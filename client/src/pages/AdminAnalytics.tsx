import { useAuth } from "@/_core/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { 
  Users, 
  CreditCard, 
  Video, 
  TrendingUp,
  Clock,
  AlertCircle 
} from "lucide-react";
import { Redirect } from "wouter";

export default function AdminAnalytics() {
  const { user } = useAuth();
  const { data: analytics, isLoading } = trpc.admin.getAnalytics.useQuery();

  // Redirect if not admin
  if (user && user.role !== "admin") {
    return <Redirect to="/" />;
  }

  if (isLoading || !analytics) {
    return (
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-4xl font-bold mb-8">Admin Analytics</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="h-24 bg-muted rounded"></div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Admin Analytics</h1>
        <p className="text-muted-foreground">
          Platform metrics and user insights
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Users */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-primary/10 dark:bg-primary/10 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-primary dark:text-primary" />
            </div>
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>
          <h3 className="text-2xl font-bold">{analytics.totalUsers}</h3>
          <p className="text-sm text-muted-foreground">Total Users</p>
          <p className="text-xs text-primary mt-2">
            +{analytics.newUsersToday} today
          </p>
        </Card>

        {/* Daily Active Users */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-primary dark:text-green-400" />
            </div>
          </div>
          <h3 className="text-2xl font-bold">{analytics.dailyActiveUsers}</h3>
          <p className="text-sm text-muted-foreground">Daily Active Users</p>
          <p className="text-xs text-muted-foreground mt-2">
            {((analytics.dailyActiveUsers / analytics.totalUsers) * 100).toFixed(1)}% of total
          </p>
        </Card>

        {/* Credit Purchases */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-primary/10 dark:bg-primary/10 rounded-full flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-primary dark:text-primary" />
            </div>
          </div>
          <h3 className="text-2xl font-bold">${analytics.totalRevenue.toLocaleString()}</h3>
          <p className="text-sm text-muted-foreground">Total Revenue</p>
          <p className="text-xs text-muted-foreground mt-2">
            {analytics.creditPurchases} purchases
          </p>
        </Card>

        {/* Videos Generated */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center">
              <Video className="w-6 h-6 text-primary dark:text-primary/80" />
            </div>
          </div>
          <h3 className="text-2xl font-bold">{analytics.totalVideos}</h3>
          <p className="text-sm text-muted-foreground">Videos Generated</p>
          <p className="text-xs text-muted-foreground mt-2">
            {analytics.videosToday} today
          </p>
        </Card>
      </div>

      {/* Video Generation Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-4">Video Generation by Tier</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm">Standard (Free)</span>
                <span className="text-sm font-medium">{analytics.standardVideos}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full" 
                  style={{ width: `${(analytics.standardVideos / analytics.totalVideos) * 100}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm">AI-Enhanced ($9.99)</span>
                <span className="text-sm font-medium">{analytics.aiEnhancedVideos}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full" 
                  style={{ width: `${(analytics.aiEnhancedVideos / analytics.totalVideos) * 100}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm">Full AI Cinematic ($29.99)</span>
                <span className="text-sm font-medium">{analytics.fullAiVideos}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full" 
                  style={{ width: `${(analytics.fullAiVideos / analytics.totalVideos) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-4">Rate Limit Insights</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-primary dark:text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium">{analytics.rateLimitHits} Users Hit Limit</p>
                <p className="text-sm text-muted-foreground">
                  {((analytics.rateLimitHits / analytics.dailyActiveUsers) * 100).toFixed(1)}% of active users today
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-5 h-5 text-primary dark:text-green-400" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Conversion Opportunity</p>
                <p className="text-sm text-muted-foreground">
                  Users hitting limits are prime candidates for paid plans
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Subscription Breakdown */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4">Subscription Distribution</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-muted rounded-lg">
            <p className="text-3xl font-bold">{analytics.freeUsers}</p>
            <p className="text-sm text-muted-foreground">Free Trial</p>
          </div>
          <div className="text-center p-4 bg-muted rounded-lg">
            <p className="text-3xl font-bold">{analytics.proUsers}</p>
            <p className="text-sm text-muted-foreground">Professional ($149)</p>
          </div>
          <div className="text-center p-4 bg-muted rounded-lg">
            <p className="text-3xl font-bold">{analytics.premiumUsers}</p>
            <p className="text-sm text-muted-foreground">Agency ($399)</p>
          </div>
        </div>
        <div className="mt-4 p-4 bg-primary/10 dark:bg-primary/10 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-primary dark:text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-primary dark:text-primary">Conversion Rate</p>
              <p className="text-sm text-primary dark:text-primary">
                {((analytics.proUsers + analytics.premiumUsers) / analytics.totalUsers * 100).toFixed(1)}% of users have upgraded to paid plans
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
