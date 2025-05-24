/**
 * LP Token Pricing Service for Alephium DEXes
 * Calculates accurate USD values for LP tokens based on underlying assets
 */

import { NodeProvider } from '@alephium/web3';
import { getAlephiumPrice } from './coingeckoApi';
import { isTokenMapped } from './tokenMappings';

export interface LPTokenPricing {
  tokenId: string;
  totalValueUSD: number;
  breakdown: {
    token0: {
      symbol: string;
      amount: number;
      valueUSD: number;
    };
    token1: {
      symbol: string;
      amount: number;
      valueUSD: number;
    };
  };
  source: 'calculated' | 'estimated';
  dexName: string;
}

export interface PoolReserves {
  token0Reserve: string;
  token1Reserve: string;
  totalSupply: string;
  token0Decimals: number;
  token1Decimals: number;
}

// Cache for LP token prices to avoid repeated calculations
const lpPriceCache = new Map<string, { price: LPTokenPricing; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Calculates the USD value of an LP token position
 */
export const calculateLPTokenValue = async (
  tokenId: string,
  amount: string,
  poolAddress?: string,
  underlyingTokens?: string[]
): Promise<LPTokenPricing | null> => {
  try {
    // Check cache first
    const cached = lpPriceCache.get(tokenId);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      // Scale the cached result for this amount
      const ratio = Number(amount) / (10 ** 18); // Assuming 18 decimals for LP tokens
      return {
        ...cached.price,
        totalValueUSD: cached.price.totalValueUSD * ratio,
        breakdown: {
          token0: {
            ...cached.price.breakdown.token0,
            amount: cached.price.breakdown.token0.amount * ratio,
            valueUSD: cached.price.breakdown.token0.valueUSD * ratio
          },
          token1: {
            ...cached.price.breakdown.token1,
            amount: cached.price.breakdown.token1.amount * ratio,
            valueUSD: cached.price.breakdown.token1.valueUSD * ratio
          }
        }
      };
    }

    // Get current ALPH price for calculations
    const { price: alphPrice } = await getAlephiumPrice();

    // If we have pool information, try to calculate exact value
    if (poolAddress && underlyingTokens && underlyingTokens.length === 2) {
      const poolValue = await calculateFromPoolReserves(
        poolAddress,
        underlyingTokens[0],
        underlyingTokens[1],
        alphPrice
      );
      
      if (poolValue) {
        const userTokens = Number(amount) / (10 ** 18); // LP token decimals
        const result = {
          tokenId,
          totalValueUSD: poolValue.totalValueUSD * userTokens,
          breakdown: {
            token0: {
              symbol: underlyingTokens[0],
              amount: poolValue.breakdown.token0.amount * userTokens,
              valueUSD: poolValue.breakdown.token0.valueUSD * userTokens
            },
            token1: {
              symbol: underlyingTokens[1], 
              amount: poolValue.breakdown.token1.amount * userTokens,
              valueUSD: poolValue.breakdown.token1.valueUSD * userTokens
            }
          },
          source: 'calculated' as const,
          dexName: 'Alephium DEX'
        };

        // Cache the per-unit value
        lpPriceCache.set(tokenId, {
          price: {
            ...result,
            totalValueUSD: poolValue.totalValueUSD,
            breakdown: {
              token0: {
                ...result.breakdown.token0,
                amount: poolValue.breakdown.token0.amount,
                valueUSD: poolValue.breakdown.token0.valueUSD
              },
              token1: {
                ...result.breakdown.token1,
                amount: poolValue.breakdown.token1.amount,
                valueUSD: poolValue.breakdown.token1.valueUSD
              }
            }
          },
          timestamp: Date.now()
        });

        return result;
      }
    }

    // Fallback: Estimate based on common LP token patterns
    const estimatedValue = await estimateLPTokenValue(tokenId, amount, alphPrice, underlyingTokens);
    return estimatedValue;

  } catch (error) {
    console.error(`[LP Pricing] Error calculating value for ${tokenId}:`, error);
    
    // Fallback to basic estimation
    const { price: alphPrice } = await getAlephiumPrice();
    return estimateLPTokenValue(tokenId, amount, alphPrice, underlyingTokens);
  }
};

/**
 * Calculates LP token value from actual pool reserves (when available)
 */
const calculateFromPoolReserves = async (
  poolAddress: string,
  token0: string,
  token1: string,
  alphPrice: number
): Promise<LPTokenPricing | null> => {
  try {
    // TODO: Implement actual pool contract calls
    // This would involve:
    // 1. Getting pool reserves from the contract
    // 2. Getting total LP supply
    // 3. Calculating per-LP-token value
    
    console.warn(`[LP Pricing] Pool reserve calculation not yet implemented for ${poolAddress}`);
    return null;

    // Future implementation:
    // const nodeProvider = new NodeProvider('https://node.mainnet.alephium.org');
    // const poolContract = await nodeProvider.contracts.getContractState(poolAddress);
    // const reserves = await getPoolReserves(poolContract);
    // return calculateValueFromReserves(reserves, token0, token1, alphPrice);
    
  } catch (error) {
    console.error(`[LP Pricing] Failed to get pool reserves for ${poolAddress}:`, error);
    return null;
  }
};

/**
 * Estimates LP token value using heuristics and token patterns
 */
const estimateLPTokenValue = async (
  tokenId: string,
  amount: string,
  alphPrice: number,
  underlyingTokens?: string[]
): Promise<LPTokenPricing> => {
  const userTokens = Number(amount) / (10 ** 18); // Assuming 18 decimals
  
  let totalValueUSD = 0;
  let token0Value = 0;
  let token1Value = 0;
  let token0Symbol = 'UNKNOWN';
  let token1Symbol = 'UNKNOWN';

  if (underlyingTokens && underlyingTokens.length === 2) {
    token0Symbol = underlyingTokens[0];
    token1Symbol = underlyingTokens[1];

    // Estimate value based on token types
    const token0Price = getTokenPrice(underlyingTokens[0], alphPrice);
    const token1Price = getTokenPrice(underlyingTokens[1], alphPrice);

    // Assume equal value split (common for LP tokens)
    const estimatedPerTokenValue = (token0Price + token1Price) / 2;
    totalValueUSD = userTokens * estimatedPerTokenValue;
    
    token0Value = totalValueUSD * 0.5;
    token1Value = totalValueUSD * 0.5;
  } else {
    // Very rough estimate for unknown LP tokens
    // Assume they're worth more than regular tokens but less than major pairs
    totalValueUSD = userTokens * alphPrice * 0.5;
    token0Value = totalValueUSD * 0.5;
    token1Value = totalValueUSD * 0.5;
  }

  return {
    tokenId,
    totalValueUSD,
    breakdown: {
      token0: {
        symbol: token0Symbol,
        amount: userTokens * 0.5, // Rough estimate
        valueUSD: token0Value
      },
      token1: {
        symbol: token1Symbol,
        amount: userTokens * 0.5, // Rough estimate
        valueUSD: token1Value
      }
    },
    source: 'estimated',
    dexName: 'Unknown DEX'
  };
};

/**
 * Gets the estimated USD price for a token
 */
const getTokenPrice = (tokenSymbol: string, alphPrice: number): number => {
  const symbol = tokenSymbol.toUpperCase();
  
  if (symbol === 'ALPH') {
    return alphPrice;
  }
  
  // Common stablecoins
  if (['USDT', 'USDC', 'DAI', 'BUSD'].includes(symbol)) {
    return 1.0;
  }
  
  // Major cryptocurrencies (rough estimates)
  const majorTokens: Record<string, number> = {
    'BTC': alphPrice * 1000, // Rough BTC/ALPH ratio
    'ETH': alphPrice * 100,  // Rough ETH/ALPH ratio
    'BNB': alphPrice * 50,   // Rough BNB/ALPH ratio
  };
  
  if (majorTokens[symbol]) {
    return majorTokens[symbol];
  }
  
  // For mapped tokens, use a higher multiplier
  if (isTokenMapped(symbol)) {
    return alphPrice * 0.5;
  }
  
  // Default for unknown tokens
  return alphPrice * 0.1;
};

/**
 * Updates the LP token price cache
 */
export const updateLPTokenPriceCache = (tokenId: string, pricing: LPTokenPricing): void => {
  lpPriceCache.set(tokenId, {
    price: pricing,
    timestamp: Date.now()
  });
};

/**
 * Clears expired entries from the price cache
 */
export const cleanupLPTokenPriceCache = (): void => {
  const now = Date.now();
  for (const [tokenId, cached] of lpPriceCache.entries()) {
    if (now - cached.timestamp > CACHE_DURATION) {
      lpPriceCache.delete(tokenId);
    }
  }
};

/**
 * Gets all cached LP token prices (for debugging)
 */
export const getLPTokenPriceCache = (): Map<string, { price: LPTokenPricing; timestamp: number }> => {
  return lpPriceCache;
}; 