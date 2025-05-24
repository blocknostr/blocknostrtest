'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  MessageSquare, 
  Heart,
  Target,
  Lightbulb,
  Star,
  Award,
  Clock,
  Calendar
} from 'lucide-react';
import { CommunityInsights } from '@/types/dao';

interface AnalyticsInsightsProps {
  insights: CommunityInsights | null;
  loading: boolean;
  communityId: string;
}

export function AnalyticsInsights({ insights, loading, communityId }: AnalyticsInsightsProps) {
  if (loading || !insights) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const formatTrend = (trend: number) => {
    const isPositive = trend >= 0;
    const Icon = isPositive ? TrendingUp : TrendingDown;
    const color = isPositive ? 'text-green-600' : 'text-red-600';
    
    return (
      <div className={`flex items-center gap-1 text-sm ${color}`}>
        <Icon className="h-3 w-3" />
        {Math.abs(trend).toFixed(1)}%
      </div>
    );
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'growth': return Users;
      case 'engagement': return Heart;
      case 'content': return MessageSquare;
      case 'moderation': return Target;
      default: return Lightbulb;
    }
  };

  return (
    <div className="space-y-6">
      {/* KPIs Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Members</p>
                <p className="text-2xl font-bold">{insights.kpis.totalMembers}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Members</p>
                <p className="text-2xl font-bold">{insights.kpis.activeMembers}</p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Retention Rate</p>
                <p className="text-2xl font-bold">{(insights.kpis.memberRetentionRate * 100).toFixed(1)}%</p>
              </div>
              <Target className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Daily Posts</p>
                <p className="text-2xl font-bold">{insights.kpis.avgDailyPosts.toFixed(1)}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Engagement</p>
                <p className="text-2xl font-bold">{(insights.kpis.engagementRate * 100).toFixed(1)}%</p>
              </div>
              <Heart className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Health Score</p>
                <p className={`text-2xl font-bold ${
                  insights.kpis.healthScore >= 80 ? 'text-green-600' :
                  insights.kpis.healthScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {Math.round(insights.kpis.healthScore)}
                </p>
              </div>
              <Target className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Growth Trends</CardTitle>
            <CardDescription>Week-over-week changes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Member Growth</span>
              {formatTrend(insights.trends.memberGrowth)}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Activity Growth</span>
              {formatTrend(insights.trends.activityGrowth)}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Engagement Growth</span>
              {formatTrend(insights.trends.engagementGrowth)}
            </div>
          </CardContent>
        </Card>

        {/* Activity Patterns */}
        <Card>
          <CardHeader>
            <CardTitle>Activity Patterns</CardTitle>
            <CardDescription>When your community is most active</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Peak Hours</p>
              <div className="flex flex-wrap gap-1">
                {insights.activityPatterns.peakHours.map(hour => (
                  <Badge key={hour} variant="secondary">
                    {hour}:00
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Peak Days</p>
              <div className="flex flex-wrap gap-1">
                {insights.activityPatterns.peakDays.map(day => (
                  <Badge key={day} variant="secondary">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day]}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Seasonal Trends</p>
              <div className="space-y-2">
                {insights.activityPatterns.seasonalTrends.map(trend => (
                  <div key={trend.period} className="flex items-center justify-between">
                    <span className="text-sm">{trend.period}</span>
                    <div className="flex items-center gap-2">
                      <Progress value={trend.activity} className="w-16" />
                      <span className="text-sm text-muted-foreground">{trend.activity}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Members */}
        <Card>
          <CardHeader>
            <CardTitle>Top Contributors</CardTitle>
            <CardDescription>Most active community members</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {insights.topMembers.map((member, index) => (
              <div key={member.pubkey} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-full text-sm font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium">{member.pubkey.slice(0, 8)}...{member.pubkey.slice(-4)}</p>
                    <p className="text-sm text-muted-foreground capitalize">{member.metric}</p>
                  </div>
                </div>
                <Badge variant="secondary">
                  {member.value} {member.metric}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Top Posts */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Posts</CardTitle>
            <CardDescription>Most engaging content this period</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {insights.topPosts.map((post, index) => (
              <div key={post.postId} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-secondary text-secondary-foreground rounded-full text-sm font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium">Post {post.postId.slice(0, 8)}...</p>
                    <p className="text-sm text-muted-foreground capitalize">{post.metric}</p>
                  </div>
                </div>
                <Badge variant="secondary">
                  {post.value}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recommendations</CardTitle>
            <CardDescription>AI-powered suggestions to improve your community</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {insights.recommendations.map((rec, index) => {
              const Icon = getRecommendationIcon(rec.type);
              return (
                <div key={index} className="flex items-start gap-4 p-4 border rounded-lg">
                  <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium">{rec.title}</h4>
                      <Badge variant={getPriorityColor(rec.priority) as any}>
                        {rec.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {rec.description}
                    </p>
                    {rec.actionable && (
                      <Button size="sm" variant="outline">
                        Take Action
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Generation Info */}
      <div className="text-center text-sm text-muted-foreground">
        <Clock className="h-4 w-4 inline mr-1" />
        Insights generated on {new Date(insights.generatedAt * 1000).toLocaleString()}
      </div>
    </div>
  );
} 