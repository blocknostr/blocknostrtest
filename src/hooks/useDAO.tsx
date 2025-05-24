import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "@/lib/utils/toast-replacement";
import { daoService } from "@/lib/dao/dao-service";
import { daoCache } from "@/lib/dao/dao-cache";
import { DAO, DAOProposal } from "@/types/dao";
import { nostrService } from "@/lib/nostr";

export function useDAO(daoId?: string) {
  const [daos, setDaos] = useState<DAO[]>([]);
  const [myDaos, setMyDaos] = useState<DAO[]>([]);
  const [trendingDaos, setTrendingDaos] = useState<DAO[]>([]);
  const [currentDao, setCurrentDao] = useState<DAO | null>(null);
  const [proposals, setProposals] = useState<DAOProposal[]>([]);
  const [kickProposals, setKickProposals] = useState<any[]>([]);
  
  // Split loading states for progressive rendering
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingMyDaos, setLoadingMyDaos] = useState<boolean>(false);
  const [loadingTrending, setLoadingTrending] = useState<boolean>(false);
  const [loadingProposals, setLoadingProposals] = useState<boolean>(true);
  const [loadingKickProposals, setLoadingKickProposals] = useState<boolean>(true);
  
  // Track data initialization
  const initializedRef = useRef({
    general: false,
    myDaos: false,
    trending: false
  });
  
  // Cache freshness tracking
  const [myDaosCachedAt, setMyDaosCachedAt] = useState<number | null>(null);
  const [isMyDaosCacheFresh, setIsMyDaosCacheFresh] = useState<boolean>(true);
  const [allDaosCachedAt, setAllDaosCachedAt] = useState<number | null>(null);
  
  const currentUserPubkey = nostrService.publicKey;
  
  // Community posts state
  const [approvedPosts, setApprovedPosts] = useState<any[]>([]);
  const [pendingPosts, setPendingPosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [loadingPendingPosts, setLoadingPendingPosts] = useState(false);
  
  // Enhanced moderation state
  const [rejectedPosts, setRejectedPosts] = useState<any[]>([]);
  const [bannedMembers, setBannedMembers] = useState<any[]>([]);
  const [contentReports, setContentReports] = useState<any[]>([]);
  const [moderationLogs, setModerationLogs] = useState<any[]>([]);
  const [loadingRejectedPosts, setLoadingRejectedPosts] = useState(false);
  const [loadingBannedMembers, setLoadingBannedMembers] = useState(false);
  const [loadingReports, setLoadingReports] = useState(false);
  const [loadingModerationLogs, setLoadingModerationLogs] = useState(false);
  
  // Fetch DAOs for general discovery page in parallel
  const fetchGeneralDAOs = useCallback(async () => {
    if (daoId) return; // Skip if viewing a specific DAO
    if (initializedRef.current.general) return; // Skip if already initialized
    
    initializedRef.current.general = true;
    setLoading(true);
    
    try {
      console.log("Fetching general DAOs...");
      const fetchedDaos = await daoService.getDAOs();
      console.log(`Fetched ${fetchedDaos.length} DAOs successfully`);
      setDaos(fetchedDaos);
      
      // Update cache timestamp tracking
      const cachedAt = daoCache.getAllDAOsCachedAt();
      setAllDaosCachedAt(cachedAt);
      
      // If no DAOs were fetched, log additional info for debugging
      if (fetchedDaos.length === 0) {
        console.warn("No DAOs were returned from service - this might indicate parsing issues or network problems");
      }
    } catch (error) {
      console.error("Error fetching general DAOs:", error);
      // Reset loading state to ensure UI doesn't get stuck
      setDaos([]); // Set empty array to trigger proper empty state in UI
      toast.error("Failed to load communities. Please try refreshing the page.");
    } finally {
      setLoading(false);
    }
  }, [daoId]);
  
  // Fetch user DAOs in parallel
  const fetchMyDAOs = useCallback(async (forceRefresh: boolean = false) => {
    console.log(`[useDAO] fetchMyDAOs called: daoId=${!!daoId}, currentUserPubkey=${!!currentUserPubkey}, initialized=${initializedRef.current.myDaos}, forceRefresh=${forceRefresh}`);
    
    if (daoId || !currentUserPubkey) {
      console.log("[useDAO] Skipping fetchMyDAOs: viewing specific DAO or not logged in");
      return; // Skip if viewing a specific DAO or not logged in
    }
    
    // Only skip if already initialized AND we have data AND not forcing refresh
    if (initializedRef.current.myDaos && !forceRefresh && myDaos.length > 0) {
      console.log("[useDAO] Skipping fetchMyDAOs: already initialized with data and not forcing refresh");
      return;
    }
    
    if (!forceRefresh) {
      initializedRef.current.myDaos = true;
    }
    setLoadingMyDaos(true);
    
    try {
      console.log(`Fetching user DAOs... ${forceRefresh ? '(force refresh)' : ''}`);
      const userDaos = await daoService.getUserDAOs(currentUserPubkey, 20, forceRefresh);
      console.log(`Fetched ${userDaos.length} user DAOs successfully`, userDaos);
      setMyDaos(userDaos);
      
      // Update cache freshness tracking
      const cachedAt = daoCache.getUserDAOsCachedAt(currentUserPubkey);
      const isFresh = daoCache.isUserDAOsCacheFresh(currentUserPubkey);
      setMyDaosCachedAt(cachedAt);
      setIsMyDaosCacheFresh(isFresh);
      
      if (userDaos.length === 0) {
        console.log("User has not joined any communities yet");
      }
      
      if (forceRefresh) {
        toast.success("My Communities refreshed!", {
          description: `Updated ${userDaos.length} communities`
        });
      }
    } catch (error) {
      console.error("Error fetching user DAOs:", error);
      setMyDaos([]); // Set empty array to trigger proper empty state
      toast.error("Failed to load your communities. Please try refreshing.");
    } finally {
      setLoadingMyDaos(false);
    }
  }, [daoId, currentUserPubkey, myDaos.length]);
  
  // Fetch trending DAOs in parallel
  const fetchTrendingDAOs = useCallback(async () => {
    if (daoId) return; // Skip if viewing a specific DAO
    if (initializedRef.current.trending) return; // Skip if already initialized
    
    initializedRef.current.trending = true;
    setLoadingTrending(true);
    
    try {
      console.log("Fetching trending DAOs...");
      const trending = await daoService.getTrendingDAOs();
      console.log(`Fetched ${trending.length} trending DAOs successfully`);
      setTrendingDaos(trending);
      
      if (trending.length === 0) {
        console.log("No trending communities available");
      }
    } catch (error) {
      console.error("Error fetching trending DAOs:", error);
      setTrendingDaos([]); // Set empty array to trigger proper empty state
      // Don't show toast for trending as it's less critical
    } finally {
      setLoadingTrending(false);
    }
  }, [daoId]);
  
  // Refresh function to manually trigger data reload
  const refreshDaos = useCallback(async () => {
    if (daoId) return; // Skip if viewing a specific DAO
    
    // Reset initialization flags
    initializedRef.current = {
      general: false,
      myDaos: false,
      trending: false
    };
    
    // Clear the cache - force a fresh load
    daoCache.invalidateAll();
    
    // Update cache timestamps to null since cache was cleared
    setAllDaosCachedAt(null);
    setMyDaosCachedAt(null);
    
    // Only fetch the DAOs for the currently active tab
    return true;
  }, [daoId]);
  
  // Fetch specific DAO if daoId is provided
  const fetchDaoDetails = useCallback(async () => {
    if (!daoId) return;
    
    setLoading(true);
    
    try {
      console.log(`Fetching details for DAO ${daoId}...`);
      
      const dao = await daoService.getDAOById(daoId);
      if (dao) {
        console.log("DAO details fetched:", dao.name);
        setCurrentDao(dao);
        // Mark loading as complete once we have the main DAO data
        setLoading(false);
        
        // Now fetch proposals in background
        setLoadingProposals(true);
        fetchDaoProposals(daoId);
        
        // Fetch kick proposals in background
        setLoadingKickProposals(true);
        fetchDaoKickProposals(daoId);
      } else {
        console.error("Community not found");
        setLoading(false);
      }
    } catch (error) {
      console.error(`Error fetching DAO ${daoId}:`, error);
      toast.error("Failed to load community details");
      setLoading(false);
    }
  }, [daoId]);
  
  // Fetch proposals in background
  const fetchDaoProposals = async (daoId: string) => {
    try {
      const daoProposals = await daoService.getDAOProposals(daoId);
      console.log(`Fetched ${daoProposals.length} proposals`);
      setProposals(daoProposals);
    } catch (error) {
      console.error(`Error fetching proposals for DAO ${daoId}:`, error);
    } finally {
      setLoadingProposals(false);
    }
  };
  
  // Fetch kick proposals in background
  const fetchDaoKickProposals = async (daoId: string) => {
    try {
      const kickProps = await daoService.getDAOKickProposals(daoId);
      console.log(`Fetched ${kickProps.length} kick proposals`);
      setKickProposals(kickProps);
    } catch (error) {
      console.error(`Error fetching kick proposals for DAO ${daoId}:`, error);
    } finally {
      setLoadingKickProposals(false);
    }
  };
  
  useEffect(() => {
    fetchDaoDetails();
  }, [fetchDaoDetails]);
  
  // Create new DAO
  const createDAO = async (name: string, description: string, tags: string[] = []) => {
    try {
      console.log(`Creating new DAO: ${name}`);
      
      if (!name.trim()) {
        toast.error("Community name is required");
        return null;
      }
      
      if (!currentUserPubkey) {
        toast.error("You must be logged in to create a community");
        return null;
      }
      
      const daoId = await daoService.createDAO(name, description, tags);
      
      if (daoId) {
        toast.success("Successfully created community");
        // Refetch DAOs
        const updatedDaos = await daoService.getDAOs();
        setDaos(updatedDaos);
        
        if (currentUserPubkey) {
          await fetchMyDAOs(true); // Force refresh to get updated list
        }
        return daoId;
      } else {
        toast.error("Failed to create community");
        return null;
      }
    } catch (error) {
      console.error("Error creating DAO:", error);
      toast.error("Failed to create community");
      return null;
    }
  };
  
  // Create a proposal
  const createProposal = async (
    daoId: string, 
    title: string, 
    description: string, 
    options: string[],
    durationDays: number = 7
  ) => {
    try {
      console.log(`Creating proposal for DAO ${daoId}: ${title}`);
      
      if (!title.trim()) {
        toast.error("Proposal title is required");
        return null;
      }
      
      if (!currentUserPubkey) {
        toast.error("You must be logged in to create a proposal");
        return null;
      }
      
      if (!options || options.length < 2) {
        toast.error("At least two options are required");
        return null;
      }
      
      const proposalId = await daoService.createProposal(daoId, title, description, options, durationDays);
      
      if (proposalId) {
        toast.success("Successfully created proposal");
        
        // Refetch proposals if we're viewing this DAO
        if (currentDao?.id === daoId) {
          setLoadingProposals(true);
          const updatedProposals = await daoService.getDAOProposals(daoId);
          setProposals(updatedProposals);
          setLoadingProposals(false);
        }
        return proposalId;
      } else {
        toast.error("Failed to create proposal");
        return null;
      }
    } catch (error) {
      console.error("Error creating proposal:", error);
      toast.error("Failed to create proposal");
      return null;
    }
  };
  
  // Vote on a proposal with immediate UI update
  const voteOnProposal = async (proposalId: string, optionIndex: number) => {
    try {
      console.log(`Voting on proposal ${proposalId}, option ${optionIndex}`);
      
      if (!currentUserPubkey) {
        toast.error("You must be logged in to vote");
        return false;
      }
      
      const success = await daoService.voteOnProposal(proposalId, optionIndex);
      
      if (success) {
        toast.success("Vote recorded");
        
        // Optimistic update - immediately update the local state
        if (currentUserPubkey) {
          setProposals(currentProposals => {
            return currentProposals.map(p => {
              if (p.id === proposalId) {
                // Create a new votes object with the current user's vote
                const updatedVotes = { ...p.votes, [currentUserPubkey]: optionIndex };
                return { ...p, votes: updatedVotes };
              }
              return p;
            });
          });
        }
        
        // Background refresh for accurate data
        if (currentDao) {
          daoService.getDAOProposals(currentDao.id)
            .then(updatedProposals => {
              setProposals(updatedProposals);
            })
            .catch(err => {
              console.error("Error refreshing proposals:", err);
            });
        }
        return true;
      } else {
        toast.error("Failed to record vote");
        return false;
      }
    } catch (error) {
      console.error("Error voting on proposal:", error);
      toast.error("Failed to record vote");
      return false;
    }
  };
  
  // Vote on kick proposal with optimistic update
  const voteOnKickProposal = async (proposalId: string, optionIndex: number) => {
    try {
      console.log(`Voting on kick proposal ${proposalId}, option ${optionIndex}`);
      
      // Optimistic update for kick proposals
      if (currentUserPubkey) {
        setKickProposals(currentProposals => {
          return currentProposals.map(p => {
            if (p.id === proposalId) {
              const updatedVotes = { ...p.votes, [currentUserPubkey]: optionIndex };
              return { ...p, votes: updatedVotes };
            }
            return p;
          });
        });
      }
      
      // Use standard voting mechanism
      return await voteOnProposal(proposalId, optionIndex);
    } catch (error) {
      console.error("Error voting on kick proposal:", error);
      toast.error("Failed to record vote");
      return false;
    }
  };
  
  // Join a DAO
  const joinDAO = async (daoId: string) => {
    try {
      console.log(`Joining DAO ${daoId}`);
      
      if (!currentUserPubkey) {
        toast.error("You must be logged in to join a community");
        return false;
      }
      
      const success = await daoService.joinDAO(daoId);
      
      if (success) {
        toast.success("Successfully joined community");
        
        // If we're currently viewing this DAO, update it
        if (currentDao?.id === daoId) {
          const updatedDao = await daoService.getDAOById(daoId);
          setCurrentDao(updatedDao);
        }
        
        // Force refresh myDaos with new indefinite caching
        if (currentUserPubkey) {
          await fetchMyDAOs(true); // Force refresh to get updated list
        }
        
        return true;
      } else {
        toast.error("Failed to join community");
        return false;
      }
    } catch (error) {
      console.error("Error joining DAO:", error);
      toast.error("Failed to join community");
      return false;
    }
  };
  
  // Leave a DAO
  const leaveDAO = async (daoId: string): Promise<boolean> => {
    try {
      if (!currentUserPubkey) {
        toast.error("You must be logged in to leave a community");
        return false;
      }
      
      console.log(`Leaving DAO ${daoId}`);
      
      const success = await daoService.leaveDAO(daoId);
      
      if (success) {
        toast.success("Successfully left the community");
        
        // If we're currently viewing this DAO, update it
        if (currentDao?.id === daoId) {
          const updatedDao = await daoService.getDAOById(daoId);
          setCurrentDao(updatedDao);
        }
        
        // Update myDaos list
        if (currentUserPubkey) {
          await fetchMyDAOs(true); // Force refresh to get updated list
        }
        
        return true;
      } else {
        toast.error("Failed to leave the community");
        return false;
      }
    } catch (error: any) {
      console.error("Error leaving DAO:", error);
      toast.error(error?.message || "Failed to leave the community");
      return false;
    }
  };
  
  // Update DAO privacy setting
  const updateDAOPrivacy = async (isPrivate: boolean) => {
    try {
      if (!currentDao || !currentUserPubkey) return false;
      
      // Only creator can update privacy
      if (currentDao.creator !== currentUserPubkey) {
        toast.error("Only the community creator can update privacy settings");
        return false;
      }
      
      console.log(`Setting DAO ${currentDao.id} privacy to ${isPrivate}`);
      
      const success = await daoService.updateDAOMetadata(
        currentDao.id,
        { type: "privacy", isPrivate }
      );
      
      if (success) {
        // Update local state
        setCurrentDao(prev => {
          if (!prev) return null;
          return { ...prev, isPrivate };
        });
        return true;
      } else {
        toast.error("Failed to update privacy settings");
        return false;
      }
    } catch (error) {
      console.error("Error updating DAO privacy:", error);
      toast.error("Failed to update privacy settings");
      return false;
    }
  };
  
  // Update DAO guidelines
  const updateDAOGuidelines = async (guidelines: string) => {
    try {
      if (!currentDao || !currentUserPubkey) return false;
      
      // Only creator can update guidelines
      if (currentDao.creator !== currentUserPubkey) {
        toast.error("Only the community creator can update guidelines");
        return false;
      }
      
      console.log(`Updating guidelines for DAO ${currentDao.id}`);
      
      const success = await daoService.updateDAOMetadata(
        currentDao.id,
        { type: "guidelines", content: guidelines }
      );
      
      if (success) {
        // Update local state
        setCurrentDao(prev => {
          if (!prev) return null;
          return { ...prev, guidelines };
        });
        return true;
      } else {
        toast.error("Failed to update guidelines");
        return false;
      }
    } catch (error) {
      console.error("Error updating DAO guidelines:", error);
      toast.error("Failed to update guidelines");
      return false;
    }
  };
  
  // Update DAO tags
  const updateDAOTags = async (tags: string[]) => {
    try {
      if (!currentDao || !currentUserPubkey) return false;
      
      // Only creator can update tags
      if (currentDao.creator !== currentUserPubkey) {
        toast.error("Only the community creator can update tags");
        return false;
      }
      
      console.log(`Updating tags for DAO ${currentDao.id}:`, tags);
      
      const success = await daoService.updateDAOMetadata(
        currentDao.id,
        { type: "tags", content: tags }
      );
      
      if (success) {
        // Update local state
        setCurrentDao(prev => {
          if (!prev) return null;
          return { ...prev, tags };
        });
        return true;
      } else {
        toast.error("Failed to update tags");
        return false;
      }
    } catch (error) {
      console.error("Error updating DAO tags:", error);
      toast.error("Failed to update tags");
      return false;
    }
  };
  
  // Add DAO moderator
  const addDAOModerator = async (pubkey: string) => {
    try {
      if (!currentDao || !currentUserPubkey) return false;
      
      // Only creator can add moderators
      if (currentDao.creator !== currentUserPubkey) {
        toast.error("Only the community creator can add moderators");
        return false;
      }
      
      // Check if already a moderator
      if (currentDao.moderators.includes(pubkey)) {
        toast.error("This user is already a moderator");
        return false;
      }
      
      // Check if pubkey is valid
      if (!pubkey.match(/^[0-9a-f]{64}$/)) {
        toast.error("Invalid pubkey format");
        return false;
      }
      
      console.log(`Adding moderator ${pubkey} to DAO ${currentDao.id}`);
      
      const success = await daoService.updateDAORoles(
        currentDao.id,
        { role: "moderator", action: "add", pubkey }
      );
      
      if (success) {
        // Update local state
        setCurrentDao(prev => {
          if (!prev) return null;
          const moderators = [...prev.moderators, pubkey];
          return { ...prev, moderators };
        });
        return true;
      } else {
        toast.error("Failed to add moderator");
        return false;
      }
    } catch (error) {
      console.error("Error adding DAO moderator:", error);
      toast.error("Failed to add moderator");
      return false;
    }
  };
  
  // Remove DAO moderator
  const removeDAOModerator = async (pubkey: string) => {
    try {
      if (!currentDao || !currentUserPubkey) return false;
      
      // Only creator can remove moderators
      if (currentDao.creator !== currentUserPubkey) {
        toast.error("Only the community creator can remove moderators");
        return false;
      }
      
      console.log(`Removing moderator ${pubkey} from DAO ${currentDao.id}`);
      
      const success = await daoService.updateDAORoles(
        currentDao.id,
        { role: "moderator", action: "remove", pubkey }
      );
      
      if (success) {
        // Update local state
        setCurrentDao(prev => {
          if (!prev) return null;
          const moderators = prev.moderators.filter(mod => mod !== pubkey);
          return { ...prev, moderators };
        });
        return true;
      } else {
        toast.error("Failed to remove moderator");
        return false;
      }
    } catch (error) {
      console.error("Error removing DAO moderator:", error);
      toast.error("Failed to remove moderator");
      return false;
    }
  };
  
  // Create DAO invite link
  const createDAOInvite = async (daoId: string) => {
    try {
      if (!currentUserPubkey) return null;
      
      console.log(`Creating invite link for DAO ${daoId}`);
      
      const inviteId = await daoService.createDAOInvite(daoId);
      
      if (inviteId) {
        // Generate shareable link
        const inviteLink = `https://${window.location.host}/dao/invite/${inviteId}`;
        return inviteLink;
      } else {
        toast.error("Failed to create invite link");
        return null;
      }
    } catch (error) {
      console.error("Error creating DAO invite:", error);
      toast.error("Failed to create invite link");
      return null;
    }
  };
  
  // Create kick proposal
  const createKickProposal = async (daoId: string, memberToKick: string, reason: string) => {
    try {
      if (!currentUserPubkey) return false;
      
      console.log(`Creating kick proposal for member ${memberToKick} in DAO ${daoId}`);
      
      // For kick proposals, use standard proposal mechanism with special options
      const title = `Remove member ${memberToKick.substring(0, 8)}...`;
      const description = `Reason for removal: ${reason}`;
      const options = ["Yes, remove member", "No, keep member"];
      
      // Create a special proposal with kick metadata
      const proposalId = await daoService.createKickProposal(
        daoId,
        title,
        description,
        options,
        memberToKick
      );
      
      if (proposalId) {
        // Refresh proposals after creating kick proposal
        if (currentDao) {
          const updatedProposals = await daoService.getDAOProposals(daoId);
          setProposals(updatedProposals);
        }
        return true;
      } else {
        toast.error("Failed to create kick proposal");
        return false;
      }
    } catch (error) {
      console.error("Error creating kick proposal:", error);
      toast.error("Failed to create kick proposal");
      return false;
    }
  };
  
  // Check if user is a member
  const isMember = (dao: DAO): boolean => {
    return !!currentUserPubkey && dao.members.includes(currentUserPubkey);
  };
  
  // Check if user is a moderator
  const isModerator = (dao: DAO): boolean => {
    return !!currentUserPubkey && dao.moderators.includes(currentUserPubkey);
  };
  
  // Check if user is the creator
  const isCreator = (dao: DAO): boolean => {
    return !!currentUserPubkey && dao.creator === currentUserPubkey;
  };
  
  // Add refreshProposals function
  const refreshProposals = useCallback(async () => {
    if (!daoId) return;
    
    setLoadingProposals(true);
    try {
      const fetchedProposals = await daoService.getDAOProposals(daoId);
      setProposals(fetchedProposals);
    } catch (error) {
      console.error("Error refreshing proposals:", error);
    } finally {
      setLoadingProposals(false);
    }
  }, [daoId]);

  // Force refresh My Communities with user feedback
  const forceRefreshMyDAOs = useCallback(async () => {
    if (!currentUserPubkey) return;
    
    console.log("Force refreshing My Communities...");
    await fetchMyDAOs(true);
  }, [currentUserPubkey, fetchMyDAOs]);

  // Community post functions
  const submitCommunityPost = async (content: string, title?: string) => {
    try {
      if (!daoId || !currentUserPubkey) return false;
      
      console.log(`Submitting post to community ${daoId}`);
      
      const postId = await daoService.submitCommunityPost(daoId, content, title);
      
      if (postId) {
        toast.success("Post submitted for moderation");
        // Refresh pending posts
        await fetchPendingPosts();
        return true;
      } else {
        toast.error("Failed to submit post");
        return false;
      }
    } catch (error) {
      console.error("Error submitting community post:", error);
      toast.error("Failed to submit post");
      return false;
    }
  };

  const approveCommunityPost = async (postId: string, originalPost: any) => {
    try {
      if (!daoId || !currentUserPubkey) return false;
      
      console.log(`Approving post ${postId} for community ${daoId}`);
      
      // Optimistically update the UI immediately
      const approvedPost = pendingPosts.find(post => post.id === postId);
      if (approvedPost) {
        // Remove from pending posts immediately
        setPendingPosts(prev => prev.filter(post => post.id !== postId));
        
        // Add to approved posts immediately with proper structure
        const newApprovedPost = {
          id: postId,
          content: approvedPost.content,
          title: approvedPost.title,
          author: approvedPost.author,
          createdAt: approvedPost.createdAt,
          tags: approvedPost.tags || []
        };
        setApprovedPosts(prev => [newApprovedPost, ...prev]);
      }
      
      const approvalId = await daoService.approveCommunityPost(daoId, postId, originalPost);
      
      if (approvalId) {
        toast.success("Post approved successfully");
        // Background refresh to ensure data consistency
        setTimeout(() => {
          Promise.all([fetchPendingPosts(), fetchApprovedPosts()]);
        }, 1000);
        return true;
      } else {
        toast.error("Failed to approve post");
        // Revert optimistic update on failure
        if (approvedPost) {
          setPendingPosts(prev => [approvedPost, ...prev]);
          setApprovedPosts(prev => prev.filter(post => post.id !== postId));
        }
        return false;
      }
    } catch (error) {
      console.error("Error approving community post:", error);
      toast.error("Failed to approve post");
      // Revert optimistic update on error
      const approvedPost = pendingPosts.find(post => post.id === postId);
      if (approvedPost) {
        setPendingPosts(prev => [approvedPost, ...prev]);
        setApprovedPosts(prev => prev.filter(post => post.id !== postId));
      }
      return false;
    }
  };

  const fetchApprovedPosts = async () => {
    if (!daoId) return;
    
    setLoadingPosts(true);
    try {
      const posts = await daoService.getApprovedCommunityPosts(daoId);
      setApprovedPosts(posts);
    } catch (error) {
      console.error("Error fetching approved posts:", error);
    } finally {
      setLoadingPosts(false);
    }
  };

  const fetchPendingPosts = async () => {
    if (!daoId) return;
    
    setLoadingPendingPosts(true);
    try {
      const posts = await daoService.getPendingCommunityPosts(daoId);
      setPendingPosts(posts);
    } catch (error) {
      console.error("Error fetching pending posts:", error);
    } finally {
      setLoadingPendingPosts(false);
    }
  };

  // Load posts when DAO changes
  useEffect(() => {
    if (daoId) {
      fetchApprovedPosts();
      fetchPendingPosts();
      // Load moderation data for moderators
      if (currentDao && (isCreator(currentDao) || isModerator(currentDao))) {
        fetchRejectedPosts();
        fetchBannedMembers();
        fetchContentReports();
        fetchModerationLogs();
      }
    }
  }, [daoId, currentDao]);
  
  // Enhanced moderation functions
  const rejectCommunityPost = async (postId: string, originalPost: any, reason: string) => {
    try {
      if (!daoId || !currentUserPubkey) return false;
      
      console.log(`Rejecting post ${postId} for community ${daoId} with reason: ${reason}`);
      
      // Optimistically update the UI immediately
      const rejectedPost = pendingPosts.find(post => post.id === postId);
      if (rejectedPost) {
        // Remove from pending posts immediately
        setPendingPosts(prev => prev.filter(post => post.id !== postId));
      }
      
      const rejectionId = await daoService.rejectCommunityPost(daoId, postId, originalPost, reason);
      
      if (rejectionId) {
        toast.success("Post rejected successfully");
        // Background refresh to ensure data consistency
        setTimeout(() => {
          Promise.all([fetchPendingPosts(), fetchRejectedPosts()]);
        }, 1000);
        return true;
      } else {
        toast.error("Failed to reject post");
        // Revert optimistic update on failure
        if (rejectedPost) {
          setPendingPosts(prev => [rejectedPost, ...prev]);
        }
        return false;
      }
    } catch (error) {
      console.error("Error rejecting community post:", error);
      toast.error("Failed to reject post");
      // Revert optimistic update on error
      const rejectedPost = pendingPosts.find(post => post.id === postId);
      if (rejectedPost) {
        setPendingPosts(prev => [rejectedPost, ...prev]);
      }
      return false;
    }
  };

  const banMember = async (memberToBan: string, reason: string, durationHours?: number) => {
    try {
      if (!daoId || !currentUserPubkey) return false;
      
      console.log(`Banning member ${memberToBan} from community ${daoId}`);
      
      const banId = await daoService.banMember(daoId, memberToBan, reason, durationHours);
      
      if (banId) {
        toast.success(`Member banned successfully${durationHours ? ` for ${durationHours} hours` : ''}`);
        // Refresh DAO and banned members list
        await Promise.all([fetchDaoDetails(), fetchBannedMembers()]);
        return true;
      } else {
        toast.error("Failed to ban member");
        return false;
      }
    } catch (error) {
      console.error("Error banning member:", error);
      toast.error("Failed to ban member");
      return false;
    }
  };

  const unbanMember = async (memberToUnban: string, reason?: string) => {
    try {
      if (!daoId || !currentUserPubkey) return false;
      
      console.log(`Unbanning member ${memberToUnban} from community ${daoId}`);
      
      const unbanId = await daoService.unbanMember(daoId, memberToUnban, reason);
      
      if (unbanId) {
        toast.success("Member unbanned successfully");
        // Refresh DAO and banned members list
        await Promise.all([fetchDaoDetails(), fetchBannedMembers()]);
        return true;
      } else {
        toast.error("Failed to unban member");
        return false;
      }
    } catch (error) {
      console.error("Error unbanning member:", error);
      toast.error("Failed to unban member");
      return false;
    }
  };

  const reportContent = async (
    targetId: string,
    targetType: 'post' | 'comment' | 'user',
    category: 'spam' | 'harassment' | 'inappropriate' | 'misinformation' | 'other',
    reason: string
  ) => {
    try {
      if (!daoId || !currentUserPubkey) return false;
      
      console.log(`Reporting ${targetType} ${targetId} in community ${daoId}`);
      
      const reportId = await daoService.reportContent(daoId, targetId, targetType, category, reason);
      
      if (reportId) {
        toast.success("Content reported successfully");
        // Refresh reports for moderators
        if (currentDao && (isCreator(currentDao) || isModerator(currentDao))) {
          await fetchContentReports();
        }
        return true;
      } else {
        toast.error("Failed to report content");
        return false;
      }
    } catch (error) {
      console.error("Error reporting content:", error);
      toast.error("Failed to report content");
      return false;
    }
  };

  const reviewContentReport = async (reportId: string, resolution: string, status: 'reviewed' | 'resolved' | 'dismissed') => {
    try {
      if (!daoId || !currentUserPubkey) return false;
      
      console.log(`Reviewing content report ${reportId}`);
      
      const reviewId = await daoService.reviewContentReport(reportId, daoId, resolution, status);
      
      if (reviewId) {
        toast.success("Report reviewed successfully");
        // Refresh reports and logs
        await Promise.all([fetchContentReports(), fetchModerationLogs()]);
        return true;
      } else {
        toast.error("Failed to review report");
        return false;
      }
    } catch (error) {
      console.error("Error reviewing content report:", error);
      toast.error("Failed to review report");
      return false;
    }
  };

  // Fetch functions for moderation data
  const fetchRejectedPosts = async () => {
    if (!daoId) return;
    
    setLoadingRejectedPosts(true);
    try {
      const posts = await daoService.getRejectedCommunityPosts(daoId);
      setRejectedPosts(posts);
    } catch (error) {
      console.error("Error fetching rejected posts:", error);
    } finally {
      setLoadingRejectedPosts(false);
    }
  };

  const fetchBannedMembers = async () => {
    if (!daoId) return;
    
    setLoadingBannedMembers(true);
    try {
      const bans = await daoService.getBannedMembers(daoId);
      setBannedMembers(bans);
    } catch (error) {
      console.error("Error fetching banned members:", error);
    } finally {
      setLoadingBannedMembers(false);
    }
  };

  const fetchContentReports = async () => {
    if (!daoId) return;
    
    setLoadingReports(true);
    try {
      const reports = await daoService.getContentReports(daoId);
      setContentReports(reports);
    } catch (error) {
      console.error("Error fetching content reports:", error);
    } finally {
      setLoadingReports(false);
    }
  };

  const fetchModerationLogs = async () => {
    if (!daoId) return;
    
    setLoadingModerationLogs(true);
    try {
      const logs = await daoService.getModerationLogs(daoId);
      setModerationLogs(logs);
    } catch (error) {
      console.error("Error fetching moderation logs:", error);
    } finally {
      setLoadingModerationLogs(false);
    }
  };
  
  return {
    daos,
    myDaos,
    trendingDaos,
    currentDao,
    proposals,
    kickProposals,
    approvedPosts,
    pendingPosts,
    rejectedPosts,
    bannedMembers,
    contentReports,
    moderationLogs,
    loading,
    loadingMyDaos,
    loadingTrending,
    loadingProposals,
    loadingKickProposals,
    loadingPosts,
    loadingPendingPosts,
    loadingRejectedPosts,
    loadingBannedMembers,
    loadingReports,
    loadingModerationLogs,
    // Cache freshness info
    myDaosCachedAt,
    isMyDaosCacheFresh,
    allDaosCachedAt,
    createDAO,
    createProposal,
    voteOnProposal,
    joinDAO,
    leaveDAO,
    updateDAOPrivacy,
    updateDAOGuidelines,
    updateDAOTags,
    addDAOModerator,
    removeDAOModerator,
    createDAOInvite,
    createKickProposal,
    voteOnKickProposal,
    submitCommunityPost,
    approveCommunityPost,
    fetchApprovedPosts,
    fetchPendingPosts,
    isMember,
    isModerator,
    isCreator,
    currentUserPubkey,
    refreshDaos,
    fetchDaoDetails,
    // Expose these methods for lazy loading
    fetchGeneralDAOs,
    fetchMyDAOs,
    fetchTrendingDAOs,
    refreshProposals,
    rejectCommunityPost,
    banMember,
    unbanMember,
    reportContent,
    reviewContentReport,
    fetchRejectedPosts,
    fetchBannedMembers,
    fetchContentReports,
    fetchModerationLogs,
    forceRefreshMyDAOs
  };
}
