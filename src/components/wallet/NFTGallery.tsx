import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, FileQuestion, Info, ChevronLeft, ChevronRight } from "lucide-react";
import { getAddressNFTs, EnrichedToken } from "@/lib/api/alephiumApi";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { truncateAddress } from "@/lib/utils/formatters";
import { EnrichedTokenWithWallets } from "@/types/wallet";

interface NFTGalleryProps {
  address: string;
  allTokens?: EnrichedTokenWithWallets[]; // Accept allTokens prop for consistency
  updateApiStatus?: (update: any) => void;
  apiHealth?: any;
}

// Global cache for NFT metadata and images
class NFTCache {
  private static instance: NFTCache;
  private metadataCache = new Map<string, string | null>();
  private imageValidityCache = new Map<string, boolean>();
  private cacheExpiry = new Map<string, number>();
  private readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

  static getInstance(): NFTCache {
    if (!NFTCache.instance) {
      NFTCache.instance = new NFTCache();
    }
    return NFTCache.instance;
  }

  setMetadata(tokenId: string, imageUrl: string | null) {
    this.metadataCache.set(tokenId, imageUrl);
    this.cacheExpiry.set(tokenId, Date.now() + this.CACHE_DURATION);
    
    // Also cache in localStorage for persistence
    try {
      const cacheData = {
        imageUrl,
        timestamp: Date.now(),
        expiry: Date.now() + this.CACHE_DURATION
      };
      localStorage.setItem(`nft_metadata_${tokenId}`, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('[NFT Cache] Failed to save to localStorage:', error);
    }
  }

  getMetadata(tokenId: string): string | null | undefined {
    // Check memory cache first
    const expiry = this.cacheExpiry.get(tokenId);
    if (expiry && Date.now() < expiry) {
      return this.metadataCache.get(tokenId);
    }

    // Check localStorage
    try {
      const cached = localStorage.getItem(`nft_metadata_${tokenId}`);
      if (cached) {
        const cacheData = JSON.parse(cached);
        if (Date.now() < cacheData.expiry) {
          // Restore to memory cache
          this.metadataCache.set(tokenId, cacheData.imageUrl);
          this.cacheExpiry.set(tokenId, cacheData.expiry);
          return cacheData.imageUrl;
        } else {
          // Remove expired cache
          localStorage.removeItem(`nft_metadata_${tokenId}`);
        }
      }
    } catch (error) {
      console.warn('[NFT Cache] Failed to read from localStorage:', error);
    }

    return undefined; // Not cached
  }

  setImageValidity(imageUrl: string, isValid: boolean) {
    this.imageValidityCache.set(imageUrl, isValid);
  }

  isImageValid(imageUrl: string): boolean | undefined {
    return this.imageValidityCache.get(imageUrl);
  }

  clearExpired() {
    const now = Date.now();
    for (const [key, expiry] of this.cacheExpiry.entries()) {
      if (now >= expiry) {
        this.metadataCache.delete(key);
        this.cacheExpiry.delete(key);
      }
    }
  }
}

// Skeleton loading component for NFT cards
const NFTSkeleton = () => (
  <div className="cursor-pointer group relative rounded-md overflow-hidden border bg-card aspect-square">
    <div className="h-32 w-full bg-muted animate-pulse"></div>
    <div className="p-2 absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent">
      <div className="h-3 bg-white/20 rounded animate-pulse mb-1"></div>
      <div className="h-2 bg-white/10 rounded animate-pulse w-2/3"></div>
    </div>
  </div>
);

const NFTGallery: React.FC<NFTGalleryProps> = ({ address, allTokens, updateApiStatus, apiHealth }) => {
  const [nfts, setNfts] = useState<EnrichedToken[] | EnrichedTokenWithWallets[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedNFT, setSelectedNFT] = useState<EnrichedToken | EnrichedTokenWithWallets | null>(null);
  const [currentPage, setCurrentPage] = useState(0);

  // Constants for carousel layout
  const ROWS = 3;
  const COLUMNS = 4;
  const NFTS_PER_PAGE = ROWS * COLUMNS; // 12 NFTs per page

  // Get cache instance
  const cache = NFTCache.getInstance();

  useEffect(() => {
    const fetchNFTs = async () => {
      if (!address) return;
      
      setIsLoading(true);
      try {
        // Clear expired cache entries
        cache.clearExpired();

        // If allTokens is provided, use those instead of fetching separately
        if (allTokens && allTokens.length > 0) {
          const nftTokens = allTokens.filter(token => token.isNFT);
          console.log(`[NFT Gallery] Using provided allTokens data: ${nftTokens.length} NFTs from ${allTokens.length} total tokens`);
          
          // Debug: Log all NFTs with their image information
          nftTokens.forEach((nft, index) => {
            console.log(`[NFT Gallery] NFT ${index + 1}:`, {
              id: nft.id,
              name: nft.name,
              imageUrl: nft.imageUrl,
              tokenURI: nft.tokenURI,
              hasImage: !!nft.imageUrl,
              cached: cache.getMetadata(nft.id) !== undefined
            });
          });
          
          setNfts(nftTokens);
        } else {
          // Fallback to fetching directly if no allTokens provided
        const nftData = await getAddressNFTs(address);
          console.log(`[NFT Gallery] Fetched ${nftData.length} NFTs directly for address ${address}`);
          
          // Debug: Log direct fetch results
          nftData.forEach((nft, index) => {
            console.log(`[NFT Gallery] Direct NFT ${index + 1}:`, {
              id: nft.id,
              name: nft.name,
              imageUrl: nft.imageUrl,
              tokenURI: nft.tokenURI,
              hasImage: !!nft.imageUrl,
              cached: cache.getMetadata(nft.id) !== undefined
            });
          });
          
        setNfts(nftData);
        }
      } catch (error) {
        console.error('Error fetching NFTs:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNFTs();
  }, [address, allTokens]);

  // Calculate total pages needed
  const totalPages = Math.ceil(nfts.length / NFTS_PER_PAGE);
  
  // Get NFTs for current page
  const getCurrentPageNFTs = () => {
    const startIndex = currentPage * NFTS_PER_PAGE;
    const endIndex = startIndex + NFTS_PER_PAGE;
    return nfts.slice(startIndex, endIndex);
  };

  // Navigation functions
  const goToNextPage = () => {
    setCurrentPage(prev => (prev + 1) % totalPages);
  };

  const goToPreviousPage = () => {
    setCurrentPage(prev => (prev - 1 + totalPages) % totalPages);
  };

  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  // Enhanced NFT image component with proper fallback handling and caching
  const NFTImage = ({ nft }: { nft: EnrichedToken | EnrichedTokenWithWallets }) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [imageLoading, setImageLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [fetchedImageUrl, setFetchedImageUrl] = useState<string | null>(null);
    const [isFetchingMetadata, setIsFetchingMetadata] = useState(false);
    
    // Fetch metadata from tokenURI if no imageUrl is available
    const fetchMetadataFromTokenURI = async (tokenURI: string) => {
      if (isFetchingMetadata) return null;
      
      // Check cache first
      const cachedImageUrl = cache.getMetadata(nft.id);
      if (cachedImageUrl !== undefined) {
        console.log(`[NFT Cache] Using cached metadata for ${nft.id}:`, cachedImageUrl);
        return cachedImageUrl;
      }
      
      setIsFetchingMetadata(true);
      
      try {
        // Handle data URIs (inline JSON)
        if (tokenURI.startsWith('data:application/json,')) {
          const jsonStr = decodeURIComponent(tokenURI.substring(23));
          const metadata = JSON.parse(jsonStr);
          const imageUrl = metadata.image || metadata.image_url || metadata.imageUrl;
          console.log(`[NFT Metadata] Parsed inline JSON for ${nft.id}:`, { imageUrl, metadata });
          
          // Cache the result
          cache.setMetadata(nft.id, imageUrl || null);
          return imageUrl;
        }
        
        // Handle regular URLs (Arweave, IPFS, etc.)
        console.log(`[NFT Metadata] Fetching metadata from tokenURI: ${tokenURI}`);
        const response = await fetch(tokenURI, {
          headers: { 'Accept': 'application/json' },
          mode: 'cors'
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const metadata = await response.json();
        const imageUrl = metadata.image || metadata.image_url || metadata.imageUrl || metadata.picture;
        
        console.log(`[NFT Metadata] Successfully fetched metadata for ${nft.id}:`, { imageUrl, metadata });
        
        // Cache the result
        cache.setMetadata(nft.id, imageUrl || null);
        return imageUrl;
      } catch (error) {
        console.error(`[NFT Metadata] Failed to fetch metadata from ${tokenURI}:`, error);
        
        // Cache the failure to avoid repeated attempts
        cache.setMetadata(nft.id, null);
        return null;
      } finally {
        setIsFetchingMetadata(false);
      }
    };
    
    // Generate all possible image URLs for this NFT
    const getImageUrls = (originalUrl: string | undefined) => {
      const urls: string[] = [];
      
      if (!originalUrl) return urls;
      
      // Check if this URL was previously validated
      const isValid = cache.isImageValid(originalUrl);
      if (isValid === false) {
        console.log(`[NFT Cache] Skipping previously failed URL: ${originalUrl}`);
        // Don't include URLs that we know are invalid
      } else {
        // Add the original URL first
        urls.push(originalUrl);
      }
      
      // If it's an IPFS URL, add alternative gateways
      if (originalUrl.includes('ipfs.io/ipfs/')) {
        const hash = originalUrl.split('ipfs.io/ipfs/')[1];
        const alternatives = [
          `https://gateway.pinata.cloud/ipfs/${hash}`,
          `https://cloudflare-ipfs.com/ipfs/${hash}`,
          `https://dweb.link/ipfs/${hash}`,
          `https://cf-ipfs.com/ipfs/${hash}`
        ];
        
        // Only add alternatives that haven't failed before
        alternatives.forEach(alt => {
          if (cache.isImageValid(alt) !== false) {
            urls.push(alt);
          }
        });
      } else if (originalUrl.includes('ipfs://')) {
        const hash = originalUrl.substring(7);
        const alternatives = [
          `https://ipfs.io/ipfs/${hash}`,
          `https://gateway.pinata.cloud/ipfs/${hash}`,
          `https://cloudflare-ipfs.com/ipfs/${hash}`,
          `https://dweb.link/ipfs/${hash}`
        ];
        
        alternatives.forEach(alt => {
          if (cache.isImageValid(alt) !== false) {
            urls.push(alt);
          }
        });
      }
      
      // Add more specific gateway alternatives for Arweave URLs
      if (originalUrl.includes('arweave.net')) {
        const arweaveId = originalUrl.split('/').pop();
        if (arweaveId) {
          const alternatives = [
            `https://gateway.irys.xyz/${arweaveId}`,
            `https://arseed.web3infra.dev/${arweaveId}`
          ];
          
          alternatives.forEach(alt => {
            if (cache.isImageValid(alt) !== false) {
              urls.push(alt);
            }
          });
        }
      }
      
      return [...new Set(urls)]; // Remove duplicates
    };
    
    // Use fetched image URL if available, otherwise use the original
    const effectiveImageUrl = fetchedImageUrl || nft.imageUrl;
    const imageUrls = getImageUrls(effectiveImageUrl);
    const currentImageUrl = imageUrls[currentImageIndex];
    
    // Reset state when NFT changes
    useEffect(() => {
      setCurrentImageIndex(0);
      setImageLoading(true);
      setHasError(false);
      setFetchedImageUrl(null);
      setIsFetchingMetadata(false);
    }, [nft.id]);
    
    // Check cache and fetch metadata from tokenURI if no image is available
    useEffect(() => {
      const attemptMetadataFetch = async () => {
        if (!nft.imageUrl && nft.tokenURI && !fetchedImageUrl && !isFetchingMetadata) {
          console.log(`[NFT Metadata] No imageUrl found for ${nft.id}, checking cache and fetching from tokenURI: ${nft.tokenURI}`);
          const imageUrl = await fetchMetadataFromTokenURI(nft.tokenURI);
          if (imageUrl) {
            setFetchedImageUrl(imageUrl);
            setImageLoading(true); // Reset loading state for new image
          }
        }
      };
      
      attemptMetadataFetch();
    }, [nft.id, nft.imageUrl, nft.tokenURI, fetchedImageUrl, isFetchingMetadata]);
    
    const handleImageError = () => {
      // Cache the failed URL
      if (currentImageUrl) {
        cache.setImageValidity(currentImageUrl, false);
      }
      
      console.log(`[NFT Image] Failed to load image ${currentImageIndex + 1}/${imageUrls.length} for ${nft.name || nft.id}: ${currentImageUrl}`);
      
      if (currentImageIndex < imageUrls.length - 1) {
        // Try next image URL
        setCurrentImageIndex(prev => prev + 1);
        setImageLoading(true);
        setHasError(false);
      } else {
        // All image sources failed
        console.log(`[NFT Image] All ${imageUrls.length} image sources failed for ${nft.id}`);
        setHasError(true);
        setImageLoading(false);
      }
    };
    
    const handleImageLoad = () => {
      // Cache the successful URL
      if (currentImageUrl) {
        cache.setImageValidity(currentImageUrl, true);
      }
      
      console.log(`[NFT Image] Successfully loaded image for ${nft.name || nft.id}: ${currentImageUrl}`);
      setImageLoading(false);
      setHasError(false);
    };
    
    // If we're still fetching metadata and no image URL is available
    if (isFetchingMetadata || (!currentImageUrl && nft.tokenURI && !hasError)) {
      return (
        <div className="h-32 w-full bg-muted flex items-center justify-center rounded-md">
          <div className="flex flex-col items-center justify-center text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mb-1" />
            <div className="text-xs text-center px-2">
              {isFetchingMetadata ? 'Fetching Metadata...' : 'Loading...'}
            </div>
          </div>
        </div>
      );
    }
    
    // If no image URL is available at all
    if (!currentImageUrl) {
      return (
        <div className="h-32 w-full bg-muted flex items-center justify-center rounded-md">
          <div className="flex flex-col items-center justify-center text-muted-foreground">
            <FileQuestion className="h-8 w-8 mb-1" />
            <div className="text-xs text-center px-2">
              {nft.tokenURI ? 'No Image in Metadata' : 'No Image'}
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div className="h-32 w-full bg-muted flex items-center justify-center rounded-md relative overflow-hidden">
        {hasError ? (
          <div className="flex flex-col items-center justify-center text-muted-foreground">
            <FileQuestion className="h-8 w-8 mb-1" />
            <div className="text-xs text-center px-2">
              Image Failed
              {imageUrls.length > 1 && (
                <div className="text-xs opacity-70 mt-1">
                  Tried {imageUrls.length} sources
                </div>
              )}
            </div>
      </div>
    ) : (
          <>
            {imageLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                {imageUrls.length > 1 && currentImageIndex > 0 && (
                  <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
                    {currentImageIndex + 1}/{imageUrls.length}
                  </div>
                )}
                {fetchedImageUrl && (
                  <div className="absolute top-2 left-2 text-xs text-muted-foreground bg-black/50 px-1 py-0.5 rounded">
                    Fetched
                  </div>
                )}
                {cache.getMetadata(nft.id) !== undefined && (
                  <div className="absolute top-2 right-2 text-xs text-muted-foreground bg-green-500/50 px-1 py-0.5 rounded">
                    Cached
                  </div>
                )}
              </div>
            )}
            <img 
              key={currentImageUrl} // Force re-render when URL changes
              src={currentImageUrl}
              alt={nft.name || `NFT ${nft.id}`}
              className={`h-32 w-full object-cover rounded-md transition-opacity duration-200 ${
                imageLoading ? 'opacity-0' : 'opacity-100'
              }`}
              onError={handleImageError}
              onLoad={handleImageLoad}
              loading="lazy"
            />
          </>
        )}
      </div>
    );
  };

  const NFTAttributes = ({ attributes }: { attributes?: any[] }) => {
    if (!attributes || attributes.length === 0) return null;
    
    return (
      <div className="grid grid-cols-2 gap-2 mt-4">
        {attributes.slice(0, 6).map((attr, index) => (
          <div key={index} className="bg-muted/50 p-2 rounded-md text-xs">
            <div className="font-medium text-muted-foreground">{attr.trait_type || attr.name}</div>
            <div>{attr.value}</div>
          </div>
        ))}
      </div>
    );
  };

  const NFTDetailsDialog = () => {
    if (!selectedNFT) return null;
    
    // Enhanced NFT image for dialog with larger size
    const DialogNFTImage = ({ nft }: { nft: EnrichedToken | EnrichedTokenWithWallets }) => {
      const [currentImageIndex, setCurrentImageIndex] = useState(0);
      const [imageLoading, setImageLoading] = useState(true);
      const [hasError, setHasError] = useState(false);
      const [fetchedImageUrl, setFetchedImageUrl] = useState<string | null>(null);
      const [isFetchingMetadata, setIsFetchingMetadata] = useState(false);
      
      // Fetch metadata from tokenURI if no imageUrl is available
      const fetchMetadataFromTokenURI = async (tokenURI: string) => {
        if (isFetchingMetadata) return null;
        
        setIsFetchingMetadata(true);
        
        try {
          // Handle data URIs (inline JSON)
          if (tokenURI.startsWith('data:application/json,')) {
            const jsonStr = decodeURIComponent(tokenURI.substring(23));
            const metadata = JSON.parse(jsonStr);
            const imageUrl = metadata.image || metadata.image_url || metadata.imageUrl;
            console.log(`[Dialog NFT Metadata] Parsed inline JSON for ${nft.id}:`, { imageUrl, metadata });
            return imageUrl;
          }
          
          // Handle regular URLs (Arweave, IPFS, etc.)
          console.log(`[Dialog NFT Metadata] Fetching metadata from tokenURI: ${tokenURI}`);
          const response = await fetch(tokenURI, {
            headers: { 'Accept': 'application/json' },
            mode: 'cors'
          });
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }
          
          const metadata = await response.json();
          const imageUrl = metadata.image || metadata.image_url || metadata.imageUrl || metadata.picture;
          
          console.log(`[Dialog NFT Metadata] Successfully fetched metadata for ${nft.id}:`, { imageUrl, metadata });
          return imageUrl;
        } catch (error) {
          console.error(`[Dialog NFT Metadata] Failed to fetch metadata from ${tokenURI}:`, error);
          return null;
        } finally {
          setIsFetchingMetadata(false);
        }
      };
      
      // Same image URL generation logic
      const getImageUrls = (originalUrl: string | undefined) => {
        const urls: string[] = [];
        
        if (!originalUrl) return urls;
        
        urls.push(originalUrl);
        
        if (originalUrl.includes('ipfs.io/ipfs/')) {
          const hash = originalUrl.split('ipfs.io/ipfs/')[1];
          urls.push(
            `https://gateway.pinata.cloud/ipfs/${hash}`,
            `https://cloudflare-ipfs.com/ipfs/${hash}`,
            `https://dweb.link/ipfs/${hash}`,
            `https://cf-ipfs.com/ipfs/${hash}`
          );
        } else if (originalUrl.includes('ipfs://')) {
          const hash = originalUrl.substring(7);
          urls.push(
            `https://ipfs.io/ipfs/${hash}`,
            `https://gateway.pinata.cloud/ipfs/${hash}`,
            `https://cloudflare-ipfs.com/ipfs/${hash}`,
            `https://dweb.link/ipfs/${hash}`
          );
        }
        
        if (originalUrl.includes('arweave.net')) {
          const arweaveId = originalUrl.split('/').pop();
          if (arweaveId) {
            urls.push(
              `https://gateway.irys.xyz/${arweaveId}`,
              `https://arseed.web3infra.dev/${arweaveId}`
            );
          }
        }
        
        return [...new Set(urls)];
      };
      
      // Use fetched image URL if available, otherwise use the original
      const effectiveImageUrl = fetchedImageUrl || nft.imageUrl;
      const imageUrls = getImageUrls(effectiveImageUrl);
      const currentImageUrl = imageUrls[currentImageIndex];
      
      useEffect(() => {
        setCurrentImageIndex(0);
        setImageLoading(true);
        setHasError(false);
        setFetchedImageUrl(null);
        setIsFetchingMetadata(false);
      }, [nft.id]);
      
      // Fetch metadata from tokenURI if no image is available
      useEffect(() => {
        const attemptMetadataFetch = async () => {
          if (!nft.imageUrl && nft.tokenURI && !fetchedImageUrl && !isFetchingMetadata) {
            console.log(`[Dialog NFT Metadata] No imageUrl found for ${nft.id}, attempting to fetch from tokenURI: ${nft.tokenURI}`);
            const imageUrl = await fetchMetadataFromTokenURI(nft.tokenURI);
            if (imageUrl) {
              setFetchedImageUrl(imageUrl);
              setImageLoading(true); // Reset loading state for new image
            }
          }
        };
        
        attemptMetadataFetch();
      }, [nft.id, nft.imageUrl, nft.tokenURI, fetchedImageUrl, isFetchingMetadata]);
      
      const handleImageError = () => {
        if (currentImageIndex < imageUrls.length - 1) {
          setCurrentImageIndex(prev => prev + 1);
          setImageLoading(true);
          setHasError(false);
        } else {
          setHasError(true);
          setImageLoading(false);
        }
      };
      
      const handleImageLoad = () => {
        setImageLoading(false);
        setHasError(false);
      };
      
      // If we're still fetching metadata and no image URL is available
      if (isFetchingMetadata || (!currentImageUrl && nft.tokenURI && !hasError)) {
        return (
          <div className="h-40 w-full bg-muted flex items-center justify-center rounded-md">
            <div className="flex flex-col items-center justify-center text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mb-2" />
              <div className="text-sm text-center px-2">
                {isFetchingMetadata ? 'Fetching Metadata...' : 'Loading...'}
              </div>
            </div>
          </div>
        );
      }
      
      if (!currentImageUrl) {
        return (
          <div className="h-40 w-full bg-muted flex items-center justify-center rounded-md">
            <div className="flex flex-col items-center justify-center text-muted-foreground">
              <FileQuestion className="h-12 w-12 mb-2" />
              <div className="text-sm text-center px-2">
                {nft.tokenURI ? 'No Image in Metadata' : 'No Image Available'}
              </div>
            </div>
          </div>
        );
      }
      
      return (
        <div className="h-40 w-full bg-muted flex items-center justify-center rounded-md relative overflow-hidden">
          {hasError ? (
            <div className="flex flex-col items-center justify-center text-muted-foreground">
              <FileQuestion className="h-12 w-12 mb-2" />
              <div className="text-sm text-center px-2">
                Failed to Load Image
                {imageUrls.length > 1 && (
                  <div className="text-xs opacity-70 mt-1">
                    Tried {imageUrls.length} sources
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              {imageLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  {imageUrls.length > 1 && currentImageIndex > 0 && (
                    <div className="absolute bottom-2 right-2 text-sm text-muted-foreground bg-black/50 px-2 py-1 rounded">
                      {currentImageIndex + 1}/{imageUrls.length}
                    </div>
                  )}
                  {fetchedImageUrl && (
                    <div className="absolute top-2 left-2 text-sm text-muted-foreground bg-black/50 px-2 py-1 rounded">
                      Fetched from Metadata
                    </div>
                  )}
                </div>
              )}
              <img 
                key={currentImageUrl}
                src={currentImageUrl}
                alt={nft.name || `NFT ${nft.id}`}
                className={`h-40 w-full object-cover rounded-md transition-opacity duration-200 ${
                  imageLoading ? 'opacity-0' : 'opacity-100'
                }`}
                onError={handleImageError}
                onLoad={handleImageLoad}
              />
            </>
          )}
        </div>
      );
    };
    
    return (
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{selectedNFT.name || `NFT ${truncateAddress(selectedNFT.id)}`}</DialogTitle>
          <DialogDescription>ID: {truncateAddress(selectedNFT.id)}</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <DialogNFTImage nft={selectedNFT} />
          
          {selectedNFT.description && (
            <div>
              <h4 className="text-sm font-medium mb-1">Description</h4>
              <p className="text-sm text-muted-foreground">{selectedNFT.description}</p>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Token ID:</span>
              <div className="font-mono text-xs break-all">{selectedNFT.id}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Amount:</span>
              <div>{selectedNFT.formattedAmount || selectedNFT.amount || '1'}</div>
            </div>
          </div>
          
          {/* Show wallet distribution for tokens with multiple wallets */}
          {'wallets' in selectedNFT && selectedNFT.wallets && selectedNFT.wallets.length > 1 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Distribution</h4>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {selectedNFT.wallets.map((wallet, idx) => (
                  <div key={idx} className="flex justify-between text-xs">
                    <span className="font-mono">{truncateAddress(wallet.address)}</span>
                    <span>{wallet.amount}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <NFTAttributes attributes={selectedNFT.attributes} />
          
          <div className="flex justify-end">
            <a 
              href={`https://explorer.alephium.org/tokens/${selectedNFT.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline"
            >
              View on Explorer
            </a>
          </div>
        </div>
      </DialogContent>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          NFT Collection
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-5 w-5">
                  <Info className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Non-Fungible Tokens owned by this address. Enhanced with Alephium INFT detection.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
        <CardDescription>
          {allTokens ? 
            `NFTs across all tracked wallets (${nfts.length} found)` : 
            `View your NFT collection (${nfts.length} found)`
          }
          {nfts.length > NFTS_PER_PAGE && (
            <span className="ml-2 text-xs">
              • Page {currentPage + 1} of {totalPages}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="relative">
            {/* Show skeleton grid while loading */}
            <div className="grid grid-cols-4 gap-3 min-h-[400px]">
              {Array.from({ length: NFTS_PER_PAGE }, (_, index) => (
                <NFTSkeleton key={`loading-skeleton-${index}`} />
              ))}
            </div>
            
            {/* Loading overlay */}
            <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
              <div className="bg-background border rounded-lg p-4 shadow-lg">
                <div className="flex items-center space-x-3">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <div>
                    <div className="font-medium">Loading NFT Collection</div>
                    <div className="text-sm text-muted-foreground">
                      {allTokens ? 
                        "Processing tokens across all wallets..." : 
                        "Fetching NFTs from blockchain..."
                      }
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : nfts.length > 0 ? (
          <>
            {/* Carousel Container */}
            <div className="relative">
              {/* NFT Grid - 3 rows × 4 columns - Always show 12 items */}
              <div className="grid grid-cols-4 gap-3 min-h-[400px]">
                {Array.from({ length: NFTS_PER_PAGE }, (_, index) => {
                  const nft = getCurrentPageNFTs()[index];
                  
                  if (!nft) {
                    // Show skeleton for empty slots to maintain grid structure
                    return <NFTSkeleton key={`skeleton-${index}`} />;
                  }
                  
                  return (
                <Dialog key={nft.id}>
                  <DialogTrigger asChild>
                    <div 
                          className="cursor-pointer group relative rounded-md overflow-hidden border bg-card hover:border-primary transition-colors aspect-square"
                      onClick={() => setSelectedNFT(nft)}
                    >
                      <NFTImage nft={nft} />
                          <div className="p-2 absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent">
                            <h3 className="font-medium truncate text-xs text-white">
                          {nft.name || `NFT ${truncateAddress(nft.id)}`}
                        </h3>
                            <p className="text-xs text-gray-300 truncate">
                              {nft.formattedAmount || nft.amount || '1'} {nft.symbol || 'NFT'}
                            </p>
                            {/* Show wallet count if this NFT is spread across multiple wallets */}
                            {'wallets' in nft && nft.wallets && nft.wallets.length > 1 && (
                              <div className="text-xs text-blue-300 mt-1">
                                {nft.wallets.length} wallets
                              </div>
                            )}
                            {/* Show cache indicator */}
                            {cache.getMetadata(nft.id) !== undefined && (
                              <div className="absolute top-1 right-1 w-2 h-2 bg-green-400 rounded-full opacity-70" title="Cached"></div>
                            )}
                      </div>
                    </div>
                  </DialogTrigger>
                  <NFTDetailsDialog />
                </Dialog>
                  );
                })}
              </div>
              
              {/* Navigation Controls */}
              {totalPages > 1 && (
                <>
                  {/* Previous Button */}
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-12 z-10"
                    onClick={goToPreviousPage}
                    disabled={totalPages <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  {/* Next Button */}
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-12 z-10"
                    onClick={goToNextPage}
                    disabled={totalPages <= 1}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
            
            {/* Page Indicators */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-6">
                <span className="text-sm text-muted-foreground mr-3">
                  {currentPage + 1} of {totalPages}
                </span>
                
                {/* Page Dots */}
                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, index) => (
                    <button
                      key={index}
                      onClick={() => goToPage(index)}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === currentPage 
                          ? 'bg-primary' 
                          : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                      }`}
                      aria-label={`Go to page ${index + 1}`}
                    />
                  ))}
                </div>
                
                {/* Page Numbers for larger collections */}
                {totalPages <= 10 && (
                  <div className="flex gap-1 ml-3">
                    {Array.from({ length: totalPages }, (_, index) => (
                      <Button
                        key={index}
                        variant={index === currentPage ? "default" : "outline"}
                        size="sm"
                        onClick={() => goToPage(index)}
                        className="w-8 h-8 p-0 text-xs"
                      >
                        {index + 1}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {/* Collection Summary */}
            <div className="mt-6 p-4 rounded-lg bg-muted/50">
              <div className="flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium">Total NFTs:</span>
                  <span className="ml-2">{nfts.length}</span>
                </div>
                <div>
                  <span className="font-medium">Showing:</span>
                  <span className="ml-2">
                    {Math.min(currentPage * NFTS_PER_PAGE + 1, nfts.length)} - {Math.min((currentPage + 1) * NFTS_PER_PAGE, nfts.length)}
                  </span>
                </div>
                {totalPages > 1 && (
                  <div>
                    <span className="font-medium">Pages:</span>
                    <span className="ml-2">{totalPages}</span>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex justify-center items-center h-80 text-muted-foreground">
            <div className="text-center">
              <FileQuestion className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <div className="text-lg mb-2">No NFTs found</div>
              <div className="text-sm">
                {allTokens ? 
                  "No NFTs found across all tracked wallets" :
                  "No NFTs found for this address"
                }
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NFTGallery;
