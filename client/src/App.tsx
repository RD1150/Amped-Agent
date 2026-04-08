import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import ContentCalendar from "./pages/ContentCalendar";
import PersonaBrand from "./pages/PersonaBrand";
import Uploads from "./pages/Uploads";
import ImportData from "./pages/ImportData";
import Integrations from "./pages/Integrations";
import AIGenerate from "./pages/AIGenerate";
import Settings from "./pages/Settings";
import Help from "./pages/Help";
import Analytics from "./pages/Analytics";
import Schedules from "./pages/Schedules";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import DataDeletion from "./pages/DataDeletion";
import MarketStats from "./pages/MarketStats";
import Hooks from "./pages/Hooks";
import FacebookCallback from "./pages/FacebookCallback";
import LinkedInCallback from "./pages/LinkedInCallback";
import GoogleCallback from "./pages/GoogleCallback";
import YouTubeCallback from "./pages/YouTubeCallback";
import InstagramSetup from "./pages/InstagramSetup";
import AgentOnboarding from "./components/AgentOnboarding";
import FAQ from "./pages/FAQ";
import Contact from "./pages/Contact";
import Dashboard from "./pages/Dashboard";
import AutoReels from "./pages/AutoReels";
import FullAvatarVideo from "./pages/FullAvatarVideo";
import YouTubeVideoBuilder from "./pages/YouTubeVideoBuilder";
import ImageLibraryPage from "./pages/ImageLibrary";
import ListingPresentationPage from "./pages/ListingPresentation";
import ThumbnailGenerator from "./pages/ThumbnailGenerator";
import PropertyTours from "./pages/PropertyTours";
import ContentTemplates from "./pages/ContentTemplates";
import PerformanceCoach from "./pages/PerformanceCoach";
import AuthorityProfile from "./pages/AuthorityProfile";
import Pricing from "./pages/Pricing";
import Subscription from "./pages/Subscription";
import Credits from "./pages/Credits";
import AdminAnalytics from "./pages/AdminAnalytics";
import AdminSettings from "./pages/AdminSettings";
import AdminSpend from "./pages/AdminSpend";
import AdminUsers from "./pages/AdminUsers";
import GenerationQuality from "./pages/GenerationQuality";
import Drafts from "./pages/Drafts";
import ScriptToReel from "./pages/ScriptToReel";
import MyReels from "./pages/MyReels";
import MyVideos from "./pages/MyVideos";
import NewsletterBuilder from "./pages/NewsletterBuilder";
import Onboarding from "./pages/Onboarding";
import BulkImport from "./pages/BulkImport";
import RepurposeEngine from "./pages/RepurposeEngine";
import LeadMagnet from "./pages/LeadMagnet";
import CinematicWalkthrough from "./pages/CinematicWalkthrough";
import LiveTour from "./pages/LiveTour";
import VideoScriptBuilder from "./pages/VideoScriptBuilder";
import MyLeadMagnets from "./pages/MyLeadMagnets";
import MyContent from "./pages/MyContent";
import VideoComparison from "./pages/VideoComparison";
import BlogBuilder from "./pages/BlogBuilder";
import BrandStory from "./pages/BrandStory";

import Upgrade from "./pages/Upgrade";
import Landing from "./pages/Landing";
import { OnboardingModal } from "./components/OnboardingModal";
import { trpc } from "./lib/trpc";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import AIDisclaimer from "./pages/AIDisclaimer";
import FairHousing from "./pages/FairHousing";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";

function Router() {
  return (
    <Switch>
      {/* Public routes without dashboard layout */}
      <Route path="/" component={Landing} />
      <Route path="/credits" component={Credits} />
      <Route path="/admin/analytics" component={AdminAnalytics} />
      <Route path="/admin/settings" component={AdminSettings} />
      <Route path="/admin/spend" component={AdminSpend} />
      <Route path="/admin/users" component={AdminUsers} />
      <Route path="/admin/generation-quality" component={GenerationQuality} />
      <Route path="/landing" component={Landing} />
      <Route path="/terms" component={Terms} />
      <Route path="/terms-of-service" component={TermsOfService} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/privacy-policy-full" component={PrivacyPolicyPage} />
      <Route path="/ai-disclaimer" component={AIDisclaimer} />
      <Route path="/fair-housing" component={FairHousing} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route path="/data-deletion" component={DataDeletion} />
      <Route path="/integrations/facebook/callback" component={FacebookCallback} />
      <Route path="/integrations/linkedin/callback" component={LinkedInCallback} />
      <Route path="/integrations/google/callback" component={GoogleCallback} />
      <Route path="/integrations/youtube/callback" component={YouTubeCallback} />
      <Route path="/integrations/instagram/setup" component={InstagramSetup} />
      <Route path="/onboarding" component={Onboarding} />
      <Route path="/agent-onboarding" component={AgentOnboarding} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/subscription" component={Subscription} />
      <Route path="/upgrade" component={Upgrade} />
      
      {/* Dashboard routes */}
      <Route>
        {() => (
          <DashboardLayout>
            <Switch>
              <Route path="/dashboard" component={Dashboard} />
              <Route path="/calendar" component={ContentCalendar} />
        <Route path="/persona" component={PersonaBrand} />
        <Route path="/uploads" component={Uploads} />
        <Route path="/import" component={ImportData} />
        <Route path="/integrations" component={Integrations} />
        <Route path="/generate" component={AIGenerate} />
        <Route path="/autoreels" component={AutoReels} />
        <Route path="/full-avatar-video" component={FullAvatarVideo} />
        <Route path="/youtube-video-builder" component={YouTubeVideoBuilder} />
        <Route path="/image-library" component={ImageLibraryPage} />
        <Route path="/listing-presentation" component={ListingPresentationPage} />
        <Route path="/thumbnails" component={ThumbnailGenerator} />
        <Route path="/property-tours" component={PropertyTours} />
        <Route path="/content-templates" component={ContentTemplates} />
        <Route path="/bulk-import" component={BulkImport} />
        <Route path="/repurpose" component={RepurposeEngine} />
        <Route path="/lead-magnet" component={LeadMagnet} />
        <Route path="/cinematic-walkthrough" component={CinematicWalkthrough} />
        <Route path="/live-tour" component={LiveTour} />
        <Route path="/video-script-builder" component={VideoScriptBuilder} />
        <Route path="/video-comparison" component={VideoComparison} />
        <Route path="/my-lead-magnets" component={MyLeadMagnets} />
        <Route path="/script-to-reel" component={ScriptToReel} />
        <Route path="/my-reels" component={MyReels} />
        <Route path="/my-videos" component={MyVideos} />
        <Route path="/my-content" component={MyContent} />
        <Route path="/blog-builder" component={BlogBuilder} />
        <Route path="/brand-story" component={BrandStory} />
        <Route path="/newsletter" component={NewsletterBuilder} />
        <Route path="/drafts" component={Drafts} />
        <Route path="/coach" component={PerformanceCoach} />
        <Route path="/authority-profile" component={AuthorityProfile} />
        <Route path="/market-stats" component={MarketStats} />
        <Route path="/hooks" component={Hooks} />

        <Route path="/analytics" component={Analytics} />
        <Route path="/schedules" component={Schedules} />
        <Route path="/settings" component={Settings} />
        <Route path="/help" component={Help} />
        <Route path="/faq" component={FAQ} />
        <Route path="/contact" component={Contact} />
              <Route path="/404" component={NotFound} />
              <Route component={NotFound} />
            </Switch>
          </DashboardLayout>
        )}
      </Route>
    </Switch>
  );
}

function AppWithOnboarding() {
  const { data: user, refetch } = trpc.auth.me.useQuery();
  const showOnboarding = !!(user && !user.hasCompletedOnboarding);

  return (
    <>
      <Router />
      <OnboardingModal
        open={showOnboarding}
        onComplete={() => refetch()}
      />
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable={false}>
        <TooltipProvider>
          <Toaster />
          <AppWithOnboarding />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
