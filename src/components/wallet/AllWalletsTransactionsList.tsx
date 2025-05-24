import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUpRight, ArrowDownLeft, ExternalLink, Search, ArrowDownUp, Wallet } from "lucide-react";
import { getAddressTransactions } from "@/lib/api/cachedAlephiumApi";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/lib/utils/toast-replacement";
import { truncateAddress } from "@/lib/utils/formatters";
import { SavedWallet, WalletType } from "@/types/wallet";

interface AllWalletsTransactionsListProps {
  savedWallets: SavedWallet[];
  selectedWalletType: WalletType;
  updateApiStatus?: (isLive: boolean, healthUpdate?: any, errorUpdate?: any) => void;
  apiHealth?: any;
}

interface TransactionWithWallet {
  hash: string;
  blockHash: string;
  timestamp: number;
  inputs: Array<{
    address?: string;
    outputRef?: {
      hint: number;
      key: string;
    };
    unlockScript?: string;
    txHashRef?: string;
    attoAlphAmount?: string;
    amount?: string;
  }>;
  outputs: Array<{
    address: string;
    attoAlphAmount?: string;
    amount?: string;
    hint?: number;
    key?: string;
    tokens?: Array<{
      id: string;
      amount: string;
    }>;
  }>;
  gasAmount?: number;
  gasPrice?: string;
  // Wallet information
  walletAddress: string;
  walletLabel: string;
}

const AllWalletsTransactionsList = ({ 
  savedWallets, 
  selectedWalletType, 
  updateApiStatus, 
  apiHealth 
}: AllWalletsTransactionsListProps) => {
  const [transactions, setTransactions] = useState<TransactionWithWallet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Filter wallets for the selected type (memoized to prevent infinite loops)
  const filteredWallets = useMemo(() => {
    return savedWallets.filter(wallet => wallet.network === selectedWalletType);
  }, [savedWallets, selectedWalletType]);

  useEffect(() => {
    const fetchAllTransactions = async () => {
      if (filteredWallets.length === 0) {
        setTransactions([]);
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      const allTransactions: TransactionWithWallet[] = [];
      
      try {
        // Fetch transactions for each wallet
        for (const wallet of filteredWallets) {
          if (wallet.network === selectedWalletType) {
            try {
              console.log(`[AllWalletsTransactions] Fetching transactions for wallet: ${wallet.label} (${wallet.address})`);
              const walletTransactions = await getAddressTransactions(wallet.address, 50);
              
              // Add wallet information to each transaction
              const transactionsWithWallet = walletTransactions.map(tx => ({
                ...tx,
                walletAddress: wallet.address,
                walletLabel: wallet.label
              }));
              
              allTransactions.push(...transactionsWithWallet);
              console.log(`[AllWalletsTransactions] Fetched ${walletTransactions.length} transactions for ${wallet.label}`);
            } catch (error) {
              console.error(`[AllWalletsTransactions] Error fetching transactions for ${wallet.label}:`, error);
            }
          }
        }
        
        // Remove duplicate transactions (same hash) while preserving wallet information
        // If the same transaction appears for multiple wallets, keep all instances with different wallet info
        const uniqueTransactions = allTransactions.filter((tx, index, array) => {
          // Check if this is the first occurrence of this transaction hash + wallet combination
          return array.findIndex(t => t.hash === tx.hash && t.walletAddress === tx.walletAddress) === index;
        });
        
        // Sort all transactions by timestamp (newest first)
        uniqueTransactions.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        
        setTransactions(uniqueTransactions);
        console.log(`[AllWalletsTransactions] Total aggregated transactions: ${uniqueTransactions.length} (${allTransactions.length - uniqueTransactions.length} duplicates removed)`);
        
        // Update API status if callback provided
        if (updateApiStatus) {
          updateApiStatus(true, { source: 'explorer' }, {});
        }
      } catch (error) {
        console.error('[AllWalletsTransactions] Error fetching transactions:', error);
        
        // Update API status with error if callback provided
        if (updateApiStatus) {
          updateApiStatus(false, { source: 'error' }, { 
            network: error instanceof Error ? error.message : 'Failed to fetch transactions' 
          });
        }
        
        toast.error("Could not fetch transaction history", {
          description: "Please try again later"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAllTransactions();
  }, [filteredWallets]);

  // Helper function to format date
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Helper to determine if transaction is incoming or outgoing for a specific wallet
  const getTransactionType = (tx: TransactionWithWallet) => {
    // If any output is to this wallet address, it's incoming
    const isIncoming = tx.outputs.some(output => output.address === tx.walletAddress);
    // If any input is from this wallet address, it's outgoing
    const isOutgoing = tx.inputs.some(input => input.address === tx.walletAddress);
    
    if (isIncoming && !isOutgoing) return 'received';
    if (isOutgoing) return 'sent';
    return 'unknown';
  };
  
  // Calculate amount transferred to/from the wallet address
  const getTransactionAmount = (tx: TransactionWithWallet) => {
    const type = getTransactionType(tx);
    
    if (type === 'received') {
      // Sum all outputs to this wallet address
      const relevantOutputs = tx.outputs.filter(output => output.address === tx.walletAddress);
      
      const amount = relevantOutputs.reduce((sum, output) => {
        // Handle Alephium API structure: try attoAlphAmount first, then amount
        const outputAmount = output.attoAlphAmount || output.amount || '0';
        return sum + Number(outputAmount);
      }, 0);
      
      return amount / 10**18; // Convert from attoALPH to ALPH
    } else if (type === 'sent') {
      // For sent transactions, calculate the total amount sent to other addresses
      const relevantOutputs = tx.outputs.filter(output => output.address !== tx.walletAddress);
      
      const amount = relevantOutputs.reduce((sum, output) => {
        // Handle Alephium API structure: try attoAlphAmount first, then amount
        const outputAmount = output.attoAlphAmount || output.amount || '0';
        return sum + Number(outputAmount);
      }, 0);
      
      return amount / 10**18; // Convert from attoALPH to ALPH
    }
    
    return 0;
  };
  
  // Get the counterparty address
  const getCounterpartyAddress = (tx: TransactionWithWallet) => {
    const type = getTransactionType(tx);
    
    if (type === 'received') {
      // For received transactions, find the sender from inputs
      const senderInput = tx.inputs.find(input => input.address);
      return senderInput?.address || 'External Address';
    } else if (type === 'sent') {
      // For sent transactions, find the first recipient (non-self output)
      const recipient = tx.outputs.find(output => output.address !== tx.walletAddress);
      return recipient?.address || 'Unknown';
    }
    
    return 'Unknown';
  };

  // Filter and sort transactions
  const filteredTransactions = transactions.filter(tx => {
    const counterparty = getCounterpartyAddress(tx);
    const txType = getTransactionType(tx);
    const walletLabel = tx.walletLabel.toLowerCase();
    const searchLower = searchTerm.toLowerCase();
    
    return (
      tx.hash.toLowerCase().includes(searchLower) ||
      counterparty.toLowerCase().includes(searchLower) ||
      txType.toLowerCase().includes(searchLower) ||
      walletLabel.includes(searchLower)
    );
  });

  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    const timeA = a.timestamp || 0;
    const timeB = b.timestamp || 0;
    return sortDirection === "desc" ? timeB - timeA : timeA - timeB;
  });

  const toggleSortDirection = () => {
    setSortDirection(prev => prev === "desc" ? "asc" : "desc");
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              All Wallets Transaction History
              <Badge variant="secondary" className="text-xs">
                {sortedTransactions.length} transactions
              </Badge>
            </CardTitle>
            <CardDescription>
              Combined activity from {filteredWallets.length} {selectedWalletType} wallet{filteredWallets.length !== 1 ? 's' : ''}
            </CardDescription>
          </div>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search transactions or wallets..." 
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">
              {searchTerm ? "No transactions match your search" : "No transactions found"}
            </p>
            <p className="text-sm">
              {searchTerm ? "Try a different search term" : `No transaction history available for your ${selectedWalletType} wallets`}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Wallet</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead className="hidden sm:table-cell">Address</TableHead>
                  <TableHead className="hidden md:table-cell">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={toggleSortDirection}
                      className="p-0 h-auto font-medium flex items-center gap-1 hover:no-underline"
                    >
                      Date
                      <ArrowDownUp className="h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedTransactions.map((tx) => {
                  const type = getTransactionType(tx);
                  const amount = getTransactionAmount(tx);
                  const counterparty = getCounterpartyAddress(tx);
                  
                  return (
                    <TableRow key={`${tx.walletAddress}-${tx.hash}`} className="hover:bg-muted/40">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex flex-col">
                            <span className="font-medium text-sm">{tx.walletLabel}</span>
                            <span className="text-xs text-muted-foreground font-mono">
                              {truncateAddress(tx.walletAddress)}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {type === 'received' ? (
                            <div className="p-1 rounded-full bg-green-100 dark:bg-green-900/20">
                              <ArrowDownLeft className="h-3.5 w-3.5 text-green-500" />
                            </div>
                          ) : (
                            <div className="p-1 rounded-full bg-blue-100 dark:bg-blue-900/20">
                              <ArrowUpRight className="h-3.5 w-3.5 text-blue-500" />
                            </div>
                          )}
                          <span className="capitalize">{type}</span>
                        </div>
                      </TableCell>
                      <TableCell className={`font-medium ${type === 'received' ? 'text-green-500' : 'text-blue-500'}`}>
                        {type === 'received' ? '+' : '-'} {amount.toFixed(4)} ALPH
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">{truncateAddress(counterparty)}</TableCell>
                      <TableCell className="hidden md:table-cell">{formatDate(tx.timestamp)}</TableCell>
                      <TableCell className="text-right">
                        <a
                          href={`https://explorer.alephium.org/transactions/${tx.hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-primary hover:underline"
                        >
                          View <ExternalLink className="ml-1 h-3 w-3" />
                        </a>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AllWalletsTransactionsList; 