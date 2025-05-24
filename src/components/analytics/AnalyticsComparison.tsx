'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  MessageSquare, 
  Heart,
  Target,
  Award,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';
import { CommunityComparison } from '@/types/dao';
import { useAnalytics } from '@/hooks/useAnalytics';

interface AnalyticsComparisonProps {
  comparison: CommunityComparison | null;
  loading: boolean;
  communityId: string;
}

export function AnalyticsComparison({ comparison, loading, communityId }: AnalyticsComparisonProps) {
  const [compareWith, setCompareWith] = useState<'similar' | 'trending' | 'category_average'>('similar');
  const { loadComparison } = useAnalytics(communityId);

  const handleCompareWithChange = (value: 'similar' | 'trending' | 'category_average') => {
    setCompareWith(value);
    loadComparison(value);
  };

  if (loading || !comparison) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
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

  const getPercentileColor = (percentile: number) => {
    if (percentile >= 75) return 'text-green-600';
    if (percentile >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPercentileBadge = (percentile: number) => {
    if (percentile >= 75) return { variant: 'default', label: 'Excellent' };
    if (percentile >= 50) return { variant: 'secondary', label: 'Good' };
    return { variant: 'destructive', label: 'Needs Improvement' };
  };

  const getBenchmarkColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const metrics = [
    {
      name: 'Member Count',
      icon: Users,
      value: comparison.metrics.memberCount.value,
      percentile: comparison.metrics.memberCount.percentile,
      trend: comparison.metrics.memberCount.trend,
      description: 'Total community members'
    },
    {
      name: 'Activity Level',
      icon: MessageSquare,
      value: comparison.metrics.activityLevel.value,
      percentile: comparison.metrics.activityLevel.percentile,
      trend: comparison.metrics.activityLevel.trend,
      description: 'Daily activity score'
    },
    {
      name: 'Engagement Rate',
      icon: Heart,
      value: `${(comparison.metrics.engagementRate.value * 100).toFixed(1)}%`,
      percentile: comparison.metrics.engagementRate.percentile,
      trend: comparison.metrics.engagementRate.trend,
      description: 'Member engagement percentage'
    },
    {
      name: 'Growth Rate',
      icon: TrendingUp,
      value: `${comparison.metrics.growthRate.value.toFixed(1)}%`,
      percentile: comparison.metrics.growthRate.percentile,
      trend: comparison.metrics.growthRate.trend,
      description: 'Monthly growth rate'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Community Comparison</h3>
          <p className="text-sm text-muted-foreground">
            See how your community performs compared to others
          </p>
        </div>
        <Select value={compareWith} onValueChange={handleCompareWithChange}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="similar">Similar Communities</SelectItem>
            <SelectItem value="trending">Trending Communities</SelectItem>
            <SelectItem value="category_average">Category Average</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Benchmark Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Overall Benchmark Score
          </CardTitle>
          <CardDescription>
            Your community's performance compared to {compareWith.replace('_', ' ')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="text-center">
              <div className={`text-4xl font-bold ${getBenchmarkColor(comparison.benchmarkScore)}`}>
                {comparison.benchmarkScore}
              </div>
              <div className="text-sm text-muted-foreground">out of 100</div>
            </div>
            <div className="flex-1 ml-8">
              <Progress value={comparison.benchmarkScore} className="h-3" />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>0</span>
                <span>50</span>
                <span>100</span>
              </div>
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            {comparison.benchmarkScore >= 80 
              ? "Your community is performing exceptionally well!"
              : comparison.benchmarkScore >= 60
                ? "Your community is performing well with room for improvement."
                : "There are significant opportunities to improve your community's performance."
            }
          </div>
        </CardContent>
      </Card>

      {/* Metrics Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          const badge = getPercentileBadge(metric.percentile);
          
          return (
            <Card key={index}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Icon className="h-4 w-4" />
                  {metric.name}
                </CardTitle>
                <CardDescription>{metric.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold">{metric.value}</span>
                    <Badge variant={badge.variant as any}>
                      {badge.label}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Percentile</span>
                      <span className={getPercentileColor(metric.percentile)}>
                        {metric.percentile.toFixed(0)}th
                      </span>
                    </div>
                    <Progress value={metric.percentile} className="h-2" />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Trend</span>
                    {formatTrend(metric.trend)}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Strengths and Opportunities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Strengths */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              Strengths
            </CardTitle>
            <CardDescription>
              Areas where your community excels
            </CardDescription>
          </CardHeader>
          <CardContent>
            {comparison.strengths.length > 0 ? (
              <ul className="space-y-2">
                {comparison.strengths.map((strength, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{strength}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-sm text-muted-foreground">
                No specific strengths identified yet. Keep building your community!
              </div>
            )}
          </CardContent>
        </Card>

        {/* Opportunities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-600">
              <AlertCircle className="h-5 w-5" />
              Opportunities
            </CardTitle>
            <CardDescription>
              Areas with potential for improvement
            </CardDescription>
          </CardHeader>
          <CardContent>
            {comparison.opportunities.length > 0 ? (
              <ul className="space-y-2">
                {comparison.opportunities.map((opportunity, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{opportunity}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-sm text-muted-foreground">
                Your community is performing well across all metrics!
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Comparison Context */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            About This Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground space-y-2">
            <p>
              <strong>Comparing with:</strong> {
                compareWith === 'similar' ? 'Communities with similar size and category' :
                compareWith === 'trending' ? 'Currently trending communities' :
                'Average performance in your category'
              }
            </p>
            <p>
              <strong>Percentile:</strong> Shows what percentage of communities you outperform in each metric.
            </p>
            <p>
              <strong>Trend:</strong> Recent change in performance compared to the comparison group.
            </p>
            <p>
              <strong>Benchmark Score:</strong> Overall performance score calculated from all metrics.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 