<<<<<<< HEAD
import { useState, useEffect, useCallback, useRef } from 'react';
import { SavedWallet, WalletCacheConfig, CacheStatus } from '@/types/wallet';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { toast } from '@/lib/utils/toast-replacement';
import { safeRefreshWallet } from '@/lib/api/cachedAlephiumApi';
import { shouldRefreshWallet, getRateLimitStatus } from '@/lib/api/rateLimitedApi';

// Default cache configuration - made more conservative to reduce API spam
const DEFAULT_CACHE_CONFIG: WalletCacheConfig = {
  defaultTTL: 60 * 60 * 1000,      // 60 minutes (increased from 30)
  maxTTL: 24 * 60 * 60 * 1000,     // 24 hours
  refreshInterval: 30 * 60 * 1000,  // 30 minutes (increased from 10)
  maxRetries: 2,                    // Reduced from 3
  enableAutoRefresh: false,         // Disabled by default to prevent spam
  enableBackgroundSync: false,      // Disabled by default
  storageQuotaLimit: 5 * 1024 * 1024, // 5MB
};

const CACHE_VERSION = '1.1.0'; // Updated version

export function useWalletCache() {
  const [savedWallets, setSavedWallets] = useLocalStorage<SavedWallet[]>("blocknoster_saved_wallets", []);
  const [cacheConfig, setCacheConfig] = useLocalStorage<WalletCacheConfig>("wallet_cache_config", DEFAULT_CACHE_CONFIG);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastVisibilityRef = useRef<number>(Date.now());
  const refreshInProgressRef = useRef<Set<string>>(new Set());

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Only refresh if backgroundSync is enabled and we haven't refreshed recently
      if (cacheConfig.enableBackgroundSync) {
        setTimeout(() => refreshStaleWallets(), 2000); // Small delay to avoid immediate spam
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const timeSinceHidden = Date.now() - lastVisibilityRef.current;
        // Only refresh if hidden for more than 30 minutes and backgroundSync is enabled
        if (timeSinceHidden > 30 * 60 * 1000 && cacheConfig.enableBackgroundSync) {
          setTimeout(() => refreshStaleWallets(), 3000); // Delay to avoid immediate spam
        }
        lastVisibilityRef.current = Date.now();
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [cacheConfig.enableBackgroundSync]);

  // Auto-refresh interval - more conservative
  useEffect(() => {
    if (cacheConfig.enableAutoRefresh && isOnline) {
      refreshIntervalRef.current = setInterval(() => {
        // Only refresh if we have stale wallets and not currently refreshing
        const staleWallets = getStaleWallets();
        if (staleWallets.length > 0 && refreshInProgressRef.current.size === 0) {
          refreshStaleWallets();
        }
      }, cacheConfig.refreshInterval);

      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }
      };
    }
  }, [cacheConfig.enableAutoRefresh, cacheConfig.refreshInterval, isOnline]);

  // Initialize cache metadata for existing wallets
  useEffect(() => {
    const initializeCache = () => {
      const now = Date.now();
      const updatedWallets = savedWallets.map(wallet => {
        if (!wallet.cacheMetadata || wallet.cacheMetadata.version !== CACHE_VERSION) {
          return {
            ...wallet,
            cacheMetadata: {
              cachedAt: now,
              expiresAt: now + cacheConfig.defaultTTL,
              lastRefresh: wallet.cacheMetadata?.lastRefresh || now,
              refreshInterval: cacheConfig.defaultTTL,
              version: CACHE_VERSION,
              isStale: false,
              autoRefresh: cacheConfig.enableAutoRefresh,
              retryCount: 0,
              maxRetries: cacheConfig.maxRetries,
            }
          };
        }
        return wallet;
      });

      if (JSON.stringify(updatedWallets) !== JSON.stringify(savedWallets)) {
        setSavedWallets(updatedWallets);
      }
    };

    if (savedWallets.length > 0) {
      initializeCache();
    }
  }, [savedWallets.length, cacheConfig]);

  // Add a new wallet with cache metadata
  const addWallet = useCallback((wallet: Omit<SavedWallet, 'cacheMetadata'>) => {
    const now = Date.now();
    const newWallet: SavedWallet = {
      ...wallet,
      cacheMetadata: {
        cachedAt: now,
        expiresAt: now + cacheConfig.defaultTTL,
        lastRefresh: now,
        refreshInterval: cacheConfig.defaultTTL,
        version: CACHE_VERSION,
        isStale: false,
        autoRefresh: cacheConfig.enableAutoRefresh,
        retryCount: 0,
        maxRetries: cacheConfig.maxRetries,
      }
    };

    setSavedWallets(prev => [...prev, newWallet]);
    toast.success(`Added ${wallet.label} with smart caching enabled`);
    return newWallet;
  }, [cacheConfig, setSavedWallets]);

  // Remove a wallet
  const removeWallet = useCallback((address: string) => {
    setSavedWallets(prev => prev.filter(w => w.address !== address));
    // Cancel any pending refresh for this wallet
    refreshInProgressRef.current.delete(address);
    toast.success("Wallet removed from cache");
  }, [setSavedWallets]);

  // Update any part of a wallet
  const updateWallet = useCallback((address: string, updates: Partial<SavedWallet>) => {
    setSavedWallets(prev => prev.map(wallet => {
      if (wallet.address === address) {
        return {
          ...wallet,
          ...updates,
          // Merge cache metadata if provided
          cacheMetadata: updates.cacheMetadata 
            ? { ...wallet.cacheMetadata, ...updates.cacheMetadata }
            : wallet.cacheMetadata
        };
      }
      return wallet;
    }));
  }, [setSavedWallets]);

  // Update wallet cache metadata
  const updateWalletCache = useCallback((address: string, updates: Partial<SavedWallet['cacheMetadata']>) => {
    setSavedWallets(prev => prev.map(wallet => {
      if (wallet.address === address && wallet.cacheMetadata) {
        // Handle retry count increment when undefined
        let finalUpdates = { ...updates };
        if (updates.retryCount === undefined && 'retryCount' in updates) {
          // Increment current retry count
          finalUpdates.retryCount = (wallet.cacheMetadata.retryCount || 0) + 1;
        }
        
        return {
          ...wallet,
          cacheMetadata: {
            ...wallet.cacheMetadata,
            ...finalUpdates,
          }
        };
      }
      return wallet;
    }));
  }, [setSavedWallets]);

  // Mark wallet data as refreshed
  const markAsRefreshed = useCallback((address: string, success: boolean = true) => {
    const now = Date.now();
    
    updateWalletCache(address, {
      lastRefresh: now,
      isStale: false,
      retryCount: success ? 0 : undefined, // Let updateWalletCache handle retry increment
      expiresAt: now + cacheConfig.defaultTTL,
    });
    
    // Remove from in-progress set
    refreshInProgressRef.current.delete(address);
  }, [updateWalletCache, cacheConfig.defaultTTL]);

  // Check if wallet data is stale using the smart function
  const isWalletStale = useCallback((address: string): boolean => {
    const wallet = savedWallets.find(w => w.address === address);
    if (!wallet) return true;
    
    return shouldRefreshWallet(wallet);
  }, [savedWallets]);

  // Get stale wallets
  const getStaleWallets = useCallback((): SavedWallet[] => {
    return savedWallets.filter(wallet => isWalletStale(wallet.address));
  }, [savedWallets, isWalletStale]);

  // Refresh stale wallets with rate limiting
  const refreshStaleWallets = useCallback(async () => {
    if (!isOnline) return;

    const staleWallets = getStaleWallets();
    if (staleWallets.length === 0) return;

    // Filter out wallets that are already being refreshed
    const walletsToRefresh = staleWallets.filter(w => !refreshInProgressRef.current.has(w.address));
    if (walletsToRefresh.length === 0) return;

    console.log(`🔄 [Cache] Refreshing ${walletsToRefresh.length} stale wallet(s)`);

    // Process wallets sequentially with delays to avoid rate limits
    for (let i = 0; i < Math.min(walletsToRefresh.length, 3); i++) { // Limit to 3 concurrent refreshes
      const wallet = walletsToRefresh[i];
      
      // Mark as in progress
      refreshInProgressRef.current.add(wallet.address);
      
      try {
        // Add delay between wallets
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
        }
        
        await safeRefreshWallet(wallet.address);
        markAsRefreshed(wallet.address, true);
        
      } catch (error: any) {
        console.error(`[Cache] Failed to refresh wallet ${wallet.address}:`, error.message);
        markAsRefreshed(wallet.address, false);
        
        // If rate limited, stop processing more wallets
        if (error.message?.includes('Rate limited')) {
          console.warn('[Cache] Rate limited, stopping batch refresh');
          break;
        }
      }
    }
  }, [isOnline, getStaleWallets, markAsRefreshed]);

  // Force refresh a specific wallet
  const forceRefreshWallet = useCallback(async (address: string) => {
    const wallet = savedWallets.find(w => w.address === address);
    if (!wallet) return false;

    // Don't refresh if already in progress
    if (refreshInProgressRef.current.has(address)) {
      console.log(`[Cache] Wallet ${address} refresh already in progress`);
      return false;
    }

    try {
      refreshInProgressRef.current.add(address);
      updateWalletCache(address, { isStale: false, retryCount: 0 });
      
      await safeRefreshWallet(address);
      
      markAsRefreshed(address, true);
      toast.success("Wallet data refreshed successfully");
      return true;
    } catch (error: any) {
      console.error(`[Cache] Failed to force refresh wallet ${address}:`, error.message);
      markAsRefreshed(address, false);
      
      if (error.message?.includes('Rate limited')) {
        toast.error("Rate limited - please wait before refreshing");
      } else {
        toast.error("Failed to refresh wallet data");
      }
      return false;
    }
  }, [savedWallets, updateWalletCache, markAsRefreshed]);

  // Get cache status including rate limit info
  const getCacheStatus = useCallback((): CacheStatus => {
    const staleWallets = getStaleWallets();
    const cachedWallets = savedWallets.filter(w => w.cacheMetadata && !isWalletStale(w.address));
    
    // Estimate storage usage (rough calculation)
    const storageUsage = JSON.stringify(savedWallets).length * 2; // UTF-16 encoding

    return {
      totalWallets: savedWallets.length,
      cachedWallets: cachedWallets.length,
      staleWallets: staleWallets.length,
      lastCleanup: Date.now(), // In real implementation, track this
      storageUsage,
      isOnline,
    };
  }, [savedWallets, getStaleWallets, isWalletStale, isOnline]);

  // Clean up old cache data
  const cleanupCache = useCallback(() => {
    const now = Date.now();
    const cleanedWallets = savedWallets.map(wallet => {
      if (wallet.cacheMetadata && wallet.cacheMetadata.retryCount >= wallet.cacheMetadata.maxRetries) {
        // Reset retry count for wallets that have exceeded max retries
        return {
          ...wallet,
          cacheMetadata: {
            ...wallet.cacheMetadata,
            retryCount: 0,
            isStale: true,
          }
        };
      }
      return wallet;
    });

    setSavedWallets(cleanedWallets);
    toast.success("Cache cleanup completed");
  }, [savedWallets, setSavedWallets]);

  // Update cache configuration
  const updateCacheConfig = useCallback((updates: Partial<WalletCacheConfig>) => {
    setCacheConfig(prev => ({
      ...prev,
      ...updates,
    }));
    toast.success("Cache settings updated");
  }, [setCacheConfig]);

  // Get rate limit status for debugging
  const getRateLimitInfo = useCallback(() => {
    return getRateLimitStatus();
  }, []);

  return {
    // Wallet management
    savedWallets,
    addWallet,
    removeWallet,
    updateWallet,
    
    // Cache operations
    markAsRefreshed,
    isWalletStale,
    getStaleWallets,
    refreshStaleWallets,
    forceRefreshWallet,
    
    // Cache monitoring
    getCacheStatus,
    cleanupCache,
    getRateLimitInfo,
    
    // Configuration
    cacheConfig,
    updateCacheConfig,
    
    // Status
    isOnline,
  };
=======
import { useState, useEffect, useCallback, useRef } from 'react';
import { SavedWallet, WalletCacheConfig, CacheStatus } from '@/types/wallet';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { toast } from '@/lib/utils/toast-replacement';
import { safeRefreshWallet } from '@/lib/api/cachedAlephiumApi';
import { shouldRefreshWallet, getRateLimitStatus } from '@/lib/api/rateLimitedApi';

// Default cache configuration - made more conservative to reduce API spam
const DEFAULT_CACHE_CONFIG: WalletCacheConfig = {
  defaultTTL: 60 * 60 * 1000,      // 60 minutes (increased from 30)
  maxTTL: 24 * 60 * 60 * 1000,     // 24 hours
  refreshInterval: 30 * 60 * 1000,  // 30 minutes (increased from 10)
  maxRetries: 2,                    // Reduced from 3
  enableAutoRefresh: false,         // Disabled by default to prevent spam
  enableBackgroundSync: false,      // Disabled by default
  storageQuotaLimit: 5 * 1024 * 1024, // 5MB
};

const CACHE_VERSION = '1.1.0'; // Updated version

export function useWalletCache() {
  const [savedWallets, setSavedWallets] = useLocalStorage<SavedWallet[]>("blocknoster_saved_wallets", []);
  const [cacheConfig, setCacheConfig] = useLocalStorage<WalletCacheConfig>("wallet_cache_config", DEFAULT_CACHE_CONFIG);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastVisibilityRef = useRef<number>(Date.now());
  const refreshInProgressRef = useRef<Set<string>>(new Set());

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Only refresh if backgroundSync is enabled and we haven't refreshed recently
      if (cacheConfig.enableBackgroundSync) {
        setTimeout(() => refreshStaleWallets(), 2000); // Small delay to avoid immediate spam
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const timeSinceHidden = Date.now() - lastVisibilityRef.current;
        // Only refresh if hidden for more than 30 minutes and backgroundSync is enabled
        if (timeSinceHidden > 30 * 60 * 1000 && cacheConfig.enableBackgroundSync) {
          setTimeout(() => refreshStaleWallets(), 3000); // Delay to avoid immediate spam
        }
        lastVisibilityRef.current = Date.now();
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [cacheConfig.enableBackgroundSync]);

  // Auto-refresh interval - more conservative
  useEffect(() => {
    if (cacheConfig.enableAutoRefresh && isOnline) {
      refreshIntervalRef.current = setInterval(() => {
        // Only refresh if we have stale wallets and not currently refreshing
        const staleWallets = getStaleWallets();
        if (staleWallets.length > 0 && refreshInProgressRef.current.size === 0) {
          refreshStaleWallets();
        }
      }, cacheConfig.refreshInterval);

      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }
      };
    }
  }, [cacheConfig.enableAutoRefresh, cacheConfig.refreshInterval, isOnline]);

  // Initialize cache metadata for existing wallets
  useEffect(() => {
    const initializeCache = () => {
      const now = Date.now();
      const updatedWallets = savedWallets.map(wallet => {
        if (!wallet.cacheMetadata || wallet.cacheMetadata.version !== CACHE_VERSION) {
          return {
            ...wallet,
            cacheMetadata: {
              cachedAt: now,
              expiresAt: now + cacheConfig.defaultTTL,
              lastRefresh: wallet.cacheMetadata?.lastRefresh || now,
              refreshInterval: cacheConfig.defaultTTL,
              version: CACHE_VERSION,
              isStale: false,
              autoRefresh: cacheConfig.enableAutoRefresh,
              retryCount: 0,
              maxRetries: cacheConfig.maxRetries,
            }
          };
        }
        return wallet;
      });

      if (JSON.stringify(updatedWallets) !== JSON.stringify(savedWallets)) {
        setSavedWallets(updatedWallets);
      }
    };

    if (savedWallets.length > 0) {
      initializeCache();
    }
  }, [savedWallets.length, cacheConfig]);

  // Add a new wallet with cache metadata
  const addWallet = useCallback((wallet: Omit<SavedWallet, 'cacheMetadata'>) => {
    const now = Date.now();
    const newWallet: SavedWallet = {
      ...wallet,
      cacheMetadata: {
        cachedAt: now,
        expiresAt: now + cacheConfig.defaultTTL,
        lastRefresh: now,
        refreshInterval: cacheConfig.defaultTTL,
        version: CACHE_VERSION,
        isStale: false,
        autoRefresh: cacheConfig.enableAutoRefresh,
        retryCount: 0,
        maxRetries: cacheConfig.maxRetries,
      }
    };

    setSavedWallets(prev => [...prev, newWallet]);
    toast.success(`Added ${wallet.label} with smart caching enabled`);
    return newWallet;
  }, [cacheConfig, setSavedWallets]);

  // Remove a wallet
  const removeWallet = useCallback((address: string) => {
    setSavedWallets(prev => prev.filter(w => w.address !== address));
    // Cancel any pending refresh for this wallet
    refreshInProgressRef.current.delete(address);
    toast.success("Wallet removed from cache");
  }, [setSavedWallets]);

  // Update wallet cache metadata
  const updateWalletCache = useCallback((address: string, updates: Partial<SavedWallet['cacheMetadata']>) => {
    setSavedWallets(prev => prev.map(wallet => {
      if (wallet.address === address && wallet.cacheMetadata) {
        // Handle retry count increment when undefined
        let finalUpdates = { ...updates };
        if (updates.retryCount === undefined && 'retryCount' in updates) {
          // Increment current retry count
          finalUpdates.retryCount = (wallet.cacheMetadata.retryCount || 0) + 1;
        }
        
        return {
          ...wallet,
          cacheMetadata: {
            ...wallet.cacheMetadata,
            ...finalUpdates,
          }
        };
      }
      return wallet;
    }));
  }, [setSavedWallets]);

  // Mark wallet data as refreshed
  const markAsRefreshed = useCallback((address: string, success: boolean = true) => {
    const now = Date.now();
    
    updateWalletCache(address, {
      lastRefresh: now,
      isStale: false,
      retryCount: success ? 0 : undefined, // Let updateWalletCache handle retry increment
      expiresAt: now + cacheConfig.defaultTTL,
    });
    
    // Remove from in-progress set
    refreshInProgressRef.current.delete(address);
  }, [updateWalletCache, cacheConfig.defaultTTL]);

  // Check if wallet data is stale using the smart function
  const isWalletStale = useCallback((address: string): boolean => {
    const wallet = savedWallets.find(w => w.address === address);
    if (!wallet) return true;
    
    return shouldRefreshWallet(wallet);
  }, [savedWallets]);

  // Get stale wallets
  const getStaleWallets = useCallback((): SavedWallet[] => {
    return savedWallets.filter(wallet => isWalletStale(wallet.address));
  }, [savedWallets, isWalletStale]);

  // Refresh stale wallets with rate limiting
  const refreshStaleWallets = useCallback(async () => {
    if (!isOnline) return;

    const staleWallets = getStaleWallets();
    if (staleWallets.length === 0) return;

    // Filter out wallets that are already being refreshed
    const walletsToRefresh = staleWallets.filter(w => !refreshInProgressRef.current.has(w.address));
    if (walletsToRefresh.length === 0) return;

    console.log(`🔄 [Cache] Refreshing ${walletsToRefresh.length} stale wallet(s)`);

    // Process wallets sequentially with delays to avoid rate limits
    for (let i = 0; i < Math.min(walletsToRefresh.length, 3); i++) { // Limit to 3 concurrent refreshes
      const wallet = walletsToRefresh[i];
      
      // Mark as in progress
      refreshInProgressRef.current.add(wallet.address);
      
      try {
        // Add delay between wallets
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
        }
        
        await safeRefreshWallet(wallet.address);
        markAsRefreshed(wallet.address, true);
        
      } catch (error: any) {
        console.error(`[Cache] Failed to refresh wallet ${wallet.address}:`, error.message);
        markAsRefreshed(wallet.address, false);
        
        // If rate limited, stop processing more wallets
        if (error.message?.includes('Rate limited')) {
          console.warn('[Cache] Rate limited, stopping batch refresh');
          break;
        }
      }
    }
  }, [isOnline, getStaleWallets, markAsRefreshed]);

  // Force refresh a specific wallet
  const forceRefreshWallet = useCallback(async (address: string) => {
    const wallet = savedWallets.find(w => w.address === address);
    if (!wallet) return false;

    // Don't refresh if already in progress
    if (refreshInProgressRef.current.has(address)) {
      console.log(`[Cache] Wallet ${address} refresh already in progress`);
      return false;
    }

    try {
      refreshInProgressRef.current.add(address);
      updateWalletCache(address, { isStale: false, retryCount: 0 });
      
      await safeRefreshWallet(address);
      
      markAsRefreshed(address, true);
      toast.success("Wallet data refreshed successfully");
      return true;
    } catch (error: any) {
      console.error(`[Cache] Failed to force refresh wallet ${address}:`, error.message);
      markAsRefreshed(address, false);
      
      if (error.message?.includes('Rate limited')) {
        toast.error("Rate limited - please wait before refreshing");
      } else {
        toast.error("Failed to refresh wallet data");
      }
      return false;
    }
  }, [savedWallets, updateWalletCache, markAsRefreshed]);

  // Get cache status including rate limit info
  const getCacheStatus = useCallback((): CacheStatus => {
    const staleWallets = getStaleWallets();
    const cachedWallets = savedWallets.filter(w => w.cacheMetadata && !isWalletStale(w.address));
    
    // Estimate storage usage (rough calculation)
    const storageUsage = JSON.stringify(savedWallets).length * 2; // UTF-16 encoding

    return {
      totalWallets: savedWallets.length,
      cachedWallets: cachedWallets.length,
      staleWallets: staleWallets.length,
      lastCleanup: Date.now(), // In real implementation, track this
      storageUsage,
      isOnline,
    };
  }, [savedWallets, getStaleWallets, isWalletStale, isOnline]);

  // Clean up old cache data
  const cleanupCache = useCallback(() => {
    const now = Date.now();
    const cleanedWallets = savedWallets.map(wallet => {
      if (wallet.cacheMetadata && wallet.cacheMetadata.retryCount >= wallet.cacheMetadata.maxRetries) {
        // Reset retry count for wallets that have exceeded max retries
        return {
          ...wallet,
          cacheMetadata: {
            ...wallet.cacheMetadata,
            retryCount: 0,
            isStale: true,
          }
        };
      }
      return wallet;
    });

    setSavedWallets(cleanedWallets);
    toast.success("Cache cleanup completed");
  }, [savedWallets, setSavedWallets]);

  // Update cache configuration
  const updateCacheConfig = useCallback((updates: Partial<WalletCacheConfig>) => {
    setCacheConfig(prev => ({
      ...prev,
      ...updates,
    }));
    toast.success("Cache settings updated");
  }, [setCacheConfig]);

  // Get rate limit status for debugging
  const getRateLimitInfo = useCallback(() => {
    return getRateLimitStatus();
  }, []);

  return {
    // Wallet management
    savedWallets,
    addWallet,
    removeWallet,
    
    // Cache operations
    markAsRefreshed,
    isWalletStale,
    getStaleWallets,
    refreshStaleWallets,
    forceRefreshWallet,
    
    // Cache monitoring
    getCacheStatus,
    cleanupCache,
    getRateLimitInfo,
    
    // Configuration
    cacheConfig,
    updateCacheConfig,
    
    // Status
    isOnline,
  };
>>>>>>> origin/main
} 