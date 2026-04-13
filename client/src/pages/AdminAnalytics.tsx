import { useAuth } from "@/_core/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { 
  Users, 
  CreditCard, 
  Video, 
  TrendingUp,
  Clock,
  AlertCircle,
  Crown,
  UserCheck,
  UserX,
  Timer
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
            <div className="w-12 h-12 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center">
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
              <div className="w-10 h-10 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
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
      <Card className="p-6 mb-6">
        <h3 className="text-xl font-semibold mb-4">Subscription Distribution</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-muted rounded-lg">
            <p className="text-3xl font-bold">{analytics.freeUsers}</p>
            <p className="text-sm text-muted-foreground">Starter (Inactive)</p>
          </div>
          <div className="text-center p-4 bg-muted rounded-lg">
            <p className="text-3xl font-bold">{analytics.proUsers}</p>
            <p className="text-sm text-muted-foreground">Pro</p>
          </div>
          <div className="text-center p-4 bg-muted rounded-lg">
            <p className="text-3xl font-bold">{analytics.premiumUsers}</p>
            <p className="text-sm text-muted-foreground">Authority</p>
          </div>
        </div>
        <div className="mt-4 p-4 bg-primary/10 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-primary">Paid Conversion Rate</p>
              <p className="text-sm text-primary">
                {((analytics.proUsers + analytics.premiumUsers) / analytics.totalUsers * 100).toFixed(1)}% of users have upgraded to paid plans
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Trial Conversion Funnel */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-1">Trial Conversion Funnel</h3>
        <p className="text-sm text-muted-foreground mb-6">Track how users move through the 14-day free trial</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {/* Currently Trialing */}
          <div className="flex flex-col gap-2 p-4 bg-primary/5 border border-primary/20 rounded-xl">
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Active Trials</span>
            </div>
            <p className="text-3xl font-bold">{analytics.trialingUsers}</p>
            <p className="text-xs text-muted-foreground">Currently on 14-day trial</p>
          </div>

          {/* Ending Soon */}
          <div className="flex flex-col gap-2 p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl">
            <div className="flex items-center gap-2">
              <Timer className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Ending Soon</span>
            </div>
            <p className="text-3xl font-bold text-amber-600">{analytics.trialEndingSoon}</p>
            <p className="text-xs text-muted-foreground">Trial ends within 3 days</p>
          </div>

          {/* Converted */}
          <div className="flex flex-col gap-2 p-4 bg-green-500/5 border border-green-500/20 rounded-xl">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-green-500" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Converted</span>
            </div>
            <p className="text-3xl font-bold text-green-600">{analytics.convertedFromTrial}</p>
            <p className="text-xs text-muted-foreground">Trial → Active subscriber</p>
          </div>

          {/* Churned */}
          <div className="flex flex-col gap-2 p-4 bg-red-500/5 border border-red-500/20 rounded-xl">
            <div className="flex items-center gap-2">
              <UserX className="w-4 h-4 text-red-500" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Churned</span>
            </div>
            <p className="text-3xl font-bold text-red-600">{analytics.churnedAfterTrial}</p>
            <p className="text-xs text-muted-foreground">Trial ended, no conversion</p>
          </div>
        </div>

        {/* Conversion Rate Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Trial-to-Paid Conversion Rate</span>
            <span className="text-2xl font-bold text-primary">{analytics.trialConversionRate}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
            <div
              className="h-3 rounded-full bg-primary transition-all duration-700"
              style={{ width: `${analytics.trialConversionRate}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {analytics.convertedFromTrial} converted out of {analytics.convertedFromTrial + analytics.churnedAfterTrial} completed trials
          </p>
        </div>
      </Card>
    </div>
  );
}
