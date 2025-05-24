'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  AnalyticsDashboardData,
  CommunityInsights,
  CommunityComparison,
  AnalyticsAlert,
  MemberAnalytics,
  AnalyticsEvent
} from '@/types/dao';
import { analyticsService } from '@/lib/dao/analytics-service';

export function useAnalytics(communityId?: string) {
  // Dashboard data state
  const [dashboardData, setDashboardData] = useState<AnalyticsDashboardData | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState<string | null>(null);

  // Insights state
  const [insights, setInsights] = useState<CommunityInsights | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsError, setInsightsError] = useState<string | null>(null);

  // Comparison state
  const [comparison, setComparison] = useState<CommunityComparison | null>(null);
  const [comparisonLoading, setComparisonLoading] = useState(false);
  const [comparisonError, setComparisonError] = useState<string | null>(null);

  // Alerts state
  const [alerts, setAlerts] = useState<AnalyticsAlert[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [alertsError, setAlertsError] = useState<string | null>(null);

  // Member analytics state
  const [memberAnalytics, setMemberAnalytics] = useState<MemberAnalytics | null>(null);
  const [memberAnalyticsLoading, setMemberAnalyticsLoading] = useState(false);
  const [memberAnalyticsError, setMemberAnalyticsError] = useState<string | null>(null);

  // Load dashboard data
  const loadDashboardData = useCallback(async (timeRange: '7d' | '30d' | '90d' | '1y' = '30d') => {
    if (!communityId) return;

    setDashboardLoading(true);
    setDashboardError(null);

    try {
      const data = await analyticsService.getDashboardData(communityId, timeRange);
      setDashboardData(data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setDashboardError(error instanceof Error ? error.message : 'Failed to load dashboard data');
    } finally {
      setDashboardLoading(false);
    }
  }, [communityId]);

  // Load community insights
  const loadInsights = useCallback(async () => {
    if (!communityId) return;

    setInsightsLoading(true);
    setInsightsError(null);

    try {
      const data = await analyticsService.getCommunityInsights(communityId);
      setInsights(data);
    } catch (error) {
      console.error('Error loading insights:', error);
      setInsightsError(error instanceof Error ? error.message : 'Failed to load insights');
    } finally {
      setInsightsLoading(false);
    }
  }, [communityId]);

  // Load community comparison
  const loadComparison = useCallback(async (compareWith: 'similar' | 'trending' | 'category_average' = 'similar') => {
    if (!communityId) return;

    setComparisonLoading(true);
    setComparisonError(null);

    try {
      const data = await analyticsService.getCommunityComparison(communityId, compareWith);
      setComparison(data);
    } catch (error) {
      console.error('Error loading comparison:', error);
      setComparisonError(error instanceof Error ? error.message : 'Failed to load comparison');
    } finally {
      setComparisonLoading(false);
    }
  }, [communityId]);

  // Load analytics alerts
  const loadAlerts = useCallback(async () => {
    if (!communityId) return;

    setAlertsLoading(true);
    setAlertsError(null);

    try {
      const data = await analyticsService.getAnalyticsAlerts(communityId);
      setAlerts(data);
    } catch (error) {
      console.error('Error loading alerts:', error);
      setAlertsError(error instanceof Error ? error.message : 'Failed to load alerts');
    } finally {
      setAlertsLoading(false);
    }
  }, [communityId]);

  // Load member analytics
  const loadMemberAnalytics = useCallback(async (memberPubkey: string) => {
    if (!communityId) return;

    setMemberAnalyticsLoading(true);
    setMemberAnalyticsError(null);

    try {
      const data = await analyticsService.getMemberAnalytics(communityId, memberPubkey);
      setMemberAnalytics(data);
    } catch (error) {
      console.error('Error loading member analytics:', error);
      setMemberAnalyticsError(error instanceof Error ? error.message : 'Failed to load member analytics');
    } finally {
      setMemberAnalyticsLoading(false);
    }
  }, [communityId]);

  // Track analytics event
  const trackEvent = useCallback((event: Omit<AnalyticsEvent, 'id' | 'timestamp'>) => {
    analyticsService.trackEvent(event);
  }, []);

  // Acknowledge alert
  const acknowledgeAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId 
        ? { ...alert, acknowledged: true, acknowledgedBy: 'current_user' }
        : alert
    ));
  }, []);

  // Refresh all data
  const refreshAll = useCallback(async () => {
    if (!communityId) return;

    await Promise.all([
      loadDashboardData(),
      loadInsights(),
      loadComparison(),
      loadAlerts()
    ]);
  }, [communityId, loadDashboardData, loadInsights, loadComparison, loadAlerts]);

  // Auto-load data when community changes
  useEffect(() => {
    if (communityId) {
      refreshAll();
    }
  }, [communityId, refreshAll]);

  return {
    // Dashboard data
    dashboardData,
    dashboardLoading,
    dashboardError,
    loadDashboardData,

    // Insights
    insights,
    insightsLoading,
    insightsError,
    loadInsights,

    // Comparison
    comparison,
    comparisonLoading,
    comparisonError,
    loadComparison,

    // Alerts
    alerts,
    alertsLoading,
    alertsError,
    loadAlerts,
    acknowledgeAlert,

    // Member analytics
    memberAnalytics,
    memberAnalyticsLoading,
    memberAnalyticsError,
    loadMemberAnalytics,

    // Utilities
    trackEvent,
    refreshAll
  };
} 