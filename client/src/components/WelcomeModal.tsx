import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sparkles, Video, CreditCard, Clock, Volume2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

export function WelcomeModal() {
  const [open, setOpen] = useState(false);
  const [videoEnded, setVideoEnded] = useState(false);
  const [showSoundHint, setShowSoundHint] = useState(true);
  
  const { data: user } = trpc.auth.me.useQuery();
  const utils = trpc.useUtils();
  const completeOnboarding = trpc.auth.completeOnboarding.useMutation({
    onSuccess: () => {
      // Refetch user data to update hasCompletedOnboarding flag
      utils.auth.me.invalidate();
    },
  });

  useEffect(() => {
    // Show modal if user hasn't completed onboarding
    if (user && !user.hasCompletedOnboarding) {
      setOpen(true);
    }
  }, [user]);

  const handleClose = async () => {
    try {
      // Mark onboarding as completed
      await completeOnboarding.mutateAsync();
      // Close modal after successful completion
      setOpen(false);
    } catch (error) {
      console.error("Failed to complete onboarding:", error);
      // Close anyway to prevent blocking user
      setOpen(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold text-center">
            Welcome to Authority Content! 🎉
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Welcome Video */}
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
            <h3 className="text-xl font-semibold mb-4 text-center">A Message From Our Team</h3>
            <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
              <video
                controls
                autoPlay
                muted
                className="w-full h-full"
                onEnded={() => setVideoEnded(true)}
                onPlay={() => {
                  setShowSoundHint(true);
                  setTimeout(() => setShowSoundHint(false), 3000);
                }}
                src="https://files.manuscdn.com/user_upload_by_module/session_file/310419663026756998/yDPbyHOCmkINXsjt.mp4"
              >
                Your browser does not support the video tag.
              </video>
              {showSoundHint && (
                <div className="absolute top-4 right-4 bg-black/80 text-white px-4 py-2 rounded-full flex items-center gap-2 animate-in fade-in duration-300">
                  <Volume2 className="w-4 h-4" />
                  <span className="text-sm font-medium">Click for sound</span>
                </div>
              )}
            </div>
          </Card>

          {/* Features Overview */}
          {videoEnded && (
            <div className="space-y-4 animate-in fade-in duration-500">
              <h3 className="text-2xl font-semibold text-center mb-6">
                Here's What You Get to Start
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Free Credits */}
                <Card className="p-6 text-center hover:shadow-lg transition-shadow">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CreditCard className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <h4 className="font-semibold text-lg mb-2">50 Free Credits</h4>
                  <p className="text-sm text-muted-foreground">
                    Enough to create 10 standard videos or 3 Full AI Cinematic tours
                  </p>
                </Card>

                {/* Daily Limit */}
                <Card className="p-6 text-center hover:shadow-lg transition-shadow">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h4 className="font-semibold text-lg mb-2">10 Videos/Day</h4>
                  <p className="text-sm text-muted-foreground">
                    Generate up to 10 property tour videos daily during your trial
                  </p>
                </Card>

                {/* AI Features */}
                <Card className="p-6 text-center hover:shadow-lg transition-shadow">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h4 className="font-semibold text-lg mb-2">AI-Powered</h4>
                  <p className="text-sm text-muted-foreground">
                    Cinematic videos, professional voiceovers, and social media content
                  </p>
                </Card>
              </div>

              {/* Quick Start Guide */}
              <Card className="p-6 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950 border-amber-200 dark:border-amber-800">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900 rounded-full flex items-center justify-center flex-shrink-0">
                    <Video className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg mb-2">Quick Start: Create Your First Video</h4>
                    <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                      <li>Go to <strong>Property Tours</strong> in the sidebar</li>
                      <li>Upload 5-10 property photos</li>
                      <li>Add property details (address, price, features)</li>
                      <li>Choose your video mode (Standard, AI-Enhanced, or Full AI Cinematic)</li>
                      <li>Click <strong>Generate Video</strong> and watch the magic happen!</li>
                    </ol>
                  </div>
                </div>
              </Card>

              {/* CTA Button */}
              <div className="flex justify-center pt-4">
                <Button
                  size="lg"
                  onClick={handleClose}
                  className="px-8 py-6 text-lg"
                >
                  Get Started →
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
