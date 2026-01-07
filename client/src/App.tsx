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

function Router() {
  return (
    <Switch>
      {/* Public routes without dashboard layout */}
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route path="/data-deletion" component={DataDeletion} />
      
      {/* Dashboard routes */}
      <Route>
        {() => (
          <DashboardLayout>
            <Switch>
              <Route path="/" component={ContentCalendar} />
        <Route path="/persona" component={PersonaBrand} />
        <Route path="/uploads" component={Uploads} />
        <Route path="/import" component={ImportData} />
        <Route path="/integrations" component={Integrations} />
        <Route path="/generate" component={AIGenerate} />
        <Route path="/ghl" component={GHLSettings} />
        <Route path="/analytics" component={Analytics} />
        <Route path="/schedules" component={Schedules} />
        <Route path="/settings" component={Settings} />
        <Route path="/help" component={Help} />
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
      <ThemeProvider defaultTheme="dark" switchable={true}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
