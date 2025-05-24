import { unifiedCacheManager } from '@/lib/utils/UnifiedCacheManager';
import { DAO, DAOProposal } from '@/types/dao';

/**
 * DAO Cache Service
 * Now uses UnifiedCacheManager as backend - eliminates duplicate caching logic
 */
export class DAOCache {
  // Cache all DAOs
  cacheAllDAOs(daos: DAO[]): void {
    unifiedCacheManager.setAllDAOs(daos);
  }
  
  // Cache all DAOs with timestamp tracking
  cacheAllDAOsWithTimestamp(daos: DAO[]): void {
    const STANDARD_TTL = 3 * 60 * 1000; // 3 minutes for general DAOs
    unifiedCacheManager.setAllDAOs(daos, STANDARD_TTL);
    
    // Store metadata about when this was cached
    unifiedCacheManager.set('all_daos_cached_at', Date.now(), STANDARD_TTL, 'dao');
    
    console.log(`[DAOCache] All DAOs cached with timestamp (${daos.length} communities)`);
  }
  
  // Get when all DAOs were last cached
  getAllDAOsCachedAt(): number | null {
    return unifiedCacheManager.get<number>('all_daos_cached_at', 'dao');
  }
  
  // Get cached DAOs
  getAllDAOs(): DAO[] | null {
    return unifiedCacheManager.getAllDAOs();
  }
  
  // Cache user DAOs
  cacheUserDAOs(pubkey: string, daos: DAO[]): void {
    unifiedCacheManager.setUserDAOs(pubkey, daos);
  }
  
  // Cache user DAOs with indefinite TTL (perfect for My Communities)
  cacheUserDAOsIndefinite(pubkey: string, daos: DAO[]): void {
    // Set with 24 hours TTL = effectively indefinite for user sessions
    const INDEFINITE_TTL = 24 * 60 * 60 * 1000; // 24 hours
    unifiedCacheManager.setUserDAOs(pubkey, daos, INDEFINITE_TTL);
    
    // Store metadata about when this was cached for freshness indicators
    unifiedCacheManager.set(`user_daos_cached_at:${pubkey}`, Date.now(), INDEFINITE_TTL, 'dao');
    
    console.log(`[DAOCache] User DAOs cached indefinitely for ${pubkey} (${daos.length} communities)`);
  }
  
  // Get when user DAOs were last cached
  getUserDAOsCachedAt(pubkey: string): number | null {
    return unifiedCacheManager.get<number>(`user_daos_cached_at:${pubkey}`, 'dao');
  }
  
  // Check if user DAOs cache is fresh (for UI indicators)
  isUserDAOsCacheFresh(pubkey: string, freshnessThreshold: number = 5 * 60 * 1000): boolean {
    const cachedAt = this.getUserDAOsCachedAt(pubkey);
    if (!cachedAt) return false;
    
    return (Date.now() - cachedAt) < freshnessThreshold;
  }
  
  // Force refresh user DAOs (clears cache and requires new fetch)
  forceRefreshUserDAOs(pubkey: string): void {
    this.invalidateUserDAOs(pubkey);
    unifiedCacheManager.delete(`user_daos_cached_at:${pubkey}`, 'dao');
    console.log(`[DAOCache] Forced refresh for user DAOs: ${pubkey}`);
  }
  
  // Get cached user DAOs
  getUserDAOs(pubkey: string): DAO[] | null {
    return unifiedCacheManager.getUserDAOs(pubkey);
  }
  
  // Cache trending DAOs
  cacheTrendingDAOs(daos: DAO[]): void {
    unifiedCacheManager.setTrendingDAOs(daos);
  }
  
  // Get cached trending DAOs
  getTrendingDAOs(): DAO[] | null {
    return unifiedCacheManager.getTrendingDAOs();
  }
  
  // Cache DAO details
  cacheDAO(daoId: string, dao: DAO): void {
    unifiedCacheManager.setDAO(daoId, dao);
  }
  
  // Get cached DAO details
  getDAO(daoId: string): DAO | null {
    return unifiedCacheManager.getDAO(daoId);
  }
  
  // Cache DAO proposals
  cacheDAOProposals(daoId: string, proposals: DAOProposal[]): void {
    unifiedCacheManager.setDAOProposals(daoId, proposals);
  }
  
  // Get cached DAO proposals
  getDAOProposals(daoId: string): DAOProposal[] | null {
    return unifiedCacheManager.getDAOProposals(daoId);
  }
  
  // Cache kick proposals (specialized DAO proposals)
  cacheKickProposals(daoId: string, proposals: any[]): void {
    unifiedCacheManager.set(`kick_proposals:${daoId}`, proposals, undefined, 'dao');
  }
  
  // Get cached kick proposals
  getKickProposals(daoId: string): any[] | null {
    return unifiedCacheManager.get<any[]>(`kick_proposals:${daoId}`, 'dao');
  }
  
  // Invalidate specific cache entries when data changes
  invalidateDAO(daoId: string): void {
    unifiedCacheManager.invalidateDAO(daoId);
  }
  
  // Invalidate user DAO cache
  invalidateUserDAOs(pubkey: string): void {
    unifiedCacheManager.delete(`daos:user:${pubkey}`, 'dao');
  }
  
  // Invalidate all DAO caches
  invalidateAll(): void {
    unifiedCacheManager.clear('dao');
  }
}

// Export singleton instance
export const daoCache = new DAOCache();
