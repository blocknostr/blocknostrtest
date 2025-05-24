interface StatsDisplayProps {
  likeCount: number;
  repostCount: number;
  replyCount: number;
  zapCount: number;
  zapAmount: number;
  followerCount?: number;
  followingCount?: number;
  postCount?: number;
}

const StatsDisplay = ({ 
  likeCount, 
  repostCount, 
  replyCount, 
  zapCount, 
  zapAmount,
  followerCount = 0,
  followingCount = 0,
  postCount = 0
}: StatsDisplayProps) => {
  return (
    <div className="mt-2 p-3 bg-muted/30 rounded-md text-sm">
      <div className="grid grid-cols-3 gap-2">
        <div>
          <div className="text-xs text-muted-foreground">Following</div>
          <div className="font-medium">{followingCount}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Followers</div>
          <div className="font-medium">{followerCount}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Posts</div>
          <div className="font-medium">{postCount}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Likes</div>
          <div className="font-medium">{likeCount}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Reposts</div>
          <div className="font-medium">{repostCount}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Replies</div>
          <div className="font-medium">{replyCount}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Zaps</div>
          <div className="font-medium">
            {zapCount} <span className="text-xs text-muted-foreground">({zapAmount} sats)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsDisplay;
