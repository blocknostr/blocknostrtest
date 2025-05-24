import { ProfileData } from '@/lib/services/profile/types';
import { DAO, DAOProposal } from '@/types/dao';

type CacheItem<T> = {
  data: T;
  timestamp: number;
  expiresAt: number;
}

type CacheDomain = 'profile' | 'dao' | 'generic';

/**
 * Enhanced Unified Cache Manager
 * Consolidates ALL caching approaches including ProfileCache capabilities
 * - Multi-tiered caching strategy
 * - Hot cache for frequently accessed items
 * - Background prefetching
 * - Access frequency tracking
 * - Domain-specific optimizations
 */
export class UnifiedCacheManager {
  private static instance: UnifiedCacheManager;
  
  // Domain-specific caches
  private profileCache: Map<string, CacheItem<ProfileData>> = new Map();
  private daoCache: Map<string, CacheItem<DAO[] | DAO | DAOProposal[]>> = new Map();
  private genericCache: Map<string, CacheItem<any>> = new Map();
  
  // Enhanced profile features (absorbed from ProfileCache)
  private profileHotCache: Map<string, ProfileData> = new Map();
  private profileAccessCounts: Map<string, number> = new Map();
  private prefetchQueue: string[] = [];
  private backgroundRefreshTimer: number | null = null;
  private offlineMode: boolean = false;
  
  // Configuration
  private readonly defaultTTL = {
    profile: 5 * 60 * 1000, // 5 minutes
    dao: 3 * 60 * 1000,     // 3 minutes  
    generic: 5 * 60 * 1000  // 5 minutes
  };
  
  private readonly HOT_CACHE_TTL = 2 * 60 * 1000; // 2 minutes for hot cache
  private readonly FREQUENT_ACCESS_THRESHOLD = 3;
  private readonly PREFETCH_QUEUE_SIZE = 20;
  private readonly PREFETCH_BATCH_SIZE = 5;

  private constructor() {
    // Start cleanup interval for expired entries
    this.startCacheCleanup();
    
    // Start background refresh for frequently accessed profiles
    this.startBackgroundRefresh();
  }

  public static getInstance(): UnifiedCacheManager {
    if (!UnifiedCacheManager.instance) {
      UnifiedCacheManager.instance = new UnifiedCacheManager();
    }
    return UnifiedCacheManager.instance;
  }

  // ============================================================================
  // OFFLINE MODE SUPPORT (FROM PROFILECACHE)
  // ============================================================================

  /**
   * Set offline mode status
   */
  setOfflineMode(offline: boolean): void {
    this.offlineMode = offline;
    console.log(`[UnifiedCacheManager] Offline mode: ${offline ? 'enabled' : 'disabled'}`);
  }

  /**
   * Get offline mode status
   */
  isOffline(): boolean {
    return this.offlineMode;
  }

  // ============================================================================
  // GENERIC CACHE OPERATIONS
  // ============================================================================

  /**
   * Get an item from cache with domain separation
   */
  get<T>(key: string, domain: CacheDomain = 'generic'): T | null {
    const cache = this.getCacheForDomain(domain);
    const item = cache.get(key);
    
    if (!item) {
      return null;
    }
    
    // Check if item is expired
    if (Date.now() > item.expiresAt) {
      cache.delete(key);
      return null;
    }
    
    return item.data as T;
  }

  /**
   * Set an item in cache with domain separation
   */
  set<T>(key: string, data: T, ttl?: number, domain: CacheDomain = 'generic'): void {
    const cache = this.getCacheForDomain(domain);
    const timestamp = Date.now();
    const expiresAt = timestamp + (ttl || this.defaultTTL[domain]);
    
    cache.set(key, {
      data,
      timestamp,
      expiresAt
    });
  }

  /**
   * Check if key exists in cache and is not expired
   */
  has(key: string, domain: CacheDomain = 'generic'): boolean {
    const cache = this.getCacheForDomain(domain);
    const item = cache.get(key);
    
    if (!item) {
      return false;
    }
    
    // Check if item is expired
    if (Date.now() > item.expiresAt) {
      cache.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * Remove item from cache
   */
  delete(key: string, domain: CacheDomain = 'generic'): boolean {
    const cache = this.getCacheForDomain(domain);
    
    // Also clean hot cache for profiles
    if (domain === 'profile' && key.startsWith('profile:')) {
      const pubkey = key.replace('profile:', '');
      this.profileHotCache.delete(pubkey);
    }
    
    return cache.delete(key);
  }

  /**
   * Clear cache for a specific domain or all caches
   */
  clear(domain?: CacheDomain): void {
    if (domain) {
      this.getCacheForDomain(domain).clear();
      
      // Clear related hot cache if clearing profiles
      if (domain === 'profile') {
        this.profileHotCache.clear();
        this.profileAccessCounts.clear();
        this.prefetchQueue = [];
      }
    } else {
      this.profileCache.clear();
      this.daoCache.clear();
      this.genericCache.clear();
      this.profileHotCache.clear();
      this.profileAccessCounts.clear();
      this.prefetchQueue = [];
    }
  }

  // ============================================================================
  // ENHANCED PROFILE OPERATIONS (ABSORBED FROM PROFILECACHE)
  // ============================================================================

  /**
   * Get profile with enhanced multi-tiered caching strategy
   * Checks hot cache first, then regular cache
   */
  getProfile(pubkey: string): ProfileData | null {
    // Track access frequency
    this.trackProfileAccess(pubkey);
    
    // Check hot cache first (fastest)
    if (this.profileHotCache.has(pubkey)) {
      return this.profileHotCache.get(pubkey)!;
    }
    
    // Fall back to regular cache
    const profile = this.get<ProfileData>(`profile:${pubkey}`, 'profile');
    
    // If frequently accessed, promote to hot cache
    if (profile && this.isFrequentlyAccessed(pubkey)) {
      this.profileHotCache.set(pubkey, profile);
      
      // Auto-expire from hot cache
      setTimeout(() => {
        this.profileHotCache.delete(pubkey);
      }, this.HOT_CACHE_TTL);
    }
    
    return profile;
  }

  /**
   * Set profile with enhanced strategy
   */
  setProfile(pubkey: string, profileData: ProfileData, ttl?: number): void {
    // Store in regular cache
    this.set(`profile:${pubkey}`, profileData, ttl, 'profile');
    
    // If frequently accessed, also store in hot cache
    if (this.isFrequentlyAccessed(pubkey)) {
      this.profileHotCache.set(pubkey, profileData);
    }
    
    // Queue related profiles for prefetching
    this.queueRelatedProfilesForPrefetch(profileData);
  }

  /**
   * Cache profile item (ProfileCache compatibility method)
   */
  cacheItem(pubkey: string, profileData: any, important: boolean = false): void {
    if (!profileData) return;
    
    try {
      // Add creation timestamp to profile data for account age
      if (profileData && !profileData._createdAt && profileData.created_at) {
        profileData._createdAt = profileData.created_at;
      }
      
      // Use enhanced profile caching
      this.setProfile(pubkey, profileData);
    } catch (error) {
      console.error(`Error caching profile for ${pubkey}:`, error);
    }
  }

  /**
   * Get profile item (ProfileCache compatibility method)
   */
  getItem(pubkey: string): any | null {
    return this.getProfile(pubkey);
  }

  /**
   * Check if profile is cached (checks both hot and regular cache)
   */
  hasProfile(pubkey: string): boolean {
    return this.profileHotCache.has(pubkey) || this.has(`profile:${pubkey}`, 'profile');
  }

  /**
   * Remove profile from all caches
   */
  deleteProfile(pubkey: string): boolean {
    this.profileHotCache.delete(pubkey);
    this.profileAccessCounts.delete(pubkey);
    return this.delete(`profile:${pubkey}`, 'profile');
  }

  /**
   * Get all cached profile keys
   */
  getProfileKeys(): string[] {
    const regularKeys = Array.from(this.profileCache.keys())
      .filter(key => key.startsWith('profile:'))
      .map(key => key.replace('profile:', ''));
    
    const hotKeys = Array.from(this.profileHotCache.keys());
    
    // Return unique combination
    return [...new Set([...regularKeys, ...hotKeys])];
  }

  /**
   * Clean up expired entries (ProfileCache compatibility)
   */
  cleanupExpiredEntries(): void {
    this.cleanupExpiredEntriesInternal();
  }

  // ============================================================================
  // PROFILE ACCESS TRACKING (FROM PROFILECACHE)
  // ============================================================================

  /**
   * Track profile access frequency
   */
  private trackProfileAccess(pubkey: string): void {
    const currentCount = this.profileAccessCounts.get(pubkey) || 0;
    this.profileAccessCounts.set(pubkey, currentCount + 1);
    
    // Periodically normalize access counts to prevent overflow
    if (this.profileAccessCounts.size > 1000) {
      this.normalizeAccessCounts();
    }
  }

  /**
   * Check if a profile is frequently accessed
   */
  private isFrequentlyAccessed(pubkey: string): boolean {
    const count = this.profileAccessCounts.get(pubkey) || 0;
    return count > this.FREQUENT_ACCESS_THRESHOLD;
  }

  /**
   * Normalize access counts to prevent overflow
   */
  private normalizeAccessCounts(): void {
    this.profileAccessCounts.forEach((count, key) => {
      this.profileAccessCounts.set(key, Math.max(1, Math.floor(count / 2)));
    });
  }

  /**
   * Queue related profiles for prefetching
   */
  private queueRelatedProfilesForPrefetch(profileData: ProfileData): void {
    if (!profileData) return;
    
    const relatedPubkeys: string[] = [];
    
    // Extract from mentions in profile description
    if ((profileData as any).about) {
      const mentionMatches = (profileData as any).about.match(/nostr:npub[a-z0-9]{59}/g) || [];
      mentionMatches.forEach((match: string) => {
        const pubkey = match.replace('nostr:', '');
        relatedPubkeys.push(pubkey);
      });
    }
    
    // Check for other related profiles in custom fields
    if ((profileData as any).relatedProfiles && Array.isArray((profileData as any).relatedProfiles)) {
      (profileData as any).relatedProfiles.forEach((pubkey: string) => {
        relatedPubkeys.push(pubkey);
      });
    }
    
    // Add to prefetch queue (up to 5 related profiles)
    const uniquePubkeys = [...new Set(relatedPubkeys)].slice(0, this.PREFETCH_BATCH_SIZE);
    this.prefetchQueue.push(...uniquePubkeys);
    
    // Cap prefetch queue size
    if (this.prefetchQueue.length > this.PREFETCH_QUEUE_SIZE) {
      this.prefetchQueue = this.prefetchQueue.slice(-this.PREFETCH_QUEUE_SIZE);
    }
  }

  // ============================================================================
  // BACKGROUND OPERATIONS (FROM PROFILECACHE)
  // ============================================================================

  /**
   * Start background refresh for frequently accessed profiles
   */
  private startBackgroundRefresh(): void {
    if (this.backgroundRefreshTimer) {
      clearInterval(this.backgroundRefreshTimer);
    }
    
    // Process prefetch queue every 5 minutes
    this.backgroundRefreshTimer = window.setInterval(() => {
      this.processPrefetchQueue();
    }, 5 * 60 * 1000);
  }

  /**
   * Process the prefetch queue
   */
  private processPrefetchQueue(): void {
    // Process up to 5 profiles at a time from the queue
    const toProcess = this.prefetchQueue.splice(0, this.PREFETCH_BATCH_SIZE);
    
    if (toProcess.length === 0) return;
    
    console.log(`[UnifiedCacheManager] Background prefetching ${toProcess.length} profiles`, toProcess);
    
    // Note: In a real implementation, this would fetch profiles and cache them
    // For now, we just log the intent
  }

  // ============================================================================
  // DAO-SPECIFIC OPERATIONS
  // ============================================================================

  /**
   * Get all DAOs
   */
  getAllDAOs(): DAO[] | null {
    return this.get<DAO[]>('daos:all', 'dao');
  }

  /**
   * Set all DAOs
   */
  setAllDAOs(daos: DAO[], ttl?: number): void {
    this.set('daos:all', daos, ttl, 'dao');
  }

  /**
   * Get user DAOs
   */
  getUserDAOs(pubkey: string): DAO[] | null {
    return this.get<DAO[]>(`daos:user:${pubkey}`, 'dao');
  }

  /**
   * Set user DAOs
   */
  setUserDAOs(pubkey: string, daos: DAO[], ttl?: number): void {
    this.set(`daos:user:${pubkey}`, daos, ttl, 'dao');
  }

  /**
   * Get trending DAOs
   */
  getTrendingDAOs(): DAO[] | null {
    return this.get<DAO[]>('daos:trending', 'dao');
  }

  /**
   * Set trending DAOs
   */
  setTrendingDAOs(daos: DAO[], ttl?: number): void {
    this.set('daos:trending', daos, ttl, 'dao');
  }

  /**
   * Get DAO details
   */
  getDAO(daoId: string): DAO | null {
    return this.get<DAO>(`dao:${daoId}`, 'dao');
  }

  /**
   * Set DAO details
   */
  setDAO(daoId: string, dao: DAO, ttl?: number): void {
    this.set(`dao:${daoId}`, dao, ttl, 'dao');
  }

  /**
   * Get DAO proposals
   */
  getDAOProposals(daoId: string): DAOProposal[] | null {
    return this.get<DAOProposal[]>(`proposals:${daoId}`, 'dao');
  }

  /**
   * Set DAO proposals
   */
  setDAOProposals(daoId: string, proposals: DAOProposal[], ttl?: number): void {
    this.set(`proposals:${daoId}`, proposals, ttl, 'dao');
  }

  /**
   * Invalidate DAO-related caches
   */
  invalidateDAO(daoId: string): void {
    this.delete(`dao:${daoId}`, 'dao');
    this.delete(`proposals:${daoId}`, 'dao');
  }

  // ============================================================================
  // UTILITY OPERATIONS
  // ============================================================================

  /**
   * Get all keys with a specific prefix
   */
  getKeysWithPrefix(prefix: string, domain: CacheDomain = 'generic'): string[] {
    const cache = this.getCacheForDomain(domain);
    return Array.from(cache.keys()).filter(key => key.startsWith(prefix));
  }

  /**
   * Delete all keys with a specific prefix
   */
  deleteKeysWithPrefix(prefix: string, domain: CacheDomain = 'generic'): number {
    const cache = this.getCacheForDomain(domain);
    let count = 0;
    
    for (const key of this.getKeysWithPrefix(prefix, domain)) {
      if (cache.delete(key)) {
        count++;
      }
    }
    
    return count;
  }

  /**
   * Get enhanced cache statistics
   */
  getStats(): Record<CacheDomain | 'total' | 'hotCache', { size: number; expired: number }> {
    const now = Date.now();
    
    const calculateStats = (cache: Map<string, CacheItem<any>>) => {
      let expired = 0;
      cache.forEach(item => {
        if (now > item.expiresAt) expired++;
      });
      return { size: cache.size, expired };
    };

    const profileStats = calculateStats(this.profileCache);
    const daoStats = calculateStats(this.daoCache);
    const genericStats = calculateStats(this.genericCache);

    return {
      profile: profileStats,
      dao: daoStats,
      generic: genericStats,
      hotCache: { 
        size: this.profileHotCache.size, 
        expired: 0 // Hot cache items auto-expire
      },
      total: {
        size: profileStats.size + daoStats.size + genericStats.size + this.profileHotCache.size,
        expired: profileStats.expired + daoStats.expired + genericStats.expired
      }
    };
  }

  /**
   * Get cache for specific domain
   */
  private getCacheForDomain(domain: CacheDomain): Map<string, CacheItem<any>> {
    switch (domain) {
      case 'profile': return this.profileCache;
      case 'dao': return this.daoCache;
      case 'generic': return this.genericCache;
      default: return this.genericCache;
    }
  }

  /**
   * Start cache cleanup interval
   */
  private startCacheCleanup(): void {
    setInterval(() => {
      this.cleanupExpiredEntriesInternal();
    }, 60000); // Every minute
  }

  /**
   * Clean up expired entries across all caches
   */
  private cleanupExpiredEntriesInternal(): void {
    const now = Date.now();
    
    // Clean profile cache
    for (const [key, item] of this.profileCache.entries()) {
      if (now > item.expiresAt) {
        this.profileCache.delete(key);
      }
    }
    
    // Clean DAO cache
    for (const [key, item] of this.daoCache.entries()) {
      if (now > item.expiresAt) {
        this.daoCache.delete(key);
      }
    }
    
    // Clean generic cache
    for (const [key, item] of this.genericCache.entries()) {
      if (now > item.expiresAt) {
        this.genericCache.delete(key);
      }
    }
  }

  /**
   * Dispose and clean up all resources
   */
  dispose(): void {
    if (this.backgroundRefreshTimer) {
      clearInterval(this.backgroundRefreshTimer);
      this.backgroundRefreshTimer = null;
    }
    
    this.clear(); // Clear all caches
  }
}

// Export singleton instance
export const unifiedCacheManager = UnifiedCacheManager.getInstance();

/**
 * Helper function for cache-or-create pattern
 */
export async function getOrCreateCached<T>(
  key: string, 
  fetchFn: () => Promise<T>, 
  ttl?: number,
  domain: CacheDomain = 'generic'
): Promise<T> {
  const cached = unifiedCacheManager.get<T>(key, domain);
  
  if (cached !== null) {
    return cached;
  }
  
  const data = await fetchFn();
  unifiedCacheManager.set(key, data, ttl, domain);
  
  return data;
} 