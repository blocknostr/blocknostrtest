
import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MoreHorizontal, Crown, Shield, UserPlus, Copy, Check } from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { DAO } from "@/types/dao";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "@/lib/utils/toast-replacement";
import { nostrService } from "@/lib/nostr";

interface DAOMembersListProps {
  dao: DAO;
  currentUserPubkey: string | null;
  onKickProposal: (memberPubkey: string, reason: string) => Promise<boolean>;
  kickProposals: any[];
  onVoteKick: (proposalId: string, vote: boolean) => Promise<boolean>;
  onLeaveDAO: () => Promise<void>;
  userRole: string | null;
  canKickPropose: boolean;
  onCreateInvite?: () => Promise<string | null>;
}

const DAOMembersList: React.FC<DAOMembersListProps> = ({
  dao,
  currentUserPubkey,
  onKickProposal,
  kickProposals,
  onVoteKick,
  onLeaveDAO,
  userRole,
  canKickPropose,
  onCreateInvite
}) => {
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [isKickModalOpen, setIsKickModalOpen] = useState<boolean>(false);
  const [kickReason, setKickReason] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  // New state for invite functionality
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [isCreatingInvite, setIsCreatingInvite] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  
  // Check if current user has a pending kick proposal
  const hasKickProposal = (memberPubkey: string): boolean => {
    return kickProposals.some(proposal => 
      proposal.memberToKick === memberPubkey && proposal.status === "active"
    );
  };
  
  // Handle creating kick proposal
  const handleKickSubmit = async () => {
    if (!selectedMember) return;
    
    setIsSubmitting(true);
    try {
      const success = await onKickProposal(selectedMember, kickReason);
      if (success) {
        setIsKickModalOpen(false);
        setKickReason("");
        toast.success("Kick proposal created successfully");
      }
    } catch (error) {
      console.error("Error creating kick proposal:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // New function to handle invite creation
  const handleCreateInvite = async () => {
    if (!onCreateInvite) return;
    
    setIsCreatingInvite(true);
    try {
      const link = await onCreateInvite();
      if (link) {
        setInviteLink(link);
        toast.success("Invite link created successfully");
      }
    } catch (error) {
      console.error("Error creating invite link:", error);
      toast.error("Failed to create invite link");
    } finally {
      setIsCreatingInvite(false);
    }
  };
  
  // New function to copy invite link
  const copyInviteLink = () => {
    if (!inviteLink) return;
    
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    toast.success("Invite link copied to clipboard");
    
    setTimeout(() => {
      setCopied(false);
    }, 3000);
  };

  // Check if member is creator or moderator
  const getMemberRole = (pubkey: string): string | null => {
    if (pubkey === dao.creator) return "creator";
    if (dao.moderators?.includes(pubkey)) return "moderator";
    return null;
  };
  
  // Get avatar letters for fallback 
  const getAvatarLetters = (pubkey: string): string => {
    return pubkey.substring(0, 2).toUpperCase();
  };
  
  // Get displayable pubkey (shortened)
  const getShortenedPubkey = (pubkey: string): string => {
    return pubkey.substring(0, 8) + "..." + pubkey.substring(pubkey.length - 4);
  };
  
  // Format pubkey for display
  const formatDisplayName = (pubkey: string): string => {
    // Try to convert to npub if possible
    try {
      const npub = nostrService.getNpubFromHex ? nostrService.getNpubFromHex(pubkey) : null;
      if (npub) {
        return npub.substring(0, 8) + "...";
      }
    } catch (e) {
      console.warn("Error converting pubkey to npub:", e);
    }
    
    // Fallback to hex format
    return getShortenedPubkey(pubkey);
  };
  
  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg">
            Members ({dao.members.length})
          </CardTitle>
          
          {/* Add invite button if user can create invites */}
          {onCreateInvite && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleCreateInvite}
              disabled={isCreatingInvite}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Invite
            </Button>
          )}
        </CardHeader>
        
        <CardContent>
          {/* Invite link section */}
          {inviteLink && (
            <div className="mb-4 p-3 border rounded-md bg-muted/30">
              <div className="text-sm font-medium mb-2">Share invite link:</div>
              <div className="flex gap-2">
                <Input
                  value={inviteLink}
                  readOnly
                  className="flex-1 font-mono text-xs"
                />
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={copyInviteLink}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Members list */}
          <ul className="space-y-3">
            {dao.members.map((memberPubkey) => {
              const memberRole = getMemberRole(memberPubkey);
              const isPending = hasKickProposal(memberPubkey);
              const isCurrentUser = currentUserPubkey === memberPubkey;
              const avatarSeed = memberPubkey.substring(0, 8);
              
              return (
                <li key={memberPubkey} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${avatarSeed}`} />
                      <AvatarFallback>{getAvatarLetters(memberPubkey)}</AvatarFallback>
                    </Avatar>
                    
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{formatDisplayName(memberPubkey)}</span>
                        {memberRole === "creator" && (
                          <Crown className="h-4 w-4 text-yellow-500" />
                        )}
                        {memberRole === "moderator" && (
                          <Shield className="h-4 w-4 text-blue-500" />
                        )}
                        {isCurrentUser && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">You</span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {getShortenedPubkey(memberPubkey)}
                      </div>
                    </div>
                  </div>
                  
                  {/* Member actions (kick, etc.) */}
                  {canKickPropose && !isCurrentUser && memberPubkey !== dao.creator && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedMember(memberPubkey);
                            setIsKickModalOpen(true);
                          }}
                          disabled={isPending}
                        >
                          {isPending ? "Kick proposal pending" : "Propose to kick"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>
      
      {/* Kick proposal modal */}
      <Dialog open={isKickModalOpen} onOpenChange={setIsKickModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Propose to kick member</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for kicking</Label>
              <Textarea
                id="reason"
                placeholder="Please provide a reason for your proposal..."
                value={kickReason}
                onChange={(e) => setKickReason(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsKickModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleKickSubmit}
              disabled={!kickReason.trim() || isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Submit proposal"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DAOMembersList;
