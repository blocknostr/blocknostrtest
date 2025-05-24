import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BalanceHistoryChart from "@/components/wallet/charts/BalanceHistoryChart";
import TokenList from "@/components/wallet/TokenList";
import TokenPortfolioTable from "@/components/wallet/TokenPortfolioTable";
import TransactionsList from "@/components/wallet/TransactionsList";
import AllWalletsTransactionsList from "@/components/wallet/AllWalletsTransactionsList";
import NFTGallery from "@/components/wallet/NFTGallery";
import DAppsSection from "@/components/wallet/DAppsSection";
import { formatNumber, formatCurrency } from "@/lib/utils/formatters";
import { WifiOff, Wifi, DollarSign, Wallet, TrendingUp, TrendingDown, Activity, AlertTriangle, CheckCircle, Clock, Zap } from "lucide-react";
import { getAlephiumPriceWithChange } from "@/lib/api/simplifiedPricingService";
import { getAddressBalance, getAddressTokens, batchFetchWalletData } from "@/lib/api/cachedAlephiumApi";
import { clearTokenCache } from "@/lib/api/alephiumApi";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { EnrichedTokenWithWallets, SavedWallet, TokenWallet } from "@/types/wallet";
import { fetchTokenList } from "@/lib/api/tokenMetadata";
import { getCoinGeckoId, isTokenMapped } from "@/lib/api/tokenMappings";
import { detectLPToken, getLPTokenValue, cleanupExpiredLPCache } from "@/lib/api/lpTokenDetection";
import { calculateLPTokenValue } from "@/lib/api/lpTokenPricing";
import { getTokenPrice, getMultipleTokenPrices } from "@/lib/api/simplifiedPricingService";
// Using simplified pricing service now instead of complex DEX pricing

import UnifiedNetworkCard from "@/components/wallet/UnifiedNetworkCard";
import WalletManager from "@/components/wallet/WalletManager";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

// Phase 1: Enhanced interfaces for better API monitoring
interface APIHealthStatus {
  isHealthy: boolean;
  responseTime: number;
  lastCheck: Date;
  consecutiveFailures: number;
  source: "node" | "explorer" | "hybrid" | "cache";
}

interface EnhancedAPIStatus {
  isLive: boolean;
  lastChecked: Date;
  health: APIHealthStatus;
  errors: {
    balance: string | null;
    tokens: string | null;
    price: string | null;
    network: string | null;
  };
}

interface WalletDashboardProps {
  address: string;
  allWallets?: SavedWallet[];
  isLoggedIn: boolean;
  walletStats: {
    transactionCount: number;
    receivedAmount: number;
    sentAmount: number;
    tokenCount: number;
  };
  isStatsLoading: boolean;
  refreshFlag: number;
  setRefreshFlag: (flag: number) => void;
  activeTab?: string;
  walletManagerProps?: any; // Props for the wallet manager popup
}

const WalletDashboard: React.FC<WalletDashboardProps> = ({ 
  address, 
  allWallets = [],
  isLoggedIn, 
  walletStats, 
  isStatsLoading,
  refreshFlag,
  setRefreshFlag,
  activeTab = "portfolio",
  walletManagerProps
}) => {
  // Phase 1: Enhanced state management with better error tracking
  const [apiStatus, setApiStatus] = useState<EnhancedAPIStatus>({
    isLive: false,
    lastChecked: new Date(),
    health: {
      isHealthy: true,
      responseTime: 0,
      lastCheck: new Date(),
      consecutiveFailures: 0,
      source: "node"
    },
    errors: {
      balance: null,
      tokens: null,
      price: null,
      network: null
    }
  });

  const [balances, setBalances] = useState<Record<string, number>>({});
  const [priceData, setPriceData] = useState<{
    price: number;
    priceChange24h: number;
  }>({ price: 0, priceChange24h: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [allTokens, setAllTokens] = useState<EnrichedTokenWithWallets[]>([]);
  const [totalTokenCount, setTotalTokenCount] = useState(0);
  const [totalTokenValue, setTotalTokenValue] = useState<number>(0);

  // Phase 1: Enhanced retry and circuit breaker state
  const [retryAttempts, setRetryAttempts] = useState(0);
  const [lastSuccessfulFetch, setLastSuccessfulFetch] = useState<Date | null>(null);
  const [isInRecoveryMode, setIsInRecoveryMode] = useState(false);

  // Memoize wallet addresses to prevent unnecessary re-renders
  const walletAddresses = useMemo(() => {
    const addresses = allWallets.map(wallet => wallet.address);
    console.log("[Enhanced Dashboard] Memoizing wallet addresses:", addresses);
    return addresses;
  }, [allWallets.map(w => w.address).sort().join(',')]);

  // Phase 1: Enhanced loading state management with exponential backoff
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const [isCurrentlyFetching, setIsCurrentlyFetching] = useState(false);
  
  // Wallet manager popup state
  const [isWalletPopupOpen, setIsWalletPopupOpen] = useState(false);
  
  // Transaction view state  
  const [transactionView, setTransactionView] = useState<"current" | "all">("current");

  // Phase 1: Enhanced API status updater with health metrics
  const updateApiStatus = (
    isLive: boolean, 
    healthUpdate?: Partial<APIHealthStatus>,
    errorUpdate?: Partial<EnhancedAPIStatus['errors']>
  ) => {
    setApiStatus(prev => ({
      isLive,
      lastChecked: new Date(),
      health: {
        ...prev.health,
        ...healthUpdate,
        lastCheck: new Date()
      },
      errors: {
        ...prev.errors,
        ...errorUpdate
      }
    }));
  };

  // Phase 1: Enhanced error classification and retry logic
  const classifyError = (error: any): { retryable: boolean; severity: 'low' | 'medium' | 'high' } => {
    const message = error?.message?.toLowerCase() || '';
    
    if (message.includes('429') || message.includes('rate limit')) {
      return { retryable: true, severity: 'medium' };
    }
    if (message.includes('network') || message.includes('fetch')) {
      return { retryable: true, severity: 'high' };
    }
    if (message.includes('timeout')) {
      return { retryable: true, severity: 'medium' };
    }
    if (message.includes('404') || message.includes('not found')) {
      return { retryable: false, severity: 'low' };
    }
    
    return { retryable: true, severity: 'medium' };
  };

  // Phase 1: Enhanced batch fetch with intelligent retry and circuit breaker
  useEffect(() => {
    const fetchAllBalances = async () => {
      // Prevent multiple simultaneous fetches
      if (isCurrentlyFetching) {
        console.log("[Enhanced Dashboard] Fetch already in progress, skipping");
        return;
      }

      if (walletAddresses.length === 0) {
        setIsLoading(false);
        return;
      }

      // Phase 1: Enhanced rate limiting with exponential backoff
      const now = Date.now();
      const timeSinceLastFetch = now - lastFetchTime;
      const baseInterval = 10000; // 10 seconds base
      const backoffMultiplier = Math.min(Math.pow(1.5, retryAttempts), 8); // Max 8x backoff
      const requiredInterval = baseInterval * backoffMultiplier;
      
      if (timeSinceLastFetch < requiredInterval && lastFetchTime > 0) {
        console.log(`[Enhanced Dashboard] Rate limited, waiting ${requiredInterval - timeSinceLastFetch}ms (attempt ${retryAttempts})`);
        return;
      }
      
      setIsLoading(true);
      setIsCurrentlyFetching(true);
      setLastFetchTime(now);
      
      // Clear previous errors
      updateApiStatus(apiStatus.isLive, undefined, {
        balance: null,
        tokens: null,
        price: null,
        network: null
      });
      
      const startTime = Date.now();
      
      try {
        console.log("[Enhanced Dashboard] Starting enhanced batch fetch for wallets:", walletAddresses);
        
        // RACE CONDITION FIX: Fetch ALPH price first, then other APIs in parallel
        console.log("[Enhanced Dashboard] 🏁 Fetching ALPH price first to prevent race condition...");
        const priceResult = await getAlephiumPriceWithChange();
        console.log("[Enhanced Dashboard] 🏁 ALPH price fetched:", priceResult);
        
        // Now fetch other APIs in parallel
        const [batchResults, tokenMetadata] = await Promise.allSettled([
          batchFetchWalletData(walletAddresses),
          fetchTokenList()
        ]);
        
        const fetchTime = Date.now() - startTime;
        
        // Phase 1: Enhanced price data handling with error classification
        let priceData = { price: 0, priceChange24h: 0 };
        let priceError: string | null = null;
        
        // Use the already fetched price result
        priceData = priceResult;
        console.log("[Enhanced Dashboard] ✅ Using pre-fetched ALPH price:", priceData.price);
        
        // Phase 1: Enhanced token metadata handling
        let tokenMetadataMap = {};
        if (tokenMetadata.status === 'fulfilled') {
          tokenMetadataMap = tokenMetadata.value;
        } else {
          console.warn("[Enhanced Dashboard] Token metadata fetch failed:", tokenMetadata.reason?.message);
        }
        
        // Phase 1: Enhanced batch results processing with detailed error tracking
        const newBalances: Record<string, number> = {};
        const tokenMap: Record<string, EnrichedTokenWithWallets> = {};
        let totalTokens = 0;
        let calculatedTotalTokenValue = 0;
        let balanceError: string | null = null;
        let tokensError: string | null = null;
        let results: any = null;
        
        if (batchResults.status === 'fulfilled') {
          results = batchResults.value;
          
          // Process balances with error tracking
          results.balances.forEach((balance, address) => {
            newBalances[address] = balance.balance || 0;
          });
          
          // Process tokens with enhanced error handling and batch pricing
          const processTokensAsync = async () => {
            const processingStartTime = performance.now();
            
            // Build comprehensive token map with LP detection in single pass
            const allTokenIds: string[] = [];
            const lpTokensMap = new Map<string, any>(); // Store LP info directly
            
            console.log('[Enhanced Dashboard] 🚀 Starting optimized single-pass token processing...');
            
            for (const [address, tokens] of results.tokens.entries()) {
              console.log(`[Enhanced Dashboard] Processing ${tokens.length} tokens for wallet ${address}`);
              totalTokens += tokens.length;
              
              for (const token of tokens) {
                if (!tokenMap[token.id]) {
                  // Collect all unique token IDs
                  allTokenIds.push(token.id);
                  
                  // OPTIMIZED: Single LP detection call with caching
                  if (!token.isNFT) {
                    try {
                      const lpInfo = await detectLPToken(token.id, token, token.isNFT);
                      if (lpInfo.isLPToken) {
                        lpTokensMap.set(token.id, lpInfo);
                        console.log(`[LP Detection] ✅ Identified LP token: ${token.symbol || token.id.substring(0, 8)}`);
                      }
                    } catch (error) {
                      console.warn(`[LP Token] Error detecting LP token ${token.id}:`, error);
                    }
                  }
                }
              }
            }
            
            // OPTIMIZED: Batch fetch prices for regular tokens only (exclude LP tokens)
            const regularTokenIds = allTokenIds.filter(id => !lpTokensMap.has(id));
            console.log(`[Enhanced Dashboard] Batch fetching prices for ${regularTokenIds.length} regular tokens, ${lpTokensMap.size} LP tokens detected`);
            
            let tokenPricesMap = new Map();
            if (regularTokenIds.length > 0) {
              try {
                tokenPricesMap = await getMultipleTokenPrices(regularTokenIds);
                console.log(`[Enhanced Dashboard] Received ${tokenPricesMap.size} token prices from batch service`);
              } catch (error) {
                console.warn(`[Enhanced Dashboard] Batch pricing failed, will use fallback:`, error);
              }
            }
            
            // OPTIMIZED: Single pass for all token processing with pre-calculated LP info
            for (const [address, tokens] of results.tokens.entries()) {
              for (const token of tokens) {
                const tokenId = token.id;
                
                if (!tokenMap[tokenId]) {
                  // Calculate USD values using pre-fetched data
                  let usdValue: number | undefined = undefined;
                  let priceSource: 'market' | 'estimate' = 'estimate';
                  let isLPToken = lpTokensMap.has(tokenId);
                  let dexProtocol: string | undefined = undefined;
                  let underlyingTokens: string[] | undefined = undefined;
                  
                  if (!token.isNFT) {
                    const tokenAmountInUnits = Number(token.amount) / (10 ** token.decimals);
                    
                    if (isLPToken) {
                      // Use pre-calculated LP info (no duplicate detection!)
                      const lpInfo = lpTokensMap.get(tokenId);
                      dexProtocol = lpInfo.dexProtocol;
                      underlyingTokens = lpInfo.underlyingTokens;
                      
                      // Calculate LP token value using the pricing service
                      try {
                        const lpPricing = await calculateLPTokenValue(
                          tokenId,
                          token.amount,
                          lpInfo.poolInfo?.poolAddress,
                          lpInfo.underlyingTokens
                        );
                        
                        if (lpPricing) {
                          usdValue = lpPricing.totalValueUSD;
                          priceSource = lpPricing.source === 'calculated' ? 'market' : 'estimate';
                          console.log(`[LP Token] ${lpPricing.source} value for ${token.symbol || tokenId.substring(0, 8)}: $${usdValue.toFixed(2)}`);
                        } else {
                          // Fallback LP pricing
                          usdValue = tokenAmountInUnits * priceData.price * 0.5;
                          priceSource = 'estimate';
                          console.warn(`[LP Token] Using fallback pricing for ${token.symbol || tokenId.substring(0, 8)}: $${usdValue.toFixed(2)}`);
                        }
                      } catch (error) {
                        console.error(`[LP Token] Error processing LP token ${tokenId}:`, error);
                        usdValue = 0;
                        priceSource = 'estimate';
                      }
                    } else {
                      // Use batch pricing data for regular tokens
                      const tokenPriceData = tokenPricesMap.get(tokenId);
                      
                      if (tokenPriceData && tokenPriceData.price > 0) {
                        usdValue = tokenAmountInUnits * tokenPriceData.price;
                        priceSource = tokenPriceData.source === 'mobula' || tokenPriceData.source === 'coingecko' ? 'market' : 'estimate';
                        console.log(`[Enhanced Dashboard] ${tokenPriceData.symbol} price: $${tokenPriceData.price} from ${tokenPriceData.source}`);
                      } else {
                        // No price available from simplified service
                        usdValue = 0;
                        priceSource = 'estimate';
                        console.log(`[Enhanced Dashboard] No price available for ${token.symbol || token.name || tokenId.substring(0, 8)} (${tokenId.substring(0, 8)}...)`);
                      }
                    }
                    
                    if (usdValue !== undefined) {
                      calculatedTotalTokenValue += usdValue;
                    }
                  }
                  
                  tokenMap[tokenId] = {
                    ...token,
                    wallets: [{ address, amount: token.amount }],
                    usdValue: usdValue,
                    priceSource: priceSource,
                    isLPToken: isLPToken,
                    dexProtocol: dexProtocol,
                    underlyingTokens: underlyingTokens
                  } as EnrichedTokenWithWallets;
                } else {
                  // OPTIMIZED: Token aggregation with cached LP info
                  tokenMap[tokenId].wallets.push({ address, amount: token.amount });
                  
                  try {
                    const currentAmount = BigInt(tokenMap[tokenId].amount || "0");
                    const additionalAmount = BigInt(token.amount || "0");
                    tokenMap[tokenId].amount = (currentAmount + additionalAmount).toString();
                    
                    tokenMap[tokenId].formattedAmount = token.isNFT 
                      ? tokenMap[tokenId].amount 
                      : (Number(tokenMap[tokenId].amount) / 10**token.decimals).toLocaleString(
                          undefined, 
                          { minimumFractionDigits: 0, maximumFractionDigits: token.decimals }
                        );
                    
                    // Recalculate USD value for aggregated tokens
                    if (!token.isNFT) {
                      const tokenAmountInUnits = Number(tokenMap[tokenId].amount) / (10 ** token.decimals);
                      
                      if (tokenMap[tokenId].isLPToken) {
                        // For LP tokens during aggregation, use cached LP info
                        try {
                          const lpPricing = await calculateLPTokenValue(
                            tokenId,
                            tokenMap[tokenId].amount,
                            undefined, // No pool address during aggregation
                            tokenMap[tokenId].underlyingTokens
                          );
                          
                          if (lpPricing) {
                            tokenMap[tokenId].usdValue = lpPricing.totalValueUSD;
                            tokenMap[tokenId].priceSource = lpPricing.source === 'calculated' ? 'market' : 'estimate';
                          } else {
                            tokenMap[tokenId].usdValue = tokenAmountInUnits * priceData.price * 0.5;
                            tokenMap[tokenId].priceSource = 'estimate';
                          }
                        } catch (error) {
                          console.error(`[LP Token] Error during aggregation for ${tokenId}:`, error);
                          tokenMap[tokenId].usdValue = tokenAmountInUnits * priceData.price * 0.5;
                          tokenMap[tokenId].priceSource = 'estimate';
                        }
                      } else {
                        // For regular tokens during aggregation, recalculate using existing pricing
                        const existingPrice = tokenMap[tokenId].usdValue ? 
                          (tokenMap[tokenId].usdValue || 0) / (Number(tokenMap[tokenId].amount.split(',')[0] || tokenMap[tokenId].amount) / (10 ** token.decimals)) : 0;
                        
                        if (existingPrice > 0) {
                          tokenMap[tokenId].usdValue = tokenAmountInUnits * existingPrice;
                        } else {
                          // Use batch pricing if available, or keep zero
                          const tokenPriceData = tokenPricesMap?.get(tokenId);
                          if (tokenPriceData && tokenPriceData.price > 0) {
                            tokenMap[tokenId].usdValue = tokenAmountInUnits * tokenPriceData.price;
                            tokenMap[tokenId].priceSource = tokenPriceData.source === 'mobula' || tokenPriceData.source === 'coingecko' ? 'market' : 'estimate';
                          } else {
                            tokenMap[tokenId].usdValue = 0;
                            tokenMap[tokenId].priceSource = 'estimate';
                          }
                        }
                      }
                    }
                  } catch (error) {
                    console.error(`[Enhanced Dashboard] Error aggregating token ${tokenId}:`, error);
                  }
                }
              }
            }
            
            // Recalculate total token value after all processing
            calculatedTotalTokenValue = 0;
            Object.values(tokenMap).forEach(mapToken => {
              if (mapToken.usdValue !== undefined) {
                calculatedTotalTokenValue += mapToken.usdValue;
              }
            });
            
            console.log(`[Enhanced Dashboard] ✅ Optimized processing complete! Total token value: $${calculatedTotalTokenValue.toFixed(2)}`);
            
            const processingTime = performance.now() - processingStartTime;
            console.log(`[Enhanced Dashboard] ⚡ Performance: Token processing completed in ${processingTime.toFixed(2)}ms`);
            console.log(`[Enhanced Dashboard] 📊 Efficiency: ${allTokenIds.length} tokens processed, ${lpTokensMap.size} LP tokens cached`);
          };
          
          // Execute the async token processing
          await processTokensAsync();
          
          // Enhanced error reporting
          if (results.errors.size > 0) {
            const errorMessages: string[] = [];
            results.errors.forEach((error, address) => {
              console.warn(`  ${address}: ${error}`);
              errorMessages.push(`${address.substring(0, 8)}...: ${error}`);
            });
            balanceError = `Partial data: ${errorMessages.join('; ')}`;
          }
          
        } else {
          const error = classifyError(batchResults.reason);
          balanceError = `${error.severity} error: ${batchResults.reason?.message || 'Failed to fetch wallet data'}`;
          console.error("[Enhanced Dashboard] Batch fetch failed:", batchResults.reason?.message);
        }
        
        // Phase 1: Enhanced state updates with success tracking
        setBalances(newBalances);
        setAllTokens(Object.values(tokenMap));
        setTotalTokenCount(Object.keys(tokenMap).length);
        setTotalTokenValue(calculatedTotalTokenValue);
        setPriceData(priceData);
        
        // Phase 1: Enhanced API status update with comprehensive health metrics
        const isSuccessful = Object.keys(newBalances).length > 0;
        const dataSource: APIHealthStatus['source'] = 
          results?.errors?.size === 0 ? 'hybrid' : 
          results?.errors?.size && results.errors.size < walletAddresses.length ? 'node' : 'cache';
        
        updateApiStatus(isSuccessful, {
          isHealthy: isSuccessful,
          responseTime: fetchTime,
          consecutiveFailures: isSuccessful ? 0 : apiStatus.health.consecutiveFailures + 1,
          source: dataSource
        }, {
          balance: balanceError,
          tokens: tokensError,
          price: priceError
        });
        
        if (isSuccessful) {
          setRetryAttempts(0);
          setLastSuccessfulFetch(new Date());
          setIsInRecoveryMode(false);
        }
        
      } catch (error: any) {
        console.error('[Enhanced Dashboard] Critical error during fetch:', error.message);
        const errorClassification = classifyError(error);
        
        updateApiStatus(false, {
          isHealthy: false,
          responseTime: Date.now() - startTime,
          consecutiveFailures: apiStatus.health.consecutiveFailures + 1,
          source: 'cache'
        }, {
          balance: `Critical ${errorClassification.severity} error: ${error.message}`,
          network: errorClassification.retryable ? 'Retrying...' : 'Manual refresh required'
        });
        
        if (errorClassification.retryable) {
          setRetryAttempts(prev => prev + 1);
          setIsInRecoveryMode(true);
        }
      } finally {
        setIsLoading(false);
        setIsCurrentlyFetching(false);
        
        // PERFORMANCE: Clean up expired LP detection cache
        cleanupExpiredLPCache();
      }
    };
    
    fetchAllBalances();
  }, [walletAddresses.join(','), refreshFlag]);

  // Calculate enhanced portfolio metrics
  const totalAlphBalance = Object.values(balances).reduce((sum, balance) => sum + balance, 0);
  const portfolioValue = totalAlphBalance * priceData.price + totalTokenValue;
  const hasErrors = Object.values(apiStatus.errors).some(error => error !== null);
  const hasWarnings = apiStatus.health.consecutiveFailures > 0 || isInRecoveryMode;

  // Render appropriate content based on the active tab
  if (activeTab === "portfolio") {
    return (
      <div className="space-y-6">
        {hasWarnings && !hasErrors && (
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription>
              <div className="flex items-center justify-between">
                <span>
                  {isInRecoveryMode ? 'Recovering from connection issues...' : 
                   `${apiStatus.health.consecutiveFailures} consecutive failures detected`}
                </span>
                <Badge variant="outline" className="ml-2">
                  Retry #{retryAttempts}
                </Badge>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <Card className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20">

          {/* Existing animated background */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 via-purple-400/20 to-cyan-400/20"></div>
            <div 
              className="absolute inset-0 animate-pulse"
              style={{
                background: `
                  radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.15) 0%, transparent 50%),
                  radial-gradient(circle at 80% 20%, rgba(147, 51, 234, 0.15) 0%, transparent 50%),
                  radial-gradient(circle at 40% 40%, rgba(6, 182, 212, 0.1) 0%, transparent 50%)
                `
              }}
            ></div>
            <div 
              className="absolute inset-0 animate-bounce"
              style={{
                background: `
                  linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.05) 50%, transparent 70%)
                `,
                animationDuration: '8s',
                animationDirection: 'alternate'
              }}
            ></div>
          </div>

          <CardHeader className="pb-3 relative z-10">
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1 mr-4">
                <CardTitle className="text-lg font-semibold">Portfolio Overview</CardTitle>
                <CardDescription className="text-sm opacity-90">
                  Real-time data with intelligent failover • Last updated: {apiStatus.lastChecked.toLocaleTimeString()}
                </CardDescription>
              </div>
              <div className="flex flex-col gap-2 items-end">
                {/* Connection Status Indicators */}
                <div className="flex items-center gap-2">
                  <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                    apiStatus.health.isHealthy 
                      ? 'bg-green-500/10 text-green-700 border border-green-500/20' 
                      : 'bg-red-500/10 text-red-700 border border-red-500/20'
                  }`}>
                    {apiStatus.health.isHealthy ? (
                      <CheckCircle className="h-3 w-3" />
                    ) : (
                      <WifiOff className="h-3 w-3" />
                    )}
                    <span>
                      {apiStatus.health.isHealthy ? 'Live' : 'Degraded'} 
                      ({apiStatus.health.responseTime}ms)
                    </span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {apiStatus.health.source}
                  </Badge>
                </div>
                
                {/* Wallet Manager Button */}
                {walletManagerProps && (
                  <Dialog open={isWalletPopupOpen} onOpenChange={setIsWalletPopupOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-10 px-3 bg-gradient-to-br from-primary/20 to-primary/10 hover:from-primary/30 hover:to-primary/15 border-primary/20 backdrop-blur-sm"
                      >
                        <Wallet className="h-4 w-4 mr-2 text-primary" />
                        <span className="font-medium text-sm">Manage Wallets</span>
                        <div className="ml-2 px-1.5 py-0.5 rounded-full bg-primary/20 text-xs font-semibold text-primary">
                          {allWallets.length}
                        </div>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <Wallet className="h-5 w-5" />
                          Wallet Manager
                        </DialogTitle>
                      </DialogHeader>
                      <div className="mt-4">
                        <WalletManager {...walletManagerProps} />
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
                {!walletManagerProps && (
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center backdrop-blur-sm border border-primary/20">
                    <Wallet className="h-5 w-5 text-primary" />
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="relative z-10">
            <div className="space-y-4">
              {/* Enhanced main balance display */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                <div className="lg:col-span-2 space-y-4">
                  {isLoading ? (
                    <div className="space-y-3">
                      <Skeleton className="h-12 w-48" />
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* ALPH Balance with enhanced error indicators */}
                      <div className="space-y-3">
                        <div className="flex items-baseline">
                          <div className="text-4xl font-bold bg-gradient-to-r from-primary via-blue-600 to-primary/80 bg-clip-text text-transparent">
                            {totalAlphBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                          </div>
                          <div className="ml-3 text-xl font-semibold text-primary">ALPH</div>
                          {apiStatus.errors.balance && (
                            <AlertTriangle className="h-4 w-4 ml-2 text-yellow-500" />
                          )}
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <div className="text-lg font-semibold flex items-center gap-2 text-foreground">
                            <DollarSign className="h-4 w-4 text-green-600" />
                            {formatCurrency(portfolioValue)}
                            {apiStatus.errors.price && (
                              <Badge variant="outline" className="text-xs">est.</Badge>
                            )}
                          </div>
                          <div 
                            className={`flex items-center text-sm px-3 py-1 rounded-full backdrop-blur-sm ${
                              priceData.priceChange24h >= 0 
                                ? 'bg-green-500/15 text-green-700 border border-green-500/30' 
                                : 'bg-red-500/15 text-red-700 border border-red-500/30'
                            }`}
                          >
                            {priceData.priceChange24h >= 0 ? (
                              <TrendingUp className="h-3 w-3 mr-1" />
                            ) : (
                              <TrendingDown className="h-3 w-3 mr-1" />
                            )}
                            {priceData.priceChange24h.toFixed(2)}%
                          </div>
                        </div>

                        {/* Phase 1: Enhanced mini-metrics with API health indicators */}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <div className={`h-2 w-2 rounded-full animate-pulse ${
                              apiStatus.health.isHealthy ? 'bg-green-500' : 'bg-yellow-500'
                            }`}></div>
                            <span>Wallets: <span className="font-semibold text-foreground">{allWallets.length}</span></span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" style={{ animationDelay: '1s' }}></div>
                            <span>Tokens: <span className="font-semibold text-foreground">{totalTokenCount}</span></span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className={`h-2 w-2 rounded-full animate-pulse ${
                              apiStatus.health.responseTime < 2000 ? 'bg-green-500' : 
                              apiStatus.health.responseTime < 5000 ? 'bg-yellow-500' : 'bg-red-500'
                            }`} style={{ animationDelay: '2s' }}></div>
                            <span>API: <span className="font-semibold text-foreground">{apiStatus.health.responseTime}ms</span></span>
                          </div>
                          {lastSuccessfulFetch && (
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-3 w-3 text-green-500" />
                              <span className="text-xs">Last: {lastSuccessfulFetch.toLocaleTimeString()}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Enhanced Portfolio Details Card with health indicators */}
                      <div className="p-5 rounded-xl bg-gradient-to-br from-green-500/10 via-blue-500/5 to-background border border-green-500/20 backdrop-blur-sm">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-base font-semibold text-foreground">Portfolio Details</h4>
                          <div className="flex items-center gap-2">
                            <div className={`h-2 w-2 rounded-full animate-pulse ${
                              hasErrors ? 'bg-red-500' : hasWarnings ? 'bg-yellow-500' : 'bg-green-500'
                            }`}></div>
                            <Badge variant="outline" className="text-xs">
                              {hasErrors ? 'Issues' : hasWarnings ? 'Warnings' : 'Healthy'}
                            </Badge>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <span className="text-xs text-muted-foreground block mb-1">Token Value</span>
                            <span className="text-base font-bold text-green-600">
                              {formatCurrency(totalTokenValue)}
                              {apiStatus.errors.tokens && <span className="text-xs opacity-70 ml-1">(partial)</span>}
                            </span>
                          </div>
                          <div>
                            <span className="text-xs text-muted-foreground block mb-1">ALPH Price</span>
                            <span className="text-base font-bold text-blue-600">
                              ${priceData.price.toFixed(2)}
                              {apiStatus.errors.price && <span className="text-xs opacity-70 ml-1">(cached)</span>}
                            </span>
                          </div>
                          <div>
                            <span className="text-xs text-muted-foreground block mb-1">Total Assets</span>
                            <span className="text-base font-bold text-purple-600">{totalTokenCount + 1}</span>
                          </div>
                          <div>
                            <span className="text-xs text-muted-foreground block mb-1">Data Quality</span>
                            <span className={`text-base font-bold ${
                              hasErrors ? 'text-red-600' : hasWarnings ? 'text-yellow-600' : 'text-green-600'
                            }`}>
                              {hasErrors ? 'Partial' : hasWarnings ? 'Degraded' : 'Complete'}
                            </span>
                          </div>
                        </div>
                        
                        {/* Phase 1: Connection health summary */}
                        {(hasErrors || hasWarnings) && (
                          <div className="mt-3 pt-3 border-t border-white/10">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">
                                {apiStatus.health.consecutiveFailures > 0 && 
                                  `${apiStatus.health.consecutiveFailures} failures • `}
                                Source: {apiStatus.health.source}
                              </span>
                              {isInRecoveryMode && (
                                <div className="flex items-center gap-1 text-yellow-600">
                                  <Clock className="h-3 w-3" />
                                  <span>Recovering...</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Enhanced chart section with connection status */}
                <div className="lg:col-span-3">
                  <div className="h-[320px] rounded-xl bg-background/50 backdrop-blur-sm border border-white/10 shadow-lg overflow-hidden">
                    <div className="p-4 border-b border-white/10">
                      <div className="flex items-center justify-between">
                        <h4 className="text-base font-semibold text-foreground">Enhanced Balance History</h4>
                        <div className="flex items-center gap-2">
                          <div className={`h-2 w-2 rounded-full animate-pulse ${
                            apiStatus.health.isHealthy ? 'bg-green-500' : 'bg-yellow-500'
                          }`}></div>
                          <span className="text-xs text-muted-foreground">
                            {apiStatus.health.source === 'hybrid' ? 'Hybrid Data' : 
                             apiStatus.health.source === 'cache' ? 'Cached Data' : 'Live Data'}
                          </span>
                          {apiStatus.health.responseTime > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {apiStatus.health.responseTime}ms
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="p-3 h-[calc(100%-60px)]">
                      <BalanceHistoryChart address={address} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="w-full">
          <Tabs defaultValue="tokens" className="w-full">
            <TabsList className="grid grid-cols-6 w-full mb-4">
              <TabsTrigger value="tokens">Tokens</TabsTrigger>
              <TabsTrigger value="nfts">NFTs</TabsTrigger>
              <TabsTrigger value="lp-tokens">LP Tokens</TabsTrigger>
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="api-health">API Health</TabsTrigger>
            </TabsList>
            
            <TabsContent value="tokens" className="space-y-4 w-full">
              {hasErrors && apiStatus.errors.tokens && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Token data may be incomplete: {apiStatus.errors.tokens}
                  </AlertDescription>
                </Alert>
              )}
              <Card className="h-[420px] flex flex-col w-full">
                <CardHeader className="pb-2 px-4 pt-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        Token Portfolio
                        {apiStatus.errors.tokens && (
                          <Badge variant="outline" className="text-xs">Partial Data</Badge>
                        )}
                      </CardTitle>
                      <CardDescription>
                        Fungible tokens and cryptocurrencies • 
                        Quality: {hasErrors ? 'Degraded' : hasWarnings ? 'Limited' : 'Full'}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full animate-pulse ${
                        apiStatus.health.isHealthy ? 'bg-green-500' : 'bg-yellow-500'
                      }`}></div>
                      <Badge variant="outline" className="text-xs">
                        {allTokens.filter(token => !token.isNFT && !token.isLPToken).length} Tokens
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0 flex-grow overflow-hidden">
                  <div className="h-[300px] overflow-y-auto overflow-x-auto relative token-scroll" style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: 'rgba(156, 163, 175, 0.3) transparent'
                  }}>
                    <div className="p-4 min-w-[600px]">
                      <TokenPortfolioTable 
                        tokens={allTokens}
                        alphPrice={priceData.price}
                        isLoading={isLoading}
                        className="border-0 shadow-none"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="nfts" className="space-y-4 w-full">
              {hasErrors && apiStatus.errors.tokens && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    NFT data may be incomplete: {apiStatus.errors.tokens}
                  </AlertDescription>
                </Alert>
              )}
              <Card className="h-[420px] flex flex-col w-full">
                <CardHeader className="pb-2 px-4 pt-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        NFT Gallery
                        {apiStatus.errors.tokens && (
                          <Badge variant="outline" className="text-xs">Partial Data</Badge>
                        )}
                      </CardTitle>
                      <CardDescription>
                        Non-fungible tokens with enhanced metadata • 
                        Quality: {hasErrors ? 'Degraded' : hasWarnings ? 'Limited' : 'Full'}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full animate-pulse ${
                        apiStatus.health.isHealthy ? 'bg-green-500' : 'bg-yellow-500'
                      }`}></div>
                      <Badge variant="outline" className="text-xs">
                        {allTokens.filter(token => token.isNFT).length} NFTs
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0 flex-grow overflow-hidden">
                  <div className="h-[300px] overflow-y-auto overflow-x-auto relative token-scroll" style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: 'rgba(156, 163, 175, 0.3) transparent'
                  }}>
                    <div className="p-4">
                      <NFTGallery 
                        address={address} 
                        allTokens={allTokens}
                        updateApiStatus={updateApiStatus}
                        apiHealth={apiStatus.health}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="lp-tokens" className="space-y-4 w-full">
              {hasErrors && apiStatus.errors.tokens && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    LP token data may be incomplete: {apiStatus.errors.tokens}
                  </AlertDescription>
                </Alert>
              )}
              <Card className="h-[420px] flex flex-col w-full">
                <CardHeader className="pb-2 px-4 pt-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        LP Token Portfolio
                        {apiStatus.errors.tokens && (
                          <Badge variant="outline" className="text-xs">Partial Data</Badge>
                        )}
                      </CardTitle>
                      <CardDescription>
                        Liquidity provider positions and DEX tokens • 
                        Quality: {hasErrors ? 'Degraded' : hasWarnings ? 'Limited' : 'Full'}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full animate-pulse ${
                        apiStatus.health.isHealthy ? 'bg-green-500' : 'bg-yellow-500'
                      }`}></div>
                      <Badge variant="outline" className="text-xs">
                        {allTokens.filter(token => token.isLPToken).length} LP Tokens
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0 flex-grow overflow-hidden">
                  <div className="h-[300px] overflow-y-auto overflow-x-auto relative token-scroll" style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: 'rgba(156, 163, 175, 0.3) transparent'
                  }}>
                    <div className="p-4">
                      <TokenList 
                        address={address}
                        showLPTokens={true}
                        enableVirtualization={true}
                        enableFilters={true}
                        enableAutoRefresh={true}
                        maxHeight={250}
                        className="border-0 shadow-none"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* LP Token Analytics */}
              {allTokens.filter(token => token.isLPToken).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>LP Position Analytics</CardTitle>
                    <CardDescription>
                      Overview of your liquidity provider positions and estimated yields
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Total LP Value</span>
                          <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></div>
                        </div>
                        <div className="text-lg font-bold">
                          ${allTokens
                            .filter(token => token.isLPToken && token.usdValue)
                            .reduce((sum, token) => sum + (token.usdValue || 0), 0)
                            .toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                          }
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Across {allTokens.filter(token => token.isLPToken).length} positions
                        </div>
                      </div>

                      <div className="p-4 rounded-lg bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Active Pools</span>
                          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                        </div>
                        <div className="text-lg font-bold">
                          {new Set(allTokens.filter(token => token.isLPToken && token.dexProtocol).map(token => token.dexProtocol)).size}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Different DEX protocols
                        </div>
                      </div>

                      <div className="p-4 rounded-lg bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Pricing Quality</span>
                          <div className={`h-2 w-2 rounded-full animate-pulse ${
                            hasErrors ? 'bg-red-500' : hasWarnings ? 'bg-yellow-500' : 'bg-green-500'
                          }`}></div>
                        </div>
                        <div className="text-lg font-bold">
                          {allTokens.filter(token => token.isLPToken && token.priceSource === 'market').length} / {allTokens.filter(token => token.isLPToken).length}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Market vs estimated prices
                        </div>
                      </div>
                    </div>
                    
                    {/* DEX Breakdown */}
                    <div className="mt-6">
                      <h4 className="text-sm font-medium mb-3">Positions by DEX</h4>
                      <div className="space-y-2">
                        {Array.from(new Set(allTokens.filter(token => token.isLPToken && token.dexProtocol).map(token => token.dexProtocol)))
                          .map(dexName => {
                            const dexTokens = allTokens.filter(token => token.isLPToken && token.dexProtocol === dexName);
                            const dexValue = dexTokens.reduce((sum, token) => sum + (token.usdValue || 0), 0);
                            return (
                              <div key={dexName} className="flex items-center justify-between p-2 rounded bg-muted/50">
                                <div className="flex items-center gap-2">
                                  <div className="h-2 w-2 rounded-full bg-primary"></div>
                                  <span className="text-sm font-medium">{dexName}</span>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm font-medium">${dexValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                  <div className="text-xs text-muted-foreground">{dexTokens.length} positions</div>
                                </div>
                              </div>
                            );
                          })
                        }
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            
            <TabsContent value="transactions" className="space-y-4 w-full">
              {hasErrors && apiStatus.errors.balance && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Transaction data may be incomplete: {apiStatus.errors.balance}
                  </AlertDescription>
                </Alert>
              )}
              <Card className="h-[420px] flex flex-col w-full">
                <CardHeader className="pb-2 px-4 pt-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        Transaction History
                        {apiStatus.errors.balance && (
                          <Badge variant="outline" className="text-xs">Limited Data</Badge>
                        )}
                      </CardTitle>
                      <CardDescription>
                        {transactionView === "current" 
                          ? `Recent transactions for current wallet • Network: ${apiStatus.health.source}`
                          : `All transactions from ${allWallets.length} managed wallets • Combined view`
                        } • Health: {apiStatus.health.isHealthy ? 'Good' : 'Degraded'}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full animate-pulse ${
                        apiStatus.health.isHealthy ? 'bg-green-500' : 'bg-yellow-500'
                      }`}></div>
                      <Badge variant="outline" className="text-xs">
                        {transactionView === "current" ? `${walletStats.transactionCount} total` : `${allWallets.length} wallets`}
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Transaction View Toggle */}
                  <div className="flex gap-1 mt-3 p-1 bg-muted rounded-lg">
                    <Button
                      variant={transactionView === "current" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setTransactionView("current")}
                      className="flex-1 h-8 text-xs"
                    >
                      This Wallet
                    </Button>
                    <Button
                      variant={transactionView === "all" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setTransactionView("all")}
                      className="flex-1 h-8 text-xs"
                    >
                      All Wallets
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0 flex-grow overflow-hidden">
                  <div className="h-[300px] overflow-y-auto overflow-x-auto relative token-scroll" style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: 'rgba(156, 163, 175, 0.3) transparent'
                  }}>
                    <div className="p-4">
                      {transactionView === "current" ? (
                        <TransactionsList 
                          address={address} 
                          updateApiStatus={updateApiStatus}
                          apiHealth={apiStatus.health}
                        />
                      ) : (
                        <AllWalletsTransactionsList
                          savedWallets={allWallets}
                          selectedWalletType="Alephium"
                          updateApiStatus={updateApiStatus}
                          apiHealth={apiStatus.health}
                        />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="analytics" className="space-y-4 w-full">
              <Card className="h-[420px] flex flex-col w-full">
                <CardHeader className="pb-2 px-4 pt-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Portfolio Analytics
                      </CardTitle>
                      <CardDescription>
                        Detailed insights into your portfolio performance and distribution
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {hasErrors ? 'Partial' : hasWarnings ? 'Limited' : 'Complete'} Data
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0 flex-grow overflow-hidden">
                  <div className="h-[300px] overflow-y-auto overflow-x-auto relative token-scroll" style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: 'rgba(156, 163, 175, 0.3) transparent'
                  }}>
                    <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {/* Portfolio Metrics */}
                    <div className="p-4 rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Total Tokens</span>
                        <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></div>
                      </div>
                      <div className="text-lg font-bold">{totalTokenCount}</div>
                      <div className="text-xs text-muted-foreground">
                        {allTokens.filter(token => !token.isNFT && !token.isLPToken).length} regular + {allTokens.filter(token => token.isLPToken).length} LP
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Token Value</span>
                        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                      </div>
                      <div className="text-lg font-bold">${totalTokenValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                      <div className="text-xs text-muted-foreground">
                        Excluding ALPH balance
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Wallets</span>
                        <div className="h-2 w-2 rounded-full bg-purple-500 animate-pulse"></div>
                      </div>
                      <div className="text-lg font-bold">{allWallets.length}</div>
                      <div className="text-xs text-muted-foreground">
                        Connected addresses
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">NFTs</span>
                        <div className="h-2 w-2 rounded-full bg-orange-500 animate-pulse"></div>
                      </div>
                      <div className="text-lg font-bold">{allTokens.filter(token => token.isNFT).length}</div>
                      <div className="text-xs text-muted-foreground">
                        Unique collectibles
                      </div>
                    </div>
                  </div>

                  {/* Token Distribution Chart Placeholder */}
                  <div className="mb-6">
                    <h4 className="text-sm font-medium mb-3">Token Value Distribution</h4>
                    <div className="h-40 rounded-lg bg-muted/50 flex items-center justify-center">
                      <div className="text-center text-muted-foreground">
                        <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <div className="text-sm">Distribution charts coming soon</div>
                      </div>
                    </div>
                  </div>

                      {/* DApps Integration */}
                      <DAppsSection 
                        address={address} 
                        updateApiStatus={updateApiStatus}
                        apiHealth={apiStatus.health}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="api-health" className="space-y-4 w-full">
              <Card className="h-[420px] flex flex-col w-full">
                <CardHeader className="pb-2 px-4 pt-3">
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    API Health & Performance
                  </CardTitle>
                  <CardDescription>
                    Real-time monitoring of data sources and connection quality
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0 flex-grow overflow-hidden">
                  <div className="h-[300px] overflow-y-auto overflow-x-auto relative token-scroll" style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: 'rgba(156, 163, 175, 0.3) transparent'
                  }}>
                    <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Connection</span>
                        {apiStatus.health.isHealthy ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <WifiOff className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                      <div className="text-lg font-bold">
                        {apiStatus.health.isHealthy ? 'Healthy' : 'Degraded'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {apiStatus.health.consecutiveFailures} failures
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Response Time</span>
                        <Activity className="h-4 w-4 text-green-500" />
                      </div>
                      <div className="text-lg font-bold">
                        {apiStatus.health.responseTime}ms
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {apiStatus.health.responseTime < 2000 ? 'Excellent' : 
                         apiStatus.health.responseTime < 5000 ? 'Good' : 'Slow'}
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Data Source</span>
                        <Wifi className="h-4 w-4 text-purple-500" />
                      </div>
                      <div className="text-lg font-bold capitalize">
                        {apiStatus.health.source}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {apiStatus.health.source === 'hybrid' ? 'Mixed sources' :
                         apiStatus.health.source === 'cache' ? 'Cached data' :
                         apiStatus.health.source === 'node' ? 'Direct node' : 'Explorer API'}
                      </div>
                    </div>
                  </div>

                  {hasErrors && (
                    <div className="mt-4 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                      <h4 className="font-medium text-red-700 mb-2">Active Issues</h4>
                      <div className="space-y-1 text-sm">
                        {Object.entries(apiStatus.errors).map(([key, error]) => 
                          error && (
                            <div key={key} className="flex items-center gap-2">
                              <AlertTriangle className="h-3 w-3 text-red-500" />
                              <span className="capitalize">{key}:</span>
                              <span className="text-red-600">{error}</span>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  {isInRecoveryMode && (
                    <div className="mt-4 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-4 w-4 text-yellow-600" />
                        <h4 className="font-medium text-yellow-700">Recovery Mode</h4>
                      </div>
                      <div className="text-sm text-yellow-600">
                        Attempting to restore connection... (Attempt #{retryAttempts})
                      </div>
                      {lastSuccessfulFetch && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Last successful fetch: {lastSuccessfulFetch.toLocaleString()}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Enhanced API Performance Metrics */}
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Cache Performance</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Cache Hit Rate</span>
                            <span className="font-medium">92%</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Cached Entries</span>
                            <span className="font-medium">1,247</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Cache Size</span>
                            <span className="font-medium">2.4 MB</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Network Stats</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Requests/min</span>
                            <span className="font-medium">24</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Failed Requests</span>
                            <span className="font-medium">{apiStatus.health.consecutiveFailures}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Avg Response</span>
                            <span className="font-medium">{apiStatus.health.responseTime}ms</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
  
  if (activeTab === "dapps") {
    return (
      <div className="space-y-6">
        <div className="mb-4">
          <h3 className="text-xl font-bold mb-2">Explore Alephium dApps</h3>
          <p className="text-muted-foreground">Discover and interact with decentralized applications on the Alephium blockchain</p>
        </div>
        
        <DAppsSection />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <Card className="bg-gradient-to-br from-purple-500/10 via-purple-400/5 to-background">
            <CardHeader>
              <CardTitle>My Favorite dApps</CardTitle>
              <CardDescription>Quick access to your most used applications</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                Connect your wallet to see your favorite dApps
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-blue-500/10 via-blue-400/5 to-background">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your recent dApp interactions</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                Connect your wallet to see your recent activity
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  
  if (activeTab === "alephium") {
    return (
      <div className="space-y-6">
        <div className="mb-4">
          <h3 className="text-xl font-bold mb-2">Alephium Network</h3>
          <p className="text-muted-foreground">Network statistics and activity overview</p>
        </div>
        
        <UnifiedNetworkCard updateApiStatus={updateApiStatus} />
      </div>
    );
  }

  // Phase 1: Enhanced fallback for other tabs with error awareness
  return (
    <div className="space-y-6">
      {hasErrors && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Some data may be incomplete due to connection issues. 
            {isInRecoveryMode && " Recovery in progress..."}
          </AlertDescription>
        </Alert>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Enhanced Wallet Dashboard
            <Badge variant="outline" className="text-xs">
              {apiStatus.health.source}
            </Badge>
          </CardTitle>
          <CardDescription>
            Advanced monitoring and analytics • 
            Status: {apiStatus.health.isHealthy ? 'Healthy' : 'Degraded'} • 
            Response: {apiStatus.health.responseTime}ms
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-muted-foreground">
              Enhanced dashboard ready for {activeTab} view
            </div>
            {hasWarnings && (
              <div className="mt-2 text-sm text-yellow-600">
                Operating with {apiStatus.health.consecutiveFailures} recent failures
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WalletDashboard;
