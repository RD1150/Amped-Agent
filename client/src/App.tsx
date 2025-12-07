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

function Router() {
  return (
    <DashboardLayout>
      <Switch>
        <Route path="/" component={ContentCalendar} />
        <Route path="/persona" component={PersonaBrand} />
        <Route path="/uploads" component={Uploads} />
        <Route path="/import" component={ImportData} />
        <Route path="/integrations" component={Integrations} />
        <Route path="/generate" component={AIGenerate} />
        <Route path="/settings" component={Settings} />
        <Route path="/help" component={Help} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </DashboardLayout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
