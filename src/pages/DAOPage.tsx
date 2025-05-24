import React, { useState, useCallback, useMemo, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Plus, 
  Users, 
  Search, 
  RefreshCw,
  TrendingUp,
  Clock
} from "lucide-react";
import { useDAO } from "@/hooks/useDAO";
import { useDiscovery } from "@/hooks/useDiscovery";
import CommunitiesGrid from "@/components/communities/CommunitiesGrid";
import CreateDAODialog from "@/components/dao/CreateDAODialog";
import { toast } from "@/lib/utils/toast-replacement";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

const DAOPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState("discover");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const navigate = useNavigate();
  
  const {
    daos,
    myDaos,
    loading,
    loadingMyDaos,
    createDAO,
    joinDAO,
    currentUserPubkey,
    fetchGeneralDAOs,
    fetchMyDAOs,
    refreshDaos,
    myDaosCachedAt,
    allDaosCachedAt
  } = useDAO();

  const {
    searchResults,
    trendingCommunities,
    loading: discoveryLoading,
    searchCommunities,
    refreshDiscoveryData
  } = useDiscovery();

  // Calculate tab counts (simplified without trending tab)
  const tabCounts = useMemo(() => ({
    discover: searchResults.length || daos.length,
    myDaos: myDaos.length
  }), [searchResults.length, daos.length, myDaos.length]);

  // Filter communities based on search term for "My Communities" tab
  const filteredMyDaos = useMemo(() => {
    if (!searchTerm) return myDaos;
    return myDaos.filter(dao => 
      dao.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dao.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dao.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [myDaos, searchTerm]);

  // Get communities for discover tab
  const discoverCommunities = useMemo(() => {
    // If there are search results, use them; otherwise use general DAOs
    const baseCommunities = searchResults.length > 0 ? searchResults.map(result => result.community || result) : daos;
    
    if (!searchTerm) return baseCommunities;
    
    return baseCommunities.filter(dao => 
      dao.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dao.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dao.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [searchResults, daos, searchTerm]);

  const handleCreateCommunity = async (name: string, description: string, tags: string[]) => {
    try {
      const communityId = await createDAO(name, description, tags);
      if (communityId) {
        toast.success("Community created successfully!", {
          description: "Redirecting to your new community..."
        });
        setIsCreateOpen(false);
        
        // Navigate to the new community page immediately
        setTimeout(() => {
          navigate(`/dao/${communityId}`);
        }, 500);
        
        return communityId;
      }
      return null;
    } catch (error) {
      console.error("Error creating community:", error);
      toast.error("Failed to create community");
      return null;
    }
  };

  const handleJoinCommunity = async (communityId: string, communityName: string) => {
    try {
      await joinDAO(communityId);
      toast.success(`Successfully joined ${communityName}!`, {
        description: "You can now participate in the community"
      });
      
      // Navigate to the community page after joining
      setTimeout(() => {
        navigate(`/dao/${communityId}`);
      }, 1000);
    } catch (error) {
      console.error("Error joining community:", error);
      toast.error("Failed to join community");
    }
  };

  const handleTabChange = useCallback((value: string) => {
    console.log(`[DAOPage] User manually changed tab to: ${value}`);
    setActiveTab(value);
    setIsInitialLoad(false); // Mark that user has interacted
    
    // Clear search when switching tabs
    setSearchTerm("");
    
    // Lazy load data for each tab
    if (value === "discover" && daos.length === 0) {
      fetchGeneralDAOs();
    } else if (value === "my-communities" && myDaos.length === 0 && currentUserPubkey) {
      fetchMyDAOs();
    }
  }, [daos.length, myDaos.length, currentUserPubkey, fetchGeneralDAOs, fetchMyDAOs]);

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // Trigger search for discover tab if there's a search term
    if (value.trim() && activeTab === "discover") {
      searchCommunities({
        query: value.trim(),
        sortBy: 'newest'
      });
    }
  }, [activeTab, searchCommunities]);

  const handleRefresh = useCallback(async () => {
    try {
      if (activeTab === "discover") {
        await Promise.all([
          refreshDaos(),
          refreshDiscoveryData()
        ]);
        // Trigger fetchGeneralDAOs to update cache timestamp
        setTimeout(() => fetchGeneralDAOs(), 100);
      } else if (activeTab === "my-communities") {
        await fetchMyDAOs();
      }
      toast.success("Communities refreshed!");
    } catch (error) {
      console.error("Error refreshing:", error);
      toast.error("Failed to refresh communities");
    }
  }, [activeTab, refreshDaos, refreshDiscoveryData, fetchMyDAOs, fetchGeneralDAOs]);

  // Initial data loading - fix dependency array and logic
  useEffect(() => {
    console.log(`[DAOPage] Initial data loading: activeTab=${activeTab}, currentUserPubkey=${!!currentUserPubkey}`);
    
    if (activeTab === "discover") {
      fetchGeneralDAOs();
      refreshDiscoveryData();
    } else if (activeTab === "my-communities" && currentUserPubkey) {
      fetchMyDAOs();
    }
  }, [activeTab, currentUserPubkey, fetchGeneralDAOs, refreshDiscoveryData, fetchMyDAOs]);

  // Set default tab based on user login status - ONLY on initial load
  useEffect(() => {
    if (!isInitialLoad) return; // Don't override manual user selections
    
    if (currentUserPubkey && activeTab === "discover") {
      console.log("[DAOPage] Setting initial default tab to my-communities for logged in user");
      setActiveTab("my-communities");
      setIsInitialLoad(false);
    } else if (!currentUserPubkey && activeTab === "my-communities") {
      console.log("[DAOPage] Setting initial default tab to discover for logged out user");
      setActiveTab("discover");
      setIsInitialLoad(false);
    }
  }, [currentUserPubkey, activeTab, isInitialLoad]);

  return (
    <div className="container mx-auto px-4 py-3 max-w-7xl">
      <div className="space-y-3">
        {/* Header - more compact */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Communities
            </h1>
            <p className="text-muted-foreground text-sm">
              Discover, join, and participate in decentralized communities on Nostr
            </p>
          </div>
          
          <CreateDAODialog
            open={isCreateOpen}
            onOpenChange={setIsCreateOpen}
            onCreateDAO={handleCreateCommunity}
          >
            <Button size="default" className="gap-2">
              <Plus className="h-4 w-4" />
              Create Community
            </Button>
          </CreateDAODialog>
        </div>

        {/* Last Updated Notification - more compact */}
        <div className="flex justify-end">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-2.5 w-2.5" />
            <span>
              {(() => {
                if (activeTab === "my-communities") {
                  return myDaosCachedAt 
                    ? `Last updated ${formatDistanceToNow(new Date(myDaosCachedAt))} ago`
                    : "Loading cache data...";
                } else {
                  return allDaosCachedAt 
                    ? `Last updated ${formatDistanceToNow(new Date(allDaosCachedAt))} ago`
                    : "Loading cache data...";
                }
              })()}
            </span>
          </div>
        </div>

        {/* Search and Actions - more compact */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search communities by name, description, or tags..."
              className="pl-10 pr-4 h-9"
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading || discoveryLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${(loading || discoveryLoading) ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Main Content - more compact */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            {currentUserPubkey && (
              <TabsTrigger value="my-communities" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                My Communities
                {tabCounts.myDaos > 0 && (
                  <span className="ml-1 bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs">
                    {tabCounts.myDaos}
                  </span>
                )}
              </TabsTrigger>
            )}
            <TabsTrigger value="discover" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Discover
              {tabCounts.discover > 0 && (
                <span className="ml-1 bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs">
                  {tabCounts.discover}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Discover Tab - reduced spacing */}
          <TabsContent value="discover" className="space-y-4 mt-4">
            {searchTerm ? (
              // Search Results
              <CommunitiesGrid
                communities={discoverCommunities}
                currentUserPubkey={currentUserPubkey || ""}
                onJoinCommunity={handleJoinCommunity}
                loading={loading || discoveryLoading}
                title={`Search Results for "${searchTerm}"`}
                emptyMessage={`No communities found for "${searchTerm}"`}
                emptyActionLabel="Create Community"
                onEmptyAction={() => setIsCreateOpen(true)}
              />
            ) : (
              // All Communities Content
              <>
                {/* Trending Communities Section */}
                {trendingCommunities.length > 0 && (
                  <CommunitiesGrid
                    communities={trendingCommunities.map(trending => trending.community || trending)}
                    currentUserPubkey={currentUserPubkey || ""}
                    onJoinCommunity={handleJoinCommunity}
                    loading={discoveryLoading}
                    variant="trending"
                    title="🔥 Trending Communities"
                    emptyMessage="No trending communities at the moment"
                    emptyActionLabel="Create Community"
                    onEmptyAction={() => setIsCreateOpen(true)}
                    itemsPerPage={3}
                    showPagination={false}
                  />
                )}

                {/* All Communities Grid */}
                <div className={trendingCommunities.length > 0 ? "mt-3" : ""}>
                  <CommunitiesGrid
                    communities={discoverCommunities}
                    currentUserPubkey={currentUserPubkey || ""}
                    onJoinCommunity={handleJoinCommunity}
                    loading={loading}
                    variant="default"
                    title="🌍 All Communities"
                    emptyMessage="No communities found"
                    emptyActionLabel="Create Community"
                    onEmptyAction={() => setIsCreateOpen(true)}
                    itemsPerPage={6}
                  />
                </div>
              </>
            )}
          </TabsContent>

          {/* My Communities Tab - reduced spacing */}
          {currentUserPubkey && (
            <TabsContent value="my-communities" className="space-y-4 mt-4">
              <CommunitiesGrid
                communities={filteredMyDaos}
                currentUserPubkey={currentUserPubkey}
                onJoinCommunity={handleJoinCommunity}
                loading={loadingMyDaos}
                variant="default"
                title="My Communities"
                emptyMessage={searchTerm ? `No communities found for "${searchTerm}"` : "You haven't joined any communities yet"}
                emptyActionLabel={searchTerm ? "Clear search" : "Discover Communities"}
                onEmptyAction={() => {
                  if (searchTerm) {
                    setSearchTerm("");
                  } else {
                    setActiveTab("discover");
                  }
                }}
                onCreateAction={() => setIsCreateOpen(true)}
              />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default DAOPage;
