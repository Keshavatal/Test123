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
import Chatbot from "./pages/Chatbot"; // Import Chatbot component

// Import PrivateRoute component
import PrivateRoute from './components/PrivateRoute';

function Router() {
  return (
    <Switch>
      <Route path="/">
        <Dashboard />
      </Route>
      <Route path="/login">
        <Login />
      </Route>
      <Route path="/register">
        <Register />
      </Route>
      <Route path="/assessment">
        <Assessment />
      </Route>
      <Route path="/exercises">
        <Exercises />
      </Route>
      <Route path="/journal">
        <Journal />
      </Route>
      <Route path="/progress">
        <Progress />
      </Route>

      {/* Exercise Routes */}
      <Route path="/exercises/breathing">
        <BreathingExercise />
      </Route>
      <Route path="/exercises/mindfulness">
        <MindfulnessMeditation />
      </Route>
      <Route path="/exercises/cognitive">
        <CognitiveRestructuring />
      </Route>
      <Route path="/exercises/gratitude">
        <GratitudePractice />
      </Route>
      <Route path="/exercises/box-breathing">
        <BoxBreathing />
      </Route>
      <Route path="/exercises/progressive-relaxation">
        <ProgressiveRelaxation />
      </Route>
      <Route path="/exercises/thought-record">
        <ThoughtRecord />
      </Route>
      <Route path="/exercises/values-clarification">
        <ValuesClarification />
      </Route>

      <Route path="/chatbot">
        <PrivateRoute>
          <Chatbot />
        </PrivateRoute>
      </Route>
      <Route path="/exercise-chatbot">
        <PrivateRoute>
          <ExerciseChatbot />
        </PrivateRoute>
      </Route>

      <Route>
        <NotFound />
      </Route>
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