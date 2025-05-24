/**
 * LP Token Detection and Pool Information for Alephium DEXes
 * This module helps identify LP tokens, pool tokens, and provides proper metadata
 */

// Add cache for LP detection results
const lpDetectionCache = new Map<string, LPTokenInfo>();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
const cacheTimestamps = new Map<string, number>();

export interface PoolInfo {
  poolAddress: string;
  token0: string;
  token1: string;
  token0Symbol: string;
  token1Symbol: string;
  dexName: string;
  poolType: 'LP' | 'Stable' | 'Weighted';
  fee?: number;
}

export interface LPTokenInfo {
  tokenId: string;
  isLPToken: boolean;
  poolInfo?: PoolInfo;
  underlyingTokens?: string[];
  dexProtocol?: string;
  displayName?: string;
  displaySymbol?: string;
}

// OPTIMIZED: More specific and efficient LP patterns
const KNOWN_DEX_PATTERNS = {
  // Alephium DEX - specific patterns only
  ALEPHIUM_DEX: {
    patterns: [
      /^ALPH[-_]USDT$/i,    // Exact ALPH-USDT pairs
      /^ALPH[-_]USDC$/i,    // Exact ALPH-USDC pairs  
      /^ALPH[-_]DAI$/i,     // Exact ALPH-DAI pairs
    ],
    name: 'Alephium DEX'
  },
  // Known LP token formats - MUCH more specific
  UNISWAP_V2_STYLE: {
    patterns: [
      /^LP[-_]/i,           // Starts with LP-
      /^UniV2[-_]/i,        // UniswapV2 style
      /^PancakeLP[-_]/i,    // PancakeSwap style
      /^SLP[-_]/i,          // SushiSwap style
    ],
    name: 'Uniswap V2 Style'
  },
  // MUCH more restrictive generic patterns
  GENERIC_LP: {
    patterns: [
      /[-_]LP$/i,           // Ends with -LP or _LP
      /[-_]POOL$/i,         // Ends with -POOL or _POOL
      /^LP[-_]\w{3,8}[-_]\w{3,8}$/i, // LP-TOKEN-TOKEN format (specific length)
    ],
    name: 'Unknown DEX'
  }
};

// Known LP token registry (can be expanded with API calls)
const KNOWN_LP_TOKENS: Record<string, PoolInfo> = {
  // Example entries - these would be populated from DEX APIs
  // "tokenId": {
  //   poolAddress: "...",
  //   token0: "ALPH",
  //   token1: "USDT",
  //   token0Symbol: "ALPH",
  //   token1Symbol: "USDT",
  //   dexName: "Alephium DEX",
  //   poolType: "LP"
  // }
};

/**
 * OPTIMIZED: Cached LP token detection to prevent duplicate calls
 * This function now caches results to avoid expensive pattern matching
 */
export const detectLPToken = async (tokenId: string, tokenMetadata?: any, isNFT?: boolean): Promise<LPTokenInfo> => {
  // CRITICAL: Skip LP detection for NFTs entirely
  if (isNFT === true) {
    console.log(`[LP Detection] ⏭️ Skipping LP detection for NFT ${tokenId}`);
    return {
      tokenId,
      isLPToken: false
    };
  }

  // Check cache first - MAJOR PERFORMANCE IMPROVEMENT
  const cached = lpDetectionCache.get(tokenId);
  const cacheTime = cacheTimestamps.get(tokenId);
  if (cached && cacheTime && Date.now() - cacheTime < CACHE_DURATION) {
    console.log(`[LP Detection] 🎯 Cache hit for ${tokenId}`);
    return cached;
  }

  // Perform detection
  const result = await performLPDetection(tokenId, tokenMetadata, isNFT);
  
  // Cache the result
  lpDetectionCache.set(tokenId, result);
  cacheTimestamps.set(tokenId, Date.now());
  
  return result;
};

/**
 * Internal function that performs the actual LP detection
 */
const performLPDetection = async (tokenId: string, tokenMetadata?: any, isNFT?: boolean): Promise<LPTokenInfo> => {
  // Check against known LP tokens first
  if (KNOWN_LP_TOKENS[tokenId]) {
    const poolInfo = KNOWN_LP_TOKENS[tokenId];
    return {
      tokenId,
      isLPToken: true,
      poolInfo,
      underlyingTokens: [poolInfo.token0, poolInfo.token1],
      dexProtocol: poolInfo.dexName,
      displayName: `${poolInfo.token0Symbol}/${poolInfo.token1Symbol} LP`,
      displaySymbol: `${poolInfo.token0Symbol}-${poolInfo.token1Symbol}`
    };
  }

  // OPTIMIZED: Pattern-based detection with early exits
  if (tokenMetadata) {
    const { name = '', symbol = '' } = tokenMetadata;
    
    // PERFORMANCE: Early exit for obvious non-LP tokens
    if (symbol.length < 3 || name.length < 3) {
      return { tokenId, isLPToken: false };
    }
    
    // Additional safety check: If symbol looks like an auto-generated NFT symbol, skip
    if (symbol.startsWith('TOKEN-') && symbol.length < 12) {
      console.log(`[LP Detection] ⏭️ Skipping auto-generated token symbol ${symbol} (likely NFT fallback)`);
      return { tokenId, isLPToken: false };
    }
    
    // OPTIMIZED: Check patterns in order of specificity (most specific first)
    for (const [dexKey, dexInfo] of Object.entries(KNOWN_DEX_PATTERNS)) {
      for (const pattern of dexInfo.patterns) {
        // PERFORMANCE: Test symbol first (most likely to match), then name, then tokenId last
        if (pattern.test(symbol) || pattern.test(name)) {
          console.log(`[LP Detection] Token ${tokenId} (${symbol}/${name}) matched ${dexKey} pattern: ${pattern}`);
          return {
            tokenId,
            isLPToken: true,
            dexProtocol: dexInfo.name,
            displayName: `${name} (LP Token)`,
            displaySymbol: symbol.includes('LP') ? symbol : `${symbol}-LP`
          };
        }
      }
    }
  }

  return { tokenId, isLPToken: false };
};

/**
 * Attempts to resolve pool information for an LP token
 * This would integrate with DEX APIs when available
 */
export const resolvePoolInfo = async (tokenId: string): Promise<PoolInfo | null> => {
  try {
    // TODO: Implement actual DEX API calls
    // For now, return known pools
    return KNOWN_LP_TOKENS[tokenId] || null;
    
    // Future implementation would look like:
    // const poolInfo = await fetchPoolInfoFromDEX(tokenId);
    // return poolInfo;
  } catch (error) {
    console.error(`Failed to resolve pool info for ${tokenId}:`, error);
    return null;
  }
};

/**
 * Fetches the underlying token reserves for an LP token
 * This helps calculate the USD value of LP positions
 */
export const getLPTokenValue = async (
  tokenId: string, 
  amount: string, 
  poolInfo: PoolInfo
): Promise<{ usdValue: number; breakdown: Array<{ token: string; amount: string; value: number }> } | null> => {
  try {
    // TODO: Implement actual pool reserves fetching
    // This would involve calling the pool contract to get:
    // 1. Total LP supply
    // 2. Token reserves in the pool
    // 3. Calculate this LP token's share
    
    console.warn('LP token value calculation not yet implemented');
    return null;
    
    // Future implementation:
    // const reserves = await getPoolReserves(poolInfo.poolAddress);
    // const totalSupply = await getLPTokenTotalSupply(tokenId);
    // const userShare = BigInt(amount) / BigInt(totalSupply);
    // return calculateLPValue(reserves, userShare);
  } catch (error) {
    console.error(`Failed to calculate LP token value for ${tokenId}:`, error);
    return null;
  }
};

/**
 * Enhanced token display name that handles LP tokens properly
 * IMPORTANT: Pass isNFT parameter to prevent NFTs from being detected as LP tokens
 */
export const getTokenDisplayInfo = async (tokenId: string, tokenMetadata?: any, isNFT?: boolean) => {
  const lpInfo = await detectLPToken(tokenId, tokenMetadata, isNFT);
  
  if (lpInfo.isLPToken) {
    return {
      displayName: lpInfo.displayName || `${tokenMetadata?.name || tokenId} (LP Token)`,
      displaySymbol: lpInfo.displaySymbol || `${tokenMetadata?.symbol || 'LP'}-LP`,
      isLPToken: true,
      dexProtocol: lpInfo.dexProtocol
    };
  }
  
  return {
    displayName: tokenMetadata?.name || tokenId,
    displaySymbol: tokenMetadata?.symbol || tokenId.substring(0, 6),
    isLPToken: false
  };
};

/**
 * Cache management functions for performance monitoring
 */
export const clearLPDetectionCache = (): void => {
  lpDetectionCache.clear();
  cacheTimestamps.clear();
  console.log('[LP Detection] 🧹 Cache cleared');
};

export const getLPDetectionCacheStats = () => {
  const now = Date.now();
  let validEntries = 0;
  let expiredEntries = 0;
  
  for (const [tokenId, timestamp] of cacheTimestamps.entries()) {
    if (now - timestamp < CACHE_DURATION) {
      validEntries++;
    } else {
      expiredEntries++;
    }
  }
  
  return {
    totalEntries: lpDetectionCache.size,
    validEntries,
    expiredEntries,
    cacheHitRate: validEntries / (validEntries + expiredEntries) || 0
  };
};

export const cleanupExpiredLPCache = (): void => {
  const now = Date.now();
  let cleanedCount = 0;
  
  for (const [tokenId, timestamp] of cacheTimestamps.entries()) {
    if (now - timestamp >= CACHE_DURATION) {
      lpDetectionCache.delete(tokenId);
      cacheTimestamps.delete(tokenId);
      cleanedCount++;
    }
  }
  
  if (cleanedCount > 0) {
    console.log(`[LP Detection] 🧹 Cleaned ${cleanedCount} expired cache entries`);
  }
};

// Make debug functions available globally for console access
if (typeof window !== 'undefined') {
  (window as any).debugLPDetection = getLPDetectionCacheStats;
  (window as any).clearLPDetectionCache = clearLPDetectionCache;
  (window as any).cleanupExpiredLPCache = cleanupExpiredLPCache;
  
  // Add comprehensive debug function
  (window as any).debugLPSystem = () => {
    const stats = getLPDetectionCacheStats();
    console.log('🔍 [LP Detection Debug] System Status:', {
      cache: stats,
      patterns: Object.keys(KNOWN_DEX_PATTERNS),
      knownTokens: Object.keys(KNOWN_LP_TOKENS).length
    });
    
    console.log('📊 [LP Detection] Cache Performance:', {
      hitRate: `${(stats.cacheHitRate * 100).toFixed(1)}%`,
      totalCalls: stats.validEntries + stats.expiredEntries,
      cacheSavings: `${stats.validEntries} duplicate calls avoided`
    });
    
    return stats;
  };
} 