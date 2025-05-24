'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { AnalyticsDashboardData } from '@/types/dao';

interface AnalyticsChartsProps {
  data: AnalyticsDashboardData;
  loading: boolean;
  type: 'overview' | 'growth' | 'engagement';
}

export function AnalyticsCharts({ data, loading, type }: AnalyticsChartsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1'];

  const renderOverviewCharts = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Member Growth Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Member Growth</CardTitle>
          <CardDescription>Total members over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data.charts.memberGrowth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
                formatter={(value: number, name: string) => [value, name === 'members' ? 'Total Members' : 'New Members']}
              />
              <Area 
                type="monotone" 
                dataKey="members" 
                stroke="#8884d8" 
                fill="#8884d8" 
                fillOpacity={0.3}
              />
              <Area 
                type="monotone" 
                dataKey="newMembers" 
                stroke="#82ca9d" 
                fill="#82ca9d" 
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Activity Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Trend</CardTitle>
          <CardDescription>Posts, comments, and reactions over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.charts.activityTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
              />
              <Line type="monotone" dataKey="posts" stroke="#8884d8" strokeWidth={2} />
              <Line type="monotone" dataKey="comments" stroke="#82ca9d" strokeWidth={2} />
              <Line type="monotone" dataKey="reactions" stroke="#ffc658" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Tags Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Popular Tags</CardTitle>
          <CardDescription>Most used tags in the community</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.charts.topTags.slice(0, 8)} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis dataKey="tag" type="category" tick={{ fontSize: 12 }} width={80} />
              <Tooltip />
              <Bar dataKey="count" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Membership Funnel */}
      <Card>
        <CardHeader>
          <CardTitle>Membership Funnel</CardTitle>
          <CardDescription>User journey from discovery to joining</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.charts.membershipFunnel}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="stage" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                formatter={(value: number, name: string) => [
                  name === 'count' ? value : `${value.toFixed(1)}%`,
                  name === 'count' ? 'Users' : 'Conversion Rate'
                ]}
              />
              <Bar dataKey="count" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );

  const renderGrowthCharts = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Member Growth Detailed */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Detailed Member Growth</CardTitle>
          <CardDescription>Member acquisition and retention trends</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={data.charts.memberGrowth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
              />
              <Area 
                type="monotone" 
                dataKey="members" 
                stackId="1"
                stroke="#8884d8" 
                fill="#8884d8" 
                fillOpacity={0.6}
              />
              <Area 
                type="monotone" 
                dataKey="newMembers" 
                stackId="2"
                stroke="#82ca9d" 
                fill="#82ca9d" 
                fillOpacity={0.6}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Growth Highlights */}
      <Card>
        <CardHeader>
          <CardTitle>Growth Highlights</CardTitle>
          <CardDescription>Key growth metrics</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">New Member Spike</span>
            <Badge variant="secondary">
              {data.highlights.newMemberSpike.count} members on {data.highlights.newMemberSpike.date}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Most Active Day</span>
            <Badge variant="secondary">
              {data.highlights.mostActiveDay.activity} activities on {data.highlights.mostActiveDay.date}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Rising Topic</span>
            <Badge variant="secondary">
              #{data.highlights.risingTopic.tag} (+{data.highlights.risingTopic.growth}%)
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Tag Growth */}
      <Card>
        <CardHeader>
          <CardTitle>Tag Growth</CardTitle>
          <CardDescription>Trending topics and their growth</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.charts.topTags.slice(0, 6)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="tag" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="growth" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );

  const renderEngagementCharts = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Activity Heatmap */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Activity Heatmap</CardTitle>
          <CardDescription>When your community is most active (by hour and day)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-24 gap-1">
            {Array.from({ length: 7 }).map((_, day) => (
              <div key={day} className="col-span-24 grid grid-cols-24 gap-1">
                {Array.from({ length: 24 }).map((_, hour) => {
                  const heatmapData = data.charts.engagementHeatmap.find(
                    item => item.day === day && item.hour === hour
                  );
                  const intensity = heatmapData ? heatmapData.value / 100 : 0;
                  return (
                    <div
                      key={`${day}-${hour}`}
                      className="aspect-square rounded-sm"
                      style={{
                        backgroundColor: `rgba(136, 132, 216, ${intensity})`,
                        minHeight: '12px'
                      }}
                      title={`${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day]} ${hour}:00 - Activity: ${Math.round(intensity * 100)}%`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span>12 AM</span>
            <span>6 AM</span>
            <span>12 PM</span>
            <span>6 PM</span>
            <span>11 PM</span>
          </div>
        </CardContent>
      </Card>

      {/* Engagement Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Engagement Types</CardTitle>
          <CardDescription>Distribution of engagement activities</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={[
                  { name: 'Posts', value: 30 },
                  { name: 'Comments', value: 45 },
                  { name: 'Reactions', value: 25 }
                ]}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {[
                  { name: 'Posts', value: 30 },
                  { name: 'Comments', value: 45 },
                  { name: 'Reactions', value: 25 }
                ].map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Performing Content */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Content</CardTitle>
          <CardDescription>Most engaging posts this period</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div>
              <p className="font-medium">{data.highlights.topPost.title}</p>
              <p className="text-sm text-muted-foreground">Post ID: {data.highlights.topPost.id.slice(0, 8)}...</p>
            </div>
            <Badge variant="secondary">
              {data.highlights.topPost.engagement} engagements
            </Badge>
          </div>
          <div className="text-sm text-muted-foreground">
            This post received significantly higher engagement than average posts in your community.
          </div>
        </CardContent>
      </Card>
    </div>
  );

  switch (type) {
    case 'growth':
      return renderGrowthCharts();
    case 'engagement':
      return renderEngagementCharts();
    default:
      return renderOverviewCharts();
  }
} 