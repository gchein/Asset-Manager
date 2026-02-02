import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { useMyProfile } from "@/hooks/use-data";
import { Shell } from "@/components/layout/Shell";
import { Loader2 } from "lucide-react";

// Pages
import Dashboard from "@/pages/dashboard";
import Login from "@/pages/login";
import Onboarding from "@/pages/onboarding";
import ProjectsList from "@/pages/projects/index";
import ProjectDetail from "@/pages/projects/detail";
import JobDetail from "@/pages/jobs/detail";
import CompaniesList from "@/pages/companies";
import AllJobs from "@/pages/jobs/index";
import MyJobs from "@/pages/jobs/my-jobs";
import Messages from "@/pages/messages";
import NotFound from "@/pages/not-found";

function ProtectedRoute({ component: Component, ...rest }: any) {
  const { isAuthenticated, isLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useMyProfile();

  if (isLoading || profileLoading) {
    return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;
  }

  if (!isAuthenticated) {
    window.location.href = "/login";
    return null;
  }

  // If authenticated but no profile, force onboarding
  // Unless we are ALREADY at /onboarding (prevent loop)
  const isAtOnboarding = window.location.pathname === "/onboarding";
  if (!profile && !isAtOnboarding) {
    window.location.href = "/onboarding";
    return null;
  }
  
  // If at onboarding but HAVE profile, go to dashboard
  if (profile && isAtOnboarding) {
    window.location.href = "/";
    return null;
  }

  return (
    <Shell>
      <Component {...rest} />
    </Shell>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/onboarding">
        <ProtectedRoute component={Onboarding} />
      </Route>
      
      {/* Protected Routes */}
      <Route path="/">
        <ProtectedRoute component={Dashboard} />
      </Route>
      <Route path="/projects">
        <ProtectedRoute component={ProjectsList} />
      </Route>
      <Route path="/projects/:id">
        <ProtectedRoute component={ProjectDetail} />
      </Route>
      <Route path="/companies">
        <ProtectedRoute component={CompaniesList} />
      </Route>
      <Route path="/jobs">
        <ProtectedRoute component={AllJobs} />
      </Route>
      <Route path="/my-jobs">
        <ProtectedRoute component={MyJobs} />
      </Route>
      <Route path="/messages">
        <ProtectedRoute component={Messages} />
      </Route>
      <Route path="/jobs/:id">
        <ProtectedRoute component={JobDetail} />
      </Route>

      {/* Fallback */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
