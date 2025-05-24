import { NostrEvent, nostrService, contentCache } from "@/lib/nostr";
import { BrowserEventEmitter } from "./BrowserEventEmitter";
import { eventBus, EVENTS } from "./EventBus";
import { ProfileData, ProfileLoadingState, ProfileMetadata } from "./profile/types";
import { ProfileDataManager } from "./profile/profile-data-manager";
import { cacheManager } from "@/lib/utils/cacheManager";
import { getMediaUrlsFromEvent, isValidMediaUrl } from "@/lib/nostr/utils/media-extraction";

export interface ProfileLoadResult {
  profile: ProfileMetadata | null;
  npub: string;
  pubkeyHex: string;
  isOwnProfile: boolean;
  error?: string;
}

/**
 * Unified ProfileDataService that centralizes all profile data loading and management.
 * Absorbs functionality from:
 * - ProfileMetadataService
 * - ProfilePostsService  
 * - ProfileRelationsService
 * - ProfileRelaysService
 * - ProfileReactionsService
 * 
 * This is the SINGLE SOURCE OF TRUTH for all profile operations.
 */
export class ProfileDataService extends BrowserEventEmitter {
  private static instance: ProfileDataService;
  
  private currentPubkey: string | null = null;
  private isMounted = true;
  
  // Debounced loading state emission to prevent rapid-fire events
  private loadingStateDebounceTimers: Map<string, NodeJS.Timeout> = new Map();
  private readonly LOADING_STATE_DEBOUNCE_MS = 100; // 100ms debounce
  
  // Data manager
  private dataManager: ProfileDataManager;
  
  /**
   * Debounced loading state change emitter
   * Batches multiple rapid state changes into a single emission
   */
  public emitLoadingStateChange(pubkey: string, loadingState: any): void {
    // Clear existing timer for this pubkey if it exists
    const existingTimer = this.loadingStateDebounceTimers.get(pubkey);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }
    
    // Set new timer to emit after debounce period
    const timer = setTimeout(() => {
      this.emit('loading-state-changed', pubkey, loadingState);
      this.loadingStateDebounceTimers.delete(pubkey);
    }, this.LOADING_STATE_DEBOUNCE_MS);
    
    this.loadingStateDebounceTimers.set(pubkey, timer);
  }
  
  // Private constructor for singleton pattern
  private constructor() {
    super();
    
    // Initialize data manager
    this.dataManager = new ProfileDataManager(this);
    
    // Handle events from absorbed services to update the central data store
    this.on('post-received', (pubkey, event) => {
      this.dataManager.addProfilePost(pubkey, event);
    });
    
    this.on('media-received', (pubkey, event) => {
      this.dataManager.addProfileMediaPost(pubkey, event);
    });
    
    // Listen for relay connection changes
    window.addEventListener('relay-connected', this.refreshActiveData);
    window.addEventListener('relay-disconnected', this.refreshActiveData);
    
    // Clean up expired cache entries periodically
    this.startCacheCleanup();
    
    // Set up event handling for profile data updates
    this.setupEventHandling();
  }
  
  public static getInstance(): ProfileDataService {
    if (!ProfileDataService.instance) {
      ProfileDataService.instance = new ProfileDataService();
    }
    return ProfileDataService.instance;
  }
  
  /**
   * Start periodic cache cleanup
   */
  private startCacheCleanup(): void {
    setInterval(() => {
      if (!this.isMounted) return;
      // Cleanup logic here if needed
    }, 60000); // Every minute
  }
  
  /**
   * Parse and validate profile identifiers
   */
  private parseProfileIdentifiers(npub?: string, currentUserPubkey?: string): any {
    let pubkeyHex = '';
    let profileNpub = '';
    let isOwnProfile = false;
    let error = '';
    
    try {
      if (npub) {
        pubkeyHex = nostrService.getHexFromNpub(npub);
        profileNpub = npub;
      } else if (currentUserPubkey) {
        pubkeyHex = currentUserPubkey;
        profileNpub = nostrService.getNpubFromHex(currentUserPubkey);
      } else {
        error = 'No npub or current user pubkey provided';
        return { error };
      }
      
      isOwnProfile = pubkeyHex === currentUserPubkey;
      
      return { pubkeyHex, profileNpub, isOwnProfile };
    } catch (err: any) {
      return { error: err.message || 'Invalid identifier format' };
    }
  }

  /**
   * Load complete profile with all metadata - Single entry point for profile loading
   * @param npub - Optional npub string, if not provided loads current user
   * @param currentUserPubkey - Current authenticated user's public key
   * @returns Promise<ProfileLoadResult>
   */
  public async loadCompleteProfile(npub?: string, currentUserPubkey?: string): Promise<ProfileLoadResult> {
    try {
      // Parse and validate identifiers
      const identifiers = this.parseProfileIdentifiers(npub, currentUserPubkey);
      
      if (identifiers.error) {
        return {
          profile: null,
          npub: '',
          pubkeyHex: '',
          isOwnProfile: false,
          error: identifiers.error
        };
      }

      const { pubkeyHex, profileNpub, isOwnProfile } = identifiers;

      // Load profile data through the data manager
      const profileData = await this.loadProfileData(npub, currentUserPubkey);

      // Extract and format metadata
      const profile = profileData.metadata ? {
        name: profileData.metadata.name,
        display_name: profileData.metadata.display_name,
        about: profileData.metadata.about,
        picture: profileData.metadata.picture,
        banner: profileData.metadata.banner,
        nip05: profileData.metadata.nip05,
        lud16: profileData.metadata.lud16,
        website: profileData.metadata.website,
        created_at: profileData.metadata.created_at
      } : null;

      return {
        profile,
        npub: profileNpub,
        pubkeyHex,
        isOwnProfile,
      };

    } catch (error: any) {
      console.error('[ProfileDataService] Error loading complete profile:', error);
      
      // Try to provide basic info even on error
      const fallbackIdentifiers = this.parseProfileIdentifiers(npub, currentUserPubkey);
      
      return {
        profile: null,
        npub: fallbackIdentifiers.profileNpub,
        pubkeyHex: fallbackIdentifiers.pubkeyHex,
        isOwnProfile: fallbackIdentifiers.isOwnProfile,
        error: error.message || 'Failed to load profile'
      };
    }
  }
  
  private setupEventHandling(): void {
    // Listen for profile update events from other services
    eventBus.on(EVENTS.PROFILE_UPDATED, (pubkey: string, profileData: any) => {
      if (pubkey === this.currentPubkey) {
        this.dataManager.updateProfileMetadata(pubkey, profileData);
      }
    });
  }
  
  /**
   * Refresh data for currently viewed profile
   */
  private refreshActiveData = (): void => {
    if (this.currentPubkey) {
      this.loadMetadata(
        this.currentPubkey, 
        this.dataManager.getLoadingStatus(this.currentPubkey) as Record<string, any>
      );
      this.loadPosts(
        this.currentPubkey,
        this.dataManager.getLoadingStatus(this.currentPubkey) as Record<string, any>
      );
    }
  }
  
  /**
   * Load profile data optimized for performance
   * - First loads metadata (highest priority)
   * - Then loads posts in parallel with social data
   * - Uses caching aggressively
   */
  public async loadProfileData(npub: string | undefined, currentUserPubkey: string | null): Promise<ProfileData> {
    // Convert npub to hex if needed
    let hexPubkey = this.dataManager.getPubkeyFromNpub(npub);
    if (!hexPubkey && currentUserPubkey) {
      hexPubkey = currentUserPubkey;
    }
    
    // If no valid pubkey, return empty data
    if (!hexPubkey) {
      console.warn("No valid pubkey provided");
      return this.dataManager.getEmptyProfileData(null, false);
    }
    
    // Track current pubkey for refresh operations
    this.currentPubkey = hexPubkey;
    this.dataManager.setCurrentPubkey(hexPubkey);
    
    // Get or initialize profile data
    const isCurrentUser = hexPubkey === currentUserPubkey;
    const profileData = this.dataManager.getOrCreateProfileData(hexPubkey, isCurrentUser);
    
    // Ensure we're connected to relays
    await this.connectToOptimalRelays();
    
    // Launch priority loading - metadata first
    this.loadMetadata(
      hexPubkey, 
      this.dataManager.getLoadingStatus(hexPubkey) as Record<string, any>
    );
    
    // Launch parallel data loading
    setTimeout(() => {
      const loadingStatus = this.dataManager.getLoadingStatus(hexPubkey) as Record<string, any>;
      if (!loadingStatus) return;
      
      Promise.all([
        this.loadPosts(hexPubkey, loadingStatus),
        this.loadRelations(hexPubkey, isCurrentUser, loadingStatus),
        this.loadRelays(hexPubkey, isCurrentUser, loadingStatus),
        this.loadReactions(hexPubkey, loadingStatus)
      ]).catch(err => console.error("Error in parallel profile data loading:", err));
    }, 100);
    
    return profileData;
  }
  
  /**
   * Force refresh all data for a profile
   */
  public async refreshProfileData(npub: string | undefined, currentUserPubkey: string | null): Promise<void> {
    let hexPubkey = this.dataManager.getPubkeyFromNpub(npub);
    if (!hexPubkey && currentUserPubkey) {
      hexPubkey = currentUserPubkey;
    }
    
    if (!hexPubkey) return;
    
    const loadingStatus = this.dataManager.getLoadingStatus(hexPubkey);
    if (!loadingStatus) return;
    
    // Reset loading state
    const resetStatus = {
      metadata: 'idle',
      posts: 'idle',
      relations: 'idle',
      relays: 'idle',
      reactions: 'idle'
    };
    
    Object.assign(loadingStatus, resetStatus);
    this.emitLoadingStateChange(hexPubkey, loadingStatus);
    
    // Ensure relay connection
    await this.connectToOptimalRelays();
    
    // Reload all data
    await this.loadMetadata(hexPubkey, this.dataManager.getLoadingStatus(hexPubkey) as Record<string, any>);
    
    Promise.all([
      this.loadPosts(hexPubkey, this.dataManager.getLoadingStatus(hexPubkey) as Record<string, any>),
      this.loadRelations(hexPubkey, hexPubkey === currentUserPubkey, this.dataManager.getLoadingStatus(hexPubkey) as Record<string, any>),
      this.loadRelays(hexPubkey, hexPubkey === currentUserPubkey, this.dataManager.getLoadingStatus(hexPubkey) as Record<string, any>),
      this.loadReactions(hexPubkey, this.dataManager.getLoadingStatus(hexPubkey) as Record<string, any>)
    ]).catch(err => console.error("Error in parallel profile data refresh:", err));
  }
  
  /**
   * Get loading status for a profile
   */
  public getLoadingStatus(pubkey: string): ProfileLoadingState | null {
    return this.dataManager.getLoadingStatus(pubkey);
  }
  
  /**
   * Get metadata for a profile with optimized caching (absorbed from simpleProfileService)
   */
  async getProfileMetadata(pubkeyOrNpub: string): Promise<any> {
    if (!pubkeyOrNpub) {
      throw new Error("No pubkey or npub provided");
    }
    
    let hexPubkey: string;
    
    // Convert npub to hex if needed
    if (pubkeyOrNpub.startsWith('npub')) {
      try {
        hexPubkey = nostrService.getHexFromNpub(pubkeyOrNpub);
      } catch (error) {
        console.error("Invalid npub:", error);
        throw new Error("Invalid npub format");
      }
    } else {
      hexPubkey = pubkeyOrNpub;
    }
    
    // Check cache first
    const cacheKey = `profile:${hexPubkey}`;
    const cachedProfile = cacheManager.get(cacheKey);
    
    if (cachedProfile) {
      console.log(`[ProfileDataService] Cache hit for ${hexPubkey.substring(0, 8)}`);
      return cachedProfile;
    }
    
    console.log(`[ProfileDataService] Fetching profile for ${hexPubkey.substring(0, 8)}`);
    
    // Make sure we're connected to relays
    await nostrService.connectToUserRelays();
    
    // Fetch profile
    const profile = await nostrService.getUserProfile(hexPubkey);
    
    if (profile) {
      // Cache profile for 5 minutes
      cacheManager.set(cacheKey, profile, 5 * 60 * 1000);
    }
    
    return profile;
  }
  
  // ============================================================================
  // ABSORBED METADATA SERVICE METHODS
  // ============================================================================
  
  /**
   * Connect to optimal relays for fetching profile data
   */
  public async connectToOptimalRelays(): Promise<void> {
    // Ensure connected to some basic relays
    await nostrService.connectToUserRelays();
    return;
  }
  
  /**
   * Load metadata for a profile (absorbed from ProfileMetadataService)
   */
  public async loadMetadata(pubkey: string, loadingStatus: Record<string, any>): Promise<void> {
    if (!pubkey) return;
    
    try {
      // First check cache for immediate rendering
      const cachedProfile = cacheManager.get<Record<string, any>>(`profile:${pubkey}`);
      
      if (cachedProfile) {
        // Emit cached data immediately for fast rendering
        this.emit('metadata-received', pubkey, cachedProfile);
        
        // Still mark as loading to fetch fresh data in background
        loadingStatus.metadata = 'loading';
        this.emitLoadingStateChange(pubkey, loadingStatus);
      } else {
        // No cached data, mark as loading
        loadingStatus.metadata = 'loading';
        this.emitLoadingStateChange(pubkey, loadingStatus);
      }
      
      // Now fetch latest data from relays
      const profileData = await nostrService.getUserProfile(pubkey);
      
      if (profileData) {
        // Cache for future use
        cacheManager.set(`profile:${pubkey}`, profileData, 5 * 60 * 1000); // 5 minutes
        
        // Emit fresh data
        this.emit('metadata-received', pubkey, profileData);
      }
      
      // Update loading status
      loadingStatus.metadata = 'success';
      this.emitLoadingStateChange(pubkey, loadingStatus);
    } catch (error) {
      console.error("Error loading profile metadata:", error);
      loadingStatus.metadata = 'error';
      this.emitLoadingStateChange(pubkey, loadingStatus);
    }
  }
  
  // ============================================================================
  // ABSORBED POSTS SERVICE METHODS
  // ============================================================================
  
  /**
   * Load posts for a profile (absorbed from ProfilePostsService)
   */
  public async loadPosts(pubkey: string, loadingStatus: Record<string, any>): Promise<void> {
    if (!pubkey) return;
    
    try {
      // Update loading state
      loadingStatus.posts = 'loading';
      this.emitLoadingStateChange(pubkey, loadingStatus);
      
      // Check cache first for better UX
      const cachedPosts = contentCache.getEventsByAuthors([pubkey]) || [];
      if (cachedPosts.length > 0) {
        // Filter to only kind 1 (text notes)
        const postsEvents = cachedPosts.filter(e => e.kind === 1);
        
        // Sort by creation time (newest first)
        const sortedPosts = postsEvents.sort((a, b) => b.created_at - a.created_at);
        
        // Filter media posts
        const mediaEvents = postsEvents.filter(event => {
          const mediaUrls = getMediaUrlsFromEvent(event);
          const validMediaUrls = mediaUrls.filter(url => isValidMediaUrl(url));
          return validMediaUrls.length > 0;
        });
        
        // Emit cached posts
        this.emit('posts-received', pubkey, sortedPosts);
        this.emit('media-received', pubkey, mediaEvents.sort((a, b) => b.created_at - a.created_at));
      }
      
      // Connect to relays
      await nostrService.connectToUserRelays();
      
      // Subscribe to user's notes (kind 1)
      const postsList = [...cachedPosts];
      const mediaList: any[] = [];
      
      const postsSubPromise = new Promise<void>(resolve => {
        const subId = nostrService.subscribe(
          [
            {
              kinds: [1],
              authors: [pubkey],
              limit: 50
            }
          ],
          (event) => {
            // Check if we already have this event
            if (!postsList.some(e => e.id === event.id)) {
              postsList.push(event);
              
              // Check if post contains media
              const mediaUrls = getMediaUrlsFromEvent(event);
              const validMediaUrls = mediaUrls.filter(url => isValidMediaUrl(url));
              
              if (validMediaUrls.length > 0) {
                mediaList.push(event);
              }
              
              // Cache the event
              try {
                contentCache.cacheEvent(event);
              } catch (cacheError) {
                console.warn("Failed to cache event:", cacheError);
              }
            }
          }
        );
        
        // Set timeout to ensure we don't wait forever
        setTimeout(() => {
          nostrService.unsubscribe(subId);
          resolve();
        }, 5000);
      });
      
      await postsSubPromise;
      
      // Sort posts by creation time (newest first)
      const sortedPosts = postsList.sort((a, b) => b.created_at - a.created_at);
      const sortedMedia = mediaList.sort((a, b) => b.created_at - a.created_at);
      
      // Emit final results
      this.emit('posts-received', pubkey, sortedPosts);
      this.emit('media-received', pubkey, sortedMedia);
      
      // Update loading state
      loadingStatus.posts = 'success';
      this.emitLoadingStateChange(pubkey, loadingStatus);
    } catch (error) {
      console.error("Error loading profile posts:", error);
      loadingStatus.posts = 'error';
      this.emitLoadingStateChange(pubkey, loadingStatus);
    }
  }
  
  // ============================================================================
  // ABSORBED RELATIONS SERVICE METHODS
  // ============================================================================
  
  /**
   * Load social relations for a profile (absorbed from ProfileRelationsService)
   */
  public async loadRelations(pubkey: string, isCurrentUser: boolean, loadingStatus: Record<string, any>): Promise<void> {
    if (!pubkey) return;
    
    try {
      // Update loading state
      loadingStatus.relations = 'loading';
      this.emitLoadingStateChange(pubkey, loadingStatus);
      
      const followersList: string[] = [];
      const followingList: string[] = [];
      
      // Connect to relays
      await nostrService.connectToUserRelays();
      
      // Get following list first
      if (isCurrentUser && nostrService.following) {
        // Use the service's following list for better performance
        followingList.push(...nostrService.following);
      } else {
        // Fetch contact list from relays
        const contactsSubPromise = new Promise<void>(resolve => {
          const subId = nostrService.subscribe(
            [
              {
                kinds: [3], // Contact Lists (NIP-02)
                authors: [pubkey],
                limit: 5
              }
            ],
            (event) => {
              try {
                // Extract pubkeys from p tags
                const pubkeys = event.tags
                  .filter(tag => tag.length >= 2 && tag[0] === 'p')
                  .map(tag => tag[1]);
                
                followingList.push(...pubkeys);
              } catch (e) {
                console.error('Failed to parse contacts:', e);
              }
            }
          );
          
          // Set timeout to ensure we don't wait forever
          setTimeout(() => {
            nostrService.unsubscribe(subId);
            resolve();
          }, 5000);
        });
        
        await contactsSubPromise;
      }
      
      // Get followers
      const followersSubPromise = new Promise<void>(resolve => {
        const subId = nostrService.subscribe(
          [
            {
              kinds: [3], // Contact Lists (NIP-02)
              "#p": [pubkey], // Filter for contact lists that contain this pubkey
              limit: 50
            }
          ],
          (event) => {
            const followerPubkey = event.pubkey;
            if (!followersList.includes(followerPubkey)) {
              followersList.push(followerPubkey);
            }
          }
        );
        
        // Set timeout to ensure we don't wait forever
        setTimeout(() => {
          nostrService.unsubscribe(subId);
          resolve();
        }, 5000);
      });
      
      await followersSubPromise;
      
      // Emit updated data
      this.emit('followers-received', pubkey, [...new Set(followersList)]);
      this.emit('following-received', pubkey, [...new Set(followingList)]);
      
      // Update loading state
      loadingStatus.relations = 'success';
      this.emitLoadingStateChange(pubkey, loadingStatus);
    } catch (error) {
      console.error("Error loading profile relations:", error);
      loadingStatus.relations = 'error';
      this.emitLoadingStateChange(pubkey, loadingStatus);
    }
  }
  
  // ============================================================================
  // ABSORBED RELAYS SERVICE METHODS
  // ============================================================================
  
  /**
   * Load relays for a profile (absorbed from ProfileRelaysService)
   */
  public async loadRelays(pubkey: string, isCurrentUser: boolean, loadingStatus: Record<string, any>): Promise<void> {
    if (!pubkey) return;
    
    try {
      // Update loading state
      loadingStatus.relays = 'loading';
      this.emitLoadingStateChange(pubkey, loadingStatus);
      
      // Basic implementation to get any available relays
      const relays = nostrService.getRelayStatus();
      this.emit('relays-received', pubkey, relays);
      
      loadingStatus.relays = 'success';
      this.emitLoadingStateChange(pubkey, loadingStatus);
    } catch (error) {
      console.error("Error loading profile relays:", error);
      loadingStatus.relays = 'error';
      this.emitLoadingStateChange(pubkey, loadingStatus);
    }
  }
  
  // ============================================================================
  // ABSORBED REACTIONS SERVICE METHODS
  // ============================================================================
  
  /**
   * Load reactions for a profile (absorbed from ProfileReactionsService)
   */
  public async loadReactions(pubkey: string, loadingStatus: Record<string, any>): Promise<void> {
    if (!pubkey) return;
    
    try {
      // Update loading state
      loadingStatus.reactions = 'loading';
      this.emitLoadingStateChange(pubkey, loadingStatus);
      
      // For now, we just set an empty placeholder
      this.emit('reactions-received', pubkey, []);
      
      loadingStatus.reactions = 'success';
      this.emitLoadingStateChange(pubkey, loadingStatus);
    } catch (error) {
      console.error("Error loading profile reactions:", error);
      loadingStatus.reactions = 'error';
      this.emitLoadingStateChange(pubkey, loadingStatus);
    }
  }
  
  /**
   * Clean up when service is no longer needed
   */
  public dispose(): void {
    this.isMounted = false;
    window.removeEventListener('relay-connected', this.refreshActiveData);
    window.removeEventListener('relay-disconnected', this.refreshActiveData);
    
    // Clean up debounce timers
    this.loadingStateDebounceTimers.forEach(timer => clearTimeout(timer));
    this.loadingStateDebounceTimers.clear();
    
    // Clean up subscriptions and references
    this.removeAllListeners();
    this.currentPubkey = null;
    this.dataManager.setCurrentPubkey(null);
  }
}

// Export singleton instance
export const profileDataService = ProfileDataService.getInstance();

// Re-export types
export type { ProfileData, ProfileLoadingState, ProfileMetadata }; 