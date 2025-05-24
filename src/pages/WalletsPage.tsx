import React, { useState, useEffect, useCallback } from "react";
import { useWallet } from "@alephium/web3-react";
import { Wallet, ExternalLink, Blocks, LayoutGrid, ChartLine, Database, RefreshCw } from "lucide-react";
import WalletConnectButton from "@/components/wallet/WalletConnectButton";
import { Card, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/lib/utils/toast-replacement";
import AddressDisplay from "@/components/wallet/AddressDisplay";
import WalletManager from "@/components/wallet/WalletManager";
import FloatingDebugPanel from "@/components/wallet/DebugPanel";
import { getAddressTransactions, getAddressTokens } from "@/lib/api/cachedAlephiumApi";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useWalletCache } from "@/hooks/useWalletCache";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { WalletType, SavedWallet } from "@/types/wallet";
import WalletTypeSelector from "@/components/wallet/WalletTypeSelector";
import AlephiumWalletLayout from "@/components/wallet/layouts/AlephiumWalletLayout";
import BitcoinWalletLayout from "@/components/wallet/layouts/BitcoinWalletLayout";
import ErgoWalletLayout from "@/components/wallet/layouts/ErgoWalletLayout";

// Interface for wallet stats
interface WalletStats {
  transactionCount: number;
  receivedAmount: number;
  sentAmount: number;
  tokenCount: number;
}

const WalletsPage = () => {
  const wallet = useWallet();
  
  // Use the new cache system instead of basic localStorage
  const {
    savedWallets,
    addWallet,
    removeWallet,
    markAsRefreshed,
    isWalletStale,
    refreshStaleWallets,
    forceRefreshWallet,
    getCacheStatus,
    cleanupCache,
    cacheConfig,
    updateCacheConfig,
    isOnline,
    getRateLimitInfo
  } = useWalletCache();
  
  const [walletAddress, setWalletAddress] = useLocalStorage<string>("blocknoster_selected_wallet", "");
  const [refreshFlag, setRefreshFlag] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [walletStats, setWalletStats] = useState<WalletStats>({
    transactionCount: 0,
    receivedAmount: 0,
    sentAmount: 0,
    tokenCount: 0
  });
  const [isStatsLoading, setIsStatsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>("portfolio");
  const [selectedWalletType, setSelectedWalletType] = useLocalStorage<WalletType>("blocknoster_wallet_type", "Alephium");
  
  // Check if wallet is connected
  const connected = wallet.connectionStatus === 'connected';

  // Initialize with connected wallet or first saved wallet
  useEffect(() => {
    console.log("[WalletsPage] useEffect triggered:", { 
      connected, 
      walletAccount: wallet.account?.address, 
      savedWalletsCount: savedWallets.length,
      savedWalletAddresses: savedWallets.map(w => ({ address: w.address, label: w.label, network: w.network }))
    });

    // Fix existing wallets that don't have network property set correctly
    const walletsToFix = savedWallets.filter(w => 
      (w.label === "Connected Wallet" && !w.network) ||
      !w.network
    );
    
    if (walletsToFix.length > 0) {
      console.log("[WalletsPage] Fixing wallets with missing network:", walletsToFix);
      
      // Update wallets directly to prevent duplicate key issues
      walletsToFix.forEach(wallet => {
        // Create updated wallet
        const updatedWallet = {
          ...wallet,
          network: "Alephium" as WalletType,
          label: wallet.label || "Connected Wallet"
        };
        
        // Use a direct update approach
        const updatedWallets = savedWallets.map(w => 
          w.address === wallet.address ? updatedWallet : w
        );
        
        // Update via localStorage directly to avoid React timing issues
        localStorage.setItem("blocknoster_saved_wallets", JSON.stringify(updatedWallets));
        
        console.log(`[WalletsPage] Fixed wallet network for ${wallet.address}`);
      });
      
      // Force a page refresh to reload with fixed data
      window.location.reload();
      return;
    }

    if (connected && wallet.account) {
      // If user wallet is connected, use that address
      setWalletAddress(wallet.account.address);
      
      // Add the connected wallet using the cache system if it doesn't exist
      const existingWallet = savedWallets.find(w => w.address === wallet.account?.address);
      if (!existingWallet) {
        console.log("[WalletsPage] Adding connected wallet to saved wallets:", wallet.account.address);
        addWallet({ 
          address: wallet.account.address, 
          label: "Connected Wallet", 
          dateAdded: Date.now(),
          network: "Alephium", // Default to Alephium for connected wallets
          isWatchOnly: false
        });
      } else {
        console.log("[WalletsPage] Connected wallet already in saved wallets:", existingWallet);
      }
      
      // Notify user of successful connection
      toast.success("Wallet connected successfully", {
        description: `Connected to ${wallet.account.address.substring(0, 6)}...${wallet.account.address.substring(wallet.account.address.length - 4)}`
      });
    } else if (savedWallets.length > 0 && !walletAddress) {
      // If no wallet is connected but we have saved wallets, use the first one
      console.log("[WalletsPage] Using first saved wallet:", savedWallets[0]);
      setWalletAddress(savedWallets[0].address);
    } else if (!walletAddress && savedWallets.length === 0) {
      // Default connected wallet if no connected wallet and no saved wallets
      const defaultAddress = "raLUPHsewjm1iA2kBzRKXB2ntbj3j4puxbVvsZD8iK3r";
      console.log("[WalletsPage] Adding default wallet:", defaultAddress);
      setWalletAddress(defaultAddress);
      
      // Add default wallet using cache system
      addWallet({ 
        address: defaultAddress, 
        label: "Connected Wallet", 
        dateAdded: Date.now(),
        network: "Alephium",
        isWatchOnly: true
      });
    }
  }, [connected, wallet.account, savedWallets, addWallet, removeWallet]);

  // Update existing "Demo Wallet" labels to "Connected Wallet"
  useEffect(() => {
    const demoWallet = savedWallets.find(wallet => wallet.label === "Demo Wallet");
    
    if (demoWallet) {
      // Update by removing and re-adding outside of render cycle
      const updateWallet = async () => {
        removeWallet(demoWallet.address);
        // Wait a bit to ensure removal is processed
        await new Promise(resolve => setTimeout(resolve, 100));
        addWallet({
          address: demoWallet.address,
          label: "Connected Wallet",
          dateAdded: demoWallet.dateAdded,
          network: demoWallet.network,
          isWatchOnly: demoWallet.isWatchOnly
        });
      };
      
      updateWallet();
    }
  }, []); // Only run once on mount

  // Effect to fetch wallet statistics with better caching and rate limiting
  useEffect(() => {
    const fetchWalletStats = async () => {
      if (!walletAddress || selectedWalletType !== "Alephium") {
        setIsStatsLoading(false);
        return;
      }
      
      // Rate limit: don't fetch if we've fetched recently (within 30 seconds)
      const now = Date.now();
      const lastFetchKey = `lastStatsFetch_${walletAddress}`;
      const lastFetch = sessionStorage.getItem(lastFetchKey);
      if (lastFetch && (now - parseInt(lastFetch)) < 30000) {
        console.log(`[WalletsPage] Rate limiting stats fetch for ${walletAddress}`);
        setIsStatsLoading(false);
        return;
      }
      
      setIsStatsLoading(true);
      sessionStorage.setItem(lastFetchKey, now.toString());
      
      try {
        console.log(`[WalletsPage] Fetching stats for ${walletAddress}`);
        
        // Use rate-limited API with better error handling
        const [transactions, tokens] = await Promise.allSettled([
          getAddressTransactions(walletAddress, 50),
          getAddressTokens(walletAddress)
        ]);
        
        type Transaction = {
          inputs: { address: string; amount: string }[];
          outputs: { address: string; amount: string }[];
          // Add other properties as needed
        };
        type Token = object; // Define token properties as needed

        let transactionData: Transaction[] = [];
        let tokenData: Token[] = [];
        
        if (transactions.status === 'fulfilled') {
          transactionData = transactions.value || [];
        } else {
          console.warn(`[WalletsPage] Failed to fetch transactions:`, transactions.reason?.message);
          // Don't fail completely, just use empty array
        }
        
        if (tokens.status === 'fulfilled') {
          tokenData = tokens.value || [];
        } else {
          console.warn(`[WalletsPage] Failed to fetch tokens:`, tokens.reason?.message);
          // Don't fail completely, just use empty array
        }
        
        // Calculate stats from transactions
        let received = 0;
        let sent = 0;
        
        transactionData.forEach(tx => {
          const type = getTransactionType(tx);
          const amount = getTransactionAmount(tx);
          
          if (type === 'received') {
            received += amount;
          } else if (type === 'sent') {
            sent += amount;
          }
        });
        
        setWalletStats({
          transactionCount: transactionData.length,
          receivedAmount: received,
          sentAmount: sent,
          tokenCount: tokenData.length
        });
        
        // Mark wallet as refreshed since we got data (even if partial)
        markAsRefreshed(walletAddress, true);
        
      } catch (error: unknown) {
        if (error instanceof Error) {
          console.error("[WalletsPage] Error fetching wallet stats:", error.message);

          // Handle rate limiting gracefully
          if (error.message?.includes('Rate limited')) {
            toast.error("Rate limited - using cached data", {
              description: "Please wait before refreshing again"
            });
          }
        } else {
          console.error("[WalletsPage] Error fetching wallet stats:", error);
        }

        // Mark as failed refresh
        markAsRefreshed(walletAddress, false);
      } finally {
        setIsStatsLoading(false);
      }
    };
    
    fetchWalletStats();
  }, [walletAddress, refreshFlag, selectedWalletType]);

  // Define an interface for a signer that supports requestDisconnect
  interface DisconnectableSigner {
    requestDisconnect: () => Promise<void>;
    // Add other methods if needed
  }

  const handleDisconnect = async () => {
    try {
      const signer = wallet.signer as unknown as DisconnectableSigner | undefined;
      if (signer && typeof signer.requestDisconnect === "function") {
        await signer.requestDisconnect();
        toast.info("Wallet disconnected");
      } else {
        toast.error("Wallet disconnection failed", {
          description: "Your wallet doesn't support disconnect method"
        });
        return;
      }
      
      // Select the first saved wallet after disconnect
      if (savedWallets.length > 0) {
        setWalletAddress(savedWallets[0].address);
      }
    } catch (error) {
      console.error("Disconnection error:", error);
      toast.error("Disconnection failed", {
        description: error instanceof Error ? error.message : "Unknown error"
      });
    }
  };
  
  // Handle manual refresh with cache system
  const handleRefreshWallet = async () => {
    if (!walletAddress) return;
    
    setIsRefreshing(true);
    try {
      const success = await forceRefreshWallet(walletAddress);
      if (success) {
        setRefreshFlag(prev => prev + 1); // Trigger re-fetch
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  // Handle refresh all stale wallets
  const handleRefreshStale = async () => {
    setIsRefreshing(true);
    try {
      await refreshStaleWallets();
      setRefreshFlag(prev => prev + 1); // Trigger re-fetch
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Define a type for transaction inputs and outputs
  type TransactionIO = { address: string; amount: string };
  type TransactionType = {
    inputs: TransactionIO[];
    outputs: TransactionIO[];
    // Add other properties as needed
  };

  // Helper to determine if transaction is incoming or outgoing (memoized)
  const getTransactionType = useCallback((tx: TransactionType) => {
    // If any output is to this address, it's incoming
    const isIncoming = tx.outputs.some((output) => output.address === walletAddress);
    // If any input is from this address, it's outgoing
    const isOutgoing = tx.inputs.some((input) => input.address === walletAddress);

    if (isIncoming && !isOutgoing) return 'received';
    if (isOutgoing) return 'sent';
    return 'unknown';
  }, [walletAddress]);
  
  // Calculate amount transferred to/from this address (memoized)
  const getTransactionAmount = useCallback((tx: TransactionType) => {
    const type = getTransactionType(tx);

    if (type === 'received') {
      // Sum all outputs to this address
      const amount = tx.outputs
        .filter((output: TransactionIO) => output.address === walletAddress)
        .reduce((sum: number, output: TransactionIO) => sum + Number(output.amount), 0);
      return amount / 10**18; // Convert from nanoALPH to ALPH
    } else if (type === 'sent') {
      // This is a simplification - for accurate accounting we'd need to track change outputs
      const amount = tx.outputs
        .filter((output: TransactionIO) => output.address !== walletAddress)
        .reduce((sum: number, output: TransactionIO) => sum + Number(output.amount), 0);
      return amount / 10**18; // Convert from nanoALPH to ALPH
    }

    return 0;
  }, [walletAddress, getTransactionType]);

  // Decide whether to show connect screen or wallet dashboard
  if (!connected && savedWallets.length === 0 && !walletAddress) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="flex flex-col items-center justify-center space-y-6 text-center">
          <h2 className="text-3xl font-bold tracking-tight">Blockchain Portfolio Manager</h2>
          <p className="text-muted-foreground max-w-md">
            Connect your wallet to track balances, view transactions, send crypto, and interact with dApps.
          </p>
          
          <div className="w-full max-w-md my-8">
            <WalletConnectButton />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-lg mt-8">
            <div className="p-4 border rounded-lg bg-card">
              <h3 className="font-medium mb-2">Portfolio Tracking</h3>
              <p className="text-sm text-muted-foreground">Monitor your crypto balances in real-time</p>
            </div>
            <div className="p-4 border rounded-lg bg-card">
              <h3 className="font-medium mb-2">Send & Receive</h3>
              <p className="text-sm text-muted-foreground">Transfer tokens with ease</p>
            </div>
            <div className="p-4 border rounded-lg bg-card">
              <h3 className="font-medium mb-2">DApp Integration</h3>
              <p className="text-sm text-muted-foreground">Interact with blockchain dApps directly</p>
            </div>
            <div className="p-4 border rounded-lg bg-card">
              <h3 className="font-medium mb-2">Transaction History</h3>
              <p className="text-sm text-muted-foreground">Detailed history of all your activity</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show wallet dashboard with either connected wallet or saved address data
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-3xl font-bold tracking-tight">
                Blockchain Wallet
              </h2>
              <WalletTypeSelector 
                selectedWallet={selectedWalletType} 
                onSelectWallet={setSelectedWalletType} 
              />
              {/* Cache status indicator */}
              {isWalletStale(walletAddress) && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Database className="h-4 w-4 text-orange-500" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Wallet data is stale - click refresh</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            <p className="text-muted-foreground">
              {connected 
                ? `Manage your ${selectedWalletType} assets and dApps` 
                : `Viewing portfolio data for all tracked ${selectedWalletType} wallets`}
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefreshWallet}
              disabled={isRefreshing || !isOnline}
              className="h-9"
            >
              {isRefreshing ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                "Refresh"
              )}
            </Button>
            <WalletConnectButton />
            
            {connected && (
              <Button variant="outline" size="sm" onClick={handleDisconnect} className="h-9">
                Disconnect Wallet
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            {selectedWalletType === "Alephium" && (
              <Tabs defaultValue="portfolio" value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid grid-cols-3 max-w-md mb-6">
                  <TabsTrigger value="portfolio" className="flex items-center gap-2">
                    <ChartLine className="h-4 w-4" />
                    <span>My Portfolio</span>
                  </TabsTrigger>
                  <TabsTrigger value="dapps" className="flex items-center gap-2">
                    <LayoutGrid className="h-4 w-4" />
                    <span>My dApps</span>
                  </TabsTrigger>
                  <TabsTrigger value="alephium" className="flex items-center gap-2">
                    <Blocks className="h-4 w-4" />
                    <span>My Alephium</span>
                  </TabsTrigger>
                </TabsList>

                <AlephiumWalletLayout
                  address={walletAddress}
                  allWallets={savedWallets}
                  isLoggedIn={connected}
                  walletStats={walletStats}
                  isStatsLoading={isStatsLoading}
                  refreshFlag={refreshFlag}
                  setRefreshFlag={setRefreshFlag}
                  activeTab={activeTab}
                />
              </Tabs>
            )}

            {selectedWalletType === "Bitcoin" && (
              <BitcoinWalletLayout address={walletAddress} />
            )}

            {selectedWalletType === "Ergo" && (
              <ErgoWalletLayout address={walletAddress} />
            )}
          </div>

          <div className="space-y-4">
            <WalletManager 
              currentAddress={walletAddress} 
              onSelectWallet={setWalletAddress}
              savedWallets={savedWallets}
              onAddWallet={addWallet}
              onRemoveWallet={removeWallet}
              isWalletStale={isWalletStale}
              onForceRefresh={forceRefreshWallet}
              isOnline={isOnline}
              selectedWalletType={selectedWalletType}
            />
          </div>
        </div>
      </div>
      
      {/* Floating Debug Panel - positioned independently */}
      <FloatingDebugPanel
        savedWallets={savedWallets}
        isOnline={isOnline}
        rateLimitInfo={getRateLimitInfo()}
        cacheStatus={getCacheStatus()}
        onForceRefresh={forceRefreshWallet}
        onRefreshStale={refreshStaleWallets}
        onCleanupCache={cleanupCache}
        enabledForPage="wallets"
      />
    </div>
  );
};

export default WalletsPage;
