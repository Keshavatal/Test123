import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useUserContext } from "@/contexts/UserContext";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

import { MoodTracker } from "@/components/MoodTracker";
import { ProgressCard } from "@/components/ProgressCard";
import { XPCard } from "@/components/XPCard";
import { StreakCard } from "@/components/StreakCard";
import { ExerciseCard } from "@/components/ExerciseCard";
import { ChatPreview } from "@/components/ChatPreview";
import { AchievementBadge } from "@/components/AchievementBadge";
import { ChatbotInterface } from "@/components/ChatbotInterface";
import { BreathingExercise } from "@/components/BreathingExercise";
import { Button } from "@/components/ui/button";
import { calculateAssessmentScore } from "@/lib/exercises";
import { Exercise } from "@shared/schema";

export default function Dashboard() {
  const { user } = useUserContext();
  const [_location, navigate] = useLocation();
  const [chatbotOpen, setChatbotOpen] = useState(false);
  const [activeExercise, setActiveExercise] = useState<Exercise | null>(null);
  const { toast } = useToast();

  // Fetch data
  const { data: exercises = [] } = useQuery({
    queryKey: ["/api/exercises"],
    enabled: !!user,
  });

  const { data: chatMessages = [] } = useQuery({
    queryKey: ["/api/chat"],
    enabled: !!user,
  });

  const { data: latestAssessment } = useQuery({
    queryKey: ["/api/assessment/latest"],
    enabled: !!user,
  });

  const { data: achievements = [] } = useQuery({
    queryKey: ["/api/achievements/user"],
    enabled: !!user,
  });

  // Calculate wellness score
  const wellnessScore = latestAssessment ? calculateAssessmentScore(latestAssessment.answers) : 75;

  // Handle starting an exercise
  const handleStartExercise = (exercise: Exercise) => {
    setActiveExercise(exercise);
  };

  // If user is not logged in, redirect to auth page
  if (!user) {
    navigate("/auth");
    return null;
  }

  return (
    <div className="animate-fade-in">
      <header className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold font-quicksand text-foreground">
          Welcome back, <span className="text-primary">{user.firstName}</span>!
        </h1>
        <p className="text-gray-500 mt-1">Let's continue your journey to better mental health.</p>
      </header>

      {/* Mood Tracker */}
      <MoodTracker userId={user.id} />

      {/* Daily Progress Stats */}
      <section className="mb-10 animate-slide-up" style={{ animationDelay: "0.2s" }}>
        <h2 className="text-xl font-semibold font-quicksand mb-4">Your Progress</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ProgressCard 
            title="Mental Wellness" 
            percentage={wellnessScore} 
            changeText={wellnessScore > 70 ? "Up 5% this week" : "Down 3% this week"} 
          />
          <XPCard 
            xp={user.xp} 
            level={user.level} 
            nextLevelXp={(user.level) * 100} 
          />
          <StreakCard currentStreak={user.currentStreak} />
        </div>
      </section>

      {/* Recommended Exercises */}
      <section className="mb-10 animate-slide-up" style={{ animationDelay: "0.3s" }}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold font-quicksand">Recommended for You</h2>
          <Button 
            variant="link" 
            className="text-primary"
            onClick={() => navigate("/exercises")}
          >
            See all
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {exercises.slice(0, 3).map((exercise) => (
            <ExerciseCard 
              key={exercise.id} 
              exercise={exercise} 
              onStartExercise={handleStartExercise} 
            />
          ))}
        </div>
      </section>

      {/* AI Chatbot Section */}
      <section className="animate-slide-up" style={{ animationDelay: "0.4s" }}>
        <div className="bg-white rounded-2xl shadow-md p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-primary bg-opacity-20 flex items-center justify-center">
              <i className="fas fa-robot text-primary text-xl"></i>
            </div>
            <div>
              <h2 className="text-xl font-semibold font-quicksand">Your AI Wellness Coach</h2>
              <p className="text-sm text-gray-500">Personalized CBT exercises and guidance</p>
            </div>
          </div>
          
          <ChatPreview messages={chatMessages} onClick={() => setChatbotOpen(true)} />

          <Button 
            className="w-full py-3 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold flex items-center justify-center gap-2 btn-hover-effect"
            onClick={() => setChatbotOpen(true)}
          >
            <i className="fas fa-comments"></i>
            <span>Continue Conversation</span>
          </Button>
        </div>
      </section>

      {/* Achievements Section */}
      <section className="mt-10 animate-slide-up" style={{ animationDelay: "0.5s" }}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold font-quicksand">Recent Achievements</h2>
          <Button 
            variant="link" 
            className="text-primary"
            onClick={() => navigate("/achievements")}
          >
            View all
          </Button>
        </div>
        <div className="flex flex-wrap gap-4">
          {achievements.slice(0, 4).map((achievement) => (
            <AchievementBadge
              key={achievement.id}
              title={achievement.title}
              icon={achievement.icon}
              iconBg={achievement.iconBg}
              unlocked={achievement.unlocked}
            />
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-12 text-center text-sm text-gray-500 pb-6">
        <p>© 2023 MindWell - CBT Mental Wellness App. All rights reserved.</p>
      </footer>

      {/* Modals/Dialogs */}
      <ChatbotInterface isOpen={chatbotOpen} onClose={() => setChatbotOpen(false)} />
      
      {activeExercise && activeExercise.type === "breathing" && (
        <BreathingExercise 
          exercise={activeExercise} 
          isOpen={!!activeExercise} 
          onClose={() => setActiveExercise(null)} 
        />
      )}
    </div>
  );
}
