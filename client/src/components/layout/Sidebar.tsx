import { Home, BarChart2, Calendar, BookOpen, Award, Activity, MessageSquare, Headphones } from "lucide-react";

// ... other imports ...

const routes = [
  { name: "Home", href: "/", icon: Home },
  { name: "Analytics", href: "/analytics", icon: BarChart2 },
  { name: "Calendar", href: "/calendar", icon: Calendar },
  { name: "Documentation", href: "/documentation", icon: BookOpen },
  { name: "Awards", href: "/awards", icon: Award },
  { name: "Activity", href: "/activity", icon: Activity },
  { name: "Chatbot", href: "/chatbot", icon: MessageSquare },
  { name: "Interactive Exercises", href: "/exercise-chatbot", icon: Headphones },
];

// ... rest of the code ...

// ExerciseChatbot.tsx
import React from 'react';

function ExerciseChatbot() {
  return (
    <div>
      <h1>Interactive Exercise Chatbot</h1>
      {/* Implement exercise components here */}
    </div>
  );
}

export default ExerciseChatbot;

// ... rest of the code, including routing configuration to handle the '/exercise-chatbot' route ...