'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Users, 
  MessageSquare, 
  Heart, 
  TrendingUp, 
  TrendingDown,
  Activity,
  Target
} from 'lucide-react';
import { AnalyticsDashboardData } from '@/types/dao';

interface AnalyticsOverviewCardsProps {
  data: AnalyticsDashboardData | null;
  loading: boolean;
  timeRange: string;
}

export function AnalyticsOverviewCards({ data, loading, timeRange }: AnalyticsOverviewCardsProps) {
  if (loading || !data) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-4 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const formatChange = (change: number) => {
    const isPositive = change >= 0;
    const Icon = isPositive ? TrendingUp : TrendingDown;
    const color = isPositive ? 'text-green-600' : 'text-red-600';
    
    return (
      <div className={`flex items-center gap-1 text-sm ${color}`}>
        <Icon className="h-3 w-3" />
        {Math.abs(change).toFixed(1)}%
      </div>
    );
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const formatPercentage = (num: number) => {
    return `${(num * 100).toFixed(1)}%`;
  };

  const cards = [
    {
      title: 'Total Members',
      value: formatNumber(data.overview.totalMembers),
      change: data.overview.memberChange,
      icon: Users,
      description: `${Math.abs(data.overview.memberChange)} ${data.overview.memberChange >= 0 ? 'new' : 'lost'} this period`
    },
    {
      title: 'Total Posts',
      value: formatNumber(data.overview.totalPosts),
      change: data.overview.postChange,
      icon: MessageSquare,
      description: `${Math.abs(data.overview.postChange)} ${data.overview.postChange >= 0 ? 'more' : 'fewer'} than last period`
    },
    {
      title: 'Engagement Rate',
      value: formatPercentage(data.overview.engagementRate),
      change: data.overview.engagementChange,
      icon: Heart,
      description: 'Average post engagement'
    },
    {
      title: 'Health Score',
      value: Math.round(data.overview.healthScore).toString(),
      change: data.overview.healthChange,
      icon: Target,
      description: 'Overall community health',
      suffix: '/100'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        const isHealthScore = card.title === 'Health Score';
        const healthColor = isHealthScore 
          ? data.overview.healthScore >= 80 
            ? 'text-green-600' 
            : data.overview.healthScore >= 60 
              ? 'text-yellow-600' 
              : 'text-red-600'
          : '';

        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className={`text-2xl font-bold ${healthColor}`}>
                    {card.value}
                    {card.suffix && (
                      <span className="text-sm text-muted-foreground">{card.suffix}</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {card.description}
                  </p>
                </div>
                <div className="text-right">
                  {formatChange(card.change)}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
} 