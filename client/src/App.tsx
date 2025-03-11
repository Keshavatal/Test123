import React from 'react';
import { Switch, Route } from 'wouter';
import { useAuth } from './context/AuthContext';

// Pages
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import NotFound from './pages/NotFound';
import Profile from './pages/Profile';
import Journal from './pages/Journal';
import MoodTracker from './pages/MoodTracker';
import Assessments from './pages/Assessments';
import Achievements from './pages/Achievements';
import Affirmations from './pages/Affirmations';
import Goals from './pages/Goals';

// Exercise pages
import BreathingExercise from './pages/exercises/BreathingExercise';
import ProgressiveMuscleRelaxation from './pages/exercises/ProgressiveMuscleRelaxation';
import GuidedMeditation from './pages/exercises/GuidedMeditation';
import ThoughtRecords from './pages/exercises/ThoughtRecords';
import CognitiveRestructuring from './pages/exercises/CognitiveRestructuring';
import ValuesClarification from './pages/exercises/ValuesClarification';

// Import PrivateRoute component
import PrivateRoute from './components/auth/PrivateRoute';
import ChatbotPage from './pages/Chatbot';

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <PrivateRoute path="/" component={Dashboard} />
      <PrivateRoute path="/profile" component={Profile} />
      <PrivateRoute path="/journal" component={Journal} />
      <PrivateRoute path="/mood-tracker" component={MoodTracker} />
      <PrivateRoute path="/assessments" component={Assessments} />
      <PrivateRoute path="/achievements" component={Achievements} />
      <PrivateRoute path="/affirmations" component={Affirmations} />
      <PrivateRoute path="/goals" component={Goals} />
      <PrivateRoute path="/chatbot" component={ChatbotPage} />

      {/* Exercise routes */}
      <PrivateRoute path="/exercises/breathing" component={BreathingExercise} />
      <PrivateRoute path="/exercises/progressive-muscle-relaxation" component={ProgressiveMuscleRelaxation} />
      <PrivateRoute path="/exercises/guided-meditation" component={GuidedMeditation} />
      <PrivateRoute path="/exercises/thought-records" component={ThoughtRecords} />
      <PrivateRoute path="/exercises/cognitive-restructuring" component={CognitiveRestructuring} />
      <PrivateRoute path="/exercises/values-clarification" component={ValuesClarification} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <Router />
  );
}

export default App;

//Necessary files created to resolve import errors.  These are placeholders and need to be filled in with the actual application logic.
// lib/api/index.js (or .ts)
export const api = {
  // Add your API functions here
};

//components/auth/PrivateRoute.jsx (or .tsx)
import React from 'react';
import { Route, Redirect } from 'wouter';
import { useAuth } from '../../context/AuthContext';

export const PrivateRoute = ({ children, ...rest }) => {
  const { currentUser } = useAuth();
  return (
    <Route {...rest} element={currentUser ? children : <Redirect to="/login" />} />
  );
};


// components/Chatbot.jsx (or .tsx)
import React from 'react';

export const Chatbot = () => {
  return (
    <div>
      <h1>Chatbot Placeholder</h1>
    </div>
  );
};

//Placeholder components - replace with actual implementations.
//pages/Profile.jsx (or .tsx)
const Profile = () => <div>Profile Page</div>;
//pages/NewJournalEntry.jsx (or .tsx)
const NewJournalEntry = () => <div>New Journal Entry Page</div>;
//pages/JournalEntry.jsx (or .tsx)
const JournalEntry = () => <div>Journal Entry Page</div>;
//pages/MoodTracker.jsx (or .tsx)
const MoodTracker = () => <div>Mood Tracker Page</div>;