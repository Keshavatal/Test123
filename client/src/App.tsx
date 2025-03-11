import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "./context/AuthContext";

// Pages
import Dashboard from "@/pages/Dashboard";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Assessment from "@/pages/Assessment";
import Exercises from "@/pages/Exercises";
import Journal from "@/pages/Journal";
import Progress from "@/pages/Progress";
import NotFound from "@/pages/not-found";

// Exercise Pages - Using relative imports because these are not in the @/pages directory
import BreathingExercise from "./pages/exercises/BreathingExercise";
import MindfulnessMeditation from "./pages/exercises/MindfulnessMeditation";
import CognitiveRestructuring from "./pages/exercises/CognitiveRestructuring";
import GratitudePractice from "./pages/exercises/GratitudePractice";
import BoxBreathing from "./pages/exercises/BoxBreathing";
import ProgressiveRelaxation from "./pages/exercises/ProgressiveRelaxation";
import ThoughtRecord from "./pages/exercises/ThoughtRecord";
import ValuesClarification from "./pages/exercises/ValuesClarification";
import ExerciseChatbot from "./pages/ExerciseChatbot"; // Added import


// Import PrivateRoute component
import PrivateRoute from './components/PrivateRoute';

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/assessment" component={Assessment} />
      <Route path="/exercises" component={Exercises} />
      <Route path="/journal" component={Journal} />
      <Route path="/progress" component={Progress} />

      {/* Exercise Routes */}
      <Route path="/exercises/breathing" component={BreathingExercise} />
      <Route path="/exercises/mindfulness" component={MindfulnessMeditation} />
      <Route path="/exercises/cognitive" component={CognitiveRestructuring} />
      <Route path="/exercises/gratitude" component={GratitudePractice} />
      <Route path="/exercises/box-breathing" component={BoxBreathing} />
      <Route path="/exercises/progressive-relaxation" component={ProgressiveRelaxation} />
      <Route path="/exercises/thought-record" component={ThoughtRecord} />
      <Route path="/exercises/values-clarification" component={ValuesClarification} />

      <Route path="/chatbot"> {/* Existing route */}
        <PrivateRoute>
          <Chatbot />
        </PrivateRoute>
      </Route>
      <Route path="/exercise-chatbot"> {/* Added route */}
        <PrivateRoute>
          <ExerciseChatbot />
        </PrivateRoute>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;