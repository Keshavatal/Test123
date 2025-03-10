import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLocation } from "wouter";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import MoodTracker from "@/components/dashboard/MoodTracker";
import ProgressStats from "@/components/dashboard/ProgressStats";
import ProgressChart from "@/components/dashboard/ProgressChart";
import ExerciseCard from "@/components/dashboard/ExerciseCard";
import ChatbotInterface from "@/components/dashboard/ChatbotInterface";
import AchievementsSection from "@/components/dashboard/AchievementsSection";
import DailyChallengeCard from "@/components/dashboard/DailyChallengeCard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function Dashboard() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      setLocation('/login');
    } else if (user && !user.initialAssessmentCompleted) {
      setLocation('/assessment');
    }
  }, [user, isLoading, setLocation]);

  // Recommended exercises
  const recommendedExercises = [
    {
      id: "cognitive",
      title: "Cognitive Restructuring",
      description: "Challenge and reframe negative thoughts with this guided exercise.",
      duration: 5,
      type: "cognitive" as const,
      path: "/exercises/cognitive"
    },
    {
      id: "breathing",
      title: "Breathing Exercise",
      description: "Calm your mind with deep breathing techniques to reduce anxiety.",
      duration: 3,
      type: "breathing" as const,
      path: "/exercises/breathing"
    },
    {
      id: "gratitude",
      title: "Gratitude Practice",
      description: "Focus on positive aspects of your life to improve your mood.",
      duration: 7,
      type: "gratitude" as const,
      path: "/exercises/gratitude"
    },
    {
      id: "mindfulness",
      title: "Mindfulness Meditation",
      description: "Practice being present in the moment to reduce stress and anxiety.",
      duration: 10,
      type: "mindfulness" as const,
      path: "/exercises/mindfulness"
    }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg font-quicksand">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <section className="mb-12">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div>
              <h2 className="text-3xl font-quicksand font-bold mb-2">Welcome back, {user.firstName}</h2>
              <p className="text-lg text-textColor opacity-80">Continue your mental wellness journey</p>
            </div>
            
            <MoodTracker />
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column (2/3 width on large screens) */}
          <div className="lg:col-span-2">
            <section className="bg-white rounded-2xl shadow-md p-6 mb-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-quicksand font-bold">Your Wellness Journey</h3>
              </div>

              <ProgressStats />
              <ProgressChart />
            </section>

            <section className="bg-white rounded-2xl shadow-md p-6 mb-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-quicksand font-bold">Recommended CBT Exercises</h3>
                <Link href="/exercises">
                  <Button variant="ghost" className="text-sm">
                    View all exercises
                  </Button>
                </Link>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {recommendedExercises.map((exercise) => (
                  <ExerciseCard key={exercise.id} exercise={exercise} />
                ))}
              </div>
            </section>
          </div>

          {/* Right Column (1/3 width on large screens) */}
          <div>
            <ChatbotInterface />
            <AchievementsSection />
            <DailyChallengeCard />
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
