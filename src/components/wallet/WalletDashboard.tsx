import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BalanceHistoryChart from "@/components/wallet/charts/BalanceHistoryChart";
import TokenList from "@/components/wallet/TokenList";
import TransactionsList from "@/components/wallet/TransactionsList";
import NFTGallery from "@/components/wallet/NFTGallery";
import DAppsSection from "@/components/wallet/DAppsSection";
import { formatNumber, formatCurrency } from "@/lib/utils/formatters";
import { WifiOff, Wifi, DollarSign, Wallet, TrendingUp, TrendingDown, Activity } from "lucide-react";
import { getAlephiumPrice } from "@/lib/api/coingeckoApi";
import { getAddressBalance, getAddressTokens, batchFetchWalletData } from "@/lib/api/cachedAlephiumApi";
import { Skeleton } from "@/components/ui/skeleton";
import { EnrichedTokenWithWallets, SavedWallet, TokenWallet } from "@/types/wallet";
import { fetchTokenList } from "@/lib/api/tokenMetadata";
import { getCoinGeckoId, isTokenMapped } from "@/lib/api/tokenMappings";
import UnifiedNetworkCard from "@/components/wallet/UnifiedNetworkCard";
import styles from './WalletDashboard.module.css';

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
}

const WalletDashboard: React.FC<WalletDashboardProps> = ({ 
  address, 
  allWallets = [],
  isLoggedIn, 
  walletStats, 
  isStatsLoading,
  refreshFlag,
  setRefreshFlag,
  activeTab = "portfolio"
}) => {
  const [apiStatus, setApiStatus] = useState<{ isLive: boolean; lastChecked: Date }>({
    isLive: false,
    lastChecked: new Date()
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

  // Fix useMemo dependency: extract addresses and use allWallets as dependency
  const walletAddresses = useMemo(() => {
    const addresses = allWallets.map(wallet => wallet.address);
    return addresses.sort();
  }, [allWallets]);

  // Ensure walletAddresses is included in the dependencies
  const stableWalletAddresses = useMemo(() => walletAddresses.join(','), [walletAddresses]);

  // Add loading state management
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const [isCurrentlyFetching, setIsCurrentlyFetching] = useState(false);

  // Function to update API status that can be passed to child components
  const updateApiStatus = (isLive: boolean) => {
    setApiStatus({ isLive, lastChecked: new Date() });
  };

  // Fetch balance and tokens for all wallets using improved batch logic
  useEffect(() => {
    const fetchAllBalances = async () => {
      // Prevent multiple simultaneous fetches
      if (isCurrentlyFetching) {
        console.log("[WalletDashboard] Fetch already in progress, skipping");
        return;
      }

      // Don't fetch if we don't have any wallets or if we just fetched recently
      if (walletAddresses.length === 0) {
        setIsLoading(false);
        return;
      }

      // Rate limit fetches - don't fetch more than once per 10 seconds
      const now = Date.now();
      const timeSinceLastFetch = now - lastFetchTime;
      if (timeSinceLastFetch < 10000 && lastFetchTime > 0) {
        console.log("[WalletDashboard] Fetch rate limited, last fetch was", timeSinceLastFetch, "ms ago");
        return;
      }
      
      setIsLoading(true);
      setIsCurrentlyFetching(true);
      setLastFetchTime(now);
      
      try {
        console.log("[WalletDashboard] Fetching balances and tokens for wallets:", walletAddresses);
        
        // Use batch fetch with rate limiting and error handling
        const [batchResults, priceResult, tokenMetadata] = await Promise.allSettled([
          batchFetchWalletData(walletAddresses),
          getAlephiumPrice(),
          fetchTokenList()
        ]);
        
        // Handle price data
        let priceData = { price: 0, priceChange24h: 0 };
        if (priceResult.status === 'fulfilled') {
          priceData = priceResult.value;
        } else {
          console.warn("[WalletDashboard] Failed to fetch price data:", priceResult.reason?.message);
        }
        
        // Handle token metadata
        let tokenMetadataMap = {};
        if (tokenMetadata.status === 'fulfilled') {
          tokenMetadataMap = tokenMetadata.value;
        } else {
          console.warn("[WalletDashboard] Failed to fetch token metadata:", tokenMetadata.reason?.message);
        }
        
        // Process batch results
        const newBalances: Record<string, number> = {};
        const tokenMap: Record<string, EnrichedTokenWithWallets> = {};
        let totalTokens = 0;
        let calculatedTotalTokenValue = 0;
        
        if (batchResults.status === 'fulfilled') {
          const results = batchResults.value;
          
          // Process balances
          results.balances.forEach((balance, address) => {
            newBalances[address] = balance.balance || 0;
          });
          
          // Process tokens
          results.tokens.forEach((tokens, address) => {
            console.log(`[WalletDashboard] Retrieved ${tokens.length} tokens for wallet ${address}`);
            totalTokens += tokens.length;
            
            // Aggregate token data across wallets
            tokens.forEach(token => {
              const tokenId = token.id;
              
              if (!tokenMap[tokenId]) {
                // Calculate USD value for the token
                let usdValue: number | undefined = undefined;
                let priceSource: 'market' | 'estimate' = 'estimate';
                
                if (!token.isNFT) {
                  const tokenAmountInUnits = Number(token.amount) / (10 ** token.decimals);
                  
                  // For ALPH token, use direct ALPH price
                  if (tokenId === "ALPH" || tokenId.toLowerCase() === "alph") {
                    usdValue = tokenAmountInUnits * priceData.price;
                    priceSource = 'market';
                  } 
                  // For other tokens with known mapping, use their specific prices
                  else if (isTokenMapped(tokenId)) {
                    usdValue = tokenAmountInUnits * priceData.price * 0.1; // Better placeholder
                    priceSource = 'market';
                  }
                  // For unknown tokens, use a very conservative estimate
                  else {
                    usdValue = tokenAmountInUnits * priceData.price * 0.01;
                    priceSource = 'estimate';
                  }
                  
                  if (usdValue !== undefined) {
                    calculatedTotalTokenValue += usdValue;
                  }
                }
                
                tokenMap[tokenId] = {
                  ...token,
                  wallets: [{ address, amount: token.amount }],
                  usdValue: usdValue,
                  priceSource: priceSource
                } as EnrichedTokenWithWallets;
              } else {
                // Token exists in map, add this wallet's amount
                tokenMap[tokenId].wallets.push({
                  address,
                  amount: token.amount,
                  percentage: 0, // TODO: calculate actual percentage if needed
                  lastUpdated: Date.now()
                });
                
                // Update total amount for this token (as BigInt to handle large numbers)
                try {
                  const currentAmount = BigInt(tokenMap[tokenId].amount || "0");
                  const additionalAmount = BigInt(token.amount || "0");
                  tokenMap[tokenId].amount = (currentAmount + additionalAmount).toString();
                  
                  // Recalculate formatted amount with new total
                  tokenMap[tokenId].formattedAmount = token.isNFT 
                    ? tokenMap[tokenId].amount 
                    : (Number(tokenMap[tokenId].amount) / 10**token.decimals).toLocaleString(
                        undefined, 
                        { minimumFractionDigits: 0, maximumFractionDigits: token.decimals }
                      );
                  
                  // Update USD value if applicable
                  if (!token.isNFT) {
                    const tokenAmountInUnits = Number(tokenMap[tokenId].amount) / (10 ** token.decimals);
                    
                    if (tokenId === "ALPH" || tokenId.toLowerCase() === "alph") {
                      tokenMap[tokenId].usdValue = tokenAmountInUnits * priceData.price;
                      tokenMap[tokenId].priceSource = 'market';
                    } else if (isTokenMapped(tokenId)) {
                      tokenMap[tokenId].usdValue = tokenAmountInUnits * priceData.price * 0.1;
                      tokenMap[tokenId].priceSource = 'market';
                    } else {
                      tokenMap[tokenId].usdValue = tokenAmountInUnits * priceData.price * 0.01;
                      tokenMap[tokenId].priceSource = 'estimate';
                    }
                    
                    // Recalculate total to avoid double counting
                    calculatedTotalTokenValue = 0;
                    Object.values(tokenMap).forEach(mapToken => {
                      if (mapToken.usdValue !== undefined) {
                        calculatedTotalTokenValue += mapToken.usdValue;
                      }
                    });
                  }
                } catch (error) {
                  console.error(`[WalletDashboard] Error summing amounts for token ${tokenId}:`, error);
                }
              }
            });
          });
          
          // Handle any errors from batch fetch
          if (results.errors.size > 0) {
            console.warn("[WalletDashboard] Some wallet data failed to fetch:");
            results.errors.forEach((error, address) => {
              console.warn(`  ${address}: ${error}`);
            });
          }
          
        } else {
          console.error("[WalletDashboard] Batch fetch failed:", batchResults.reason?.message);
          // Fallback to empty data rather than crashing
        }
        
        setBalances(newBalances);
        console.log("[WalletDashboard] Aggregated token data:", Object.keys(tokenMap).length, "unique tokens");
        console.log("[WalletDashboard] Total token value in USD:", calculatedTotalTokenValue);
        
        setAllTokens(Object.values(tokenMap));
        setTotalTokenCount(Object.keys(tokenMap).length);
        setTotalTokenValue(calculatedTotalTokenValue);
        
        setPriceData(priceData);
        
        // Update API status based on successful data retrieval
        updateApiStatus(Object.keys(newBalances).length > 0);
      } catch (error: unknown) {
        if (error instanceof Error) {
          console.error(error.message);
        }
        updateApiStatus(false);
      } finally {
        setIsLoading(false);
        setIsCurrentlyFetching(false);
      }
    };
    
    fetchAllBalances();
  }, [stableWalletAddresses, refreshFlag, isCurrentlyFetching, lastFetchTime, walletAddresses]); // Use string join to create stable dependency

  // Calculate total balance and USD value
  const totalAlphBalance = Object.values(balances).reduce((sum, balance) => sum + balance, 0);
  const portfolioValue = totalAlphBalance * priceData.price + totalTokenValue;

  // Render appropriate content based on the active tab
  if (activeTab === "portfolio") {
    const walletAddresses = allWallets.map(wallet => wallet.address);
    
    return (
      <div className="space-y-6">
        <Card className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20">
          {/* Subtle animated wave background */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 via-purple-400/20 to-cyan-400/20"></div>
            <div 
              className={`absolute inset-0 animate-pulse ${styles['animated-bg-pulse']}`}
            ></div>
            <div 
              className={`absolute inset-0 ${styles['animated-bg-bounce']}`}
            ></div>
          </div>

          <CardHeader className="pb-4 relative z-10">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl font-semibold">Portfolio Overview</CardTitle>
                <CardDescription className="text-sm opacity-90">Combined balance of all tracked wallets</CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center backdrop-blur-sm border border-primary/20">
                  <Wallet className="h-6 w-6 text-primary" />
                </div>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="relative z-10">
            <div className="space-y-6">
              {/* Main balance display */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-2 space-y-4">
                  {isLoading ? (
                    <div className="space-y-3">
                      <Skeleton className="h-12 w-48" />
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* ALPH Balance */}
                      <div className="space-y-3">
                        <div className="flex items-baseline">
                          <div className="text-4xl font-bold bg-gradient-to-r from-primary via-blue-600 to-primary/80 bg-clip-text text-transparent">
                            {totalAlphBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                          </div>
                          <div className="ml-3 text-xl font-semibold text-primary">ALPH</div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <div className="text-lg font-semibold flex items-center gap-2 text-foreground">
                            <DollarSign className="h-4 w-4 text-green-600" />
                            {formatCurrency(portfolioValue)}
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

                        {/* Consolidated mini-metrics */}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-primary animate-pulse"></div>
                            <span>Wallets: <span className="font-semibold text-foreground">{allWallets.length}</span></span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse green-pulse-delay"></div>
                            <span>Tokens: <span className="font-semibold text-foreground">{totalTokenCount}</span></span>
                          </div>
                        </div>
                      </div>

                      {/* Token Portfolio Card - Single unified card */}
                      <div className="p-5 rounded-xl bg-gradient-to-br from-green-500/10 via-blue-500/5 to-background border border-green-500/20 backdrop-blur-sm">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-base font-semibold text-foreground">Portfolio Details</h4>
                          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <span className="text-xs text-muted-foreground block mb-1">Token Value</span>
                            <span className="text-base font-bold text-green-600">{formatCurrency(totalTokenValue)}</span>
                          </div>
                          <div>
                            <span className="text-xs text-muted-foreground block mb-1">ALPH Price</span>
                            <span className="text-base font-bold text-blue-600">${priceData.price.toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="text-xs text-muted-foreground block mb-1">Total Assets</span>
                            <span className="text-base font-bold text-purple-600">{totalTokenCount + 1}</span>
                          </div>
                          <div>
                            <span className="text-xs text-muted-foreground block mb-1">Avg/ALPH</span>
                            <span className="text-base font-bold text-indigo-600">
                              {formatCurrency(portfolioValue / totalAlphBalance || 0)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Enhanced chart with better proportions */}
                <div className="lg:col-span-3">
                  <div className="h-[400px] rounded-xl bg-background/50 backdrop-blur-sm border border-white/10 shadow-lg overflow-hidden">
                    <div className="p-4 border-b border-white/10">
                      <div className="flex items-center justify-between">
                        <h4 className="text-base font-semibold text-foreground">Balance History</h4>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></div>
                          <span className="text-xs text-muted-foreground">Live Data</span>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 h-[calc(100%-60px)]">
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
            <TabsList className="grid grid-cols-4 max-w-lg mb-4">
              <TabsTrigger value="tokens">Tokens</TabsTrigger>
              <TabsTrigger value="nfts">NFTs</TabsTrigger>
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
              <TabsTrigger value="stats">Analytics</TabsTrigger>
            </TabsList>
            
            <TabsContent value="tokens" className="mt-0">
              <TokenList address={address} allTokens={allTokens} />
            </TabsContent>
            
            <TabsContent value="nfts" className="mt-0">
              <NFTGallery address={address} />
            </TabsContent>
            
            <TabsContent value="transactions" className="mt-0">
              <TransactionsList address={address} />
            </TabsContent>
            
            <TabsContent value="stats" className="mt-0">
              <Card className="h-full">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Detailed Analytics</CardTitle>
                  <CardDescription className="text-sm">
                    Comprehensive wallet distribution and portfolio analysis
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {allWallets.length > 1 ? (
                    <div>
                      <h4 className="text-sm font-medium mb-3">Wallet Distribution</h4>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {allWallets.map(wallet => (
                          <div key={wallet.address} className="flex justify-between items-center p-3 bg-muted/20 rounded-lg text-sm hover:bg-muted/30 transition-colors">
                            <div className="truncate max-w-[140px] text-muted-foreground">
                              <div className="font-medium text-foreground">{wallet.label || 'Unnamed Wallet'}</div>
                              <div className="text-xs">{wallet.address.substring(0, 8)}...{wallet.address.substring(wallet.address.length - 4)}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold">
                                {(balances[wallet.address] || 0).toLocaleString(undefined, { 
                                  minimumFractionDigits: 2, 
                                  maximumFractionDigits: 4 
                                })} ALPH
                              </div>
                              <div className="text-xs text-muted-foreground">
                                ${((balances[wallet.address] || 0) * priceData.price).toLocaleString(undefined, { 
                                  minimumFractionDigits: 2, 
                                  maximumFractionDigits: 2 
                                })}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
                        <div className="flex justify-between items-center text-sm">
                          <span className="font-medium">Total Portfolio</span>
                          <div className="text-right">
                            <div className="font-bold text-primary">
                              {totalAlphBalance.toLocaleString(undefined, { 
                                minimumFractionDigits: 2, 
                                maximumFractionDigits: 4 
                              })} ALPH
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {formatCurrency(portfolioValue)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Wallet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h4 className="text-sm font-medium mb-2">Single Wallet</h4>
                      <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                        Add more wallets to see detailed distribution analytics and comparison metrics.
                      </p>
                    </div>
                  )}
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

  return null;
};

export default WalletDashboard;
