import { useState, useEffect, useCallback, useRef } from 'react';
import { profileAdapter, ProfileMetadata } from '@/lib/adapters/ProfileAdapter';
import { ProfileLoadResult } from '@/lib/services/ProfileDataService';
import { useAuth } from '@/hooks/useAuth';
import { chatNostrService } from '@/lib/nostr/chat-service';
import { nostrService } from '@/lib/nostr';
import { contentCache } from '@/lib/nostr/cache/content-cache';

// === TYPE DEFINITIONS ===

export interface ProfileState {
  profile: ProfileMetadata | null;
  npub: string;
  pubkeyHex: string;
  isOwnProfile: boolean;
  loading: boolean;
  error: string | null;
  debugInfo: string[];
}

export interface BatchProfileState {
  profiles: Record<string, ProfileMetadata>;
  loading: Record<string, boolean>;
  errors: Record<string, string>;
}

export interface ProfileActions {
  retry: () => void;
  refresh: () => void;
  forceRefresh: () => void;
}

export interface BatchProfileActions {
  fetchProfile: (pubkey: string, options?: ProfileFetchOptions) => Promise<ProfileMetadata | null>;
  fetchProfiles: (pubkeys: string[], options?: ProfileFetchOptions) => Promise<Record<string, ProfileMetadata>>;
  refreshProfile: (pubkey: string) => Promise<void>;
  getProfile: (pubkey: string) => ProfileMetadata | null;
  isProfileLoaded: (pubkey: string) => boolean;
  isProfileLoading: (pubkey: string) => boolean;
  clearProfile: (pubkey: string) => void;
  clearAllProfiles: () => void;
}

export interface ProfileFetchOptions {
  force?: boolean;
  important?: boolean;
  useCache?: boolean;
  service?: 'main' | 'chat';
}

export interface UseUnifiedProfileOptions {
  mode?: 'single' | 'basic' | 'batch' | 'cache';
  enableDebug?: boolean;
  enableRetry?: boolean;
  autoLoad?: boolean;
  service?: 'main' | 'chat';
  useCache?: boolean;
}

// === MAIN HOOK ===

/**
 * Unified Profile Hook - Consolidates all profile functionality
 * 
 * Absorbs and replaces:
 * - useProfile.tsx (single mode - main functionality)
 * - useProfileData.tsx (enhanced profile data)
 * - useProfileCache.tsx (caching functionality)
 * - use-profile-fetcher.tsx (feed profile fetching)
 * - useProfileFetcher.ts (chat profile fetching)
 * 
 * Provides:
 * - Single profile management (mode: 'single')
 * - Basic profile loading (mode: 'basic')
 * - Batch profile operations (mode: 'batch')
 * - Enhanced caching (mode: 'cache')
 * - Multi-service support (main/chat)
 * - Debug and retry capabilities
 * - Subscription management
 */
export function useUnifiedProfile(
  npub?: string, 
  options: UseUnifiedProfileOptions = {}
): [ProfileState | BatchProfileState, ProfileActions | BatchProfileActions] {
  const { 
    mode = 'single', 
    enableDebug = true, 
    enableRetry = true, 
    autoLoad = true,
    service = 'main',
    useCache = true
  } = options;
  
  const { isLoggedIn, publicKey } = useAuth();
  const abortControllerRef = useRef<AbortController | null>(null);
  const activeSubscriptions = useRef<Record<string, () => void>>({});
  const [retryCount, setRetryCount] = useState(0);
  const requestedPubkeys = useRef<Set<string>>(new Set());

  // State for single/basic mode
  const [singleState, setSingleState] = useState<ProfileState>({
    profile: null,
    npub: '',
    pubkeyHex: '',
    isOwnProfile: false,
    loading: mode === 'basic' ? false : true,
    error: null,
    debugInfo: []
  });

  // State for batch/cache mode
  const [batchState, setBatchState] = useState<BatchProfileState>({
    profiles: {},
    loading: {},
    errors: {}
  });

  // === UTILITY FUNCTIONS ===

  const addDebugInfo = useCallback((info: string) => {
    if (!enableDebug) return;
    
    const timestamp = new Date().toLocaleTimeString();
    setSingleState(prev => ({
      ...prev,
      debugInfo: [...prev.debugInfo.slice(-9), `[${timestamp}] ${info}`]
    }));
    console.log(`[useUnifiedProfile] ${info}`);
  }, [enableDebug]);

  const getServiceInstance = useCallback(() => {
    return service === 'chat' ? chatNostrService : nostrService;
  }, [service]);

  const convertToNpub = useCallback((pubkey: string): string => {
    if (pubkey.startsWith('npub')) return pubkey;
    try {
      return profileAdapter.convertHexToNpub(pubkey);
    } catch (error) {
      console.error(`[useUnifiedProfile] Invalid pubkey format: ${pubkey}`);
      return pubkey;
    }
  }, []);

  // Clean up subscriptions on unmount
  useEffect(() => {
    return () => {
      Object.values(activeSubscriptions.current).forEach(unsubscribe => {
        if (unsubscribe) unsubscribe();
      });
      activeSubscriptions.current = {};
    };
  }, []);

  // === SINGLE PROFILE OPERATIONS ===

  const loadProfile = useCallback(async (attempt: number = 1) => {
    if (!npub) return;
    
    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();

    try {
      if (mode !== 'basic') {
        addDebugInfo(`Loading profile (attempt ${attempt}) via ${service} service`);
        addDebugInfo(`Auth state: logged in=${isLoggedIn}, publicKey=${publicKey?.slice(0, 8) || 'none'}`);
        addDebugInfo(`Route params: npub=${npub?.slice(0, 15) || 'none'}`);
      }

      setSingleState(prev => ({
        ...prev,
        loading: true,
        error: null
      }));

      let result: ProfileLoadResult;

      if (service === 'chat') {
        // Use chat service for chat contexts
        const pubkeyHex = profileAdapter.convertNpubToHex(npub);
        const profile = await chatNostrService.getUserProfile(pubkeyHex);
        result = {
          profile: profile || null,
          npub,
          pubkeyHex,
          isOwnProfile: pubkeyHex === publicKey,
          error: profile ? null : 'Profile not found'
        };
      } else {
        // Use ProfileAdapter for main service
        result = await profileAdapter.loadProfile(npub, publicKey || undefined);
      }

      // Check if request was aborted
      if (abortControllerRef.current?.signal.aborted) {
        if (mode !== 'basic') addDebugInfo('Request was aborted');
        return;
      }

      if (result.error) {
        throw new Error(result.error);
      }

      if (mode !== 'basic') {
        addDebugInfo(`Profile loaded: ${result.profile?.name || result.profile?.display_name || 'unnamed'}`);
      }

      setSingleState(prev => ({
        ...prev,
        profile: result.profile,
        npub: result.npub,
        pubkeyHex: result.pubkeyHex,
        isOwnProfile: result.isOwnProfile,
        loading: false,
        error: null
      }));

    } catch (error: unknown) {
      if (abortControllerRef.current?.signal.aborted) {
        if (mode !== 'basic') addDebugInfo('Request aborted by user');
        return;
      }

      const errorMessage = error instanceof Error ? error.message : 'Failed to load profile';
      if (mode !== 'basic') addDebugInfo(`Error: ${errorMessage}`);
      console.error('[useUnifiedProfile] Error loading profile:', error);

      // Retry logic for certain errors (if enabled)
      if (enableRetry && attempt < 3 && (errorMessage.includes('timeout') || errorMessage.includes('connection'))) {
        if (mode !== 'basic') addDebugInfo(`Retrying in 2 seconds... (attempt ${attempt + 1}/3)`);
        setTimeout(() => {
          if (!abortControllerRef.current?.signal.aborted) {
            loadProfile(attempt + 1);
          }
        }, 2000);
        return;
      }

      setSingleState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));
    }
  }, [npub, isLoggedIn, publicKey, addDebugInfo, mode, enableRetry, service]);

  // === BATCH PROFILE OPERATIONS ===

  const fetchProfile = useCallback(async (pubkey: string, options: ProfileFetchOptions = {}) => {
    if (!pubkey) return null;
    
    const opts = {
      force: false,
      important: false,
      useCache: useCache,
      service: service,
      ...options
    };

    // Skip if already loaded or loading (unless forcing refresh)
    if (!opts.force && (batchState.profiles[pubkey] || batchState.loading[pubkey])) {
      return batchState.profiles[pubkey] || null;
    }
    
    // Mark as loading
    setBatchState(prev => ({ 
      ...prev, 
      loading: { ...prev.loading, [pubkey]: true } 
    }));
    
    try {
      let profile: ProfileMetadata | null = null;

      // Check cache first (if using cache mode)
      if (opts.useCache && !opts.force) {
        const cachedProfile = contentCache.getProfile(pubkey);
        if (cachedProfile) {
          profile = cachedProfile;
          console.log(`[useUnifiedProfile] Using cached profile for ${pubkey.substring(0, 8)}`);
        }
      }

      // Fetch from service if not cached or forced
      if (!profile || opts.force) {
        console.log(`[useUnifiedProfile] Fetching profile for ${pubkey.substring(0, 8)} via ${opts.service} service`);
        
        if (opts.service === 'chat') {
          profile = await chatNostrService.getUserProfile(pubkey);
        } else {
          const npubFormat = convertToNpub(pubkey);
          const result = await profileAdapter.loadProfile(npubFormat);
          profile = result.profile;
          
          if (result.error) {
            throw new Error(result.error);
          }

          // Set up subscription for updates if using main service
          if (!activeSubscriptions.current[pubkey] && result.pubkeyHex) {
            const unsubscribe = profileAdapter.subscribeToProfileUpdates(
<<<<<<< HEAD
              (updatedPubkey: string, profileData: any) => {
=======
              (updatedPubkey: string, profileData: import('@/lib/services/profile/types').ProfileData) => {
>>>>>>> origin/main
                if (updatedPubkey === result.pubkeyHex && profileData.metadata) {
                  console.log(`[useUnifiedProfile] Profile update received for ${pubkey.substring(0, 8)}`);
                  setBatchState(prev => ({
                    ...prev,
                    profiles: { ...prev.profiles, [pubkey]: profileData.metadata }
                  }));
                }
              }
            );
            activeSubscriptions.current[pubkey] = unsubscribe;
          }
        }

        // Cache the profile if using cache mode
        if (profile && opts.useCache) {
          contentCache.cacheProfile(pubkey, profile, opts.important);
        }
      }
      
      if (profile) {
        // Update state with the new profile
        setBatchState(prev => ({ 
          ...prev, 
          profiles: { ...prev.profiles, [pubkey]: profile! },
          errors: (() => {
            const newErrors = { ...prev.errors };
            delete newErrors[pubkey];
            return newErrors;
          })()
        }));
        
        // Track requested pubkey
        requestedPubkeys.current.add(pubkey);
        
        return profile;
      } else {
        console.warn(`[useUnifiedProfile] No profile data returned for ${pubkey.substring(0, 8)}`);
        setBatchState(prev => ({
          ...prev,
          errors: { ...prev.errors, [pubkey]: "No profile data found" }
        }));
        return null;
      }
<<<<<<< HEAD
    } catch (error: any) {
      console.error(`[useUnifiedProfile] Error fetching profile for ${pubkey.substring(0, 8)}:`, error);
      setBatchState(prev => ({
        ...prev,
        errors: { ...prev.errors, [pubkey]: error.message || "Unknown error" }
=======
    } catch (error: unknown) {
      console.error(`[useUnifiedProfile] Error fetching profile for ${pubkey.substring(0, 8)}:`, error);
      setBatchState(prev => ({
        ...prev,
        errors: { ...prev.errors, [pubkey]: error instanceof Error ? error.message : "Unknown error" }
>>>>>>> origin/main
      }));
      return null;
    } finally {
      // Mark as no longer loading
      setBatchState(prev => ({ 
        ...prev, 
        loading: { ...prev.loading, [pubkey]: false } 
      }));
    }
  }, [batchState.profiles, batchState.loading, useCache, service, convertToNpub]);

  const fetchProfiles = useCallback(async (pubkeys: string[], options: ProfileFetchOptions = {}) => {
    if (!pubkeys.length) return {};
    
    // Deduplicate pubkeys
    const uniquePubkeys = [...new Set(pubkeys)];
    console.log(`[useUnifiedProfile] Batch fetching ${uniquePubkeys.length} profiles via ${options.service || service} service`);
    
    const results: Record<string, ProfileMetadata> = {};
    
    // Process profiles concurrently
    await Promise.all(uniquePubkeys.map(async (pubkey) => {
      try {
        const profile = await fetchProfile(pubkey, options);
        if (profile) {
          results[pubkey] = profile;
        }
      } catch (error) {
        console.error(`[useUnifiedProfile] Error fetching profile ${pubkey.substring(0, 8)}:`, error);
      }
    }));
    
    return results;
  }, [fetchProfile, service]);

  const refreshProfile = useCallback(async (pubkey: string) => {
    try {
      if (service === 'chat') {
        await fetchProfile(pubkey, { force: true, service: 'chat' });
      } else {
        const npubFormat = convertToNpub(pubkey);
        await profileAdapter.refreshProfile(npubFormat);
        await fetchProfile(pubkey, { force: true });
      }
    } catch (error) {
      console.error(`[useUnifiedProfile] Error refreshing profile ${pubkey}:`, error);
    }
  }, [fetchProfile, service, convertToNpub]);

  const getProfile = useCallback((pubkey: string) => {
    return batchState.profiles[pubkey] || null;
  }, [batchState.profiles]);

  const isProfileLoaded = useCallback((pubkey: string) => {
    return !!batchState.profiles[pubkey];
  }, [batchState.profiles]);

  const isProfileLoading = useCallback((pubkey: string) => {
    return !!batchState.loading[pubkey];
  }, [batchState.loading]);

  const clearProfile = useCallback((pubkey: string) => {
    setBatchState(prev => {
      const newProfiles = { ...prev.profiles };
      const newLoading = { ...prev.loading };
      const newErrors = { ...prev.errors };
      
      delete newProfiles[pubkey];
      delete newLoading[pubkey];
      delete newErrors[pubkey];
      
      return {
        profiles: newProfiles,
        loading: newLoading,
        errors: newErrors
      };
    });
    
    // Clear from cache
    if (useCache) {
      contentCache.clearProfile(pubkey);
    }
    
    // Clean up subscription
    if (activeSubscriptions.current[pubkey]) {
      activeSubscriptions.current[pubkey]();
      delete activeSubscriptions.current[pubkey];
    }
  }, [useCache]);

  const clearAllProfiles = useCallback(() => {
    setBatchState({
      profiles: {},
      loading: {},
      errors: {}
    });
    
    // Clear all subscriptions
    Object.values(activeSubscriptions.current).forEach(unsubscribe => {
      if (unsubscribe) unsubscribe();
    });
    activeSubscriptions.current = {};
    requestedPubkeys.current.clear();
    
    // Clear cache
    if (useCache) {
      contentCache.clearAllProfiles();
    }
  }, [useCache]);

  // === SINGLE MODE ACTIONS ===

  const retry = useCallback(() => {
    setRetryCount(prev => prev + 1);
    addDebugInfo(`Manual retry initiated (${retryCount + 1})`);
    loadProfile();
  }, [loadProfile, retryCount, addDebugInfo]);

  const refresh = useCallback(async () => {
    if (mode !== 'basic') addDebugInfo('Manual refresh initiated');
    try {
      if (service === 'chat') {
        if (singleState.pubkeyHex) {
          await fetchProfile(singleState.pubkeyHex, { force: true, service: 'chat' });
        }
      } else {
        await profileAdapter.refreshProfile(npub, publicKey || undefined);
        if (mode !== 'basic') addDebugInfo('Refresh completed, reloading profile...');
        loadProfile();
      }
    } catch (error) {
      console.error('[useUnifiedProfile] Error refreshing profile:', error);
      if (mode !== 'basic') addDebugInfo(`Refresh error: ${error}`);
    }
  }, [npub, publicKey, loadProfile, addDebugInfo, mode, service, fetchProfile, singleState.pubkeyHex]);

  const forceRefresh = useCallback(async () => {
    if (mode !== 'basic') addDebugInfo('Force refresh initiated');
    
    // Clear cache first
    if (useCache && singleState.pubkeyHex) {
      contentCache.clearProfile(singleState.pubkeyHex);
    }
    
    await refresh();
  }, [refresh, addDebugInfo, mode, useCache, singleState.pubkeyHex]);

  // === MAIN EFFECTS ===

  // Main effect to load profile when dependencies change (single/basic mode)
  useEffect(() => {
    if (mode === 'batch' || mode === 'cache') return;
    
    if (mode !== 'basic') addDebugInfo('Profile hook initialized/deps changed');
    
    // Reset state when params change
    setSingleState(prev => ({
      ...prev,
      profile: null,
      npub: '',
      pubkeyHex: '',
      isOwnProfile: false,
      loading: mode === 'basic' ? false : true,
      error: null,
      debugInfo: mode === 'basic' ? [] : prev.debugInfo
    }));

    if (autoLoad && npub) {
      loadProfile();
    }

    // Cleanup function
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [loadProfile, mode, addDebugInfo, autoLoad, npub]);

  // Subscribe to profile data changes via adapter (only for single mode with main service)
  useEffect(() => {
    if (mode === 'batch' || mode === 'cache' || service === 'chat') return;
    
    const unsubscribeProfileUpdates = profileAdapter.subscribeToProfileUpdates(
<<<<<<< HEAD
      (pubkey: string, profileData: any) => {
=======
      (pubkey: string, profileData: import('@/lib/services/profile/types').ProfileData) => {
>>>>>>> origin/main
        setSingleState(prev => {
          // Only update if this is for the current profile being viewed
          if (pubkey === prev.pubkeyHex && profileData.metadata) {
            if (mode !== 'basic') addDebugInfo(`Profile updated via subscription: ${pubkey.slice(0, 8)}`);
            return {
              ...prev,
              profile: profileData.metadata
            };
          }
          return prev;
        });
      }
    );

    const unsubscribeLoadingChanges = profileAdapter.subscribeToLoadingStateChanges(
<<<<<<< HEAD
      (pubkey: string, loadingState: any) => {
=======
      (pubkey: string, loadingState: import('@/lib/services/profile/types').ProfileLoadingState) => {
>>>>>>> origin/main
        setSingleState(prev => {
          // Only log if this is for the current profile being viewed
          if (pubkey === prev.pubkeyHex && mode !== 'basic') {
            addDebugInfo(`Loading state changed for ${pubkey.slice(0, 8)}: ${JSON.stringify(loadingState)}`);
          }
          return prev;
        });
      }
    );

    return () => {
      unsubscribeProfileUpdates();
      unsubscribeLoadingChanges();
    };
  }, [addDebugInfo, mode, service]);

  // === RETURN APPROPRIATE STATE AND ACTIONS ===

  if (mode === 'batch' || mode === 'cache') {
    const batchActions: BatchProfileActions = {
      fetchProfile,
      fetchProfiles,
      refreshProfile,
      getProfile,
      isProfileLoaded,
      isProfileLoading,
      clearProfile,
      clearAllProfiles
    };
    
    return [batchState, batchActions];
  } else {
    const singleActions: ProfileActions = {
      retry,
      refresh,
      forceRefresh
    };
    
    return [singleState, singleActions];
  }
}

// === CONVENIENCE HOOKS ===

/**
 * Single profile hook - for loading one profile
 */
export function useProfile(npub?: string, options?: Omit<UseUnifiedProfileOptions, 'mode'>) {
  return useUnifiedProfile(npub, { ...options, mode: 'single' });
}

/**
 * Basic profile hook - minimal functionality, no debug/retry
 */
export function useBasicProfile(npub?: string, options?: Omit<UseUnifiedProfileOptions, 'mode'>) {
  return useUnifiedProfile(npub, { 
    ...options, 
    mode: 'basic', 
    enableDebug: false, 
    enableRetry: false 
  });
}

/**
 * Batch profile hook - for loading multiple profiles
 */
export function useBatchProfiles(options?: Omit<UseUnifiedProfileOptions, 'mode'>) {
  return useUnifiedProfile(undefined, { ...options, mode: 'batch' });
}

/**
 * Profile cache hook - enhanced caching functionality
 */
export function useProfileCache(options?: Omit<UseUnifiedProfileOptions, 'mode'>) {
  return useUnifiedProfile(undefined, { ...options, mode: 'cache', useCache: true });
}

/**
 * Chat profile hook - for chat contexts
 */
export function useChatProfile(options?: Omit<UseUnifiedProfileOptions, 'mode' | 'service'>) {
  return useUnifiedProfile(undefined, { ...options, mode: 'batch', service: 'chat' });
}

/**
 * Feed profile hook - for feed contexts  
 */
export function useFeedProfile(options?: Omit<UseUnifiedProfileOptions, 'mode'>) {
  return useUnifiedProfile(undefined, { ...options, mode: 'batch' });
<<<<<<< HEAD
} 
=======
}
>>>>>>> origin/main
