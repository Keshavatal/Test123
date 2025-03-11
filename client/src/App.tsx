import React, { Suspense, lazy } from "react";
import { Switch, Route } from "wouter";
import { useAuth } from "./context/AuthContext";
import PrivateRoute from "./components/auth/PrivateRoute";

// Lazy-loaded pages for better performance
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const NotFound = lazy(() => import("./pages/not-found")); // Corrected import path
const Profile = lazy(() => import("./pages/Profile"));
const Journal = lazy(() => import("./pages/Journal"));
const MoodTracker = lazy(() => import("./pages/MoodTracker"));
const Assessments = lazy(() => import("./pages/Assessments"));
const Achievements = lazy(() => import("./pages/Achievements"));
const Affirmations = lazy(() => import("./pages/Affirmations"));
const Goals = lazy(() => import("./pages/Goals"));
const ChatbotPage = lazy(() => import("./pages/Chatbot"));

// Exercise pages
const exercises = {
  BreathingExercise: lazy(() => import("./pages/exercises/BreathingExercise")),
  ProgressiveMuscleRelaxation: lazy(
    () => import("./pages/exercises/ProgressiveMuscleRelaxation"),
  ),
  GuidedMeditation: lazy(() => import("./pages/exercises/GuidedMeditation")),
  ThoughtRecords: lazy(() => import("./pages/exercises/ThoughtRecords")),
  CognitiveRestructuring: lazy(
    () => import("./pages/exercises/CognitiveRestructuring"),
  ),
  ValuesClarification: lazy(
    () => import("./pages/exercises/ValuesClarification"),
  ),
};

const routes = [
  { path: "/login", component: Login, isPrivate: false },
  { path: "/register", component: Register, isPrivate: false },
  { path: "/", component: Dashboard, isPrivate: true },
  { path: "/profile", component: Profile, isPrivate: true },
  { path: "/journal", component: Journal, isPrivate: true },
  { path: "/mood-tracker", component: MoodTracker, isPrivate: true },
  { path: "/assessments", component: Assessments, isPrivate: true },
  { path: "/achievements", component: Achievements, isPrivate: true },
  { path: "/affirmations", component: Affirmations, isPrivate: true },
  { path: "/goals", component: Goals, isPrivate: true },
  { path: "/chatbot", component: ChatbotPage, isPrivate: true },
  // Exercise Routes
  {
    path: "/exercises/breathing",
    component: exercises.BreathingExercise,
    isPrivate: true,
  },
  {
    path: "/exercises/progressive-muscle-relaxation",
    component: exercises.ProgressiveMuscleRelaxation,
    isPrivate: true,
  },
  {
    path: "/exercises/guided-meditation",
    component: exercises.GuidedMeditation,
    isPrivate: true,
  },
  {
    path: "/exercises/thought-records",
    component: exercises.ThoughtRecords,
    isPrivate: true,
  },
  {
    path: "/exercises/cognitive-restructuring",
    component: exercises.CognitiveRestructuring,
    isPrivate: true,
  },
  {
    path: "/exercises/values-clarification",
    component: exercises.ValuesClarification,
    isPrivate: true,
  },
];

function Router() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Switch>
        {routes.map(({ path, component: Component, isPrivate }) =>
          isPrivate ? (
            <PrivateRoute key={path} path={path} component={Component} />
          ) : (
            <Route key={path} path={path} component={Component} />
          ),
        )}
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return <Router />;
}

export default App;