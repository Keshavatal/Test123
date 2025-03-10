import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { UserProvider } from "@/contexts/UserContext";
import NotFound from "@/pages/not-found";
import Auth from "@/pages/Auth";
import Dashboard from "@/pages/Dashboard";
import Chatbot from "@/pages/Chatbot";
import Journal from "@/pages/Journal";
import Exercises from "@/pages/Exercises";
import Progress from "@/pages/Progress";
import Achievements from "@/pages/Achievements";
import AppLayout from "@/components/AppLayout";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={Auth}/>
      <Route path="/">
        <AppLayout>
          <Dashboard />
        </AppLayout>
      </Route>
      <Route path="/chatbot">
        <AppLayout>
          <Chatbot />
        </AppLayout>
      </Route>
      <Route path="/journal">
        <AppLayout>
          <Journal />
        </AppLayout>
      </Route>
      <Route path="/exercises">
        <AppLayout>
          <Exercises />
        </AppLayout>
      </Route>
      <Route path="/progress">
        <AppLayout>
          <Progress />
        </AppLayout>
      </Route>
      <Route path="/achievements">
        <AppLayout>
          <Achievements />
        </AppLayout>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <UserProvider>
        <Router />
        <Toaster />
      </UserProvider>
    </QueryClientProvider>
  );
}

export default App;
