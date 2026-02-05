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
import GHLSettings from "./pages/GHLSettings";
import Analytics from "./pages/Analytics";
import Schedules from "./pages/Schedules";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import DataDeletion from "./pages/DataDeletion";
import MarketStats from "./pages/MarketStats";
import Hooks from "./pages/Hooks";
import FacebookCallback from "./pages/FacebookCallback";
import LinkedInCallback from "./pages/LinkedInCallback";
import InstagramSetup from "./pages/InstagramSetup";
import AgentOnboarding from "./components/AgentOnboarding";
import FAQ from "./pages/FAQ";
import Contact from "./pages/Contact";
import Dashboard from "./pages/Dashboard";
import AutoReels from "./pages/AutoReels";
import ThumbnailGenerator from "./pages/ThumbnailGenerator";
import PropertyTours from "./pages/PropertyTours";
import PerformanceCoach from "./pages/PerformanceCoach";
import AuthorityProfile from "./pages/AuthorityProfile";
import Pricing from "./pages/Pricing";
import Subscription from "./pages/Subscription";

import Upgrade from "./pages/Upgrade";
import Landing from "./pages/Landing";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import AIDisclaimer from "./pages/AIDisclaimer";
import FairHousing from "./pages/FairHousing";

function Router() {
  return (
    <Switch>
      {/* Public routes without dashboard layout */}
      <Route path="/" component={Landing} />
      <Route path="/landing" component={Landing} />
      <Route path="/terms" component={Terms} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/ai-disclaimer" component={AIDisclaimer} />
      <Route path="/fair-housing" component={FairHousing} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route path="/data-deletion" component={DataDeletion} />
      <Route path="/integrations/facebook/callback" component={FacebookCallback} />
      <Route path="/integrations/linkedin/callback" component={LinkedInCallback} />
      <Route path="/integrations/instagram/setup" component={InstagramSetup} />
      <Route path="/onboarding" component={AgentOnboarding} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/subscription" component={Subscription} />
      
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
        <Route path="/thumbnails" component={ThumbnailGenerator} />
        <Route path="/property-tours" component={PropertyTours} />
        <Route path="/coach" component={PerformanceCoach} />
        <Route path="/authority-profile" component={AuthorityProfile} />
        <Route path="/market-stats" component={MarketStats} />
        <Route path="/hooks" component={Hooks} />

        <Route path="/upgrade" component={Upgrade} />
        <Route path="/ghl" component={GHLSettings} />
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

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable={false}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
