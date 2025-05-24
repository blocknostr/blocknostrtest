'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  MessageSquare, 
  Heart, 
  BarChart3,
  Calendar,
  Target,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Download
} from 'lucide-react';
import { useAnalytics } from '@/hooks/useAnalytics';
import { AnalyticsOverviewCards } from './AnalyticsOverviewCards';
import { AnalyticsCharts } from './AnalyticsCharts';
import { AnalyticsInsights } from './AnalyticsInsights';
import { AnalyticsAlerts } from './AnalyticsAlerts';
import { AnalyticsComparison } from './AnalyticsComparison';

interface AnalyticsDashboardProps {
  communityId: string;
  isOwner?: boolean;
  isModerator?: boolean;
}

export function AnalyticsDashboard({ 
  communityId, 
  isOwner = false, 
  isModerator = false 
}: AnalyticsDashboardProps) {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [activeTab, setActiveTab] = useState('overview');

  const {
    dashboardData,
    dashboardLoading,
    dashboardError,
    loadDashboardData,
    insights,
    insightsLoading,
    comparison,
    comparisonLoading,
    alerts,
    alertsLoading,
    refreshAll
  } = useAnalytics(communityId);

  const handleTimeRangeChange = (newTimeRange: '7d' | '30d' | '90d' | '1y') => {
    setTimeRange(newTimeRange);
    loadDashboardData(newTimeRange);
  };

  const handleRefresh = () => {
    refreshAll();
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Exporting analytics data...');
  };

  if (!isOwner && !isModerator) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Access Restricted</h3>
            <p className="text-muted-foreground">
              Analytics are only available to community owners and moderators.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (dashboardError) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Error Loading Analytics</h3>
            <p className="text-muted-foreground mb-4">{dashboardError}</p>
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Community Analytics</h2>
          <p className="text-muted-foreground">
            Track your community's performance and growth
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={handleTimeRangeChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <AnalyticsAlerts 
          alerts={alerts} 
          loading={alertsLoading}
          communityId={communityId}
        />
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="growth">Growth</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="comparison">Comparison</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <AnalyticsOverviewCards 
            data={dashboardData} 
            loading={dashboardLoading}
            timeRange={timeRange}
          />
          
          {dashboardData && (
            <AnalyticsCharts 
              data={dashboardData} 
              loading={dashboardLoading}
              type="overview"
            />
          )}
        </TabsContent>

        <TabsContent value="growth" className="space-y-6">
          {dashboardData && (
            <AnalyticsCharts 
              data={dashboardData} 
              loading={dashboardLoading}
              type="growth"
            />
          )}
        </TabsContent>

        <TabsContent value="engagement" className="space-y-6">
          {dashboardData && (
            <AnalyticsCharts 
              data={dashboardData} 
              loading={dashboardLoading}
              type="engagement"
            />
          )}
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <AnalyticsInsights 
            insights={insights}
            loading={insightsLoading}
            communityId={communityId}
          />
        </TabsContent>

        <TabsContent value="comparison" className="space-y-6">
          <AnalyticsComparison 
            comparison={comparison}
            loading={comparisonLoading}
            communityId={communityId}
          />
        </TabsContent>
      </Tabs>

      {/* Last Updated */}
      {dashboardData && (
        <div className="text-center text-sm text-muted-foreground">
          Last updated: {new Date(dashboardData.lastUpdated * 1000).toLocaleString()}
        </div>
      )}
    </div>
  );
} 