import {
  DAO,
  MemberAnalytics,
  PostAnalytics,
  CommunityEngagementMetrics,
  CommunityInsights,
  AnalyticsDashboardData,
  AnalyticsEvent,
  CommunityComparison,
  AnalyticsAlert,
  AnalyticsConfig,
  AnalyticsExport
} from '@/types/dao';
import { daoService } from './dao-service';

/**
 * Service for community analytics and insights
 */
export class AnalyticsService {
  private events: Map<string, AnalyticsEvent[]> = new Map();
  private configs: Map<string, AnalyticsConfig> = new Map();

  /**
   * Get analytics dashboard data for a community
   */
  async getDashboardData(communityId: string, timeRange: '7d' | '30d' | '90d' | '1y' = '30d'): Promise<AnalyticsDashboardData> {
    try {
      console.log(`Getting dashboard data for community ${communityId} (${timeRange})`);
      
      const community = await daoService.getDAO(communityId);
      if (!community) {
        throw new Error('Community not found');
      }

      const now = Math.floor(Date.now() / 1000);
      const daysBack = this.getTimeRangeDays(timeRange);
      const startTime = now - (daysBack * 24 * 60 * 60);

      // Calculate overview metrics
      const overview = await this.calculateOverviewMetrics(community, startTime, now);
      
      // Generate chart data
      const charts = await this.generateChartData(community, startTime, now, timeRange);
      
      // Get highlights
      const highlights = await this.generateHighlights(community, startTime, now);

      return {
        communityId,
        timeRange,
        lastUpdated: now,
        overview,
        charts,
        highlights
      };
    } catch (error) {
      console.error('Error getting dashboard data:', error);
      throw error;
    }
  }

  /**
   * Get member analytics for a specific user in a community
   */
  async getMemberAnalytics(communityId: string, memberPubkey: string): Promise<MemberAnalytics> {
    try {
      const community = await daoService.getDAO(communityId);
      if (!community || !community.members.includes(memberPubkey)) {
        throw new Error('Member not found in community');
      }

      // Calculate member metrics (simulated data for now)
      const joinedAt = community.createdAt; // Simplified - would track actual join time
      const now = Math.floor(Date.now() / 1000);
      const daysInCommunity = Math.max(1, Math.floor((now - joinedAt) / (24 * 60 * 60)));

      const totalPosts = Math.floor(Math.random() * 50) + 1;
      const totalComments = Math.floor(Math.random() * 100) + 5;
      const totalReactions = Math.floor(Math.random() * 200) + 10;
      
      return {
        memberPubkey,
        joinedAt,
        totalPosts,
        totalComments,
        totalReactions,
        avgPostsPerDay: totalPosts / daysInCommunity,
        lastActivity: now - Math.floor(Math.random() * 7 * 24 * 60 * 60),
        engagementScore: this.calculateEngagementScore(totalPosts, totalComments, totalReactions),
        contributionRank: Math.floor(Math.random() * community.members.length) + 1,
        streakDays: Math.floor(Math.random() * 30) + 1,
        favoriteTopics: community.tags.slice(0, 3),
        interactionStats: {
          postsLiked: Math.floor(Math.random() * 150) + 20,
          postsShared: Math.floor(Math.random() * 30) + 5,
          commentsReceived: Math.floor(Math.random() * 80) + 10,
          reactionsReceived: Math.floor(Math.random() * 300) + 50
        }
      };
    } catch (error) {
      console.error('Error getting member analytics:', error);
      throw error;
    }
  }

  /**
   * Get community insights with recommendations
   */
  async getCommunityInsights(communityId: string): Promise<CommunityInsights> {
    try {
      const community = await daoService.getDAO(communityId);
      if (!community) {
        throw new Error('Community not found');
      }

      const now = Math.floor(Date.now() / 1000);
      const metrics = await this.calculateEngagementMetrics(communityId, 'month');

      // Calculate KPIs
      const activeMembers = Math.floor(community.members.length * 0.3);
      const memberRetentionRate = 0.85 + Math.random() * 0.1;
      const avgDailyPosts = metrics.activity.totalPosts / 30;
      const engagementRate = metrics.engagement.avgMemberEngagement;
      const healthScore = metrics.healthScore;

      // Generate recommendations
      const recommendations = this.generateRecommendations(community, metrics);

      // Calculate activity patterns
      const activityPatterns = this.generateActivityPatterns();

      return {
        communityId,
        generatedAt: now,
        kpis: {
          totalMembers: community.members.length,
          activeMembers,
          memberRetentionRate,
          avgDailyPosts,
          engagementRate,
          healthScore
        },
        trends: {
          memberGrowth: 5.2 + Math.random() * 10 - 5,
          activityGrowth: 3.1 + Math.random() * 8 - 4,
          engagementGrowth: 2.8 + Math.random() * 6 - 3
        },
        topMembers: this.generateTopMembers(community),
        topPosts: this.generateTopPosts(),
        recommendations,
        activityPatterns
      };
    } catch (error) {
      console.error('Error getting community insights:', error);
      throw error;
    }
  }

  /**
   * Get community comparison data
   */
  async getCommunityComparison(communityId: string, compareWith: 'similar' | 'trending' | 'category_average' = 'similar'): Promise<CommunityComparison> {
    try {
      const community = await daoService.getDAO(communityId);
      if (!community) {
        throw new Error('Community not found');
      }

      // Simulate comparison metrics
      const memberCount = {
        value: community.members.length,
        percentile: 60 + Math.random() * 30,
        trend: Math.random() * 20 - 10
      };

      const activityLevel = {
        value: 8.5,
        percentile: 70 + Math.random() * 25,
        trend: Math.random() * 15 - 7
      };

      const engagementRate = {
        value: 0.34,
        percentile: 55 + Math.random() * 35,
        trend: Math.random() * 10 - 5
      };

      const growthRate = {
        value: 12.3,
        percentile: 65 + Math.random() * 30,
        trend: Math.random() * 25 - 12
      };

      const strengths = this.identifyStrengths(memberCount, activityLevel, engagementRate, growthRate);
      const opportunities = this.identifyOpportunities(memberCount, activityLevel, engagementRate, growthRate);
      const benchmarkScore = Math.floor((memberCount.percentile + activityLevel.percentile + engagementRate.percentile + growthRate.percentile) / 4);

      return {
        communityId,
        compareWith,
        metrics: {
          memberCount,
          activityLevel,
          engagementRate,
          growthRate
        },
        strengths,
        opportunities,
        benchmarkScore
      };
    } catch (error) {
      console.error('Error getting community comparison:', error);
      throw error;
    }
  }

  /**
   * Generate analytics alerts for a community
   */
  async getAnalyticsAlerts(communityId: string): Promise<AnalyticsAlert[]> {
    try {
      const community = await daoService.getDAO(communityId);
      if (!community) {
        return [];
      }

      const alerts: AnalyticsAlert[] = [];
      const now = Math.floor(Date.now() / 1000);

      // Simulate various alerts
      if (Math.random() > 0.7) {
        alerts.push({
          id: `alert_${Date.now()}_1`,
          communityId,
          alertType: 'growth_spike',
          severity: 'info',
          title: 'Member Growth Spike Detected',
          description: 'Your community has gained 15% more members than usual this week.',
          metric: 'member_growth',
          threshold: 10,
          currentValue: 15,
          triggeredAt: now - 3600,
          acknowledged: false,
          actions: [
            { type: 'celebrate', label: 'Share Achievement', action: 'share_growth' },
            { type: 'engage', label: 'Welcome New Members', action: 'welcome_post' }
          ]
        });
      }

      if (Math.random() > 0.8) {
        alerts.push({
          id: `alert_${Date.now()}_2`,
          communityId,
          alertType: 'engagement_drop',
          severity: 'warning',
          title: 'Engagement Decline',
          description: 'Post engagement has dropped by 20% compared to last week.',
          metric: 'engagement_rate',
          threshold: 0.3,
          currentValue: 0.24,
          triggeredAt: now - 7200,
          acknowledged: false,
          actions: [
            { type: 'content', label: 'Create Engaging Content', action: 'content_strategy' },
            { type: 'event', label: 'Host Community Event', action: 'plan_event' }
          ]
        });
      }

      return alerts;
    } catch (error) {
      console.error('Error getting analytics alerts:', error);
      return [];
    }
  }

  /**
   * Track an analytics event
   */
  trackEvent(event: Omit<AnalyticsEvent, 'id' | 'timestamp'>): void {
    const fullEvent: AnalyticsEvent = {
      ...event,
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Math.floor(Date.now() / 1000)
    };

    if (!this.events.has(event.communityId)) {
      this.events.set(event.communityId, []);
    }

    this.events.get(event.communityId)!.push(fullEvent);
    
    // Keep only last 1000 events per community
    const communityEvents = this.events.get(event.communityId)!;
    if (communityEvents.length > 1000) {
      this.events.set(event.communityId, communityEvents.slice(-1000));
    }
  }

  // Private helper methods

  private getTimeRangeDays(timeRange: string): number {
    switch (timeRange) {
      case '7d': return 7;
      case '30d': return 30;
      case '90d': return 90;
      case '1y': return 365;
      default: return 30;
    }
  }

  private async calculateOverviewMetrics(community: DAO, startTime: number, endTime: number) {
    const totalMembers = community.members.length;
    const memberChange = Math.floor(Math.random() * 20) - 5; // Simulated change
    
    const totalPosts = Math.floor(Math.random() * 100) + 20;
    const postChange = Math.floor(Math.random() * 30) - 10;
    
    const engagementRate = 0.25 + Math.random() * 0.5;
    const engagementChange = Math.random() * 20 - 10;
    
    const healthScore = 70 + Math.random() * 25;
    const healthChange = Math.random() * 15 - 7;

    return {
      totalMembers,
      memberChange,
      totalPosts,
      postChange,
      engagementRate,
      engagementChange,
      healthScore,
      healthChange
    };
  }

  private async generateChartData(community: DAO, startTime: number, endTime: number, timeRange: string) {
    const days = this.getTimeRangeDays(timeRange);
    
    // Generate member growth data
    const memberGrowth = [];
    for (let i = days; i >= 0; i--) {
      const date = new Date((endTime - i * 24 * 60 * 60) * 1000).toISOString().split('T')[0];
      const members = Math.max(1, community.members.length - Math.floor(Math.random() * i));
      const newMembers = Math.floor(Math.random() * 5);
      memberGrowth.push({ date, members, newMembers });
    }

    // Generate activity trend data
    const activityTrend = [];
    for (let i = days; i >= 0; i--) {
      const date = new Date((endTime - i * 24 * 60 * 60) * 1000).toISOString().split('T')[0];
      const posts = Math.floor(Math.random() * 10) + 1;
      const comments = Math.floor(Math.random() * 20) + 2;
      const reactions = Math.floor(Math.random() * 50) + 5;
      activityTrend.push({ date, posts, comments, reactions });
    }

    // Generate engagement heatmap (24 hours x 7 days)
    const engagementHeatmap = [];
    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        const value = Math.random() * 100;
        engagementHeatmap.push({ hour, day, value });
      }
    }

    // Generate top tags
    const topTags = community.tags.slice(0, 10).map(tag => ({
      tag,
      count: Math.floor(Math.random() * 50) + 5,
      growth: Math.random() * 50 - 25
    }));

    // Generate membership funnel
    const membershipFunnel = [
      { stage: 'Discovered', count: 1000, percentage: 100 },
      { stage: 'Visited', count: 500, percentage: 50 },
      { stage: 'Interested', count: 200, percentage: 20 },
      { stage: 'Joined', count: community.members.length, percentage: community.members.length / 10 }
    ];

    return {
      memberGrowth,
      activityTrend,
      engagementHeatmap,
      topTags,
      membershipFunnel
    };
  }

  private async generateHighlights(community: DAO, startTime: number, endTime: number) {
    return {
      topPost: {
        id: `post_${Date.now()}`,
        title: 'Most engaged post this period',
        engagement: Math.floor(Math.random() * 100) + 50
      },
      newMemberSpike: {
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        count: Math.floor(Math.random() * 10) + 5
      },
      mostActiveDay: {
        date: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        activity: Math.floor(Math.random() * 50) + 20
      },
      risingTopic: {
        tag: community.tags[Math.floor(Math.random() * community.tags.length)] || 'discussion',
        growth: Math.floor(Math.random() * 100) + 25
      }
    };
  }

  private calculateEngagementScore(posts: number, comments: number, reactions: number): number {
    return Math.min(100, (posts * 10 + comments * 5 + reactions * 2) / 10);
  }

  private async calculateEngagementMetrics(communityId: string, period: 'day' | 'week' | 'month' | 'quarter' | 'year'): Promise<CommunityEngagementMetrics> {
    const now = Math.floor(Date.now() / 1000);
    let startDate = now;
    
    switch (period) {
      case 'day': startDate = now - 24 * 60 * 60; break;
      case 'week': startDate = now - 7 * 24 * 60 * 60; break;
      case 'month': startDate = now - 30 * 24 * 60 * 60; break;
      case 'quarter': startDate = now - 90 * 24 * 60 * 60; break;
      case 'year': startDate = now - 365 * 24 * 60 * 60; break;
    }

    // Simulate metrics
    return {
      communityId,
      period,
      startDate,
      endDate: now,
      memberGrowth: {
        newMembers: Math.floor(Math.random() * 20) + 5,
        churnedMembers: Math.floor(Math.random() * 5),
        netGrowth: Math.floor(Math.random() * 15) + 2,
        growthRate: Math.random() * 20 + 5
      },
      activity: {
        totalPosts: Math.floor(Math.random() * 100) + 20,
        totalComments: Math.floor(Math.random() * 200) + 50,
        totalReactions: Math.floor(Math.random() * 500) + 100,
        uniqueActiveMembers: Math.floor(Math.random() * 50) + 10,
        avgSessionDuration: Math.random() * 30 + 5,
        peakActivityHour: Math.floor(Math.random() * 24)
      },
      engagement: {
        avgPostEngagement: Math.random() * 0.5 + 0.2,
        avgMemberEngagement: Math.random() * 0.4 + 0.1,
        engagementTrend: Math.random() * 20 - 10,
        viralPosts: Math.floor(Math.random() * 5),
        topPerformingTags: ['blockchain', 'discussion', 'news']
      },
      content: {
        avgPostLength: Math.floor(Math.random() * 200) + 100,
        mediaPostsRatio: Math.random() * 0.3 + 0.1,
        mostUsedTags: [
          { tag: 'blockchain', count: 15 },
          { tag: 'discussion', count: 12 },
          { tag: 'news', count: 8 }
        ],
        contentCategories: [
          { category: 'Discussion', percentage: 40 },
          { category: 'News', percentage: 30 },
          { category: 'Question', percentage: 20 },
          { category: 'Announcement', percentage: 10 }
        ]
      },
      healthScore: Math.floor(Math.random() * 30) + 70,
      healthIndicators: {
        memberRetention: Math.random() * 0.2 + 0.8,
        contentQuality: Math.random() * 0.3 + 0.7,
        moderationEfficiency: Math.random() * 0.2 + 0.8,
        communityGrowth: Math.random() * 0.4 + 0.6
      }
    };
  }

  private generateRecommendations(community: DAO, metrics: CommunityEngagementMetrics) {
    const recommendations = [];

    if (metrics.engagement.avgMemberEngagement < 0.3) {
      recommendations.push({
        type: 'engagement' as const,
        priority: 'high' as const,
        title: 'Boost Member Engagement',
        description: 'Consider hosting community events or creating interactive content to increase engagement.',
        actionable: true
      });
    }

    if (metrics.memberGrowth.growthRate < 5) {
      recommendations.push({
        type: 'growth' as const,
        priority: 'medium' as const,
        title: 'Accelerate Growth',
        description: 'Improve your community\'s discoverability by optimizing tags and description.',
        actionable: true
      });
    }

    if (metrics.content.avgPostLength < 50) {
      recommendations.push({
        type: 'content' as const,
        priority: 'low' as const,
        title: 'Encourage Detailed Posts',
        description: 'Promote longer, more detailed posts to improve content quality.',
        actionable: true
      });
    }

    return recommendations;
  }

  private generateActivityPatterns() {
    return {
      peakHours: [9, 12, 15, 18, 21], // Common peak hours
      peakDays: [1, 2, 3, 4], // Monday to Thursday
      seasonalTrends: [
        { period: 'Q1', activity: 85 },
        { period: 'Q2', activity: 92 },
        { period: 'Q3', activity: 78 },
        { period: 'Q4', activity: 95 }
      ]
    };
  }

  private generateTopMembers(community: DAO) {
    return community.members.slice(0, 5).map((pubkey, index) => ({
      pubkey,
      metric: ['posts', 'engagement', 'influence'][index % 3] as 'posts' | 'engagement' | 'influence',
      value: Math.floor(Math.random() * 100) + 20
    }));
  }

  private generateTopPosts() {
    return Array.from({ length: 3 }, (_, index) => ({
      postId: `post_${Date.now()}_${index}`,
      metric: ['engagement', 'reach', 'comments'][index] as 'engagement' | 'reach' | 'comments',
      value: Math.floor(Math.random() * 100) + 30
    }));
  }

  private identifyStrengths(memberCount: any, activityLevel: any, engagementRate: any, growthRate: any): string[] {
    const strengths = [];
    
    if (memberCount.percentile > 75) strengths.push('Large, active member base');
    if (activityLevel.percentile > 75) strengths.push('High activity levels');
    if (engagementRate.percentile > 75) strengths.push('Strong member engagement');
    if (growthRate.percentile > 75) strengths.push('Rapid growth trajectory');
    
    return strengths.length > 0 ? strengths : ['Stable community foundation'];
  }

  private identifyOpportunities(memberCount: any, activityLevel: any, engagementRate: any, growthRate: any): string[] {
    const opportunities = [];
    
    if (memberCount.percentile < 50) opportunities.push('Potential for significant member growth');
    if (activityLevel.percentile < 50) opportunities.push('Room to increase daily activity');
    if (engagementRate.percentile < 50) opportunities.push('Opportunities to boost engagement');
    if (growthRate.percentile < 50) opportunities.push('Growth acceleration potential');
    
    return opportunities.length > 0 ? opportunities : ['Optimize existing strengths'];
  }
}

export const analyticsService = new AnalyticsService(); 