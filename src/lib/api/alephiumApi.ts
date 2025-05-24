import { NodeProvider } from '@alephium/web3';
import { getTokenMetadata, fetchTokenList, getFallbackTokenData, formatTokenAmount } from './tokenMetadata';
import { formatNumber } from '@/lib/utils/formatters';
<<<<<<< HEAD
import { detectLPToken, getTokenDisplayInfo } from './lpTokenDetection';
// Removed complex DEX pricing imports - now using simplified Mobula API pricing


/**
 * Token Metadata Cache
 * Caches token metadata with indefinite TTL until manually refreshed
 */
class TokenMetadataCache {
  private cacheKey = 'alephium_token_metadata_cache';
  private memoryCache: Record<string, any> = {};

  /**
   * Get cached metadata for a token
   */
  getMetadata(tokenId: string): any | null {
    // Check memory cache first
    if (this.memoryCache[tokenId]) {
      console.log(`[Token Cache] Memory cache hit for ${tokenId}`);
      return this.memoryCache[tokenId];
    }

    // Check localStorage
    try {
      const cached = localStorage.getItem(`${this.cacheKey}_${tokenId}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        console.log(`[Token Cache] LocalStorage cache hit for ${tokenId}`);
        // Store in memory cache for faster access
        this.memoryCache[tokenId] = parsed;
        return parsed;
      }
    } catch (error) {
      console.warn(`[Token Cache] Error reading cache for ${tokenId}:`, error);
    }

    return null;
  }

  /**
   * Cache metadata for a token
   */
  setMetadata(tokenId: string, metadata: any): void {
    try {
      const cacheData = {
        ...metadata,
        cachedAt: Date.now(),
        source: 'cache'
      };

      // Store in memory cache
      this.memoryCache[tokenId] = cacheData;

      // Store in localStorage
      localStorage.setItem(`${this.cacheKey}_${tokenId}`, JSON.stringify(cacheData));
      
      console.log(`[Token Cache] Cached metadata for ${tokenId}`);
    } catch (error) {
      console.warn(`[Token Cache] Error caching metadata for ${tokenId}:`, error);
    }
  }

  /**
   * Clear cache for a specific token
   */
  clearToken(tokenId: string): void {
    delete this.memoryCache[tokenId];
    try {
      localStorage.removeItem(`${this.cacheKey}_${tokenId}`);
      console.log(`[Token Cache] Cleared cache for ${tokenId}`);
    } catch (error) {
      console.warn(`[Token Cache] Error clearing cache for ${tokenId}:`, error);
    }
  }

  /**
   * Clear all cached token metadata
   */
  clearAll(): void {
    this.memoryCache = {};
    try {
      // Get all localStorage keys that match our cache pattern
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.cacheKey)) {
          keysToRemove.push(key);
        }
      }
      
      // Remove all matching keys
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      console.log(`[Token Cache] Cleared all cached metadata (${keysToRemove.length} items)`);
    } catch (error) {
      console.warn(`[Token Cache] Error clearing all cache:`, error);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): { totalCached: number; memoryCount: number; cacheKeys: string[] } {
    const memoryCount = Object.keys(this.memoryCache).length;
    const cacheKeys = [];
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.cacheKey)) {
          cacheKeys.push(key.replace(`${this.cacheKey}_`, ''));
        }
      }
    } catch (error) {
      console.warn(`[Token Cache] Error getting cache stats:`, error);
    }

    return {
      totalCached: cacheKeys.length,
      memoryCount,
      cacheKeys
    };
  }
}

// Initialize the token metadata cache
const tokenMetadataCache = new TokenMetadataCache();
=======
>>>>>>> origin/main

// Initialize the node provider with the mainnet node
const nodeProvider = new NodeProvider('https://node.mainnet.alephium.org');

/**
 * Gets the balance for a specific address in ALPH (not nanoALPH)
 */
export const getAddressBalance = async (address: string): Promise<{
  balance: number;
  lockedBalance: number;
  utxoNum: number;
}> => {
  try {
    const result = await nodeProvider.addresses.getAddressesAddressBalance(address);
    
    return {
      balance: Number(result.balance) / 10**18,
      lockedBalance: Number(result.lockedBalance) / 10**18,
      utxoNum: result.utxoNum
    };
  } catch (error) {
    console.error('Error fetching address balance:', error);
    throw error;
  }
};

/**
<<<<<<< HEAD
 * Gets transaction history for an address using the Alephium Explorer Backend API
 * Falls back to UTXO-based simplified transactions if Explorer Backend is unavailable
 */
export const getAddressTransactions = async (address: string, limit = 20) => {
  try {
    console.log(`[Explorer Backend] Fetching transaction history for ${address}, limit: ${limit}`);
    
    // Try to use the Explorer Backend API first (more reliable transaction data)
    const EXPLORER_BACKEND_BASE_URL = 'https://backend.mainnet.alephium.org';
    
    try {
      const explorerUrl = `${EXPLORER_BACKEND_BASE_URL}/addresses/${address}/transactions?page=1&limit=${limit}`;
      console.log(`[Explorer Backend] Fetching from: ${explorerUrl}`);
      
      const response = await fetch(explorerUrl);
      
      if (response.ok) {
        const data = await response.json();
        
        // The Explorer backend returns transactions with much richer data
        const transactions = data.map((tx: any) => ({
          hash: tx.hash,
          blockHash: tx.blockHash,
          timestamp: tx.timestamp,
          inputs: tx.inputs || [],
          outputs: tx.outputs || [],
          gasAmount: tx.gasAmount,
          gasPrice: tx.gasPrice,
          scriptExecutionOk: tx.scriptExecutionOk !== false, // Default to true if not specified
          tokens: tx.tokens || [] // Include token transfers if any
        }));
        
        console.log(`[Explorer Backend] Successfully fetched ${transactions.length} transactions`);
        return transactions;
      } else {
        console.warn(`[Explorer Backend] HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (explorerError) {
      console.warn(`[Explorer Backend] Failed to fetch from Explorer backend:`, explorerError);
    }
    
    // Fallback to Node API (limited transaction info)
    console.log(`[Node API] Falling back to Node API for transaction history`);
    
    // For now, we'll fetch UTXOs and use them to construct a simplified transaction history
    const response = await nodeProvider.addresses.getAddressesAddressUtxos(address);
    
    // The API returns an object with a 'utxos' property that contains the array we need
=======
 * Gets transaction history for an address
 * This uses a custom implementation since the direct transaction method is not available
 */
export const getAddressTransactions = async (address: string, limit = 20) => {
  try {
    // For now, we'll fetch UTXOs and use them to construct a simplified transaction history
    // In a production app, you might want to use the explorer API or build a more sophisticated solution
    const response = await nodeProvider.addresses.getAddressesAddressUtxos(address);
    
    // The API returns an object with a 'utxos' property that contains the array we need
    // Check if we have the expected structure
>>>>>>> origin/main
    if (!response || !response.utxos || !Array.isArray(response.utxos)) {
      console.warn('Unexpected UTXO response structure:', response);
      return [];
    }
    
    // Transform UTXOs into a simplified transaction history
    const utxoArray = response.utxos;
    const simplifiedTxs = utxoArray.slice(0, limit).map((utxo: any, index: number) => ({
      hash: utxo.ref?.key || `tx-${index}`,
      blockHash: `block-${index}`, // We don't have this info from UTXOs
      timestamp: Date.now() - index * 3600000, // Fake timestamps, newest first
      inputs: [{
        address: 'unknown', // We don't know the sender from just UTXOs
<<<<<<< HEAD
        attoAlphAmount: utxo.amount || '0',
        amount: utxo.amount || '0' // Keep both for compatibility
      }],
      outputs: [{
        address: address,
        attoAlphAmount: utxo.amount || '0',
        amount: utxo.amount || '0', // Keep both for compatibility
        tokens: utxo.tokens || []
      }],
      gasAmount: 20000, // Default gas amount
      gasPrice: "100000000000", // Default gas price
      scriptExecutionOk: true
    }));
    
    console.log(`[Node API] Fallback: Generated ${simplifiedTxs.length} simplified transactions from UTXOs`);
=======
        amount: utxo.amount || '0'
      }],
      outputs: [{
        address: address,
        amount: utxo.amount || '0'
      }],
      // Add tokens information if available
      tokens: utxo.tokens || []
    }));
    
>>>>>>> origin/main
    return simplifiedTxs;
  } catch (error) {
    console.error('Error fetching address transactions:', error);
    throw error;
  }
};

/**
 * Gets UTXOs for an address
 */
export const getAddressUtxos = async (address: string) => {
  try {
    const result = await nodeProvider.addresses.getAddressesAddressUtxos(address);
    return result;
  } catch (error) {
    console.error('Error fetching address UTXOs:', error);
    throw error;
  }
};

/**
 * Token interface with rich metadata
 */
export interface EnrichedToken {
  id: string;
  amount: string; // Changed from number to string to handle large values correctly
  name: string;
  nameOnChain?: string;
  symbol: string;
  symbolOnChain?: string;
  decimals: number;
  logoURI?: string;
  description?: string;
  formattedAmount: string;
  isNFT: boolean;
  tokenURI?: string;
  imageUrl?: string;
  attributes?: any[];
<<<<<<< HEAD
  // Pricing properties
  usdValue?: number;
  tokenPrice?: number;
  priceSource?: 'market' | 'estimate';
  // LP Token support
  isLPToken?: boolean;
  dexProtocol?: string;
  underlyingTokens?: string[];
  poolInfo?: {
    token0: string;
    token1: string;
    token0Symbol: string;
    token1Symbol: string;
    poolAddress: string;
  };
}

/**
 * Checks if a token is an NFT using Alephium's official SDK methods
 * This replaces our heuristic-based approach with the official NFT detection
 */
const isLikelyNFT = async (tokenId: string) => {
  try {
    console.log(`[Official NFT Detection] Checking token ${tokenId} using SDK methods`);
    
    // Use the official SDK method to determine if this is an NFT
    const tokenType = await nodeProvider.guessStdTokenType(tokenId);
    const isNFT = tokenType === 'non-fungible';
    
    console.log(`[Official NFT Detection] Token ${tokenId} type: ${tokenType}, isNFT: ${isNFT}`);
    return isNFT;
  } catch (error) {
    console.error(`[Official NFT Detection] Error checking token ${tokenId}:`, error);
    
    // Fallback to basic heuristics if the official method fails
    // Check if the error suggests the token might be an NFT but the method failed
    if (error.message && error.message.includes('not found')) {
      console.log(`[Official NFT Detection] Token ${tokenId} not found, likely not an NFT`);
      return false;
    }
    
    // For any other error, assume it's not an NFT to be safe
    console.log(`[Official NFT Detection] Defaulting to false for token ${tokenId} due to error`);
    return false;
  }
};

/**
 * Checks if a contract is an NFT Collection using Alephium's official SDK methods
 */
const isNFTCollection = async (contractId: string) => {
  try {
    console.log(`[NFT Collection Detection] Checking if ${contractId} is an NFT collection`);
    
    // Use the official SDK method to check if this follows NFT Collection standard
    const isCollection = await nodeProvider.guessFollowsNFTCollectionStd(contractId);
    
    console.log(`[NFT Collection Detection] Contract ${contractId} isNFTCollection: ${isCollection}`);
    return isCollection;
  } catch (error) {
    console.error(`[NFT Collection Detection] Error checking contract ${contractId}:`, error);
    return false;
  }
};

/**
 * Fetch NFT metadata using official Alephium SDK methods
 * Falls back to manual fetching if needed
 */
const fetchNFTMetadata = async (tokenId: string) => {
  try {
    console.log(`[Official NFT Metadata] Fetching metadata for token ${tokenId} using SDK`);
    
    // Use the official SDK method to fetch NFT metadata
    const nftMetadata = await nodeProvider.fetchNFTMetaData(tokenId);
    
    console.log(`[Official NFT Metadata] Raw metadata from SDK:`, nftMetadata);
    
    // The SDK returns metadata with tokenUri and collectionId
    if (nftMetadata && nftMetadata.tokenUri) {
      // Fetch the actual metadata from the token URI
      const metadataResponse = await fetchMetadataFromURI(nftMetadata.tokenUri);
      
      return {
        ...metadataResponse,
        tokenUri: nftMetadata.tokenUri,
        collectionId: nftMetadata.collectionId
      };
    }
    
    return nftMetadata;
  } catch (error) {
    // Reduce noise for expected NFT metadata fetch failures
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
      console.debug(`[Official NFT Metadata] Network error for ${tokenId}: ${errorMessage}`);
    } else {
      console.warn(`[Official NFT Metadata] Error fetching official metadata for ${tokenId}:`, errorMessage);
    }
    
    // Fallback to manual detection (this might not work for many tokens)
    return null;
  }
};

/**
 * Decodes hex-encoded strings to UTF-8 text
 * The Alephium SDK sometimes returns hex-encoded names and symbols
 */
const decodeHexString = (hexString: string): string => {
  try {
    // Remove '0x' prefix if present
    const cleanHex = hexString.startsWith('0x') ? hexString.slice(2) : hexString;
    
    // Check if it's a valid hex string
    if (!/^[0-9A-Fa-f]*$/.test(cleanHex)) {
      return hexString; // Return as-is if not valid hex
    }
    
    // Convert hex to bytes and then to string
    const bytes = [];
    for (let i = 0; i < cleanHex.length; i += 2) {
      bytes.push(parseInt(cleanHex.substr(i, 2), 16));
    }
    
    // Convert bytes to UTF-8 string
    const decoded = new TextDecoder('utf-8').decode(new Uint8Array(bytes));
    
    // Return decoded string if it contains printable characters, otherwise return original
    return /^[\x20-\x7E]*$/.test(decoded) ? decoded : hexString;
  } catch (error) {
    console.warn(`[Hex Decoder] Failed to decode hex string ${hexString}:`, error);
    return hexString; // Return original if decoding fails
  }
};

/**
 * Fetch fungible token metadata using official Alephium SDK methods
 * This is the canonical way to get token metadata directly from the blockchain
 * Now includes caching with indefinite TTL
 */
const fetchFungibleTokenMetadata = async (tokenId: string, useCache: boolean = true) => {
  try {
    // Check cache first if enabled
    if (useCache) {
      const cachedMetadata = tokenMetadataCache.getMetadata(tokenId);
      if (cachedMetadata) {
        console.log(`[Official Token Metadata] Using cached metadata for ${tokenId}`);
        return cachedMetadata;
      }
    }

    console.log(`[Official Token Metadata] Fetching fresh metadata for token ${tokenId} using SDK`);
    
    // Use the official SDK method to fetch fungible token metadata
    const metadata = await nodeProvider.fetchFungibleTokenMetaData(tokenId);
    
    console.log(`[Official Token Metadata] Raw metadata from SDK:`, metadata);
    
    // Decode hex-encoded names and symbols
    const decodedName = metadata.name ? decodeHexString(metadata.name) : `Token (${tokenId.substring(0, 6)}...)`;
    const decodedSymbol = metadata.symbol ? decodeHexString(metadata.symbol) : `TKN-${tokenId.substring(0, 4)}`;
    
    console.log(`[Official Token Metadata] Decoded metadata for ${tokenId}:`, {
      originalName: metadata.name,
      decodedName,
      originalSymbol: metadata.symbol,
      decodedSymbol,
      decimals: metadata.decimals
    });
    
    const processedMetadata = {
      id: tokenId,
      name: decodedName,
      symbol: decodedSymbol,
      decimals: Number(metadata.decimals) || 0,
      totalSupply: metadata.totalSupply,
      rawName: metadata.name, // Store original hex for reference
      rawSymbol: metadata.symbol // Store original hex for reference
    };

    // Cache the processed metadata
    if (useCache) {
      tokenMetadataCache.setMetadata(tokenId, processedMetadata);
    }
    
    return processedMetadata;
  } catch (error) {
    console.error(`[Official Token Metadata] Error fetching official metadata for ${tokenId}:`, error);
    return null;
  }
};

/**
 * Helper function to fetch metadata from a URI (extracted from the original fetchNFTMetadata)
 * Enhanced to handle various NFT metadata standards and image formats
 */
const fetchMetadataFromURI = async (tokenURI: string) => {
  if (!tokenURI) return null;
  
  try {
    console.log(`[NFT Metadata] Fetching metadata from URI: ${tokenURI}`);
    
    // Enhanced IPFS link conversion with multiple gateways
    let formattedURI = tokenURI;
    if (tokenURI.startsWith('ipfs://')) {
      const ipfsHash = tokenURI.substring(7);
      // Try multiple IPFS gateways for better reliability
      const ipfsGateways = [
        `https://ipfs.io/ipfs/${ipfsHash}`,
        `https://gateway.pinata.cloud/ipfs/${ipfsHash}`,
        `https://cloudflare-ipfs.com/ipfs/${ipfsHash}`,
        `https://dweb.link/ipfs/${ipfsHash}`
      ];
      formattedURI = ipfsGateways[0]; // Start with ipfs.io
    } else if (tokenURI.startsWith('ipfs/')) {
      const ipfsHash = tokenURI.substring(5);
      formattedURI = `https://ipfs.io/ipfs/${ipfsHash}`;
    }
    
    console.log(`[NFT Metadata] Formatted URI: ${formattedURI}`);
    
    const response = await fetch(formattedURI, {
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Cache-Control': 'no-cache'
      },
      mode: 'cors',
      // Add timeout to prevent hanging requests
      signal: AbortSignal.timeout ? AbortSignal.timeout(15000) : undefined
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch metadata: ${response.status} ${response.statusText}`);
    }
    
    const metadata = await response.json();
    console.log(`[NFT Metadata] Raw metadata:`, metadata);
    
    // Enhanced image URL processing to handle various field names and formats
    let imageUrl = null;
    const possibleImageFields = [
      'image', 'image_url', 'imageUrl', 'imageURI', 'image_uri',
      'picture', 'avatar', 'logo', 'icon', 'media', 'artwork',
      'animation_url', 'animationUrl' // For animated NFTs
    ];
    
    for (const field of possibleImageFields) {
      if (metadata[field]) {
        imageUrl = metadata[field];
        break;
      }
    }
    
    // Process the image URL if found
    if (imageUrl) {
      // Convert IPFS image URLs to HTTP gateways
      if (imageUrl.startsWith('ipfs://')) {
        const ipfsHash = imageUrl.substring(7);
        imageUrl = `https://ipfs.io/ipfs/${ipfsHash}`;
      } else if (imageUrl.startsWith('ipfs/')) {
        const ipfsHash = imageUrl.substring(5);
        imageUrl = `https://ipfs.io/ipfs/${ipfsHash}`;
      }
      
      console.log(`[NFT Metadata] Processed image URL: ${imageUrl}`);
      metadata.processedImageUrl = imageUrl;
    }
    
    // Enhanced attribute processing
    if (metadata.attributes && Array.isArray(metadata.attributes)) {
      console.log(`[NFT Metadata] Found ${metadata.attributes.length} attributes`);
    }
    
    return {
      ...metadata,
      imageUrl: imageUrl || metadata.image || metadata.imageUrl // Ensure we have the processed image URL
    };
  } catch (error) {
    // Only log detailed errors for debugging purposes, not network errors
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Reduce noise for common network issues
    if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError') || errorMessage.includes('CORS')) {
      console.debug(`[NFT Metadata] Network error fetching ${tokenURI.substring(0, 50)}...: ${errorMessage}`);
    } else {
      console.warn(`[NFT Metadata] Error fetching metadata from ${tokenURI}:`, error);
    }
    
    // If the primary gateway fails, try alternative IPFS gateways
    if (tokenURI.startsWith('ipfs://')) {
      const ipfsHash = tokenURI.substring(7);
      const alternativeGateways = [
        `https://gateway.pinata.cloud/ipfs/${ipfsHash}`,
        `https://cloudflare-ipfs.com/ipfs/${ipfsHash}`,
        `https://dweb.link/ipfs/${ipfsHash}`
      ];
      
      let lastError = error;
      for (const gateway of alternativeGateways) {
        try {
          console.debug(`[NFT Metadata] Trying alternative gateway: ${gateway.substring(0, 60)}...`);
          const response = await fetch(gateway, {
            headers: { 'Accept': 'application/json' },
            mode: 'cors',
            // Add timeout to prevent hanging
            signal: AbortSignal.timeout ? AbortSignal.timeout(10000) : undefined
          });
          
          if (response.ok) {
            const metadata = await response.json();
            console.log(`[NFT Metadata] ✓ Successfully fetched from alternative gateway`);
            
            // Process image URL from alternative gateway response
            let imageUrl = metadata.image || metadata.image_url || metadata.imageUrl;
            if (imageUrl && imageUrl.startsWith('ipfs://')) {
              const imgHash = imageUrl.substring(7);
              imageUrl = `https://ipfs.io/ipfs/${imgHash}`;
            }
            
            return {
              ...metadata,
              imageUrl: imageUrl || metadata.image || metadata.imageUrl
            };
          }
        } catch (gatewayError) {
          lastError = gatewayError;
          console.debug(`[NFT Metadata] Alternative gateway failed: ${gatewayError instanceof Error ? gatewayError.message : String(gatewayError)}`);
          continue;
        }
      }
      
      // If all gateways failed, log a summary instead of individual errors
      console.warn(`[NFT Metadata] All gateways failed for IPFS hash ${ipfsHash}. Last error:`, lastError instanceof Error ? lastError.message : String(lastError));
    }
    
=======
  // Add the missing properties that are used in TokenList.tsx
  usdValue?: number;
  tokenPrice?: number;
}

/**
 * Checks if a token is likely an NFT based on its properties
 */
const isLikelyNFT = (token: any) => {
  // Check for standard NFT properties
  if (token.standard && ['INFT', 'NFT', 'ERC721', 'ERC1155'].includes(token.standard)) {
    return true;
  }
  
  // Check for common NFT indicators in the token ID or symbol
  if ((token.symbol && /NFT|TOKEN|COIN|COLLECTION/i.test(token.symbol)) || 
      (token.name && /NFT|TOKEN|COIN|COLLECTION/i.test(token.name))) {
    return true;
  }
  
  // Check if the token appears to be non-fungible based on its amount
  if (token.amount === "1" || token.amount === 1) {
    return true;
  }
  
  return false;
};

/**
 * Fetch basic NFT metadata from token URI if available
 */
const fetchNFTMetadata = async (tokenURI?: string) => {
  if (!tokenURI) return null;
  
  try {
    // If token URI is an IPFS link, convert to HTTP gateway
    const formattedURI = tokenURI.startsWith('ipfs://')
      ? `https://ipfs.io/ipfs/${tokenURI.substring(7)}`
      : tokenURI;
    
    const response = await fetch(formattedURI);
    if (!response.ok) throw new Error(`Failed to fetch metadata: ${response.status}`);
    
    const metadata = await response.json();
    return metadata;
  } catch (error) {
    console.error('Error fetching NFT metadata:', error);
>>>>>>> origin/main
    return null;
  }
};

/**
<<<<<<< HEAD
 * Calculate USD values and token prices using simplified pricing service
 * Primary: Mobula API, Fallback: CoinGecko for specific tokens
 */


/**
=======
>>>>>>> origin/main
 * Gets token balances for an address by checking UTXOs
 * and enriches them with metadata from the token list
 */
export const getAddressTokens = async (address: string): Promise<EnrichedToken[]> => {
  try {
    // Fetch token metadata first
    const tokenMetadataMap = await fetchTokenList();
    console.log("Token metadata map:", tokenMetadataMap);
    
    // Get all UTXOs for the address
    const response = await getAddressUtxos(address);
    
    // Extract token information from UTXOs
    const tokenMap: Record<string, EnrichedToken> = {};
    
    // Check if we have the expected structure
    if (!response || !response.utxos || !Array.isArray(response.utxos)) {
      console.warn('Unexpected UTXO response structure:', response);
      return [];
    }
    
    const utxoArray = response.utxos;
    
    for (const utxo of utxoArray) {
      if (utxo.tokens && utxo.tokens.length > 0) {
        for (const token of utxo.tokens) {
          const tokenId = token.id;
          
          if (!tokenMap[tokenId]) {
<<<<<<< HEAD
            // STEP 1: Use official SDK to determine token type
            console.log(`[Token Processing] Processing token ${tokenId} using official SDK methods`);
            const nftStatus = await isLikelyNFT(tokenId);
            
            // STEP 2: Get metadata based on token type
            let tokenMetadata;
            let officialMetadata = null;
            let metadataSource = 'fallback';
            
            if (nftStatus) {
              console.log(`[Token Processing] Token ${tokenId} is NFT - using NFT metadata`);
              // For NFTs, we'll handle metadata separately in the NFT processing section
              tokenMetadata = tokenMetadataMap[tokenId] || getFallbackTokenData(tokenId);
              metadataSource = tokenMetadataMap[tokenId] ? 'token-list' : 'fallback';
            } else {
              console.log(`[Token Processing] Token ${tokenId} is fungible - fetching official metadata`);
              // For fungible tokens, try to get official metadata first
              officialMetadata = await fetchFungibleTokenMetadata(tokenId);
              
              if (officialMetadata) {
                console.log(`[Token Processing] Official metadata found for ${tokenId}:`, officialMetadata);
                tokenMetadata = {
                  ...officialMetadata,
                  logoURI: tokenMetadataMap[tokenId]?.logoURI, // Keep logo from token list if available
                  description: tokenMetadataMap[tokenId]?.description || officialMetadata.description
                };
                metadataSource = 'official-sdk';
              } else {
                console.log(`[Token Processing] No official metadata for ${tokenId}, using token list fallback`);
                tokenMetadata = tokenMetadataMap[tokenId] || getFallbackTokenData(tokenId);
                metadataSource = tokenMetadataMap[tokenId] ? 'token-list' : 'fallback';
              }
            }
            
            // Check if this is an LP token (pass NFT status to prevent false positives)
            const lpInfo = await detectLPToken(tokenId, tokenMetadata, nftStatus);
            const displayInfo = await getTokenDisplayInfo(tokenId, tokenMetadata, nftStatus);
            
            // Process initial image URL from basic metadata
            let initialImageUrl = null;
            
            if (nftStatus) {
              // For NFTs, only use NFT-specific image sources, NOT logoURI (which is for regular tokens)
              initialImageUrl = tokenMetadata.image || tokenMetadata.imageUrl;
              console.log(`[NFT Processing] NFT ${tokenId} - using NFT image sources only: ${initialImageUrl}`);
            } else {
              // For regular tokens, use logoURI
              initialImageUrl = tokenMetadata.logoURI || tokenMetadata.image || tokenMetadata.imageUrl;
            }
            
            // Convert IPFS URLs to HTTP gateways at the initial level
            if (initialImageUrl) {
              if (initialImageUrl.startsWith('ipfs://')) {
                const ipfsHash = initialImageUrl.substring(7);
                initialImageUrl = `https://ipfs.io/ipfs/${ipfsHash}`;
              } else if (initialImageUrl.startsWith('ipfs/')) {
                const ipfsHash = initialImageUrl.substring(5);
                initialImageUrl = `https://ipfs.io/ipfs/${ipfsHash}`;
              }
              console.log(`[Token Processing] Processed image URL for ${tokenId}: ${initialImageUrl}`);
            }
=======
            // Get metadata from the token list or use fallback
            const metadata = tokenMetadataMap[tokenId] || getFallbackTokenData(tokenId);
            
            // Check if this token is likely an NFT
            const nftStatus = isLikelyNFT(metadata);
>>>>>>> origin/main
            
            tokenMap[tokenId] = {
              id: tokenId,
              amount: "0",
<<<<<<< HEAD
              name: displayInfo.displayName,
              nameOnChain: tokenMetadata.nameOnChain,
              symbol: displayInfo.displaySymbol,
              symbolOnChain: tokenMetadata.symbolOnChain,
              decimals: tokenMetadata.decimals,
              logoURI: tokenMetadata.logoURI,
              description: tokenMetadata.description,
              formattedAmount: '',
              isNFT: nftStatus,
              tokenURI: tokenMetadata.tokenURI || tokenMetadata.uri,
              imageUrl: initialImageUrl,
              // Initialize USD value and price properties - will be calculated after amount aggregation
              usdValue: undefined,
              tokenPrice: undefined,
              // LP Token properties
              isLPToken: lpInfo.isLPToken,
              dexProtocol: lpInfo.dexProtocol,
              underlyingTokens: lpInfo.underlyingTokens,
              poolInfo: lpInfo.poolInfo ? {
                token0: lpInfo.poolInfo.token0,
                token1: lpInfo.poolInfo.token1,
                token0Symbol: lpInfo.poolInfo.token0Symbol,
                token1Symbol: lpInfo.poolInfo.token1Symbol,
                poolAddress: lpInfo.poolInfo.poolAddress
              } : undefined
            };
            
            // Log the final token metadata for debugging
            console.log(`[Token Processing] Final metadata for ${tokenId}:`, {
              name: tokenMap[tokenId].name,
              symbol: tokenMap[tokenId].symbol,
              decimals: tokenMap[tokenId].decimals,
              isNFT: tokenMap[tokenId].isNFT,
              isLPToken: tokenMap[tokenId].isLPToken,
              source: metadataSource
            });
            
            // Try to fetch enhanced NFT metadata if it's an NFT
            if (nftStatus) {
              console.log(`[NFT Processing] Fetching enhanced metadata for NFT ${tokenId} using official SDK`);
              fetchNFTMetadata(tokenId).then(nftMetadata => {
                if (nftMetadata && tokenMap[tokenId]) {
                  console.log(`[NFT Processing] Enhanced metadata received for ${tokenId}:`, nftMetadata);
                  tokenMap[tokenId].name = nftMetadata.name || tokenMap[tokenId].name;
                  tokenMap[tokenId].description = nftMetadata.description || tokenMap[tokenId].description;
                  // Use the processed image URL from enhanced metadata if available
                  tokenMap[tokenId].imageUrl = nftMetadata.imageUrl || nftMetadata.processedImageUrl || tokenMap[tokenId].imageUrl;
                  tokenMap[tokenId].attributes = nftMetadata.attributes;
                  tokenMap[tokenId].tokenURI = nftMetadata.tokenUri || tokenMap[tokenId].tokenURI;
                  
                  console.log(`[NFT Processing] Final image URL for ${tokenId}: ${tokenMap[tokenId].imageUrl}`);
                }
              }).catch(err => {
                // Reduce noise for expected NFT metadata fetch failures
                const errorMessage = err instanceof Error ? err.message : String(err);
                if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError') || errorMessage.includes('CORS')) {
                  console.debug(`[NFT Processing] Network error fetching enhanced metadata for ${tokenId}: ${errorMessage}`);
                } else {
                  console.warn(`[NFT Processing] Error fetching enhanced metadata for token ${tokenId}:`, errorMessage);
                }
=======
              name: metadata.name,
              nameOnChain: metadata.nameOnChain,
              symbol: metadata.symbol || (nftStatus ? 'NFT' : `TOKEN-${tokenId.substring(0, 6)}`),
              symbolOnChain: metadata.symbolOnChain,
              decimals: metadata.decimals,
              logoURI: metadata.logoURI,
              description: metadata.description,
              formattedAmount: '',
              isNFT: nftStatus,
              tokenURI: metadata.tokenURI || metadata.uri,
              imageUrl: metadata.image || metadata.imageUrl,
              // Initialize the new properties with default values
              usdValue: 0,
              tokenPrice: 0
            };
            
            // Try to fetch additional NFT metadata if it's an NFT
            if (nftStatus && (metadata.tokenURI || metadata.uri)) {
              fetchNFTMetadata(metadata.tokenURI || metadata.uri).then(nftMetadata => {
                if (nftMetadata && tokenMap[tokenId]) {
                  tokenMap[tokenId].name = nftMetadata.name || tokenMap[tokenId].name;
                  tokenMap[tokenId].description = nftMetadata.description || tokenMap[tokenId].description;
                  tokenMap[tokenId].imageUrl = nftMetadata.image || tokenMap[tokenId].imageUrl;
                  tokenMap[tokenId].attributes = nftMetadata.attributes;
                }
              }).catch(err => {
                console.error(`Error fetching metadata for token ${tokenId}:`, err);
>>>>>>> origin/main
              });
            }
          }
          
          // Add the amount as string to avoid precision issues
          tokenMap[tokenId].amount = (BigInt(tokenMap[tokenId].amount) + BigInt(token.amount)).toString();
        }
      }
    }
    
<<<<<<< HEAD
    // RACE CONDITION FIX: Remove pricing calculation from here
    // Pricing is now handled by WalletDashboard to prevent concurrent API calls
    console.log("[Token Processing] ✅ Skipping pricing calculation - handled by WalletDashboard");
    
    // Convert to the final result format without pricing
    const result = Object.values(tokenMap).map(token => ({
      ...token,
      // Pricing properties are initialized but not calculated here (WalletDashboard handles pricing)
      usdValue: undefined,
      tokenPrice: undefined,
      priceSource: undefined,
=======
    // Convert the map to an array and format amounts
    const result = Object.values(tokenMap).map(token => ({
      ...token,
>>>>>>> origin/main
      formattedAmount: token.isNFT 
        ? token.amount // Don't format NFT amounts (they're usually just "1")
        : formatTokenAmount(token.amount, token.decimals)
    }));
    
<<<<<<< HEAD
    // Enhanced logging for token classification results
    const nfts = result.filter(token => token.isNFT);
    const lpTokens = result.filter(token => token.isLPToken);
    const regularTokens = result.filter(token => !token.isNFT && !token.isLPToken);
    
    console.log("=== TOKEN CLASSIFICATION RESULTS (Official SDK) ===");
    console.log(`Total tokens: ${result.length}`);
    console.log(`Regular tokens: ${regularTokens.length}`);
    console.log(`LP tokens: ${lpTokens.length}`);
    console.log(`NFTs: ${nfts.length}`);
    console.log("✅ Tokens ready for pricing by WalletDashboard");
    
    if (regularTokens.length > 0) {
      console.log("Regular tokens with metadata sources:", regularTokens.map(token => ({
        id: token.id,
        name: token.name,
        symbol: token.symbol,
        decimals: token.decimals,
        amount: token.amount,
        formattedAmount: token.formattedAmount
      })));
    }
    
    if (nfts.length > 0) {
      console.log("NFTs detected:", nfts.map(nft => ({
        id: nft.id,
        name: nft.name,
        symbol: nft.symbol,
        amount: nft.amount,
        hasImage: !!nft.imageUrl,
        hasTokenURI: !!nft.tokenURI
      })));
    }
    
    console.log("Enriched tokens with official SDK methods:", result);
=======
    console.log("Enriched tokens with NFT status:", result);
>>>>>>> origin/main
    return result;
  } catch (error) {
    console.error('Error fetching address tokens:', error);
    return [];
  }
};

/**
 * Fetches NFTs owned by an address
 */
export const getAddressNFTs = async (address: string): Promise<EnrichedToken[]> => {
  try {
    // Reuse the getAddressTokens function but filter for NFTs only
    const allTokens = await getAddressTokens(address);
    const nfts = allTokens.filter(token => token.isNFT);
    return nfts;
  } catch (error) {
    console.error('Error fetching address NFTs:', error);
    return [];
  }
};

/**
 * Build and submit a transaction
 */
export const sendTransaction = async (
  fromAddress: string,
  toAddress: string,
  amountInAlph: number,
  signer: any
) => {
  try {
    // Convert ALPH to nanoALPH
    const amountInNanoAlph = (amountInAlph * 10**18).toString();
    
    // Get the from group
    const addressInfo = await nodeProvider.addresses.getAddressesAddressGroup(fromAddress);
    const fromGroup = addressInfo.group;
    
    // Build unsigned transaction
    const unsignedTx = await nodeProvider.transactions.postTransactionsBuild({
      fromPublicKey: signer.publicKey,
      destinations: [{
        address: toAddress,
        attoAlphAmount: amountInNanoAlph
      }]
    });
    
    // Sign the transaction
    const signature = await signer.signTransactionWithSignature(unsignedTx);
    
    // Submit the transaction
    const result = await nodeProvider.transactions.postTransactionsSubmit({
      unsignedTx: unsignedTx.unsignedTx,
      signature: signature
    });
    
    return result;
  } catch (error) {
    console.error('Error sending transaction:', error);
    throw error;
  }
};

/**
 * Fetches balance history for an address
 * This is a simulated function since we don't have real historical data
 */
export const fetchBalanceHistory = async (address: string, days: number = 30) => {
  // In a real application, you would fetch this from an indexer or API
  // For now, we'll generate sample data
  try {
    // Attempt to get current balance
    const currentBalance = await getAddressBalance(address);
    
    // Generate historical data based on current balance
    const data = [];
    const now = new Date();
    let balance = currentBalance.balance * 0.7; // Start at 70% of current balance
    
    for (let i = days; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      // Add some randomness to simulate balance changes
      // More recent days should trend toward the current balance
      const volatility = i / days; // Higher volatility in the past
      const changePercent = (Math.random() - 0.45) * volatility * 0.1;
      balance = balance * (1 + changePercent);
      
      // Final day should be exact current balance
      if (i === 0) {
        balance = currentBalance.balance;
      }
      
      data.push({
        date: date.toISOString().split('T')[0],
        balance: balance.toFixed(4)
      });
    }
    
    return data;
  } catch (error) {
    console.error('Error generating balance history:', error);
    throw error;
  }
};

/**
 * Fetches network statistics from explorer.alephium.org
 * Using similar endpoints as the official explorer
 */
export const fetchNetworkStats = async () => {
  try {
    // First try to get some real data from the node
    const infoResponse = await nodeProvider.infos.getInfosNode();
    const blockflowResponse = await nodeProvider.blockflow.getBlockflowChainInfo({
      fromGroup: 0,
      toGroup: 0
    });
    
    // Use real data when available, but provide reasonable defaults
    const currentHeight = blockflowResponse ? parseInt(String(blockflowResponse.currentHeight || "3752480")) : 3752480;
    
    // Updated API endpoints based on Alephium Explorer GitHub repository
    // The correct Explorer API base URL
    const explorerApiBase = "https://explorer.alephium.org/api";
    
    // Default values in case API calls fail
    let hashRate = "38.2 PH/s";
    let difficulty = "3.51 P";
    let blockTime = "64.0s";
    let totalTransactions = "4.28M";
    let totalSupply = "110.06M ALPH";
    let isLiveData = false; // Flag to indicate if we're using live data
    
    // To track if any API call succeeded
    let anyApiCallSucceeded = false;
    
    // Try to fetch actual network metrics from the Explorer API
    try {
      // Fetch hashrates data using the correct API endpoint
      const hashRateResponse = await fetch(`${explorerApiBase}/hashrates`, {
        headers: { 'Accept': 'application/json' },
        mode: 'cors',
      });
      
      if (hashRateResponse.ok) {
        anyApiCallSucceeded = true;
        const hashRateData = await hashRateResponse.json();
        if (hashRateData && hashRateData.length > 0) {
          // Get the most recent hashrate data
          const latestHashRateData = hashRateData[hashRateData.length - 1];
          hashRate = `${(latestHashRateData.hashrate / 1e15).toFixed(2)} PH/s`;
          difficulty = `${(latestHashRateData.difficulty / 1e15).toFixed(2)} P`;
        }
      }
      
      // Fetch average block time data
      const blockTimeResponse = await fetch(`${explorerApiBase}/block-times`, {
        headers: { 'Accept': 'application/json' },
        mode: 'cors',
      });
      
      if (blockTimeResponse.ok) {
        anyApiCallSucceeded = true;
        const blockTimeData = await blockTimeResponse.json();
        if (blockTimeData && blockTimeData.length > 0) {
          // Get the most recent block time data
          const latestBlockTimeData = blockTimeData[blockTimeData.length - 1];
          blockTime = `${latestBlockTimeData.averageTime.toFixed(1)}s`;
        }
      }
      
      // Fetch supply data
      const supplyResponse = await fetch(`${explorerApiBase}/supply`, {
        headers: { 'Accept': 'application/json' },
        mode: 'cors',
      });
      
      if (supplyResponse.ok) {
        anyApiCallSucceeded = true;
        const supplyData = await supplyResponse.json();
        if (supplyData && supplyData.circulatingSupply) {
          // Format the circulating supply
          const circulatingSupply = supplyData.circulatingSupply / 1e18; // Convert from alph to ALPH
          totalSupply = `${(circulatingSupply / 1e6).toFixed(2)}M ALPH`;
        }
      }
      
      // Fetch total transaction count
      const txCountResponse = await fetch(`${explorerApiBase}/charts/txs`, {
        headers: { 'Accept': 'application/json' },
        mode: 'cors',
      });
      
      if (txCountResponse.ok) {
        anyApiCallSucceeded = true;
        const txCountData = await txCountResponse.json();
        if (txCountData && txCountData.length > 0) {
          // Sum up all transaction counts
          const totalTxs = txCountData.reduce((sum, item) => sum + item.count, 0);
          totalTransactions = totalTxs > 1e6 
            ? `${(totalTxs / 1e6).toFixed(2)}M` 
            : totalTxs > 1e3 
              ? `${(totalTxs / 1e3).toFixed(1)}K` 
              : totalTxs.toString();
        }
      }

      // If any API call was successful, mark data as live
      isLiveData = anyApiCallSucceeded;
    } catch (explorerError) {
      console.error('Error fetching from explorer API:', explorerError);
      // We'll fall back to our default values
      isLiveData = false;
    }
    
    // Fetch the latest blocks information from the node directly
    let latestBlocks = [
      { hash: "0x" + Math.random().toString(16).substring(2, 10) + "...", timestamp: Date.now() - Math.floor(Math.random() * 60000), height: currentHeight, txNumber: Math.floor(Math.random() * 10) + 1 },
      { hash: "0x" + Math.random().toString(16).substring(2, 10) + "...", timestamp: Date.now() - Math.floor(Math.random() * 60000 + 60000), height: currentHeight - 1, txNumber: Math.floor(Math.random() * 8) + 1 },
      { hash: "0x" + Math.random().toString(16).substring(2, 10) + "...", timestamp: Date.now() - Math.floor(Math.random() * 60000 + 120000), height: currentHeight - 2, txNumber: Math.floor(Math.random() * 12) + 1 }
    ];
    
    try {
      // Attempt to fetch real blocks data from the Explorer API
      const blocksResponse = await fetch(`${explorerApiBase}/blocks?page=1&limit=3`, {
        headers: { 'Accept': 'application/json' },
        mode: 'cors',
      });
      
      if (blocksResponse.ok) {
        anyApiCallSucceeded = true;
        isLiveData = true;
        const blocksData = await blocksResponse.json();
        if (blocksData && blocksData.blocks && blocksData.blocks.length > 0) {
          latestBlocks = blocksData.blocks.map(block => ({
            hash: block.hash,
            timestamp: new Date(block.timestamp).getTime(),
            height: block.height,
            txNumber: block.txNumber || 0
          }));
        } else {
          // If we couldn't get real blocks data, update the height at least
          if (blockflowResponse && blockflowResponse.currentHeight) {
            const height = parseInt(String(blockflowResponse.currentHeight));
            latestBlocks = latestBlocks.map((block, index) => ({
              ...block,
              height: height - index
            }));
          }
        }
      }
    } catch (blocksError) {
      console.error('Error fetching latest blocks:', blocksError);
      // We'll use the default/sample blocks above
    }
    
    // Get active addresses count from the explorer API
    let activeAddresses = 193500; // Default value
    
    try {
      const addressCountResponse = await fetch(`${explorerApiBase}/addresses/total`, {
        headers: { 'Accept': 'application/json' },
        mode: 'cors',
      });
      
      if (addressCountResponse.ok) {
        anyApiCallSucceeded = true;
        isLiveData = true;
        const addressData = await addressCountResponse.json();
        if (addressData && typeof addressData.total === 'number') {
          activeAddresses = addressData.total;
        }
      }
    } catch (error) {
      console.error('Error fetching address count:', error);
      // Fall back to default value
    }
    
    // Get token count from the explorer API
    let tokenCount = 385; // Default value
    
    try {
      const tokenCountResponse = await fetch(`${explorerApiBase}/tokens/total`, {
        headers: { 'Accept': 'application/json' },
        mode: 'cors',
      });
      
      if (tokenCountResponse.ok) {
        anyApiCallSucceeded = true;
        isLiveData = true;
        const tokenData = await tokenCountResponse.json();
        if (tokenData && typeof tokenData.total === 'number') {
          tokenCount = tokenData.total;
        }
      }
    } catch (error) {
      console.error('Error fetching token count:', error);
      // Fall back to default value
    }
    
    return {
      hashRate: hashRate,
      difficulty: difficulty,
      blockTime: blockTime,
      activeAddresses: activeAddresses,
      tokenCount: tokenCount,
      totalTransactions: totalTransactions,
      totalSupply: totalSupply,
      totalBlocks: `${(currentHeight / 1000000).toFixed(2)}M`, // Calculated from real height when possible
      latestBlocks: latestBlocks,
      isLiveData: isLiveData // Add the flag to the returned object
    };
  } catch (error) {
    console.error('Error fetching network stats:', error);
    // Return fallback data if we can't connect
    return {
      hashRate: "38.2 PH/s",
      difficulty: "3.51 P",
      blockTime: "64.0s",
      activeAddresses: 193500,
      tokenCount: 385,
      totalTransactions: "4.28M",
      totalSupply: "110.06M ALPH",
      totalBlocks: "3.75M",
      isLiveData: false, // Mark as fallback data
      latestBlocks: [
        { hash: "0xa1b2c3...", timestamp: Date.now() - 60000, height: 3752480, txNumber: 5 },
        { hash: "0xd4e5f6...", timestamp: Date.now() - 120000, height: 3752479, txNumber: 3 },
        { hash: "0x789012...", timestamp: Date.now() - 180000, height: 3752478, txNumber: 7 }
      ]
    };
  }
};

/**
 * Fetches latest transactions for a specific token ID
 * @param tokenId The token ID to fetch transactions for
 * @param limit Maximum number of transactions to fetch
 */
export const fetchTokenTransactions = async (tokenId: string, limit: number = 20) => {
  try {
    // Try to fetch from the backend API
    const TRANSACTIONS_API = 'https://backend.mainnet.alephium.org/tokens';
    const url = `${TRANSACTIONS_API}/${tokenId}/transactions?page=1&limit=${limit}`;
    
    console.log(`Fetching token transactions for ${tokenId}`);
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch transactions: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    if (!Array.isArray(data)) {
      console.warn('Unexpected response format for token transactions:', data);
      return [];
    }
    
    return data;
  } catch (error) {
    console.error(`Error fetching transactions for token ${tokenId}:`, error);
    
    // Return empty array if we couldn't fetch transactions
    return [];
  }
};

/**
 * Get the latest transactions across all tokens
 * Groups transactions by token and returns the most recent ones
 */
export const fetchLatestTokenTransactions = async (tokenIds: string[], limit: number = 5) => {
  try {
    const allTransactions = [];
    let count = 0;
    
    // Fetch transactions for each token ID
    for (const tokenId of tokenIds) {
      if (count >= limit) break;
      
      const tokenTxs = await fetchTokenTransactions(tokenId, 2);
      if (tokenTxs.length > 0) {
        // Add token ID to the transaction objects
        const enrichedTxs = tokenTxs.map(tx => ({
          ...tx,
          tokenId
        }));
        
        allTransactions.push(...enrichedTxs);
        count += tokenTxs.length;
      }
    }
    
    // Sort by timestamp, newest first
    return allTransactions
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  } catch (error) {
    console.error('Error fetching latest token transactions:', error);
    return [];
  }
};

<<<<<<< HEAD
/**
 * Token cache management functions
 */
export const clearTokenCache = () => {
  tokenMetadataCache.clearAll();
};

export const clearTokenCacheForToken = (tokenId: string) => {
  tokenMetadataCache.clearToken(tokenId);
};

export const getTokenCacheStats = () => {
  return tokenMetadataCache.getStats();
};

export const refreshTokenMetadata = async (tokenId: string) => {
  console.log(`[Token Cache] Manually refreshing metadata for ${tokenId}`);
  // Clear cache for this token and fetch fresh data
  tokenMetadataCache.clearToken(tokenId);
  return await fetchFungibleTokenMetadata(tokenId, true);
};

export const refreshAllTokenMetadata = async (tokenIds: string[]) => {
  console.log(`[Token Cache] Manually refreshing metadata for ${tokenIds.length} tokens`);
  // Clear all cache and fetch fresh data
  tokenMetadataCache.clearAll();
  
  const results = [];
  for (const tokenId of tokenIds) {
    try {
      const metadata = await fetchFungibleTokenMetadata(tokenId, true);
      results.push({ tokenId, metadata, success: true });
    } catch (error) {
      results.push({ tokenId, error, success: false });
    }
  }
  
  return results;
};

=======
>>>>>>> origin/main
export default {
  nodeProvider,
  getAddressBalance,
  getAddressTransactions,
  getAddressUtxos,
  getAddressTokens,
  getAddressNFTs,
  sendTransaction,
  fetchBalanceHistory,
  fetchNetworkStats,
  fetchTokenTransactions,
<<<<<<< HEAD
  fetchLatestTokenTransactions,
  // Cache management
  clearTokenCache,
  clearTokenCacheForToken,
  getTokenCacheStats,
  refreshTokenMetadata,
  refreshAllTokenMetadata
};

=======
  fetchLatestTokenTransactions
};
>>>>>>> origin/main
