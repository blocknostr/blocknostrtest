/**
 * Mobula API Service - Primary pricing source for Alephium tokens
 * https://docs.mobula.io/rest-api-reference/endpoint/market-query-token
 */

export interface MobulaTokenData {
  name: string;
  logo: string;
  symbol: string;
  address: string;
  blockchain: string;
  decimals: number;
  volume_24h: number;
  listed_at: string;
  circulating_supply: string;
  total_supply: string;
  coingecko_id?: string;
  price?: number; // Price in USD
  pairs?: MobulaPair[];
}

export interface MobulaPair {
  token0: MobulaToken;
  token1: MobulaToken;
  volume24h: number;
  liquidity: number;
  blockchain: string;
  address: string;
  createdAt: string;
  type: string;
  exchange: {
    name: string;
    logo: string;
  };
  price: number;
  priceToken: number;
  priceTokenString: string;
}

export interface MobulaToken {
  address: string;
  price: number;
  priceToken: number;
  priceTokenString: string;
  approximateReserveUSD: number;
  approximateReserveTokenRaw: string;
  approximateReserveToken: number;
  symbol: string;
  name: string;
  id: number;
  decimals: number;
  totalSupply: number;
  circulatingSupply: number;
  logo: string;
  chainId: string;
}

export interface TokenPrice {
  tokenId: string;
  symbol: string;
  price: number; // USD price
  source: 'mobula' | 'coingecko';
  confidence: 'high' | 'medium' | 'low';
  lastUpdated: number;
  volume24h?: number;
  liquidity?: number;
}

// Cache for Mobula prices
const priceCache = new Map<string, { price: TokenPrice; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Get ALPH price from Mobula API
 */
export const getAlephiumPriceFromMobula = async (): Promise<TokenPrice | null> => {
  try {
    const cacheKey = 'ALPH';
    const cached = priceCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.price;
    }

    console.log('[Mobula] Fetching ALPH price...');
    
    // Query for Alephium tokens
    const response = await fetch(
      'https://api.mobula.io/api/1/market/query/token?' + 
      new URLSearchParams({
        blockchain: 'alephium',
        symbol: 'ALPH',
        limit: '1'
      })
    );

    if (!response.ok) {
      throw new Error(`Mobula API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.data && data.data.length > 0) {
      const tokenData: MobulaTokenData = data.data[0];
      
      // Extract price from direct price field or pairs
      let price = 0;
      
      // First try direct price field
      if (tokenData.price && tokenData.price > 0) {
        price = tokenData.price;
      }
      // Fallback to pairs if no direct price
      else if (tokenData.pairs && tokenData.pairs.length > 0) {
        // Use the highest liquidity pair for price
        const bestPair = tokenData.pairs.reduce((best, current) => 
          current.liquidity > best.liquidity ? current : best
        );
        price = bestPair.price;
      }

      if (price > 0) {
        const tokenPrice: TokenPrice = {
          tokenId: 'ALPH',
          symbol: 'ALPH',
          price,
          source: 'mobula',
          confidence: 'high',
          lastUpdated: Date.now(),
          volume24h: tokenData.volume_24h,
          liquidity: tokenData.pairs?.[0]?.liquidity
        };

        priceCache.set(cacheKey, { price: tokenPrice, timestamp: Date.now() });
        console.log(`[Mobula] ALPH price: $${price}`);
        return tokenPrice;
      }
    }

    console.warn('[Mobula] No ALPH price data found');
    return null;
  } catch (error) {
    console.error('[Mobula] Error fetching ALPH price:', error);
    return null;
  }
};

/**
 * Get token price from Mobula API by address
 */
export const getTokenPriceFromMobula = async (tokenAddress: string): Promise<TokenPrice | null> => {
  try {
    const cacheKey = tokenAddress;
    const cached = priceCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.price;
    }

    console.log(`[Mobula] Fetching price for token ${tokenAddress}...`);
    
    const response = await fetch(
      'https://api.mobula.io/api/1/market/query/token?' + 
      new URLSearchParams({
        blockchain: 'alephium',
        address: tokenAddress,
        limit: '1'
      })
    );

    if (!response.ok) {
      throw new Error(`Mobula API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.data && data.data.length > 0) {
      const tokenData: MobulaTokenData = data.data[0];
      
      let price = 0;
      
      // First try direct price field
      if (tokenData.price && tokenData.price > 0) {
        price = tokenData.price;
      }
      // Fallback to pairs if no direct price
      else if (tokenData.pairs && tokenData.pairs.length > 0) {
        const bestPair = tokenData.pairs.reduce((best, current) => 
          current.liquidity > best.liquidity ? current : best
        );
        price = bestPair.price;
      }

      if (price > 0) {
        const tokenPrice: TokenPrice = {
          tokenId: tokenAddress,
          symbol: tokenData.symbol,
          price,
          source: 'mobula',
          confidence: 'high',
          lastUpdated: Date.now(),
          volume24h: tokenData.volume_24h,
          liquidity: tokenData.pairs?.[0]?.liquidity
        };

        priceCache.set(cacheKey, { price: tokenPrice, timestamp: Date.now() });
        console.log(`[Mobula] ${tokenData.symbol} price: $${price}`);
        return tokenPrice;
      }
    }

    console.warn(`[Mobula] No price data found for ${tokenAddress}`);
    return null;
  } catch (error) {
    console.error(`[Mobula] Error fetching price for ${tokenAddress}:`, error);
    return null;
  }
};

/**
 * Get multiple token prices from Mobula API
 */
export const getMultipleTokenPricesFromMobula = async (tokenAddresses: string[]): Promise<TokenPrice[]> => {
  try {
    console.log(`[Mobula] Fetching prices for ${tokenAddresses.length} tokens...`);
    
    const response = await fetch(
      'https://api.mobula.io/api/1/market/query/token?' + 
      new URLSearchParams({
        blockchain: 'alephium',
        limit: '100' // Get more results to find our tokens
      })
    );

    if (!response.ok) {
      throw new Error(`Mobula API error: ${response.status}`);
    }

    const data = await response.json();
    const tokenPrices: TokenPrice[] = [];
    
    if (data.data) {
      for (const tokenData of data.data) {
        if (tokenAddresses.includes(tokenData.address)) {
          let price = 0;
          
          // First try direct price field
          if (tokenData.price && tokenData.price > 0) {
            price = tokenData.price;
          }
          // Fallback to pairs if no direct price
          else if (tokenData.pairs && tokenData.pairs.length > 0) {
            const bestPair = tokenData.pairs.reduce((best: any, current: any) => 
              current.liquidity > best.liquidity ? current : best
            );
            price = bestPair.price;
          }

          if (price > 0) {
            const tokenPrice: TokenPrice = {
              tokenId: tokenData.address,
              symbol: tokenData.symbol,
              price,
              source: 'mobula',
              confidence: 'high',
              lastUpdated: Date.now(),
              volume24h: tokenData.volume_24h,
              liquidity: tokenData.pairs?.[0]?.liquidity
            };

            tokenPrices.push(tokenPrice);
            priceCache.set(tokenData.address, { price: tokenPrice, timestamp: Date.now() });
          }
        }
      }
    }

    console.log(`[Mobula] Found prices for ${tokenPrices.length} tokens`);
    return tokenPrices;
  } catch (error) {
    console.error('[Mobula] Error fetching multiple token prices:', error);
    return [];
  }
};

/**
 * Clear price cache
 */
export const clearMobulaCache = (): void => {
  priceCache.clear();
  console.log('[Mobula] Price cache cleared');
}; 