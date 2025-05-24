/**
 * Simplified Pricing Service
 * Primary: Mobula API (https://docs.mobula.io)
 * Fallback: CoinGecko API for specific mapped tokens
 */

import { getAlephiumPriceFromMobula, getTokenPriceFromMobula, getMultipleTokenPricesFromMobula, TokenPrice as MobulaTokenPrice } from './mobulaApi';
import { getAlephiumPrice, getMultipleCoinsPrice } from './coingeckoApi';
import { getCoinGeckoId, getAllCoinGeckoIds } from './tokenMappings';

export interface TokenPrice {
  tokenId: string;
  symbol: string;
  price: number; // USD price
  source: 'mobula' | 'coingecko' | 'estimate';
  confidence: 'high' | 'medium' | 'low';
  lastUpdated: number;
  volume24h?: number;
  priceALPH?: number; // Price in ALPH terms
}

// Global price cache
const priceCache = new Map<string, { price: TokenPrice; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

let cachedAlphPrice: number = 0;
let alphPriceTimestamp: number = 0;
let alphFetchPromise: Promise<number> | null = null; // Mutex to prevent concurrent fetches

/**
 * Get current ALPH price in USD
 */
export const getAlphPrice = async (): Promise<number> => {
  const now = Date.now();
  
  // Return cached price if still valid
  if (cachedAlphPrice > 0 && now - alphPriceTimestamp < CACHE_DURATION) {
    console.log(`[Pricing] ✅ ALPH price from cache: $${cachedAlphPrice}`);
    return cachedAlphPrice;
  }

  // If already fetching, wait for existing promise (race condition fix)
  if (alphFetchPromise) {
    console.log('[Pricing] 🔒 ALPH fetch already in progress, waiting...');
    return await alphFetchPromise;
  }

  console.log('[Pricing] 🚀 Starting fresh ALPH price fetch...');

  // Create new fetch promise
  alphFetchPromise = (async (): Promise<number> => {
    try {
      // Try Mobula first
      console.log('[Pricing] Trying Mobula for ALPH...');
      const mobulaPrice = await getAlephiumPriceFromMobula();
      console.log('[Pricing] Mobula ALPH response:', mobulaPrice);
      
      if (mobulaPrice && mobulaPrice.price > 0) {
        cachedAlphPrice = mobulaPrice.price;
        alphPriceTimestamp = now;
        console.log(`[Pricing] ✅ ALPH price from Mobula: $${cachedAlphPrice}`);
        return cachedAlphPrice;
      }

      // Fallback to CoinGecko
      console.log('[Pricing] Mobula failed, trying CoinGecko for ALPH...');
      const coingeckoPrice = await getAlephiumPrice();
      console.log('[Pricing] CoinGecko ALPH response:', coingeckoPrice);
      
      if (coingeckoPrice && coingeckoPrice.price > 0) {
        cachedAlphPrice = coingeckoPrice.price;
        alphPriceTimestamp = now;
        console.log(`[Pricing] ✅ ALPH price from CoinGecko: $${cachedAlphPrice}`);
        return cachedAlphPrice;
      }

      console.error('[Pricing] ❌ No ALPH price available from any source');
      return cachedAlphPrice || 0; // Return cached or 0

    } catch (error) {
      console.error('[Pricing] ❌ Error fetching ALPH price:', error);
      return cachedAlphPrice || 0; // Return cached or 0
    }
  })();

  try {
    const result = await alphFetchPromise;
    return result;
  } finally {
    // Clear the promise when done
    alphFetchPromise = null;
  }
};

/**
 * Get ALPH price with change data (compatible with WalletDashboard)
 */
export const getAlephiumPriceWithChange = async (): Promise<{
  price: number;
  priceChange24h: number;
  lastUpdated: Date;
}> => {
  try {
    console.log('[Pricing] 📊 Getting ALPH price with change data for dashboard...');
    const alphPrice = await getAlphPrice();
    
    const result = {
      price: alphPrice,
      priceChange24h: 0, // TODO: Get actual 24h change
      lastUpdated: new Date()
    };
    
    console.log('[Pricing] 📊 Dashboard ALPH price result:', result);
    return result;
  } catch (error) {
    console.error('[Pricing] ❌ Error getting ALPH price for dashboard:', error);
    return {
      price: 0,
      priceChange24h: 0,
      lastUpdated: new Date()
    };
  }
};

/**
 * Get token price by ID/address
 */
export const getTokenPrice = async (tokenId: string, preloadedAlphPrice?: number): Promise<TokenPrice> => {
  try {
    const cacheKey = tokenId;
    const cached = priceCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.price;
    }

    console.log(`[Pricing] Fetching price for ${tokenId}...`);

    // For ALPH, use dedicated method
    if (tokenId === 'ALPH' || tokenId.toLowerCase() === 'alph') {
      const alphPrice = preloadedAlphPrice || await getAlphPrice();
      const tokenPrice: TokenPrice = {
        tokenId: 'ALPH',
        symbol: 'ALPH',
        price: alphPrice,
        source: alphPrice > 0 ? 'mobula' : 'estimate',
        confidence: alphPrice > 0 ? 'high' : 'low',
        lastUpdated: Date.now(),
        priceALPH: 1.0
      };
      
      priceCache.set(cacheKey, { price: tokenPrice, timestamp: Date.now() });
      return tokenPrice;
    }

    // Try Mobula first for all tokens
    const mobulaPrice = await getTokenPriceFromMobula(tokenId);
    if (mobulaPrice && mobulaPrice.price > 0) {
      const alphPrice = preloadedAlphPrice || await getAlphPrice();
      const tokenPrice: TokenPrice = {
        tokenId,
        symbol: mobulaPrice.symbol,
        price: mobulaPrice.price,
        source: 'mobula',
        confidence: mobulaPrice.confidence,
        lastUpdated: Date.now(),
        volume24h: mobulaPrice.volume24h,
        priceALPH: alphPrice > 0 ? mobulaPrice.price / alphPrice : 0
      };
      
      priceCache.set(cacheKey, { price: tokenPrice, timestamp: Date.now() });
      console.log(`[Pricing] ${tokenPrice.symbol} price from Mobula: $${tokenPrice.price}`);
      return tokenPrice;
    }

    // Fallback to CoinGecko for mapped tokens
    const coingeckoId = getCoinGeckoId(tokenId);
    if (coingeckoId) {
      console.log(`[Pricing] Trying CoinGecko for ${tokenId} (${coingeckoId})...`);
      
      try {
        const coinIds = [coingeckoId];
        const coingeckoPrices = await getMultipleCoinsPrice(coinIds);
        
        if (coingeckoPrices.length > 0) {
          const coinData = coingeckoPrices[0];
          const alphPrice = preloadedAlphPrice || await getAlphPrice();
          
          const tokenPrice: TokenPrice = {
            tokenId,
            symbol: coinData.symbol.toUpperCase(),
            price: coinData.price,
            source: 'coingecko',
            confidence: 'high',
            lastUpdated: Date.now(),
            priceALPH: alphPrice > 0 ? coinData.price / alphPrice : 0
          };
          
          priceCache.set(cacheKey, { price: tokenPrice, timestamp: Date.now() });
          console.log(`[Pricing] ${tokenPrice.symbol} price from CoinGecko: $${tokenPrice.price}`);
          return tokenPrice;
        }
      } catch (coingeckoError) {
        console.warn(`[Pricing] CoinGecko failed for ${tokenId}:`, coingeckoError);
      }
    }

    // No price found - return zero price
    console.warn(`[Pricing] No price data available for ${tokenId}`);
    const tokenPrice: TokenPrice = {
      tokenId,
      symbol: tokenId.substring(0, 8).toUpperCase(),
      price: 0,
      source: 'estimate',
      confidence: 'low',
      lastUpdated: Date.now(),
      priceALPH: 0
    };
    
    priceCache.set(cacheKey, { price: tokenPrice, timestamp: Date.now() });
    return tokenPrice;

  } catch (error) {
    console.error(`[Pricing] Error fetching price for ${tokenId}:`, error);
    
    // Return error state
    return {
      tokenId,
      symbol: tokenId.substring(0, 8).toUpperCase(),
      price: 0,
      source: 'estimate',
      confidence: 'low',
      lastUpdated: Date.now(),
      priceALPH: 0
    };
  }
};

/**
 * Get multiple token prices efficiently
 */
export const getMultipleTokenPrices = async (tokenIds: string[]): Promise<Map<string, TokenPrice>> => {
  console.log(`[Pricing] 📦 Batch fetching prices for ${tokenIds.length} tokens...`);
  
  const results = new Map<string, TokenPrice>();
  const uncachedTokens: string[] = [];

  // Check cache first
  for (const tokenId of tokenIds) {
    const cached = priceCache.get(tokenId);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      results.set(tokenId, cached.price);
    } else {
      uncachedTokens.push(tokenId);
    }
  }

  if (uncachedTokens.length === 0) {
    console.log(`[Pricing] ✅ All ${tokenIds.length} prices served from cache`);
    return results;
  }

  console.log(`[Pricing] 🔄 Need to fetch ${uncachedTokens.length} prices...`);

  // Pre-fetch ALPH price once to prevent race conditions
  console.log('[Pricing] 🏁 Pre-fetching ALPH price to prevent race condition...');
  const alphPrice = await getAlphPrice();
  console.log(`[Pricing] 🏁 Pre-fetched ALPH price: $${alphPrice}`);

  // Separate ALPH from other tokens
  const alphTokens = uncachedTokens.filter(id => id === 'ALPH' || id.toLowerCase() === 'alph');
  const otherTokens = uncachedTokens.filter(id => id !== 'ALPH' && id.toLowerCase() !== 'alph');

  // Get ALPH price first (using preloaded price)
  if (alphTokens.length > 0) {
    const alphTokenPrice = await getTokenPrice('ALPH', alphPrice);
    results.set('ALPH', alphTokenPrice);
  }

  // Try Mobula for other tokens
  if (otherTokens.length > 0) {
    try {
      console.log(`[Pricing] 🌐 Trying Mobula for ${otherTokens.length} tokens...`);
      const mobulaPrices = await getMultipleTokenPricesFromMobula(otherTokens);
      console.log(`[Pricing] 🌐 Mobula returned ${mobulaPrices.length} prices`);
      
      for (const mobulaPrice of mobulaPrices) {
        const tokenPrice: TokenPrice = {
          tokenId: mobulaPrice.tokenId,
          symbol: mobulaPrice.symbol,
          price: mobulaPrice.price,
          source: 'mobula',
          confidence: mobulaPrice.confidence,
          lastUpdated: Date.now(),
          volume24h: mobulaPrice.volume24h,
          priceALPH: alphPrice > 0 ? mobulaPrice.price / alphPrice : 0
        };
        
        results.set(mobulaPrice.tokenId, tokenPrice);
        priceCache.set(mobulaPrice.tokenId, { price: tokenPrice, timestamp: Date.now() });
      }
    } catch (error) {
      console.warn('[Pricing] ⚠️ Mobula batch fetch failed:', error);
    }
  }

  // Get CoinGecko prices for unmapped tokens
  const stillMissingTokens = otherTokens.filter(id => !results.has(id));
  if (stillMissingTokens.length > 0) {
    console.log(`[Pricing] 🦎 Fetching ${stillMissingTokens.length} tokens from CoinGecko...`);
    
    // Get CoinGecko IDs for missing tokens
    const coingeckoIds = stillMissingTokens
      .map(tokenId => getCoinGeckoId(tokenId))
      .filter(id => id !== null) as string[];

    if (coingeckoIds.length > 0) {
      try {
        const coingeckoPrices = await getMultipleCoinsPrice(coingeckoIds);
        
        for (const coinData of coingeckoPrices) {
          // Find the token ID that maps to this CoinGecko ID
          const tokenId = stillMissingTokens.find(id => getCoinGeckoId(id) === coinData.id);
          
          if (tokenId) {
            const tokenPrice: TokenPrice = {
              tokenId,
              symbol: coinData.symbol.toUpperCase(),
              price: coinData.price,
              source: 'coingecko',
              confidence: 'high',
              lastUpdated: Date.now(),
              priceALPH: alphPrice > 0 ? coinData.price / alphPrice : 0
            };
            
            results.set(tokenId, tokenPrice);
            priceCache.set(tokenId, { price: tokenPrice, timestamp: Date.now() });
          }
        }
      } catch (error) {
        console.warn('[Pricing] ⚠️ CoinGecko batch fetch failed:', error);
      }
    }
  }

  // For any remaining tokens, set zero price
  const finalMissingTokens = uncachedTokens.filter(id => !results.has(id));
  for (const tokenId of finalMissingTokens) {
    const tokenPrice: TokenPrice = {
      tokenId,
      symbol: tokenId.substring(0, 8).toUpperCase(),
      price: 0,
      source: 'estimate',
      confidence: 'low',
      lastUpdated: Date.now(),
      priceALPH: 0
    };
    
    results.set(tokenId, tokenPrice);
    priceCache.set(tokenId, { price: tokenPrice, timestamp: Date.now() });
  }

  console.log(`[Pricing] ✅ Completed batch fetch: ${results.size}/${tokenIds.length} tokens priced`);
  return results;
};

/**
 * Clear all pricing caches
 */
export const clearPricingCache = (): void => {
  priceCache.clear();
  cachedAlphPrice = 0;
  alphPriceTimestamp = 0;
  alphFetchPromise = null; // Clear the mutex promise
  console.log('[Pricing] 🧹 All caches and mutexes cleared');
};

/**
 * Get cache statistics
 */
export const getPricingCacheStats = () => {
  return {
    tokenPrices: priceCache.size,
    alphPriceCached: cachedAlphPrice > 0,
    lastAlphUpdate: alphPriceTimestamp,
    alphFetchInProgress: !!alphFetchPromise
  };
}; 