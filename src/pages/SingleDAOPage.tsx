import React, { useState, useCallback, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Users, MessageSquare, Settings, Plus, Vote, UserPlus, UserMinus, Shield, AlertTriangle, Flag, Activity } from "lucide-react";
import { useDAO } from "@/hooks/useDAO";
import { useDAOSubscription } from "@/hooks/useDAOSubscription";
import DAOProposalsList from "@/components/dao/DAOProposalsList";
import DAOMembersList from "@/components/dao/DAOMembersList";
import DAOSettingsDialog from "@/components/dao/DAOSettingsDialog";
import DAOKickProposalDialog from "@/components/dao/DAOKickProposalDialog";
import DAOHeader from "@/components/dao/DAOHeader";
import DAOKickProposalsList from "@/components/dao/DAOKickProposalsList";
import CommunityPostForm from "@/components/dao/CommunityPostForm";
import CommunityPostList from "@/components/dao/CommunityPostList";
import PendingPostsList from "@/components/dao/PendingPostsList";
import ContentReportsList from "@/components/dao/ContentReportsList";
import ModerationLogsList from "@/components/dao/ModerationLogsList";
import { toast } from "@/lib/utils/toast-replacement";
import DAOPageHeader from "@/components/dao/DAOPageHeader";
import DAOGuidelines from "@/components/dao/DAOGuidelines";

const SingleDAOPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<string>("posts");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isKickDialogOpen, setIsKickDialogOpen] = useState(false);
  
  const {
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
    loadingProposals,
    loadingKickProposals,
    loadingPosts,
    loadingPendingPosts,
    loadingRejectedPosts,
    loadingBannedMembers,
    loadingReports,
    loadingModerationLogs,
    isMember,
    isCreator,
    isModerator,
    currentUserPubkey,
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
    rejectCommunityPost,
    banMember,
    unbanMember,
    reportContent,
    reviewContentReport,
    refreshProposals
  } = useDAO(id);

  // Set up real-time subscriptions for DAO updates
  const { isConnected } = useDAOSubscription({
    daoId: id,
    onNewProposal: (proposal) => {
      console.log("New proposal received:", proposal);
      // Refresh proposals when a new one is received
      refreshProposals?.();
    },
    onNewVote: (vote) => {
      console.log("New vote received:", vote);
      // Optionally refresh proposals when new votes come in
      refreshProposals?.();
    },
    onDAOUpdate: (dao) => {
      console.log("DAO update received:", dao);
    }
  });

  // Memoize the refresh function
  const handleRefreshProposals = useCallback(async () => {
    if (refreshProposals) {
      try {
        await refreshProposals();
        console.log("Proposals refreshed successfully");
      } catch (error) {
        console.error("Error refreshing proposals:", error);
      }
    }
  }, [refreshProposals]);

  // Fix type issues by properly checking if user is a member and creator
  const isMemberOfCurrentDao = currentDao ? isMember(currentDao) : false;
  const isCreatorOfCurrentDao = currentDao ? isCreator(currentDao) : false;
  const isModeratorOfCurrentDao = currentDao ? isModerator(currentDao) : false;
  
  // Determine role for member
  const userRole = isCreatorOfCurrentDao ? 'creator' : isModeratorOfCurrentDao ? 'moderator' : isMemberOfCurrentDao ? 'member' : null;
  
  // Determine if we should show the kick proposals tab
  const hasKickProposals = !loadingKickProposals && kickProposals.length > 0;
  
  // Check if the creator is the only member
  const isCreatorOnlyMember = currentDao && currentDao.members.length === 1 && currentDao.members[0] === currentDao.creator;
  
  // Permission checks
  const canModerate = isCreatorOfCurrentDao || isModeratorOfCurrentDao;
  const canCreateProposal = currentUserPubkey && isMemberOfCurrentDao;
  const canKickPropose = currentUserPubkey && isMemberOfCurrentDao && !isCreatorOfCurrentDao;
  const canCreateInvite = canModerate; // Only moderators and creators can create invites

  // Count pending items for tab badges
  const pendingPostsCount = pendingPosts.length;
  const pendingReportsCount = contentReports.filter(r => r.status === 'pending').length;

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-3 max-w-7xl">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" disabled className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="flex-1 h-8 bg-muted rounded animate-pulse" />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-3 space-y-4">
              <div className="h-10 bg-muted rounded animate-pulse" />
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 bg-muted rounded animate-pulse" />
                ))}
              </div>
            </div>
            <div className="lg:col-span-1 space-y-4">
              <div className="h-32 bg-muted rounded animate-pulse" />
              <div className="h-48 bg-muted rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentDao) {
    return (
      <div className="container mx-auto px-4 py-3 max-w-7xl">
        <div className="space-y-4">
          <Button variant="ghost" size="sm" onClick={() => window.history.back()} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          
          <Card>
            <CardContent className="py-16 text-center">
              <div className="space-y-4">
                <div className="h-16 w-16 mx-auto bg-muted rounded-full animate-pulse" />
                <div>
                  <h2 className="text-xl font-bold mb-2">Community Not Found</h2>
                  <p className="text-muted-foreground text-sm mb-4">
                    The community you're looking for doesn't exist or has been removed.
                  </p>
                  <Button variant="outline" onClick={() => window.history.back()}>
                    Go Back
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const handleJoinDAO = async () => {
    if (!currentUserPubkey) {
      toast.error("Please login to join this DAO");
      return;
    }
    
    try {
      await joinDAO(currentDao.id);
    } catch (error) {
      console.error("Error joining DAO:", error);
      toast.error("Failed to join the DAO");
    }
  };
  
  const handleCreateKickProposal = async (memberToKick: string, reason: string) => {
    if (!currentUserPubkey || !isMemberOfCurrentDao) {
      toast.error("You must be a member to create kick proposals");
      return false;
    }
    
    try {
      const success = await createKickProposal(currentDao.id, memberToKick, reason);
      return success;
    } catch (error) {
      console.error("Error creating kick proposal:", error);
      return false;
    }
  };
  
  const handleLeaveDAO = async () => {
    if (!currentDao || !currentUserPubkey) {
      toast.error("You must be logged in to leave a DAO");
      return;
    }
    
    try {
      const success = await leaveDAO(currentDao.id);
      if (success) {
        // Navigation will be handled by the LeaveDaoButton component
        // which redirects to the DAOs page
      }
    } catch (error) {
      console.error("Error leaving DAO:", error);
      toast.error("Failed to leave the DAO");
    }
  };
  
  const handleDeleteDAO = async () => {
    // This would be implemented in the useDAO hook
    toast.error("Delete DAO functionality not yet implemented");
  };
  
  const handleCreateInvite = async () => {
    if (!currentUserPubkey || !canModerate) {
      toast.error("Only moderators and creators can create invites");
      return null;
    }
    
    try {
      const inviteLink = await createDAOInvite(currentDao.id);
      return inviteLink;
    } catch (error) {
      console.error("Error creating invite:", error);
      return null;
    }
  };

  // Wrapper functions to fix type issues with function parameters
  const handleUpdateDAOPrivacy = async (daoId: string, isPrivate: boolean) => {
    return await updateDAOPrivacy(isPrivate);
  };

  const handleUpdateDAOTags = async (daoId: string, tags: string[]) => {
    return await updateDAOTags(tags);
  };

  // Fix for the voteOnProposal issue - use the updated signature
  const handleVoteOnProposal = async (proposalId: string, optionIndex: number) => {
    return await voteOnProposal(proposalId, optionIndex);
  };
  
  // Fix for the voteOnKickProposal issue - accept boolean and convert to number
  const handleVoteOnKickProposal = async (proposalId: string, vote: boolean) => {
    // Convert boolean vote to number (true -> 0, false -> 1)
    const optionIndex = vote ? 0 : 1; // Invert the logic: true = "Yes, remove" (0), false = "No, keep" (1)
    return await voteOnKickProposal(proposalId, optionIndex);
  };

  return (
    <div className="container mx-auto px-4 py-3 max-w-7xl">
      <div className="space-y-4">
        {/* Back button - separate line */}
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => window.history.back()}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>
        
        {/* DAO Header - separate line */}
        {currentDao && (
          <div className="w-full">
            <DAOHeader 
              dao={currentDao}
              currentUserPubkey={currentUserPubkey}
              userRole={userRole}
              onLeaveDAO={handleLeaveDAO}
              onDeleteDAO={handleDeleteDAO}
              isCreatorOnlyMember={isCreatorOnlyMember}
            />
          </div>
        )}
        
        {/* Main content grid - more compact */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Main Content - Takes up 3 columns */}
          <div className="lg:col-span-3 space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-3">
                <TabsTrigger value="posts" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Posts
                </TabsTrigger>
                <TabsTrigger value="proposals" className="flex items-center gap-2">
                  <Vote className="h-4 w-4" />
                  Proposals
                </TabsTrigger>
                {canModerate && (
                  <TabsTrigger value="moderation" className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Moderation
                    {(pendingPostsCount > 0 || pendingReportsCount > 0) && (
                      <span className="ml-1 bg-red-500 text-white px-1.5 py-0.5 rounded-full text-xs">
                        {pendingPostsCount + pendingReportsCount}
                      </span>
                    )}
                  </TabsTrigger>
                )}
              </TabsList>
              
              {/* Posts Tab */}
              <TabsContent value="posts" className="space-y-3">
                {isMemberOfCurrentDao && (
                  <Card>
                    <CardContent className="py-4">
                      <CommunityPostForm
                        onSubmit={submitCommunityPost}
                        isSubmitting={loadingPosts}
                      />
                    </CardContent>
                  </Card>
                )}
                
                <CommunityPostList
                  posts={approvedPosts}
                  isLoading={loadingPosts}
                  currentUserPubkey={currentUserPubkey}
                  onReportContent={reportContent}
                />
              </TabsContent>
              
              {/* Proposals Tab */}
              <TabsContent value="proposals" className="space-y-3">
                <DAOProposalsList
                  daoId={currentDao?.id || ""}
                  proposals={proposals}
                  isLoading={loadingProposals}
                  isMember={isMemberOfCurrentDao}
                  isCreator={isCreatorOfCurrentDao}
                  currentUserPubkey={currentUserPubkey}
                  onCreateProposal={createProposal}
                  onVoteProposal={handleVoteOnProposal}
                  onRefreshProposals={handleRefreshProposals}
                />
                
                {/* Kick Proposals */}
                {hasKickProposals && (
                  <div className="mt-4">
                    <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
                      <UserMinus className="h-4 w-4" />
                      Member Removal Proposals
                    </h3>
                    <DAOKickProposalsList
                      proposals={kickProposals}
                      currentUserPubkey={currentUserPubkey}
                      onVote={handleVoteOnKickProposal}
                      isLoading={loadingKickProposals}
                    />
                  </div>
                )}
              </TabsContent>
              
              {/* Moderation Tab - Only for Moderators */}
              {canModerate && (
                <TabsContent value="moderation" className="space-y-4">
                  <Tabs defaultValue="pending" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="pending" className="text-xs">
                        Pending
                        {pendingPostsCount > 0 && (
                          <span className="ml-1 bg-red-500 text-white px-1 py-0.5 rounded-full text-xs">
                            {pendingPostsCount}
                          </span>
                        )}
                      </TabsTrigger>
                      <TabsTrigger value="reports" className="text-xs">
                        Reports
                        {pendingReportsCount > 0 && (
                          <span className="ml-1 bg-red-500 text-white px-1 py-0.5 rounded-full text-xs">
                            {pendingReportsCount}
                          </span>
                        )}
                      </TabsTrigger>
                      <TabsTrigger value="rejected" className="text-xs">Rejected</TabsTrigger>
                      <TabsTrigger value="logs" className="text-xs">Logs</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="pending" className="mt-3">
                      <PendingPostsList
                        posts={pendingPosts}
                        onApprove={approveCommunityPost}
                        onReject={rejectCommunityPost}
                        isLoading={loadingPendingPosts}
                        isApproving={loadingPosts}
                      />
                    </TabsContent>
                    
                    <TabsContent value="reports" className="mt-3">
                      <ContentReportsList
                        reports={contentReports}
                        onReviewReport={reviewContentReport}
                        isLoading={loadingReports}
                        isReviewing={loadingReports}
                      />
                    </TabsContent>
                    
                    <TabsContent value="rejected" className="mt-3">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-base font-semibold">Rejected Posts</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <AlertTriangle className="h-4 w-4" />
                            <span>{rejectedPosts.length} rejected</span>
                          </div>
                        </div>
                        
                        {loadingRejectedPosts ? (
                          <div className="space-y-3">
                            {[1, 2, 3].map((i) => (
                              <Card key={i} className="animate-pulse">
                                <CardHeader className="py-3">
                                  <div className="w-1/3 h-4 bg-muted rounded" />
                                </CardHeader>
                                <CardContent className="py-3">
                                  <div className="space-y-2">
                                    <div className="w-3/4 h-4 bg-muted rounded" />
                                    <div className="w-1/2 h-4 bg-muted rounded" />
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        ) : rejectedPosts.length === 0 ? (
                          <Card>
                            <CardContent className="py-8 text-center">
                              <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                              <h3 className="text-base font-semibold mb-2">No rejected posts</h3>
                              <p className="text-muted-foreground text-sm">
                                No posts have been rejected yet.
                              </p>
                            </CardContent>
                          </Card>
                        ) : (
                          <div className="space-y-3">
                            {rejectedPosts.map((post) => (
                              <Card key={post.id} className="border-red-200 bg-red-50/50 dark:bg-red-900/10">
                                <CardHeader className="py-3">
                                  <div className="flex items-start justify-between">
                                    <div>
                                      <p className="text-sm font-medium">
                                        Author: {post.author.substring(0, 8)}...
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        Rejected by {post.rejection.moderator.substring(0, 8)}...
                                      </p>
                                    </div>
                                    <Badge variant="outline" className="text-xs bg-red-100 text-red-800 border-red-300">
                                      Rejected
                                    </Badge>
                                  </div>
                                </CardHeader>
                                
                                <CardContent className="py-3">
                                  {post.title && (
                                    <h3 className="font-semibold mb-2">{post.title}</h3>
                                  )}
                                  
                                  <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
                                    {post.content}
                                  </p>
                                  
                                  <div className="p-3 bg-red-100 rounded-lg">
                                    <p className="text-sm font-medium text-red-800 mb-1">
                                      Rejection Reason:
                                    </p>
                                    <p className="text-sm text-red-700">
                                      {post.rejection.reason}
                                    </p>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        )}
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="logs" className="mt-3">
                      <ModerationLogsList
                        logs={moderationLogs}
                        isLoading={loadingModerationLogs}
                      />
                    </TabsContent>
                  </Tabs>
                </TabsContent>
              )}
            </Tabs>
          </div>
          
          {/* Right Sidebar - Takes up 1 column */}
          <div className="lg:col-span-1 space-y-4">
            {/* Community Info Card */}
            {currentDao && (
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Community Info
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-3 space-y-3">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Members:</span>
                      <span className="font-medium">{currentDao.members.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Posts:</span>
                      <span className="font-medium">{approvedPosts.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Proposals:</span>
                      <span className="font-medium">{proposals.length}</span>
                    </div>
                  </div>
                  
                  {currentDao.tags.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Tags:</p>
                      <div className="flex flex-wrap gap-1">
                        {currentDao.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {!isMemberOfCurrentDao && currentUserPubkey && (
                    <Button onClick={handleJoinDAO} className="w-full" size="sm">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Join Community
                    </Button>
                  )}
                  
                  {canModerate && (
                    <Button 
                      variant="outline" 
                      onClick={() => setIsSettingsOpen(true)} 
                      className="w-full" 
                      size="sm"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
            
            {/* Members List */}
            {currentDao && (
              <DAOMembersList 
                dao={currentDao}
                currentUserPubkey={currentUserPubkey}
                onKickProposal={handleCreateKickProposal}
                kickProposals={kickProposals}
                onVoteKick={handleVoteOnKickProposal}
                onLeaveDAO={handleLeaveDAO}
                userRole={userRole}
                canKickPropose={canKickPropose}
                onCreateInvite={canModerate ? handleCreateInvite : undefined}
              />
            )}
          </div>
        </div>
      </div>
      
      {/* Dialogs */}
      {currentDao && canModerate && (
        <DAOSettingsDialog
          dao={currentDao}
          isOpen={isSettingsOpen}
          onOpenChange={setIsSettingsOpen}
          isCreator={isCreatorOfCurrentDao}
          onUpdatePrivacy={handleUpdateDAOPrivacy}
          onUpdateGuidelines={updateDAOGuidelines}
          onUpdateTags={handleUpdateDAOTags}
          onAddModerator={addDAOModerator}
          onRemoveModerator={removeDAOModerator}
          onCreateInviteLink={() => createDAOInvite(currentDao.id)}
        />
      )}
      
      {currentDao && (
        <DAOKickProposalDialog
          dao={currentDao}
          isOpen={isKickDialogOpen}
          onOpenChange={setIsKickDialogOpen}
          onCreateKickProposal={handleCreateKickProposal}
        />
      )}
    </div>
  );
};

export default SingleDAOPage;
