'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  Info, 
  TrendingUp, 
  TrendingDown,
  Users,
  MessageSquare,
  Shield,
  CheckCircle,
  X
} from 'lucide-react';
import { AnalyticsAlert } from '@/types/dao';
import { useAnalytics } from '@/hooks/useAnalytics';

interface AnalyticsAlertsProps {
  alerts: AnalyticsAlert[];
  loading: boolean;
  communityId: string;
}

export function AnalyticsAlerts({ alerts, loading, communityId }: AnalyticsAlertsProps) {
  const { acknowledgeAlert } = useAnalytics(communityId);

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <Alert key={i}>
            <div className="animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </div>
          </Alert>
        ))}
      </div>
    );
  }

  if (alerts.length === 0) {
    return null;
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return AlertTriangle;
      case 'warning': return AlertTriangle;
      case 'info': return Info;
      default: return Info;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'warning': return 'default';
      case 'info': return 'default';
      default: return 'default';
    }
  };

  const getAlertTypeIcon = (alertType: string) => {
    switch (alertType) {
      case 'growth_spike': return TrendingUp;
      case 'growth_decline': return TrendingDown;
      case 'engagement_drop': return MessageSquare;
      case 'spam_detected': return Shield;
      case 'health_warning': return AlertTriangle;
      default: return Info;
    }
  };

  const handleAcknowledge = (alertId: string) => {
    acknowledgeAlert(alertId);
  };

  const handleAction = (action: string) => {
    // TODO: Implement specific actions
    console.log('Executing action:', action);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Analytics Alerts</h3>
        <Badge variant="secondary">
          {alerts.filter(alert => !alert.acknowledged).length} unread
        </Badge>
      </div>

      {alerts.map((alert) => {
        const SeverityIcon = getSeverityIcon(alert.severity);
        const AlertTypeIcon = getAlertTypeIcon(alert.alertType);
        const severityColor = getSeverityColor(alert.severity);

        return (
          <Alert key={alert.id} className={`${alert.acknowledged ? 'opacity-60' : ''}`}>
            <div className="flex items-start gap-4">
              <div className="flex items-center gap-2">
                <SeverityIcon className={`h-4 w-4 ${
                  alert.severity === 'critical' ? 'text-red-500' :
                  alert.severity === 'warning' ? 'text-yellow-500' : 'text-blue-500'
                }`} />
                <AlertTypeIcon className="h-4 w-4 text-muted-foreground" />
              </div>
              
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <AlertTitle className="flex items-center gap-2">
                    {alert.title}
                    <Badge variant={severityColor as any} className="text-xs">
                      {alert.severity}
                    </Badge>
                  </AlertTitle>
                  
                  <div className="flex items-center gap-2">
                    {alert.acknowledged ? (
                      <Badge variant="outline" className="text-xs">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Acknowledged
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleAcknowledge(alert.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                <AlertDescription className="mb-3">
                  {alert.description}
                </AlertDescription>

                <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                  <span>
                    {alert.metric}: {alert.currentValue} 
                    {alert.threshold && ` (threshold: ${alert.threshold})`}
                  </span>
                  <span>
                    {new Date(alert.triggeredAt * 1000).toLocaleString()}
                  </span>
                </div>

                {alert.actions.length > 0 && !alert.acknowledged && (
                  <div className="flex flex-wrap gap-2">
                    {alert.actions.map((action, index) => (
                      <Button
                        key={index}
                        size="sm"
                        variant="outline"
                        onClick={() => handleAction(action.action)}
                      >
                        {action.label}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Alert>
        );
      })}
    </div>
  );
} 