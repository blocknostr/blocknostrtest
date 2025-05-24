import React, { useState, useEffect } from "react";
import { PlusCircle, Trash2, Lock, Database, Clock, Wallet, TrendingUp, TrendingDown, RefreshCw, Search, Filter, MoreVertical, Eye, Star } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/lib/utils/toast-replacement";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import AddressDisplay from "./AddressDisplay";
import { SavedWallet, WalletType } from "@/types/wallet";
import { formatDistanceToNow } from "date-fns";
import { formatCurrency, formatNumber } from "@/lib/utils/formatters";
import { getAddressBalance } from "@/lib/api/cachedAlephiumApi";

interface WalletManagerProps {
  currentAddress: string;
  onSelectWallet: (address: string) => void;
  savedWallets: SavedWallet[];
  onAddWallet: (wallet: Omit<SavedWallet, 'cacheMetadata'>) => void;
  onRemoveWallet: (address: string) => void;
  isWalletStale: (address: string) => boolean;
  onForceRefresh: (address: string) => void;
  isOnline: boolean;
  selectedWalletType: WalletType;
}

const WalletManager: React.FC<WalletManagerProps> = ({ 
  currentAddress, 
  onSelectWallet,
  savedWallets,
  onAddWallet,
  onRemoveWallet,
  isWalletStale,
  onForceRefresh,
  isOnline,
  selectedWalletType
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newAddress, setNewAddress] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [selectedNetwork, setSelectedNetwork] = useState<WalletType>("Alephium");
  const [searchTerm, setSearchTerm] = useState("");
  const [walletBalances, setWalletBalances] = useState<Record<string, number>>({});
  const [loadingBalances, setLoadingBalances] = useState<Record<string, boolean>>({});

  // Fetch balances for wallets
  useEffect(() => {
    const fetchBalances = async () => {
      for (const wallet of savedWallets) {
        if (wallet.network === "Alephium" && !walletBalances[wallet.address] && !loadingBalances[wallet.address]) {
          setLoadingBalances(prev => ({ ...prev, [wallet.address]: true }));
          try {
            const balanceData = await getAddressBalance(wallet.address);
            setWalletBalances(prev => ({ ...prev, [wallet.address]: balanceData.balance || 0 }));
          } catch (error) {
            console.warn(`Failed to fetch balance for ${wallet.address}`);
          } finally {
            setLoadingBalances(prev => ({ ...prev, [wallet.address]: false }));
    }
        }
      }
    };

    fetchBalances();
  }, [savedWallets, walletBalances, loadingBalances]);

  const handleAddWallet = async () => {
    if (!newAddress) {
      toast.error("Please enter a wallet address");
      return;
    }

    // Basic validation based on network
    if (selectedNetwork === "Alephium" && !newAddress.startsWith("1") && !newAddress.startsWith("r")) {
      toast.error("Invalid Alephium address format");
      return;
    }

    if (selectedNetwork === "Bitcoin" && !newAddress.startsWith("1") && !newAddress.startsWith("3") && !newAddress.startsWith("bc1")) {
      toast.error("Invalid Bitcoin address format");
      return;
    }

    // Check if wallet already exists
    if (savedWallets.some(wallet => wallet.address === newAddress)) {
      toast.error("This wallet is already in your list");
      return;
    }

    // Add the new wallet using cache system
    const label = newLabel.trim() || `${selectedNetwork} Wallet ${savedWallets.length + 1}`;
    onAddWallet({
      address: newAddress,
      label,
      dateAdded: Date.now(),
      network: selectedNetwork,
      isWatchOnly: true
    });

    setNewAddress("");
    setNewLabel("");
    setIsAdding(false);

    // Select the new wallet
    onSelectWallet(newAddress);
  };

  const handleRemoveWallet = (address: string) => {
    // Prevent removing the last wallet
    if (savedWallets.length <= 1) {
      toast.error("You must keep at least one wallet for tracking");
      return;
    }
    
    onRemoveWallet(address);
    
    // If removing the currently selected wallet, select another one
    if (address === currentAddress && savedWallets.length > 1) {
      const nextWallet = savedWallets.find(wallet => wallet.address !== address);
      if (nextWallet) {
        onSelectWallet(nextWallet.address);
      }
    }
  };

  const handleSelectWallet = (address: string) => {
    onSelectWallet(address);
  };

  const getWalletStatus = (wallet: SavedWallet) => {
    if (!isOnline) return { status: "offline", color: "bg-gray-500", text: "Offline" };
    if (!wallet.cacheMetadata) return { status: "unknown", color: "bg-gray-400", text: "Unknown" };
    
    const isStale = isWalletStale(wallet.address);
    if (isStale) {
      return { status: "stale", color: "bg-orange-500", text: "Stale" };
    }
    
    return { status: "fresh", color: "bg-green-500", text: "Fresh" };
  };

  const getNetworkColor = (network: WalletType) => {
    switch (network) {
      case "Bitcoin": return "from-orange-500 to-orange-600";
      case "Alephium": return "from-gray-900 to-black";
      case "Ergo": return "from-green-500 to-green-600";
      default: return "from-gray-500 to-gray-600";
    }
  };

  const getNetworkIcon = (network: WalletType) => {
    return <Wallet className="h-3 w-3" />;
  };

  // Filter wallets based on search, network filter, and selected wallet type
  const filteredWallets = savedWallets.filter(wallet => {
    const matchesSearch = wallet.label.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         wallet.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSelectedType = wallet.network === selectedWalletType; // Only show wallets for current blockchain
    
    return matchesSearch && matchesSelectedType;
  });

  // Debug logging for wallet filtering
  useEffect(() => {
    console.log("[WalletManager] Filtering wallets:", {
      selectedWalletType,
      totalWallets: savedWallets.length,
      filteredWallets: filteredWallets.length,
      searchTerm,
      allWallets: savedWallets.map(w => ({ label: w.label, network: w.network, address: w.address.substring(0, 8) })),
      filtered: filteredWallets.map(w => ({ label: w.label, network: w.network, address: w.address.substring(0, 8) }))
    });
  }, [savedWallets, filteredWallets, selectedWalletType, searchTerm]);

  const totalBalance = Object.entries(walletBalances)
    .filter(([address]) => savedWallets.find(w => w.address === address && w.network === selectedWalletType))
    .reduce((sum, [, balance]) => sum + balance, 0);

  const WalletCard = ({ wallet }: { wallet: SavedWallet }) => {
    const isSelected = wallet.address === currentAddress;
    const status = getWalletStatus(wallet);
    const balance = walletBalances[wallet.address] || 0;
    const isLoadingBalance = loadingBalances[wallet.address];

    return (
      <div 
        className={`group relative p-3 rounded-xl border transition-all duration-200 cursor-pointer min-h-[80px] ${
          isSelected 
            ? 'bg-primary/10 border-primary/30 shadow-lg shadow-primary/20' 
            : 'bg-card/50 border-border/50 hover:bg-card/80 hover:border-border hover:shadow-md'
        }`}
        onClick={() => handleSelectWallet(wallet.address)}
      >
        {/* Fixed upper right corner elements */}
        <div className="absolute top-2 right-2 flex items-center gap-1 z-10">
          <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gradient-to-r ${getNetworkColor(wallet.network)} text-white text-[10px] font-medium`}>
            {getNetworkIcon(wallet.network)}
            {wallet.network}
          </div>
          <div className={`h-2 w-2 rounded-full ${status.color} animate-pulse`}></div>
        </div>

        {/* Horizontal layout */}
        <div className="flex items-start justify-between gap-3 pt-6">
          {/* Left side - Wallet info */}
          <div className="flex-grow min-w-0 space-y-1">
            {/* Wallet name row */}
            <div className="font-semibold text-sm truncate pr-2">{wallet.label}</div>
            
            <div className="text-xs text-muted-foreground font-mono truncate pr-2">
              {wallet.address.substring(0, 8)}...{wallet.address.substring(wallet.address.length - 6)}
            </div>
          </div>
          
          {/* Right side - Balance display */}
          {wallet.network === "Alephium" && (
            <div className="flex-shrink-0 text-right space-y-0.5 min-w-[100px]">
              {isLoadingBalance ? (
                <div className="h-4 w-16 bg-muted animate-pulse rounded ml-auto"></div>
              ) : (
                <>
                  <div className="font-bold text-sm">{formatNumber(balance, 2)} ALPH</div>
                  <div className="text-xs text-muted-foreground">
                    ≈ {formatCurrency(balance * 0.5)}
                  </div>
                </>
              )}
              {wallet.cacheMetadata && (
                <div className="text-[9px] text-muted-foreground leading-tight">
                  Updated {formatDistanceToNow(wallet.cacheMetadata.lastRefresh)} ago
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                onForceRefresh(wallet.address);
              }}>
                <RefreshCw className="h-3 w-3 mr-2" />
                Refresh Data
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(wallet.address);
                toast.success("Address copied!");
              }}>
                <Eye className="h-3 w-3 mr-2" />
                Copy Address
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveWallet(wallet.address);
                }}
                className="text-destructive"
              >
                <Trash2 className="h-3 w-3 mr-2" />
                Remove Wallet
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Selection indicator */}
        {isSelected && (
          <div className="absolute inset-0 rounded-xl border-2 border-primary pointer-events-none"></div>
        )}
      </div>
    );
  };

  return (
    <Card className="h-full flex flex-col bg-gradient-to-br from-card/80 to-card/40 border-primary/10">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              {selectedWalletType} Wallets 
              <Badge variant="secondary" className="text-xs">{filteredWallets.length}</Badge>
            </CardTitle>
            <CardDescription className="text-sm">
              {selectedWalletType === "Alephium" ? formatCurrency(totalBalance * 0.5) + " total value" : "Manage your " + selectedWalletType + " wallets"} • {isOnline ? "🟢 Online" : "🔴 Offline"}
            </CardDescription>
          </div>
          <Button 
            variant="default" 
            size="sm" 
            onClick={() => setIsAdding(!isAdding)} 
            className="h-8 w-8 p-0"
            title="Add Wallet"
          >
            <PlusCircle className="h-4 w-4" />
          </Button>
        </div>

        {/* Search and filters */}
        <div className="flex gap-2 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <Input 
              placeholder={`Search ${selectedWalletType} wallets...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-7 h-8 text-xs"
            />
          </div>
          <div className={`h-8 px-3 text-xs rounded border bg-gradient-to-r ${getNetworkColor(selectedWalletType)} text-white flex items-center gap-1 font-medium`}>
            {getNetworkIcon(selectedWalletType)}
            {selectedWalletType} Only
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-grow overflow-hidden flex flex-col p-4">
        {/* Add wallet form */}
        {isAdding && (
          <div className="rounded-xl bg-muted/50 p-4 space-y-3 mb-4 border">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-xs font-medium">Network</label>
                <select 
                  value={selectedNetwork}
                  onChange={(e) => setSelectedNetwork(e.target.value as WalletType)}
                  className="w-full h-8 text-xs rounded border bg-background px-2"
                  title="Select blockchain network"
                >
                  <option value="Alephium">Alephium</option>
                  <option value="Bitcoin">Bitcoin</option>
                  <option value="Ergo">Ergo</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium">Label</label>
                <Input 
                  placeholder="Wallet nickname" 
                  value={newLabel} 
                  onChange={(e) => setNewLabel(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium">Address</label>
            <Input 
                placeholder={`Enter ${selectedNetwork} address`}
              value={newAddress}
              onChange={(e) => setNewAddress(e.target.value)}
              className="h-8 text-xs"
            />
            </div>
            <div className="flex justify-end gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsAdding(false)}
                className="h-7 text-xs"
              >
                Cancel
              </Button>
              <Button 
                variant="default" 
                size="sm" 
                onClick={handleAddWallet}
                className="h-7 text-xs"
              >
                Add Wallet
              </Button>
            </div>
          </div>
        )}

        {/* Wallets grid */}
        <div className="flex-grow overflow-y-auto pr-1">
          {filteredWallets.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm font-medium">No {selectedWalletType} wallets found</p>
              <p className="text-xs">
                {selectedWalletType === "Bitcoin" 
                  ? "Connect your Bitcoin wallet or add a Bitcoin address to get started"
                  : selectedWalletType === "Ergo"
                  ? "Connect your Ergo wallet or add an Ergo address to get started" 
                  : "Connect your Alephium extension wallet or add an address to get started"
                }
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredWallets.map((wallet) => (
                <WalletCard key={wallet.address} wallet={wallet} />
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default WalletManager;

