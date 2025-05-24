import { nostrService } from './service';
import { BaseAdapter } from './adapters/base-adapter';
import { SocialAdapter } from './adapters/social-adapter';
import { RelayAdapter } from './adapters/relay-adapter';
import { DataAdapter } from './adapters/data-adapter';
import { MessagingAdapter } from './adapters/messaging-adapter';
import { relayPerformanceTracker } from './relay/performance/relay-performance-tracker';
import { relaySelector } from './relay/selection/relay-selector';
import { circuitBreaker, CircuitState } from './relay/circuit/circuit-breaker';
import { ArticleAdapter } from './adapters/article-adapter';

/**
 * Main NostrAdapter that implements all functionality through domain-specific adapters
 * This class exposes both the structured approach (domain properties) and direct methods
 * for backward compatibility during transition
 */
export class NostrAdapter extends BaseAdapter {
  private socialAdapter: SocialAdapter;
  private relayAdapter: RelayAdapter;
  private dataAdapter: DataAdapter;
  private messagingAdapter: MessagingAdapter;
  private articleAdapter: ArticleAdapter;
  
  constructor(service: typeof nostrService) {
    super(service);
    
    // Initialize all the adapters
    this.socialAdapter = new SocialAdapter(service);
    this.relayAdapter = new RelayAdapter(service);
    this.dataAdapter = new DataAdapter(service);
    this.articleAdapter = new ArticleAdapter(service);
    this.messagingAdapter = new MessagingAdapter(service);
  }

  // Domain-specific property accessors
  get social() {
    return this.socialAdapter;
  }
  
  get relay() {
    return this.relayAdapter;
  }
  
  get data() {
    return this.dataAdapter;
  }
  
  get community() {
    return this.socialAdapter;  // Community methods now in SocialAdapter
  }
  

  
  get messaging() {
    return this.messagingAdapter;
  }
  
  get article() {
    return this.articleAdapter;
  }
  
  // Forward methods to appropriate adapters
  
  // Social methods
  isFollowing(pubkey: string) {
    return this.socialAdapter.isFollowing(pubkey);
  }
  
  async followUser(pubkey: string) {
    return this.socialAdapter.followUser(pubkey);
  }
  
  async unfollowUser(pubkey: string) {
    return this.socialAdapter.unfollowUser(pubkey);
  }
  
  async sendDirectMessage(recipientPubkey: string, content: string) {
    // Use relay selector to pick best write relays for DM
    const bestRelays = relaySelector.selectBestRelays(
      this.relayAdapter.getRelayUrls(),
      { 
        operation: 'write', 
        count: 3,
        requireWriteSupport: true,
        minScore: 40
      }
    );
    
    // Connect to these relays first if available
    if (bestRelays.length > 0) {
      await this.relayAdapter.addMultipleRelays(bestRelays);
    }
    
    return this.socialAdapter.sendDirectMessage(recipientPubkey, content);
  }

  // User moderation methods
  async muteUser(pubkey: string) {
    return this.socialAdapter.muteUser(pubkey);
  }
  
  async unmuteUser(pubkey: string) {
    return this.socialAdapter.unmuteUser(pubkey);
  }
  
  async isUserMuted(pubkey: string) {
    return this.socialAdapter.isUserMuted(pubkey);
  }
  
  async blockUser(pubkey: string) {
    return this.socialAdapter.blockUser(pubkey);
  }
  
  async unblockUser(pubkey: string) {
    return this.socialAdapter.unblockUser(pubkey);
  }
  
  async isUserBlocked(pubkey: string) {
    return this.socialAdapter.isUserBlocked(pubkey);
  }
  
  // Profile methods
  async updateProfile(profileData: Record<string, string>): Promise<boolean> {
    if (!this.service.publicKey) {
      console.error("Cannot update profile: not logged in");
      return false;
    }
    
    try {
      console.log("Updating profile metadata with:", profileData);
      
      // Validate NIP-05 identifier if provided
      if (profileData.nip05) {
        const isValidFormat = await this.isValidNip05Format(profileData.nip05);
        if (!isValidFormat) {
          console.error("Invalid NIP-05 identifier format:", profileData.nip05);
          return false;
        }
        
        // Optionally verify the NIP-05 identifier resolves to this pubkey
        // Note: This requires the domain to already have the nostr.json set up
        console.log("NIP-05 identifier provided:", profileData.nip05);
      }
      
      // Create and publish a metadata (kind 0) event according to NIP-01
      const event = {
        kind: 0,  // Metadata event according to NIP-01
        content: JSON.stringify(profileData),
        tags: []  // No tags needed for metadata event
      };
      
      // Use relay selector to pick best write relays for metadata
      const bestRelays = relaySelector.selectBestRelays(
        this.relayAdapter.getRelayUrls(),
        { 
          operation: 'write', 
          count: 3,
          requireWriteSupport: true,
          minScore: 40
        }
      );
      
      // Connect to these relays first if available
      if (bestRelays.length > 0) {
        await this.relayAdapter.addMultipleRelays(bestRelays);
      }
      
      // Publish the event
      const eventId = await this.service.publishEvent(event);
      
      if (eventId) {
        console.log(`Profile updated successfully with event ID: ${eventId}`);
        
        // If NIP-05 was updated, provide helpful info
        if (profileData.nip05) {
          console.log(`NIP-05 identifier set to: ${profileData.nip05}`);
          console.log(`To complete NIP-05 verification, ensure your domain serves .well-known/nostr.json`);
        }
        
        return true;
      } else {
        console.warn("Failed to publish profile update event");
        return false;
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      return false;
    }
  }

  /**
   * Validate NIP-05 identifier format
   * @param nip05Id - NIP-05 identifier to validate
   * @returns Promise<boolean> - True if format is valid
   */
  async isValidNip05Format(nip05Id: string): Promise<boolean> {
    // Simple NIP-05 format validation
    return /^[a-z0-9_.-]+@[a-z0-9.-]+$/.test(nip05Id);
  }

  /**
   * Update profile with NIP-05 verification
   * This method provides enhanced NIP-05 support for profile updates
   * @param profileData - Profile metadata to update
   * @param verifyNip05 - Whether to verify NIP-05 before updating (default: false)
   * @returns Promise<boolean> - True if update successful
   */
  async updateProfileWithNip05(
    profileData: Record<string, string>, 
    verifyNip05: boolean = false
  ): Promise<boolean> {
    if (!this.service.publicKey) {
      console.error("Cannot update profile: not logged in");
      return false;
    }

    try {
      // If NIP-05 verification is requested and identifier is provided
      if (verifyNip05 && profileData.nip05) {
        console.log("Verifying NIP-05 identifier before update...");
        
        const isVerified = await this.verifyNip05(profileData.nip05, this.service.publicKey);
        if (!isVerified) {
          console.error(`NIP-05 verification failed for ${profileData.nip05}`);
          console.log("Profile update cancelled. Please ensure your domain's .well-known/nostr.json is properly configured.");
          return false;
        }
        
        console.log(`NIP-05 identifier ${profileData.nip05} verified successfully!`);
      }

      return this.updateProfile(profileData);
    } catch (error) {
      console.error("Error updating profile with NIP-05:", error);
      return false;
    }
  }
  
  // Relay methods with enhanced performance tracking
  async addRelay(relayUrl: string, readWrite: boolean = true) {
    // Measure connection time
    const startTime = performance.now();
    
    // First check if circuit breaker allows connection to this relay
    if (circuitBreaker.getState(relayUrl) === CircuitState.OPEN) {
      console.log(`Circuit breaker preventing connection to ${relayUrl}`);
      return false;
    }
    
    try {
      const result = await this.relayAdapter.addRelay(relayUrl, readWrite);
      
      // Record performance metrics
      const duration = performance.now() - startTime;
      
      if (result) {
        // Success
        relayPerformanceTracker.trackResponseTime(relayUrl, 'connect', duration);
        circuitBreaker.recordSuccess(relayUrl);
      } else {
        // Failure
        relayPerformanceTracker.recordFailure(relayUrl, 'connect', 'Failed to connect');
        circuitBreaker.recordFailure(relayUrl);
      }
      
      return result;
    } catch (error) {
      // Error
      relayPerformanceTracker.recordFailure(relayUrl, 'connect', String(error));
      circuitBreaker.recordFailure(relayUrl);
      return false;
    }
  }
  
  removeRelay(relayUrl: string) {
    // Reset circuit breaker when manually removing a relay
    circuitBreaker.reset(relayUrl);
    return this.relayAdapter.removeRelay(relayUrl);
  }
  
  getRelayStatus() {
    // Enhance relay status with performance data
    const relayStatus = this.relayAdapter.getRelayStatus();
    
    return relayStatus.map(relay => {
      const perfData = relayPerformanceTracker.getRelayPerformance(relay.url);
      return {
        ...relay,
        score: perfData?.score || 50,
        avgResponse: perfData?.avgResponseTime,
      };
    });
  }

  getRelayUrls() {
    return this.relayAdapter.getRelayUrls();
  }
  
  async getRelaysForUser(pubkey: string) {
    return this.relayAdapter.getRelaysForUser(pubkey);
  }
  
  async connectToDefaultRelays() {
    // Use relay selector for smart relay selection
    const allRelays = this.relayAdapter.getRelayUrls();
    if (allRelays.length > 0) {
      const bestRelays = relaySelector.selectBestRelays(allRelays, {
        operation: 'both',
        count: Math.min(5, allRelays.length),
        minScore: 0  // Use all available relays if needed
      });
      
      if (bestRelays.length > 0) {
        await this.addMultipleRelays(bestRelays);
        return bestRelays;
      }
    }
    
    return this.relayAdapter.connectToDefaultRelays();
  }
  
  async connectToUserRelays() {
    // Use relay selector for smart relay selection
    const allRelays = this.relayAdapter.getRelayUrls();
    if (allRelays.length > 0) {
      const bestRelays = relaySelector.selectBestRelays(allRelays, {
        operation: 'both',
        count: Math.min(5, allRelays.length),
        minScore: 0  // Use all available relays if needed
      });
      
      if (bestRelays.length > 0) {
        await this.addMultipleRelays(bestRelays);
        return;
      }
    }
    
    return this.relayAdapter.connectToUserRelays();
  }
  
  async addMultipleRelays(relayUrls: string[]) {
    // Filter out relays with open circuit breakers
    const allowedRelays = relayUrls.filter(url => {
      const state = circuitBreaker.getState(url);
      return state !== CircuitState.OPEN; 
    });
    
    // Use the remaining relays
    return this.relayAdapter.addMultipleRelays(allowedRelays);
  }
  
  // Add the new NIP-65 relay list publishing method with performance-aware selection
  async publishRelayList(relays: { url: string, read: boolean, write: boolean }[]): Promise<boolean> {
    // Sort relays by performance score before publishing
    const enhancedRelays = relays.map(relay => {
      const perfData = relayPerformanceTracker.getRelayPerformance(relay.url);
      return {
        ...relay,
        score: perfData?.score || 50
      };
    });
    
    // Sort by score (higher first)
    enhancedRelays.sort((a, b) => 
      (b.score || 50) - (a.score || 50)
    );
    
    // Use relay selector to pick best write relays for publishing
    const bestRelays = relaySelector.selectBestRelays(
      enhancedRelays.filter(r => r.write).map(r => r.url),
      { 
        operation: 'write', 
        count: 3,
        requireWriteSupport: true
      }
    );
    
    // Connect to these relays first
    if (bestRelays.length > 0) {
      await this.addMultipleRelays(bestRelays);
    }
    
    // Now publish the relay list
    return this.relayAdapter.publishRelayList(relays);
  }
  
  // Data retrieval methods
  async getEventById(id: string) {
    return this.dataAdapter.getEvent(id);
  }
  
  async getEvents(ids: string[]) {
    return this.dataAdapter.getEventsByIds(ids);
  }
  
  async getProfilesByPubkeys(pubkeys: string[]) {
    return this.service.getProfilesByPubkeys(pubkeys);
  }
  
  async getUserProfile(pubkey: string) {
    return this.dataAdapter.getUserProfile(pubkey);
  }
  
  async verifyNip05(identifier: string, pubkey: string) {
    return this.service.verifyNip05(identifier, pubkey);
  }
  
  /**
   * Get events authored by a specific user
   */
  async getEventsByUser(pubkey: string) {
    return this.dataAdapter.getEventsByAuthor(pubkey);
  }

<<<<<<< HEAD
=======
  /**
   * Query events based on filters
   * @param filters Array of filter objects according to NIP-01
   * @returns Promise resolving to array of events
   */
  async queryEvents(filters: import('./types').NostrFilter[]): Promise<import('./types').NostrEvent[]> {
    return this.dataAdapter.queryEvents(filters);
  }

>>>>>>> origin/main
  // Community methods (now in SocialAdapter)
  async createCommunity(name: string, description: string) {
    return this.socialAdapter.createCommunity(name, description);
  }
  
  async createProposal(communityId: string, title: string, description: string, options: string[], category: string) {
    return this.socialAdapter.createProposal(communityId, title, description, options, category);
  }

  async voteOnProposal(proposalId: string, optionIndex: number) {
    return this.socialAdapter.voteOnProposal(proposalId, optionIndex);
  }
  
  // Article methods (New)
  async publishArticle(title: string, content: string, metadata = {}, tags = []) {
    return this.articleAdapter.publishArticle(title, content, metadata, tags);
  }
  
  async getArticleById(id: string) {
    return this.articleAdapter.getArticleById(id);
  }
  
  async getArticlesByAuthor(pubkey: string, limit = 10) {
    return this.articleAdapter.getArticlesByAuthor(pubkey, limit);
  }
  
  async searchArticles(params: any) {
    console.log("NostrAdapter.searchArticles called with params:", params);
    return this.articleAdapter.searchArticles(params);
  }
  
  async getRecommendedArticles(limit = 10) {
    return this.articleAdapter.getRecommendedArticles(limit);
  }
  
  // Article draft methods
  saveDraft(draft: any) {
    return this.articleAdapter.saveDraft(draft);
  }
  
  getDraft(id: string) {
    return this.articleAdapter.getDraft(id);
  }
  
  getAllDrafts() {
    return this.articleAdapter.getAllDrafts();
  }
  
  deleteDraft(id: string) {
    return this.articleAdapter.deleteDraft(id);
  }
  
  async getArticleVersions(articleId: string) {
    return this.articleAdapter.getArticleVersions(articleId);
  }
  
  // Manager getters
  get socialManager() {
    return this.socialAdapter.socialManager;
  }
  
  get relayManager() {
    return this.relayAdapter.relayManager;
  }
  
  get communityManager() {
    return this.socialAdapter.communityManager;
  }
  

}

// Create and export a singleton instance
export const adaptedNostrService = new NostrAdapter(nostrService);
