/**
 * WalletDataManager - Centralized wallet data management with performance optimizations
 * Follows the data manager > adapter > hook > component architecture
 */

import { EnrichedToken } from '../api/alephiumApi';

export interface WalletData {
  address: string;
  balance: {
    balance: number;
    lockedBalance: number;
    utxoNum: number;
  };
  tokens: EnrichedToken[];
  transactions: any[];
  nfts: EnrichedToken[];
  lastUpdated: number;
  isLoading: boolean;
  error: string | null;
}

export interface CacheOptions {
  ttl: number; // Time to live in milliseconds
  maxEntries: number;
  enablePersistence: boolean;
}

export interface DataManagerStats {
  cacheSize: number;
  hitRate: number;
  totalRequests: number;
  cacheHits: number;
  activeFetches: number;
  lastCleanup: number;
}

class WalletDataManager {
  private cache = new Map<string, WalletData>();
  private cacheTTL = new Map<string, number>();
  private loadingStates = new Map<string, Promise<WalletData>>();
  private subscribers = new Map<string, Set<(data: WalletData) => void>>();
  
  // Performance tracking
  private stats = {
    totalRequests: 0,
    cacheHits: 0,
    activeFetches: 0,
    lastCleanup: Date.now()
  };

  // Configuration
  private config: CacheOptions = {
    ttl: 30000, // 30 seconds default TTL
    maxEntries: 100,
    enablePersistence: true
  };

  constructor(options?: Partial<CacheOptions>) {
    if (options) {
      this.config = { ...this.config, ...options };
    }
    
    // Start periodic cleanup
    this.startCleanupRoutine();
    
    // Load persisted data if enabled
    if (this.config.enablePersistence) {
      this.loadPersistedData();
    }

    console.log('[WalletDataManager] Initialized with config:', this.config);
  }

  /**
   * Get wallet data with intelligent caching
   */
  async getWalletData(address: string, forceRefresh: boolean = false): Promise<WalletData> {
    this.stats.totalRequests++;
    const cacheKey = this.getCacheKey(address);

    // Check cache first (unless force refresh)
    if (!forceRefresh && this.isValidCache(cacheKey)) {
      this.stats.cacheHits++;
      const cached = this.cache.get(cacheKey)!;
      console.log(`[WalletDataManager] Cache hit for ${address}`);
      
      // Notify subscribers with cached data
      this.notifySubscribers(address, cached);
      return cached;
    }

    // Check if already loading
    if (this.loadingStates.has(cacheKey)) {
      console.log(`[WalletDataManager] Already loading ${address}, waiting...`);
      return await this.loadingStates.get(cacheKey)!;
    }

    // Create loading promise
    const loadingPromise = this.fetchWalletData(address);
    this.loadingStates.set(cacheKey, loadingPromise);
    this.stats.activeFetches++;

    try {
      const data = await loadingPromise;
      
      // Cache the result
      this.cache.set(cacheKey, data);
      this.cacheTTL.set(cacheKey, Date.now() + this.config.ttl);
      
      // Persist if enabled
      if (this.config.enablePersistence) {
        this.persistData(cacheKey, data);
      }
      
      // Notify subscribers
      this.notifySubscribers(address, data);
      
      console.log(`[WalletDataManager] Fetched and cached data for ${address}`);
      return data;
    } catch (error) {
      console.error(`[WalletDataManager] Error fetching data for ${address}:`, error);
      
      // Return error state
      const errorData: WalletData = {
        address,
        balance: { balance: 0, lockedBalance: 0, utxoNum: 0 },
        tokens: [],
        transactions: [],
        nfts: [],
        lastUpdated: Date.now(),
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      
      this.notifySubscribers(address, errorData);
      return errorData;
    } finally {
      this.loadingStates.delete(cacheKey);
      this.stats.activeFetches--;
    }
  }

  /**
   * Subscribe to wallet data changes
   */
  subscribe(address: string, callback: (data: WalletData) => void): () => void {
    const subscribers = this.subscribers.get(address) || new Set();
    subscribers.add(callback);
    this.subscribers.set(address, subscribers);

    console.log(`[WalletDataManager] Subscribed to ${address}, total subscribers: ${subscribers.size}`);

    // Return unsubscribe function
    return () => {
      subscribers.delete(callback);
      if (subscribers.size === 0) {
        this.subscribers.delete(address);
      }
      console.log(`[WalletDataManager] Unsubscribed from ${address}`);
    };
  }

  /**
   * Batch fetch multiple wallets
   */
  async getBatchWalletData(addresses: string[], forceRefresh: boolean = false): Promise<Map<string, WalletData>> {
    console.log(`[WalletDataManager] Batch fetching ${addresses.length} wallets`);
    
    const results = new Map<string, WalletData>();
    const fetchPromises = addresses.map(async (address) => {
      try {
        const data = await this.getWalletData(address, forceRefresh);
        results.set(address, data);
      } catch (error) {
        console.error(`[WalletDataManager] Batch fetch error for ${address}:`, error);
      }
    });

    await Promise.allSettled(fetchPromises);
    console.log(`[WalletDataManager] Batch fetch completed: ${results.size}/${addresses.length} successful`);
    
    return results;
  }

  /**
   * Preload wallet data in background
   */
  async preloadWalletData(addresses: string[]): Promise<void> {
    console.log(`[WalletDataManager] Preloading ${addresses.length} wallets in background`);
    
    // Don't await - this runs in background
    addresses.forEach(address => {
      if (!this.isValidCache(this.getCacheKey(address))) {
        this.getWalletData(address).catch(error => {
          console.warn(`[WalletDataManager] Preload failed for ${address}:`, error);
        });
      }
    });
  }

  /**
   * Get manager statistics
   */
  getStats(): DataManagerStats {
    const hitRate = this.stats.totalRequests > 0 
      ? (this.stats.cacheHits / this.stats.totalRequests) * 100 
      : 0;

    return {
      cacheSize: this.cache.size,
      hitRate: Math.round(hitRate * 100) / 100,
      totalRequests: this.stats.totalRequests,
      cacheHits: this.stats.cacheHits,
      activeFetches: this.stats.activeFetches,
      lastCleanup: this.stats.lastCleanup
    };
  }

  /**
   * Clear cache for specific address or all
   */
  clearCache(address?: string): void {
    if (address) {
      const cacheKey = this.getCacheKey(address);
      this.cache.delete(cacheKey);
      this.cacheTTL.delete(cacheKey);
      console.log(`[WalletDataManager] Cleared cache for ${address}`);
    } else {
      this.cache.clear();
      this.cacheTTL.clear();
      console.log('[WalletDataManager] Cleared all cache');
    }
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<CacheOptions>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('[WalletDataManager] Updated config:', this.config);
  }

  // Private methods

  private async fetchWalletData(address: string): Promise<WalletData> {
    console.log(`[WalletDataManager] Fetching fresh data for ${address}`);
    
    // Dynamic imports to avoid circular dependencies
    const { getAddressBalance, getAddressTokens, getAddressNFTs, getAddressTransactions } = 
      await import('../api/alephiumApi');

    const startTime = Date.now();
    
    // Create loading state
    const loadingData: WalletData = {
      address,
      balance: { balance: 0, lockedBalance: 0, utxoNum: 0 },
      tokens: [],
      transactions: [],
      nfts: [],
      lastUpdated: Date.now(),
      isLoading: true,
      error: null
    };

    // Notify subscribers of loading state
    this.notifySubscribers(address, loadingData);

    try {
      // Fetch all data in parallel
      const [balance, tokens, nfts, transactions] = await Promise.allSettled([
        getAddressBalance(address),
        getAddressTokens(address),
        getAddressNFTs(address),
        getAddressTransactions(address, 20)
      ]);

      const fetchTime = Date.now() - startTime;
      console.log(`[WalletDataManager] Data fetch completed for ${address} in ${fetchTime}ms`);

      return {
        address,
        balance: balance.status === 'fulfilled' ? balance.value : { balance: 0, lockedBalance: 0, utxoNum: 0 },
        tokens: tokens.status === 'fulfilled' ? tokens.value : [],
        nfts: nfts.status === 'fulfilled' ? nfts.value : [],
        transactions: transactions.status === 'fulfilled' ? transactions.value : [],
        lastUpdated: Date.now(),
        isLoading: false,
        error: null
      };
    } catch (error) {
      console.error(`[WalletDataManager] Failed to fetch data for ${address}:`, error);
      throw error;
    }
  }

  private getCacheKey(address: string): string {
    return `wallet_${address}`;
  }

  private isValidCache(cacheKey: string): boolean {
    if (!this.cache.has(cacheKey)) return false;
    
    const expiry = this.cacheTTL.get(cacheKey);
    if (!expiry || Date.now() > expiry) {
      this.cache.delete(cacheKey);
      this.cacheTTL.delete(cacheKey);
      return false;
    }
    
    return true;
  }

  private notifySubscribers(address: string, data: WalletData): void {
    const subscribers = this.subscribers.get(address);
    if (subscribers) {
      subscribers.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('[WalletDataManager] Error in subscriber callback:', error);
        }
      });
    }
  }

  private startCleanupRoutine(): void {
    setInterval(() => {
      this.cleanupExpiredCache();
    }, 60000); // Cleanup every minute
  }

  private cleanupExpiredCache(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, expiry] of this.cacheTTL.entries()) {
      if (now > expiry) {
        this.cache.delete(key);
        this.cacheTTL.delete(key);
        cleaned++;
      }
    }

    // Enforce max entries limit
    if (this.cache.size > this.config.maxEntries) {
      const excess = this.cache.size - this.config.maxEntries;
      const oldestKeys = Array.from(this.cache.keys()).slice(0, excess);
      
      oldestKeys.forEach(key => {
        this.cache.delete(key);
        this.cacheTTL.delete(key);
        cleaned++;
      });
    }

    this.stats.lastCleanup = now;
    
    if (cleaned > 0) {
      console.log(`[WalletDataManager] Cleaned up ${cleaned} expired cache entries`);
    }
  }

  private persistData(key: string, data: WalletData): void {
    try {
      localStorage.setItem(`wallet_cache_${key}`, JSON.stringify({
        data,
        expiry: this.cacheTTL.get(key)
      }));
    } catch (error) {
      console.warn('[WalletDataManager] Failed to persist data:', error);
    }
  }

  private loadPersistedData(): void {
    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith('wallet_cache_'));
      
      keys.forEach(storageKey => {
        try {
          const stored = localStorage.getItem(storageKey);
          if (stored) {
            const { data, expiry } = JSON.parse(stored);
            const cacheKey = storageKey.replace('wallet_cache_', '');
            
            if (Date.now() < expiry) {
              this.cache.set(cacheKey, data);
              this.cacheTTL.set(cacheKey, expiry);
            } else {
              localStorage.removeItem(storageKey);
            }
          }
        } catch (error) {
          console.warn(`[WalletDataManager] Failed to load persisted data for ${storageKey}:`, error);
          localStorage.removeItem(storageKey);
        }
      });
      
      console.log(`[WalletDataManager] Loaded ${this.cache.size} persisted cache entries`);
    } catch (error) {
      console.warn('[WalletDataManager] Failed to load persisted data:', error);
    }
  }
}

// Export singleton instance
export const walletDataManager = new WalletDataManager({
  ttl: 30000, // 30 seconds
  maxEntries: 50, // Reasonable for wallet app
  enablePersistence: true
});

export default WalletDataManager; 