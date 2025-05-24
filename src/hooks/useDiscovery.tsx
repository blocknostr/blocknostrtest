import { useState, useEffect, useCallback } from "react";
import { 
  CommunitySearchFilters, 
  CommunitySearchResult, 
  CommunityRecommendation,
  PopularTag,
  DAOWithMetrics,
  CommunityCategory
} from "@/types/dao";
import { discoveryService, COMMUNITY_CATEGORIES } from "@/lib/dao/discovery-service";
import { nostrService } from "@/lib/nostr";

export function useDiscovery() {
  const [searchResults, setSearchResults] = useState<CommunitySearchResult[]>([]);
  const [trendingCommunities, setTrendingCommunities] = useState<DAOWithMetrics[]>([]);
  const [recommendedCommunities, setRecommendedCommunities] = useState<CommunityRecommendation[]>([]);
  const [popularTags, setPopularTags] = useState<PopularTag[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [trendingLoading, setTrendingLoading] = useState(false);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [tagsLoading, setTagsLoading] = useState(false);
  
  const [searchFilters, setSearchFilters] = useState<CommunitySearchFilters>({
    query: '',
    sortBy: 'members',
    sortOrder: 'desc'
  });
  
  const currentUserPubkey = nostrService.publicKey;
  
  // Search communities with filters
  const searchCommunities = useCallback(async (filters: CommunitySearchFilters) => {
    setSearchLoading(true);
    try {
      console.log('Searching communities with filters:', filters);
      const results = await discoveryService.searchCommunities(filters);
      setSearchResults(results);
      setSearchFilters(filters);
    } catch (error) {
      console.error('Error searching communities:', error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, []);
  
  // Get trending communities
  const fetchTrendingCommunities = useCallback(async (limit: number = 10) => {
    setTrendingLoading(true);
    try {
      console.log('Fetching trending communities...');
      const trending = await discoveryService.getTrendingCommunities(limit);
      setTrendingCommunities(trending);
    } catch (error) {
      console.error('Error fetching trending communities:', error);
      setTrendingCommunities([]);
    } finally {
      setTrendingLoading(false);
    }
  }, []);
  
  // Get recommended communities for user
  const fetchRecommendedCommunities = useCallback(async (limit: number = 5) => {
    if (!currentUserPubkey) {
      setRecommendedCommunities([]);
      return;
    }
    
    setRecommendationsLoading(true);
    try {
      console.log('Fetching recommended communities...');
      const recommendations = await discoveryService.getRecommendedCommunities(currentUserPubkey, limit);
      setRecommendedCommunities(recommendations);
    } catch (error) {
      console.error('Error fetching recommended communities:', error);
      setRecommendedCommunities([]);
    } finally {
      setRecommendationsLoading(false);
    }
  }, [currentUserPubkey]);
  
  // Get popular tags
  const fetchPopularTags = useCallback(async (limit: number = 20) => {
    setTagsLoading(true);
    try {
      console.log('Fetching popular tags...');
      const tags = await discoveryService.getPopularTags(limit);
      setPopularTags(tags);
    } catch (error) {
      console.error('Error fetching popular tags:', error);
      setPopularTags([]);
    } finally {
      setTagsLoading(false);
    }
  }, []);
  
  // Quick search function
  const quickSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    
    const filters: CommunitySearchFilters = {
      query: query.trim(),
      sortBy: 'members',
      sortOrder: 'desc'
    };
    
    await searchCommunities(filters);
  }, [searchCommunities]);
  
  // Search by category
  const searchByCategory = useCallback(async (categoryId: string) => {
    const filters: CommunitySearchFilters = {
      categories: [categoryId],
      sortBy: 'members',
      sortOrder: 'desc'
    };
    
    await searchCommunities(filters);
  }, [searchCommunities]);
  
  // Search by tag
  const searchByTag = useCallback(async (tag: string) => {
    const filters: CommunitySearchFilters = {
      tags: [tag],
      sortBy: 'members',
      sortOrder: 'desc'
    };
    
    await searchCommunities(filters);
  }, [searchCommunities]);
  
  // Clear search results
  const clearSearch = useCallback(() => {
    setSearchResults([]);
    setSearchFilters({ query: '', sortBy: 'members', sortOrder: 'desc' });
  }, []);
  
  // Refresh all discovery data
  const refreshDiscoveryData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchTrendingCommunities(),
        fetchPopularTags(),
        currentUserPubkey ? fetchRecommendedCommunities() : Promise.resolve()
      ]);
    } catch (error) {
      console.error('Error refreshing discovery data:', error);
    } finally {
      setLoading(false);
    }
  }, [fetchTrendingCommunities, fetchPopularTags, fetchRecommendedCommunities, currentUserPubkey]);
  
  // Load initial data on mount
  useEffect(() => {
    refreshDiscoveryData();
  }, [refreshDiscoveryData]);
  
  // Utility functions
  const getCategoryById = useCallback((categoryId: string): CommunityCategory | undefined => {
    return COMMUNITY_CATEGORIES.find(cat => cat.id === categoryId);
  }, []);
  
  const getAllCategories = useCallback((): CommunityCategory[] => {
    return COMMUNITY_CATEGORIES;
  }, []);
  
  // Get categories used in search results
  const getUsedCategories = useCallback((): string[] => {
    const categories = new Set<string>();
    searchResults.forEach(result => {
      const category = discoveryService.categorizeDAO(result);
      categories.add(category);
    });
    return Array.from(categories);
  }, [searchResults]);
  
  // Get stats for dashboard
  const getDiscoveryStats = useCallback(() => {
    return {
      totalSearchResults: searchResults.length,
      trendingCount: trendingCommunities.length,
      recommendationsCount: recommendedCommunities.length,
      popularTagsCount: popularTags.length,
      categoriesCount: COMMUNITY_CATEGORIES.length
    };
  }, [searchResults.length, trendingCommunities.length, recommendedCommunities.length, popularTags.length]);
  
  return {
    // Data
    searchResults,
    trendingCommunities,
    recommendedCommunities,
    popularTags,
    searchFilters,
    categories: COMMUNITY_CATEGORIES,
    
    // Loading states
    loading,
    searchLoading,
    trendingLoading,
    recommendationsLoading,
    tagsLoading,
    
    // Actions
    searchCommunities,
    quickSearch,
    searchByCategory,
    searchByTag,
    clearSearch,
    fetchTrendingCommunities,
    fetchRecommendedCommunities,
    fetchPopularTags,
    refreshDiscoveryData,
    
    // Utilities
    getCategoryById,
    getAllCategories,
    getUsedCategories,
    getDiscoveryStats,
    
    // Current user
    currentUserPubkey,
    hasUser: !!currentUserPubkey
  };
} 