import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { 
  Sparkles, 
  Calendar, 
  Upload, 
  TrendingUp,
  FileText,
  Clock,
  HelpCircle
} from "lucide-react";
import { startDashboardTour, shouldShowTour } from "@/lib/productTour";

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { data: persona } = trpc.persona.get.useQuery();

  // Auto-start tour for first-time users
  useEffect(() => {
    if (shouldShowTour()) {
      // Delay to ensure DOM is ready
      setTimeout(() => {
        startDashboardTour();
      }, 1000);
    }
  }, []);

  // Get current hour for time-based greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const quickActions = [
    {
      title: "Generate Post",
      description: "Create AI-powered content for your audience",
      icon: Sparkles,
      href: "/generate",
      color: "bg-primary/10 text-primary"
    },
    {
      title: "Content Calendar",
      description: "View and manage your scheduled posts",
      icon: Calendar,
      href: "/",
      color: "bg-blue-500/10 text-blue-500"
    },
    {
      title: "Upload Content",
      description: "Import property listings or images",
      icon: Upload,
      href: "/uploads",
      color: "bg-green-500/10 text-green-500"
    }
  ];

  const gettingStartedSteps = [
    {
      title: "Complete Your Profile",
      description: "Add your headshot, DRE info, and branding",
      completed: persona?.isCompleted,
      href: "/persona"
    },
    {
      title: "Connect Social Accounts",
      description: "Link LinkedIn, Facebook, and Instagram",
      completed: false, // TODO: Check if integrations are connected
      href: "/integrations"
    },
    {
      title: "Generate Your First Post",
      description: "Create professional content in minutes",
      completed: false, // TODO: Check if user has generated posts
      href: "/generate"
    }
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {greeting}, {persona?.agentName || user?.name || "Agent"}! 👋
            </h1>
            <p className="text-muted-foreground">
              Ready to create engaging content for your real estate business?
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => startDashboardTour()}
            className="gap-2"
          >
            <HelpCircle className="h-4 w-4" />
            Start Tour
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Card
              key={action.title}
              className="p-6 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setLocation(action.href)}
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg ${action.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="flex-1 space-y-1">
                  <h3 className="font-semibold">{action.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {action.description}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-purple-500/10">
              <FileText className="h-6 w-6 text-purple-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Posts This Month</p>
              <p className="text-2xl font-bold">0</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-orange-500/10">
              <Clock className="h-6 w-6 text-orange-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Scheduled Posts</p>
              <p className="text-2xl font-bold">0</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-green-500/10">
              <TrendingUp className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Reach</p>
              <p className="text-2xl font-bold">-</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Getting Started Guide */}
      {!persona?.isCompleted && (
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Getting Started</h2>
              <span className="text-sm text-muted-foreground">
                {gettingStartedSteps.filter(s => s.completed).length} of {gettingStartedSteps.length} completed
              </span>
            </div>

            <div className="space-y-3">
              {gettingStartedSteps.map((step, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 p-4 rounded-lg border hover:bg-accent/50 cursor-pointer transition-colors"
                  onClick={() => setLocation(step.href)}
                >
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                    step.completed 
                      ? 'bg-green-500 text-white' 
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {step.completed ? '✓' : index + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                  <Button variant="ghost" size="sm">
                    {step.completed ? 'Review' : 'Start'} →
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Tips & Resources */}
      <Card className="p-6 bg-primary/5 border-primary/20">
        <div className="space-y-3">
          <h3 className="font-semibold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Pro Tip
          </h3>
          <p className="text-sm text-muted-foreground">
            Post consistently to build your brand! Aim for 3-5 posts per week across different platforms. 
            Use the Content Calendar to plan your content strategy and schedule posts in advance.
          </p>
        </div>
      </Card>
    </div>
  );
}
