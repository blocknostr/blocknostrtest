import { useParams } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import { Toaster } from "@/lib/toast";
import { useCommunity } from "@/hooks/useCommunity";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Import our components
import MembersList from "@/components/MembersList";
import CommunityHeader from "@/components/community/CommunityHeader";
import ProposalList from "@/components/community/ProposalList";
import CommunityLoading from "@/components/community/CommunityLoading";
import CommunityNotFound from "@/components/community/CommunityNotFound";
import CommunityPageHeader from "@/components/community/CommunityPageHeader";
import CommunityGuidelines from "@/components/community/CommunityGuidelines";
import CommunitySettings from "@/components/community/CommunitySettings";
import CommunityInvites from "@/components/community/CommunityInvites";
import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard";

const CommunityPage = () => {
  const { id } = useParams();
  
  const {
    community,
    proposals,
    kickProposals,
    inviteLinks,
    loading,
    currentUserPubkey,
    
    // Roles and permissions
    isMember,
    isCreator,
    isModerator,
    isCreatorOnlyMember,
    userRole,
    canCreateProposal,
    canKickPropose,
    canModerate,
    canSetGuidelines,
    
    // Community actions
    handleJoinCommunity,
    handleLeaveCommunity,
    handleCreateKickProposal,
    handleVoteOnKick,
    handleDeleteCommunity,
    handleCreateInvite,
    handleSetPrivate,
    handleSetGuidelines,
    handleAddModerator,
    handleRemoveModerator,
    handleSetCommunityTags,
    handleSetAlphaWallet
  } = useCommunity(id);
  
  if (loading) {
    return <CommunityLoading />;
  }
  
  if (!community) {
    return <CommunityNotFound />;
  }
  
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 ml-0 md:ml-64 overflow-auto">
        <CommunityPageHeader
          name={community.name}
          isMember={isMember}
          isCreator={isCreator}
          isCreatorOnlyMember={isCreatorOnlyMember}
          currentUserPubkey={currentUserPubkey}
          onJoinCommunity={handleJoinCommunity}
          onLeaveCommunity={handleLeaveCommunity}
          onDeleteCommunity={handleDeleteCommunity}
          isPrivate={community.isPrivate}
        />
        
        <div className="container mx-auto px-4 py-6 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Main Content - Left side */}
            <div className="lg:col-span-8 space-y-5">
              {/* Community Info */}
              <CommunityHeader 
                community={community}
                currentUserPubkey={currentUserPubkey}
                userRole={userRole}
                onLeaveCommunity={handleLeaveCommunity}
                onDeleteCommunity={handleDeleteCommunity}
                isCreatorOnlyMember={isCreatorOnlyMember}
              />
              
              <Tabs defaultValue="proposals" className="w-full">
                <TabsList className={`grid ${(isCreator || isModerator) ? 'grid-cols-4' : 'grid-cols-2'} mb-4`}>
                  <TabsTrigger value="proposals">Proposals</TabsTrigger>
                  <TabsTrigger value="guidelines">Guidelines</TabsTrigger>
                  {(isCreator || isModerator) && (
                    <TabsTrigger value="analytics">Analytics</TabsTrigger>
                  )}
                  {(isCreator || isModerator) && (
                    <TabsTrigger value="settings">Settings</TabsTrigger>
                  )}
                </TabsList>
                
                {/* Proposals Tab */}
                <TabsContent value="proposals">
                  <ProposalList
                    communityId={community.id}
                    proposals={proposals}
                    isMember={isMember}
                    isCreator={isCreator}
                    currentUserPubkey={currentUserPubkey}
                    canCreateProposal={canCreateProposal}
                  />
                </TabsContent>
                
                {/* Guidelines Tab */}
                <TabsContent value="guidelines">
                  <CommunityGuidelines
                    guidelines={community.guidelines}
                    canEdit={canSetGuidelines}
                    onUpdate={handleSetGuidelines}
                  />
                </TabsContent>
                
                {/* Analytics Tab - Only for Creator/Moderators */}
                {(isCreator || isModerator) && (
                  <TabsContent value="analytics">
                    <AnalyticsDashboard
                      communityId={community.id}
                      isOwner={isCreator}
                      isModerator={isModerator}
                    />
                  </TabsContent>
                )}
                
                {/* Settings Tab - Only for Creator/Moderators */}
                {(isCreator || isModerator) && (
                  <TabsContent value="settings">
                    <CommunitySettings
                      community={community}
                      isCreator={isCreator}
                      isModerator={isModerator}
                      isCreatorOnlyMember={isCreatorOnlyMember}
                      onSetPrivate={handleSetPrivate}
                      onUpdateTags={handleSetCommunityTags}
                      onAddModerator={handleAddModerator}
                      onRemoveModerator={handleRemoveModerator}
                      onDeleteCommunity={handleDeleteCommunity}
                      onSetAlphaWallet={handleSetAlphaWallet}
                    />
                  </TabsContent>
                )}
              </Tabs>
            </div>
            
            {/* Right Panel - Members list & Invites */}
            <div className="lg:col-span-4 space-y-5">
              <MembersList 
                community={community}
                currentUserPubkey={currentUserPubkey}
                onKickProposal={handleCreateKickProposal}
                kickProposals={kickProposals}
                onVoteKick={handleVoteOnKick}
                onLeaveCommunity={handleLeaveCommunity}
                userRole={userRole}
                canKickPropose={canKickPropose}
              />
              
              {isMember && (
                <CommunityInvites
                  communityId={community.id}
                  inviteLinks={inviteLinks}
                  onCreateInvite={handleCreateInvite}
                  isPrivate={community.isPrivate}
                />
              )}
            </div>
          </div>
        </div>
        <Toaster position="bottom-right" />
      </div>
    </div>
  );
};

export default CommunityPage;
