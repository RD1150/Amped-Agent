import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, TrendingUp, Eye, Heart, MessageCircle, Share2, MousePointerClick } from "lucide-react";
import { format } from "date-fns";
import DashboardLayout from "@/components/DashboardLayout";

export default function Analytics() {
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date(),
  });

  const { data: metrics, isLoading: metricsLoading } = trpc.analytics.getMetrics.useQuery({
    startDate: dateRange.from,
    endDate: dateRange.to,
  });

  const { data: topPosts, isLoading: topPostsLoading } = trpc.analytics.getTopPosts.useQuery({
    limit: 10,
    startDate: dateRange.from,
    endDate: dateRange.to,
  });

  const { data: trends, isLoading: trendsLoading } = trpc.analytics.getTrends.useQuery({
    startDate: dateRange.from,
    endDate: dateRange.to,
    groupBy: "day",
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Track your content performance and engagement metrics
            </p>
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[280px] justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange.from && dateRange.to ? (
                  <>
                    {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                  </>
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <div className="p-4 space-y-4">
                <div>
                  <label className="text-sm font-medium">From</label>
                  <Calendar
                    mode="single"
                    selected={dateRange.from}
                    onSelect={(date) => date && setDateRange({ ...dateRange, from: date })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">To</label>
                  <Calendar
                    mode="single"
                    selected={dateRange.to}
                    onSelect={(date) => date && setDateRange({ ...dateRange, to: date })}
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {metricsLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-1/2" />
                  <div className="h-8 bg-muted rounded w-3/4 mt-2" />
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.totalViews.toLocaleString() || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Across {metrics?.totalPosts || 0} posts
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Likes</CardTitle>
                <Heart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.totalLikes.toLocaleString() || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {metrics?.totalPosts ? ((metrics.totalLikes / metrics.totalPosts)).toFixed(1) : 0} per post
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Comments</CardTitle>
                <MessageCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.totalComments.toLocaleString() || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {metrics?.totalPosts ? ((metrics.totalComments / metrics.totalPosts)).toFixed(1) : 0} per post
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Shares</CardTitle>
                <Share2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.totalShares.toLocaleString() || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {metrics?.totalPosts ? ((metrics.totalShares / metrics.totalPosts)).toFixed(1) : 0} per post
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
                <MousePointerClick className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.totalClicks.toLocaleString() || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {metrics?.totalPosts ? ((metrics.totalClicks / metrics.totalPosts)).toFixed(1) : 0} per post
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Engagement Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {((metrics?.avgEngagement || 0) * 100).toFixed(2)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Likes + Comments + Shares / Views
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Top Performing Posts</CardTitle>
            <CardDescription>
              Your best content ranked by total engagement
            </CardDescription>
          </CardHeader>
          <CardContent>
            {topPostsLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse flex items-center space-x-4">
                    <div className="h-12 w-12 bg-muted rounded" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : topPosts && topPosts.length > 0 ? (
              <div className="space-y-4">
                {topPosts.map((post, index) => (
                  <div key={post.contentPostId} className="flex items-center space-x-4 p-4 rounded-lg border">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">Post #{post.contentPostId}</p>
                      <p className="text-xs text-muted-foreground">
                        {post.platforms.join(", ")}
                      </p>
                    </div>
                    <div className="flex items-center space-x-6 text-sm">
                      <div className="text-center">
                        <div className="font-semibold">{post.totalViews.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">Views</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold">{post.totalLikes.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">Likes</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold">{post.totalComments.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">Comments</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold">{post.totalShares.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">Shares</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-primary">{post.totalEngagement.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">Total</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <TrendingUp className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-semibold">No analytics data yet</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Start creating and publishing content to see performance metrics
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Engagement Trends</CardTitle>
            <CardDescription>
              Track how your content performs over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            {trendsLoading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : trends && trends.length > 0 ? (
              <div className="space-y-2">
                {trends.slice(0, 10).map((trend, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center space-x-4">
                      <div className="text-sm font-medium">
                        {format(new Date(trend.date), "MMM dd")}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {trend.platform}
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 text-sm">
                      <div>{trend.views} views</div>
                      <div>{trend.likes} likes</div>
                      <div>{trend.comments} comments</div>
                      <div>{trend.shares} shares</div>
                      <div className="font-semibold text-primary">
                        {(trend.engagement * 100).toFixed(1)}% engagement
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <TrendingUp className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-semibold">No trend data available</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Analytics will appear here once you have published content
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
