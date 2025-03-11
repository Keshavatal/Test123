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
import GuidedBreathingExercise from "./pages/GuidedBreathingExercise";
import MeditationTimer from "./pages/MeditationTimer";
import Goals from "./pages/Goals";
import AffirmationGenerator from "./pages/AffirmationGenerator";
import WeeklyReport from "./pages/WeeklyReport";


// Import PrivateRoute component
import PrivateRoute from './components/PrivateRoute';

function Router() {
  return (
    <Switch>
      <Route path="/login">
        <Login />
      </Route>
      <Route path="/register">
        <Register />
      </Route>
      <PrivateRoute path="/">
        <Dashboard />
      </PrivateRoute>
      <PrivateRoute path="/assessment">
        <Assessment />
      </PrivateRoute>
      <PrivateRoute path="/exercises">
        <Exercises />
      </PrivateRoute>
      <PrivateRoute path="/exercises/box-breathing">
        <BoxBreathing />
      </PrivateRoute>
      <PrivateRoute path="/exercises/breathing">
        <BreathingExercise />
      </PrivateRoute>
      <PrivateRoute path="/exercises/guided-breathing">
        <GuidedBreathingExercise />
      </PrivateRoute>
      <PrivateRoute path="/exercises/meditation-timer">
        <MeditationTimer />
      </PrivateRoute>
      <PrivateRoute path="/exercises/mindfulness">
        <MindfulnessMeditation />
      </PrivateRoute>
      <PrivateRoute path="/journal">
        <Journal />
      </PrivateRoute>
      <PrivateRoute path="/journal/new">
          <NewJournalEntry />
      </PrivateRoute>
      <PrivateRoute path="/journal/:id">
          <JournalEntry />
      </PrivateRoute>
      <PrivateRoute path="/mood">
        <MoodTracker />
      </PrivateRoute>
      <PrivateRoute path="/goals">
        <Goals />
      </PrivateRoute>
      <PrivateRoute path="/affirmations">
        <AffirmationGenerator />
      </PrivateRoute>
      <PrivateRoute path="/reports/weekly">
        <WeeklyReport />
      </PrivateRoute>
      <PrivateRoute path="/chat">
        <Chatbot />
      </PrivateRoute>
      <PrivateRoute path="/profile">
        <Profile />
      </PrivateRoute>
      <Route path="/:rest*">
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