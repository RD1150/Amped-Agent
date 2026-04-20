/**
 * LaunchPad — Guided first-week onboarding flow for new Amped Agent users.
 *
 * Shows a 5-step sequence that walks agents through the most important
 * setup actions before they access the full platform. Each step explains
 * WHY it matters, not just what to do.
 *
 * New users (hasCompletedOnboarding = false) are redirected here automatically.
 * Returning users can access it from the sidebar as a refresher.
 */

import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  UserCircle,
  Sparkles,
  Video,
  Share2,
  Rocket,
  CheckCircle2,
  ChevronRight,
  ArrowRight,
  Clock,
  Zap,
  Star,
  Play,
} from "lucide-react";

interface Step {
  id: number;
  title: string;
  subtitle: string;
  why: string;
  action: string;
  href: string;
  icon: React.ElementType;
  accentColor: string;
  bgColor: string;
  time: string;
  badge?: string;
}

const STEPS: Step[] = [
  {
    id: 1,
    title: "Set Up Your Authority Profile",
    subtitle: "Your name, photo, market, and brand voice",
    why: "Every piece of content Amped Agent creates is personalized to you — your city, your niche, your voice. Without this, the AI generates generic content that sounds like everyone else. This is the foundation everything else builds on.",
    action: "Set Up My Profile",
    href: "/persona",
    icon: UserCircle,
    accentColor: "text-blue-600",
    bgColor: "bg-blue-50 border-blue-200",
    time: "5 min",
    badge: "Start Here",
  },
  {
    id: 2,
    title: "Generate Your First Authority Post",
    subtitle: "A post that positions you as the local expert",
    why: "Most agents post listings. Authority agents post insights. Your first post will be a market commentary or expert take that makes people think \"this agent knows their stuff.\" It takes 2 minutes and you'll see immediately how different this is from anything you've used before.",
    action: "Create My First Post",
    href: "/generate",
    icon: Sparkles,
    accentColor: "text-orange-600",
    bgColor: "bg-orange-50 border-orange-200",
    time: "2 min",
  },
  {
    id: 3,
    title: "Create Your First Property Tour Video",
    subtitle: "Turn listing photos into a cinematic video in minutes",
    why: "Video listings get 403% more inquiries than photo-only listings. Upload any listing photos and Amped Agent turns them into a professional video with music and narration — no editing skills needed. This alone is worth the subscription.",
    action: "Make a Property Tour",
    href: "/property-tours",
    icon: Video,
    accentColor: "text-purple-600",
    bgColor: "bg-purple-50 border-purple-200",
    time: "5 min",
  },
  {
    id: 4,
    title: "Set Up Your AI Avatar",
    subtitle: "Your face and voice, working 24/7 without you",
    why: "Your AI avatar can record and deliver any script as a talking-head video — market updates, buyer tips, listing announcements — without you ever turning on a camera. Agents using avatar videos see 3x more profile visits. You get 3 free beta videos to start.",
    action: "Set Up My Avatar",
    href: "/full-avatar-video",
    icon: Star,
    accentColor: "text-pink-600",
    bgColor: "bg-pink-50 border-pink-200",
    time: "10 min",
    badge: "Beta Exclusive",
  },
  {
    id: 5,
    title: "Connect a Social Account & Schedule",
    subtitle: "Link LinkedIn, Facebook, or Instagram and post your first piece",
    why: "Content that stays in a dashboard doesn't build your brand. Connect one account and schedule the post you created in Step 2. From here on, Amped Agent can auto-post on your behalf so you never have to think about \"what do I post today?\" again.",
    action: "Connect & Schedule",
    href: "/integrations",
    icon: Share2,
    accentColor: "text-green-600",
    bgColor: "bg-green-50 border-green-200",
    time: "3 min",
  },
];

export default function LaunchPad() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [activeStep, setActiveStep] = useState(1);

  const { data: meData } = trpc.auth.me.useQuery(undefined, { enabled: !!user });
  const saveStep = trpc.auth.saveOnboardingStep.useMutation();
  const completeOnboarding = trpc.auth.completeOnboarding.useMutation();
  const utils = trpc.useUtils();

  // Derive completed steps from DB
  const completedUpTo = meData?.onboardingStep ?? 1;
  const isFullyComplete = meData?.hasCompletedOnboarding ?? false;

  const completedCount = isFullyComplete ? 5 : Math.max(0, completedUpTo - 1);
  const progressPct = (completedCount / 5) * 100;

  const currentStep = STEPS.find(s => s.id === activeStep) ?? STEPS[0];
  const Icon = currentStep.icon;

  async function handleStartStep(step: Step) {
    // Mark this step as started (save progress)
    if (step.id >= completedUpTo) {
      await saveStep.mutateAsync({ step: step.id });
      await utils.auth.me.invalidate();
    }
    setLocation(step.href);
  }

  async function handleMarkComplete(stepId: number) {
    const nextStep = stepId + 1;
    if (nextStep <= 5) {
      await saveStep.mutateAsync({ step: nextStep });
      setActiveStep(nextStep);
    } else {
      await completeOnboarding.mutateAsync();
    }
    await utils.auth.me.invalidate();
  }

  async function handleFinish() {
    await completeOnboarding.mutateAsync();
    await utils.auth.me.invalidate();
    setLocation("/dashboard");
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="text-center space-y-3 pt-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-semibold uppercase tracking-wider">
          <Rocket className="h-3.5 w-3.5" />
          Launch Pad
        </div>
        <h1 className="text-3xl font-bold tracking-tight">
          {isFullyComplete ? "You're Live! 🎉" : "Let's Get You Live in 25 Minutes"}
        </h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          {isFullyComplete
            ? "You've completed the Launch Pad. Your agent is set up and ready to work. Head to the Dashboard to see your weekly action plan."
            : "Follow these 5 steps in order. Each one builds on the last. By the end, your AI agent will be generating content, creating videos, and posting — all on autopilot."}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-slate-700">{completedCount} of 5 steps complete</span>
          <span className="text-muted-foreground">{Math.round(progressPct)}%</span>
        </div>
        <Progress value={progressPct} className="h-2.5" />
        {isFullyComplete && (
          <p className="text-center text-sm text-green-600 font-medium">All steps complete — your agent is live!</p>
        )}
      </div>

      {/* Step Selector Row */}
      <div className="grid grid-cols-5 gap-2">
        {STEPS.map((step) => {
          const StepIcon = step.icon;
          const isComplete = step.id < completedUpTo || isFullyComplete;
          const isActive = step.id === activeStep;
          const isLocked = step.id > completedUpTo && !isFullyComplete;

          return (
            <button
              key={step.id}
              onClick={() => setActiveStep(step.id)}
              className={`
                flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-center
                ${isActive ? "border-primary bg-primary/5 shadow-sm" : "border-transparent hover:border-slate-200 hover:bg-slate-50"}
                ${isLocked ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}
              `}
              disabled={isLocked}
            >
              <div className={`
                w-9 h-9 rounded-full flex items-center justify-center
                ${isComplete ? "bg-green-500 text-white" : isActive ? "bg-primary text-white" : "bg-slate-100 text-slate-500"}
              `}>
                {isComplete ? <CheckCircle2 className="h-5 w-5" /> : <StepIcon className="h-4.5 w-4.5" />}
              </div>
              <span className={`text-[11px] font-semibold leading-tight ${isActive ? "text-primary" : "text-slate-600"}`}>
                Step {step.id}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Step Detail Card */}
      <div className={`rounded-2xl border-2 p-8 ${currentStep.bgColor} space-y-6`}>
        <div className="flex items-start gap-5">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-white shadow-sm shrink-0`}>
            <Icon className={`h-7 w-7 ${currentStep.accentColor}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h2 className="text-xl font-bold">{currentStep.title}</h2>
              {currentStep.badge && (
                <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-wide">
                  {currentStep.badge}
                </Badge>
              )}
              <span className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
                <Clock className="h-3.5 w-3.5" />
                {currentStep.time}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{currentStep.subtitle}</p>
          </div>
        </div>

        {/* Why This Matters */}
        <div className="bg-white/70 rounded-xl p-5 border border-white/80">
          <div className="flex items-center gap-2 mb-2">
            <Zap className={`h-4 w-4 ${currentStep.accentColor}`} />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Why This Matters</span>
          </div>
          <p className="text-sm text-slate-700 leading-relaxed">{currentStep.why}</p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 flex-wrap">
          <Button
            size="lg"
            className="gap-2 font-semibold"
            onClick={() => handleStartStep(currentStep)}
          >
            <Play className="h-4 w-4" />
            {currentStep.action}
          </Button>

          {/* Mark as Done button — only show if this step is the current active one */}
          {currentStep.id === completedUpTo && !isFullyComplete && (
            <Button
              variant="outline"
              size="lg"
              className="gap-2 bg-white"
              onClick={() => handleMarkComplete(currentStep.id)}
            >
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Mark as Done
            </Button>
          )}

          {/* Already complete indicator */}
          {currentStep.id < completedUpTo || isFullyComplete ? (
            <span className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
              <CheckCircle2 className="h-4 w-4" />
              Completed
            </span>
          ) : null}
        </div>
      </div>

      {/* Step List Overview */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1">All Steps</h3>
        {STEPS.map((step) => {
          const StepIcon = step.icon;
          const isComplete = step.id < completedUpTo || isFullyComplete;
          const isActive = step.id === activeStep;

          return (
            <div
              key={step.id}
              onClick={() => !((step.id > completedUpTo) && !isFullyComplete) && setActiveStep(step.id)}
              className={`
                flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer
                ${isActive ? "border-primary/40 bg-primary/5" : "border-slate-200 hover:bg-slate-50"}
                ${(step.id > completedUpTo) && !isFullyComplete ? "opacity-40 cursor-not-allowed" : ""}
              `}
            >
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center shrink-0
                ${isComplete ? "bg-green-500 text-white" : isActive ? "bg-primary text-white" : "bg-slate-100 text-slate-400"}
              `}>
                {isComplete ? <CheckCircle2 className="h-4 w-4" /> : <StepIcon className="h-4 w-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-semibold text-sm ${isComplete ? "line-through text-muted-foreground" : ""}`}>
                  {step.title}
                </p>
                <p className="text-xs text-muted-foreground">{step.subtitle}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-muted-foreground">{step.time}</span>
                {!isComplete && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
              </div>
            </div>
          );
        })}
      </div>

      {/* Finish / Go to Dashboard */}
      <div className="flex flex-col items-center gap-3 pt-4 border-t">
        {isFullyComplete ? (
          <Button size="lg" className="gap-2 px-8" onClick={() => setLocation("/dashboard")}>
            Go to Dashboard
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={() => setLocation("/dashboard")}
            >
              Skip for now — take me to the Dashboard
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              You can always come back to the Launch Pad from the sidebar.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
