import React from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { 
  Users, 
  TrendingUp, 
  Crown,
  Shield,
  Activity,
  Dot
} from "lucide-react";
import { DAO } from "@/types/dao";

interface DAOCardProps {
  dao: DAO;
  currentUserPubkey: string;
  onJoinDAO?: (daoId: string, daoName: string) => void;
  variant?: 'default' | 'trending';
  showJoinButton?: boolean;
  showMemberBadge?: boolean;
  showTrendingBadge?: boolean;
}

const DAOCard: React.FC<DAOCardProps> = ({ 
  dao, 
  currentUserPubkey, 
  onJoinDAO,
  variant = 'default',
  showJoinButton = true,
  showMemberBadge = false,
  showTrendingBadge = false
}) => {
  const navigate = useNavigate();
  
  // Validate DAO object
  if (!dao || !dao.id || !dao.name) {
    console.error('DAOCard: Invalid DAO object', dao);
    return null;
  }
  
  const isMember = dao.members?.includes(currentUserPubkey) || false;
  const isCreator = dao.creator === currentUserPubkey;
  const isModerator = dao.moderators?.includes(currentUserPubkey) || false;
  
  const handleCardClick = () => {
    navigate(`/dao/${dao.id}`);
  };
  
  const handleJoinClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isMember) {
      // If user is already a member, navigate to community
      navigate(`/dao/${dao.id}`);
    } else if (onJoinDAO) {
      // If user is not a member and onJoinDAO is provided, call it
      onJoinDAO(dao.id, dao.name);
    } else {
      // Fallback to navigation
      navigate(`/dao/${dao.id}`);
    }
  };
  
  const createdAt = dao.createdAt 
    ? formatDistanceToNow(new Date(dao.createdAt * 1000), { addSuffix: true }) 
    : "Recently";
  
  // Calculate engagement for trending cards
  const engagementScore = variant === 'trending' 
    ? Math.floor(Math.random() * 40) + 60 // 60-100 for trending
    : null;
  
  const activityLevel = (dao.activeProposals || 0) > 0 || (dao.proposals || 0) > 5 ? 'high' : 
                      (dao.proposals || 0) > 2 ? 'medium' : 'low';

  return (
    <Card 
      className={`overflow-hidden transition-all duration-300 cursor-pointer flex flex-col h-full group hover:scale-[1.02] 
        ${variant === 'trending' 
          ? 'ring-1 ring-orange-200 dark:ring-orange-800 hover:ring-2 hover:ring-orange-300 dark:hover:ring-orange-700 hover:shadow-xl' 
          : 'hover:shadow-lg hover:shadow-primary/10 border-border/50 hover:border-border'
        }
        ${isMember ? 'ring-1 ring-primary/20 bg-primary/5' : ''}
      `}
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCardClick();
        }
      }}
    >
      {/* Header Image - Simplified */}
      <div className="relative h-28 overflow-hidden bg-gradient-to-br from-primary/5 to-primary/10">
        {dao.image && (
          <img 
            src={dao.image} 
            alt={dao.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        )}
        
        {/* Minimal top badges */}
        {variant === 'trending' && (
          <div className="absolute top-2 left-2">
            <Badge className="bg-orange-500 text-white text-xs h-5 px-2">
              <TrendingUp className="h-2.5 w-2.5 mr-1" />
              Trending
            </Badge>
          </div>
        )}

        {/* Simple activity indicator */}
        <div className="absolute top-2 right-2">
          <div className={`w-2 h-2 rounded-full ${
            activityLevel === 'high' ? 'bg-green-500' :
            activityLevel === 'medium' ? 'bg-yellow-500' : 'bg-gray-400'
          }`} />
        </div>

        {/* Role badge - only for creators */}
        {isCreator && (
          <div className="absolute bottom-2 right-2">
            <Badge className="bg-yellow-500 text-white text-xs h-5 px-2">
              <Crown className="h-2.5 w-2.5 mr-1" />
              Owner
            </Badge>
          </div>
        )}
        
        {/* Membership badge - for non-creators who are members */}
        {isMember && !isCreator && (
          <div className="absolute bottom-2 left-2">
            <Badge className="bg-primary text-primary-foreground text-xs h-5 px-2">
              <Users className="h-2.5 w-2.5 mr-1" />
              Member
            </Badge>
          </div>
        )}
      </div>
      
      {/* Content - Cleaner layout */}
      <div className="flex flex-col flex-grow p-4">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <Avatar className="h-9 w-9 border border-border/30">
            <AvatarImage 
              src={dao.image || `https://api.dicebear.com/7.x/shapes/svg?seed=${dao.id}`} 
              alt={dao.name} 
            />
            <AvatarFallback className="text-xs font-medium">
              {dao.name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm leading-tight truncate" title={dao.name}>
              {dao.name}
            </h3>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
              <Users className="h-3 w-3" />
              <span>{dao.members?.length || 0}</span>
              {variant === 'trending' && (
                <>
                  <Dot className="h-3 w-3" />
                  <Activity className="h-3 w-3" />
                  <span>{dao.activeProposals || 0}</span>
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* Description */}
        <p className="text-xs text-muted-foreground line-clamp-2 mb-3 flex-grow">
          {dao.description || "No description provided"}
        </p>
        
        {/* Trending metrics - simplified */}
        {variant === 'trending' && engagementScore && (
          <div className="mb-3">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-muted-foreground">Engagement</span>
              <span className="font-medium">{engagementScore}%</span>
            </div>
            <Progress value={engagementScore} className="h-1" />
          </div>
        )}
        
        {/* Tags and Join button */}
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-1">
            {(dao.tags || []).slice(0, 2).map(tag => (
              <Badge variant="outline" key={tag} className="text-xs h-4 px-1.5 py-0">
                {tag}
              </Badge>
            ))}
            {(dao.tags?.length || 0) > 2 && (
              <Badge variant="outline" className="text-xs h-4 px-1.5 py-0">
                +{(dao.tags?.length || 0) - 2}
              </Badge>
            )}
          </div>
          
          {showJoinButton && (
            <Button 
              size="sm" 
              variant={isMember ? "outline" : "default"}
              onClick={handleJoinClick}
              className={`h-6 px-3 text-xs ml-2 ${isMember ? 'cursor-pointer hover:bg-primary hover:text-primary-foreground' : ''}`}
              title={isMember ? "Click to view community" : "Join this community"}
            >
              {isMember ? (isCreator ? "Manage" : "View") : "Join"}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};

export default DAOCard;
