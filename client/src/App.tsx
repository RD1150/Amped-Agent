import { TooltipProvider } from "@/components/ui/tooltip";
import { lazy, Suspense } from "react";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import { trpc } from "./lib/trpc";
import { OnboardingModal } from "./components/OnboardingModal";
import { BetaAgreementModal } from "./components/BetaAgreementModal";
import { SupportChatbot } from "./components/SupportChatbot";
import WelcomeScreen from "./components/WelcomeScreen";

// Eagerly loaded (small, always needed)
import NotFound from "@/pages/NotFound";
import Login from "./pages/Login";
import Landing from "./pages/Landing";
import { PublicAgentBlog, PublicAgentBlogPost } from "./pages/PublicAgentBlog";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

// Lazy-loaded pages — each becomes its own chunk
const ContentCalendar = lazy(() => import("./pages/ContentCalendar"));
const PersonaBrand = lazy(() => import("./pages/PersonaBrand"));
const Uploads = lazy(() => import("./pages/Uploads"));
const ImportData = lazy(() => import("./pages/ImportData"));
const Integrations = lazy(() => import("./pages/Integrations"));
const AIGenerate = lazy(() => import("./pages/AIGenerate"));
const Settings = lazy(() => import("./pages/Settings"));
const Help = lazy(() => import("./pages/Help"));
const GetStarted = lazy(() => import("./pages/GetStarted"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Schedules = lazy(() => import("./pages/Schedules"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const DataDeletion = lazy(() => import("./pages/DataDeletion"));
const MarketStats = lazy(() => import("./pages/MarketStats"));
const Hooks = lazy(() => import("./pages/Hooks"));
const FacebookCallback = lazy(() => import("./pages/FacebookCallback"));
const LinkedInCallback = lazy(() => import("./pages/LinkedInCallback"));
const GoogleCallback = lazy(() => import("./pages/GoogleCallback"));
const YouTubeCallback = lazy(() => import("./pages/YouTubeCallback"));
const InstagramSetup = lazy(() => import("./pages/InstagramSetup"));
const AgentOnboarding = lazy(() => import("./components/AgentOnboarding"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Contact = lazy(() => import("./pages/Contact"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const AutoReels = lazy(() => import("./pages/AutoReels"));
const FullAvatarVideo = lazy(() => import("./pages/FullAvatarVideo"));
const YouTubeVideoBuilder = lazy(() => import("./pages/YouTubeVideoBuilder"));
const ImageLibraryPage = lazy(() => import("./pages/ImageLibrary"));
const ListingPresentationPage = lazy(() => import("./pages/ListingPresentation"));
const BuyerPresentationPage = lazy(() => import("./pages/BuyerPresentation"));
const AssetsHub = lazy(() => import("./pages/AssetsHub"));
const ThumbnailGenerator = lazy(() => import("./pages/ThumbnailGenerator"));
const PropertyTours = lazy(() => import("./pages/PropertyTours"));
const ContentTemplates = lazy(() => import("./pages/ContentTemplates"));
const PerformanceCoach = lazy(() => import("./pages/PerformanceCoach"));
const AuthorityProfile = lazy(() => import("./pages/AuthorityProfile"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Subscription = lazy(() => import("./pages/Subscription"));
const Credits = lazy(() => import("./pages/Credits"));
const AdminAnalytics = lazy(() => import("./pages/AdminAnalytics"));
const AdminSettings = lazy(() => import("./pages/AdminSettings"));
const AdminSpend = lazy(() => import("./pages/AdminSpend"));
const AdminUsers = lazy(() => import("./pages/AdminUsers"));
const AdminInviteCodes = lazy(() => import("./pages/AdminInviteCodes"));
const GenerationQuality = lazy(() => import("./pages/GenerationQuality"));
const Drafts = lazy(() => import("./pages/Drafts"));
const ScriptToReel = lazy(() => import("./pages/ScriptToReel"));
const MyReels = lazy(() => import("./pages/MyReels"));
const MyVideos = lazy(() => import("./pages/MyVideos"));
const NewsletterBuilder = lazy(() => import("./pages/NewsletterBuilder"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const BulkImport = lazy(() => import("./pages/BulkImport"));
const RepurposeEngine = lazy(() => import("./pages/RepurposeEngine"));
const LeadMagnet = lazy(() => import("./pages/LeadMagnet"));
const CinematicWalkthrough = lazy(() => import("./pages/CinematicWalkthrough"));
const LiveTour = lazy(() => import("./pages/LiveTour"));
const VideoScriptBuilder = lazy(() => import("./pages/VideoScriptBuilder"));
const MyLeadMagnets = lazy(() => import("./pages/MyLeadMagnets"));
const MyContent = lazy(() => import("./pages/MyContent"));
const VideoComparison = lazy(() => import("./pages/VideoComparison"));
const BlogBuilder = lazy(() => import("./pages/BlogBuilder"));
const BrandStory = lazy(() => import("./pages/BrandStory"));
const GuideGenerator = lazy(() => import("./pages/GuideGenerator"));
const ProspectingLetters = lazy(() => import("./pages/ProspectingLetters"));
const LettersEmails = lazy(() => import("./pages/LettersEmails"));
const PodcastBuilder = lazy(() => import("./pages/PodcastBuilder"));
const InterviewPodcast = lazy(() => import("./pages/InterviewPodcast"));
const MyDocuments = lazy(() => import("./pages/MyDocuments"));
const PublicPresentation = lazy(() => import("./pages/PublicPresentation"));
const PublicBuyerPresentation = lazy(() => import("./pages/PublicBuyerPresentation"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const AIDisclaimer = lazy(() => import("./pages/AIDisclaimer"));
const FairHousing = lazy(() => import("./pages/FairHousing"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const PrivacyPolicyPage = lazy(() => import("./pages/PrivacyPolicyPage"));
const AttractOverview = lazy(() => import("./pages/AttractOverview"));
const EngageOverview = lazy(() => import("./pages/EngageOverview"));
const ConvertOverview = lazy(() => import("./pages/ConvertOverview"));
const ScaleOverview = lazy(() => import("./pages/ScaleOverview"));
const DominateOverview = lazy(() => import("./pages/DominateOverview"));
const Upgrade = lazy(() => import("./pages/Upgrade"));
const ListingLaunchKit = lazy(() => import("./pages/ListingLaunchKit"));
const AdGenerator = lazy(() => import("./pages/AdGenerator"));
const TestimonialEngine = lazy(() => import("./pages/TestimonialEngine"));
const OpenHouseManager = lazy(() => import("./pages/OpenHouseManager"));
const CRMPipeline = lazy(() => import("./pages/CRMPipeline"));
const DripSequences = lazy(() => import("./pages/DripSequences"));
const PublicOpenHouseSignIn = lazy(() => import("./pages/PublicOpenHouseSignIn"));
const VideoVoiceover = lazy(() => import("./pages/VideoVoiceover"));
const Teleprompter = lazy(() => import("./pages/Teleprompter"));
const CRMIntegrations = lazy(() => import("./pages/CRMIntegrations"));
const ZapierWebhooks = lazy(() => import("./pages/ZapierWebhooks"));
const DemoAccess = lazy(() => import("./pages/DemoAccess"));

// Fallback spinner shown while a lazy chunk loads
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        {/* Public routes without dashboard layout */}
        <Route path="/" component={Landing} />
        <Route path="/login" component={Login} />
        {/* Referral invite link */}
        <Route path="/join" component={() => {
          const params = new URLSearchParams(window.location.search);
          const ref = params.get("ref") || "";
          window.location.replace(`/login?ref=${encodeURIComponent(ref)}&tab=register`);
          return null;
        }} />
        <Route path="/credits" component={Credits} />
        <Route path="/admin/analytics" component={AdminAnalytics} />
        <Route path="/admin/settings" component={AdminSettings} />
        <Route path="/admin/spend" component={AdminSpend} />
        <Route path="/admin/users" component={AdminUsers} />
        <Route path="/admin/generation-quality" component={GenerationQuality} />
        <Route path="/admin/invite-codes" component={AdminInviteCodes} />
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
        <Route path="/p/:id" component={PublicPresentation} />
        <Route path="/blog/:slug/:postId" component={PublicAgentBlogPost} />
        <Route path="/blog/:slug" component={PublicAgentBlog} />
        <Route path="/bp/:id" component={PublicBuyerPresentation} />
        <Route path="/pricing" component={Pricing} />
        <Route path="/subscription" component={Subscription} />
        <Route path="/upgrade" component={Upgrade} />
        <Route path="/oh/:slug" component={PublicOpenHouseSignIn} />
        <Route path="/forgot-password" component={ForgotPassword} />
        <Route path="/reset-password" component={ResetPassword} />
        <Route path="/demo-access" component={DemoAccess} />

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
                <Route path="/buyer-presentation" component={BuyerPresentationPage} />
                <Route path="/assets" component={AssetsHub} />
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
                <Route path="/video-voiceover" component={VideoVoiceover} />
                <Route path="/teleprompter" component={Teleprompter} />
                <Route path="/my-content" component={MyContent} />
                <Route path="/blog-builder" component={BlogBuilder} />
                <Route path="/brand-story" component={BrandStory} />
                <Route path="/guide-generator" component={GuideGenerator} />
                <Route path="/prospecting-letters" component={ProspectingLetters} />
                <Route path="/letters-emails" component={LettersEmails} />
                <Route path="/podcast-builder" component={PodcastBuilder} />
                <Route path="/interview-podcast" component={InterviewPodcast} />
                <Route path="/my-documents" component={MyDocuments} />
                <Route path="/newsletter" component={NewsletterBuilder} />
                <Route path="/drafts" component={Drafts} />
                <Route path="/coach" component={PerformanceCoach} />
                <Route path="/authority-profile" component={AuthorityProfile} />
                <Route path="/market-stats" component={MarketStats} />
                <Route path="/hooks" component={Hooks} />
                <Route path="/attract" component={AttractOverview} />
                <Route path="/engage" component={EngageOverview} />
                <Route path="/convert" component={ConvertOverview} />
                <Route path="/scale" component={ScaleOverview} />
                <Route path="/dominate" component={DominateOverview} />
                <Route path="/analytics" component={Analytics} />
                <Route path="/schedules" component={Schedules} />
                <Route path="/settings" component={Settings} />
                <Route path="/help" component={Help} />
                <Route path="/get-started" component={GetStarted} />
                <Route path="/faq" component={FAQ} />
                <Route path="/contact" component={Contact} />
                <Route path="/listing-launch-kit" component={ListingLaunchKit} />
                <Route path="/ad-generator" component={AdGenerator} />
                <Route path="/testimonials" component={TestimonialEngine} />
                <Route path="/open-house" component={OpenHouseManager} />
                <Route path="/crm" component={CRMPipeline} />
                <Route path="/drip-sequences" component={DripSequences} />
                <Route path="/settings/crm" component={CRMIntegrations} />
                <Route path="/settings/zapier" component={ZapierWebhooks} />
                <Route path="/404" component={NotFound} />
                <Route component={NotFound} />
              </Switch>
            </DashboardLayout>
          )}
        </Route>
      </Switch>
    </Suspense>
  );
}

function AppWithOnboarding() {
  const { data: user, refetch } = trpc.auth.me.useQuery();
  const showOnboarding = !!(user && !user.hasCompletedOnboarding);
  // Show beta agreement after onboarding is complete but before the app is usable
  const showBetaAgreement = !!(user && user.hasCompletedOnboarding && !user.hasAcceptedBetaAgreement);
  // Show welcome screen only after onboarding AND beta agreement are both done
  const showWelcome = !!(user && user.hasCompletedOnboarding && user.hasAcceptedBetaAgreement);

  return (
    <>
      <Router />
      <OnboardingModal
        open={showOnboarding}
        onComplete={() => refetch()}
      />
      <BetaAgreementModal
        open={showBetaAgreement}
        onAccepted={() => refetch()}
      />
      {showWelcome && <WelcomeScreen userName={user?.name ?? undefined} />}
      <SupportChatbot />
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
        <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <AppWithOnboarding />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
