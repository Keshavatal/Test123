import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ExerciseCard, { ExerciseProps } from "@/components/dashboard/ExerciseCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { SearchIcon, Brain, Wind, Heart, PenLine } from "lucide-react";

export default function Exercises() {
  const { user, isLoading: authLoading } = useAuth();
  const [location, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: exerciseHistory, isLoading: exercisesLoading } = useQuery({
    queryKey: ['/api/exercises'],
    enabled: !!user
  });

  // Define exercise categories and all available exercises
  const allExercises: ExerciseProps[] = [
    {
      id: "cognitive",
      title: "Cognitive Restructuring",
      description: "Challenge and reframe negative thoughts with this guided exercise.",
      duration: 5,
      type: "cognitive",
      path: "/exercises/cognitive"
    },
    {
      id: "breathing",
      title: "Breathing Exercise",
      description: "Calm your mind with deep breathing techniques to reduce anxiety.",
      duration: 3,
      type: "breathing",
      path: "/exercises/breathing"
    },
    {
      id: "gratitude",
      title: "Gratitude Practice",
      description: "Focus on positive aspects of your life to improve your mood.",
      duration: 7,
      type: "gratitude",
      path: "/exercises/gratitude"
    },
    {
      id: "mindfulness",
      title: "Mindfulness Meditation",
      description: "Practice being present in the moment to reduce stress and anxiety.",
      duration: 10,
      type: "mindfulness",
      path: "/exercises/mindfulness"
    },
    {
      id: "progressive-relaxation",
      title: "Progressive Muscle Relaxation",
      description: "Tense and relax each muscle group to reduce physical tension.",
      duration: 12,
      type: "mindfulness",
      path: "/exercises/progressive-relaxation"
    },
    {
      id: "thought-record",
      title: "Thought Record",
      description: "Record and analyze your thoughts to identify thinking patterns.",
      duration: 8,
      type: "cognitive",
      path: "/exercises/thought-record"
    },
    {
      id: "values-clarification",
      title: "Values Clarification",
      description: "Identify your core values to guide your actions and decisions.",
      duration: 15,
      type: "cognitive",
      path: "/exercises/values-clarification"
    },
    {
      id: "box-breathing",
      title: "Box Breathing",
      description: "A structured breathing technique to reduce stress and anxiety.",
      duration: 5,
      type: "breathing",
      path: "/exercises/box-breathing"
    }
  ];

  // Filter exercises based on search query and tab
  const getFilteredExercises = (category: string) => {
    return allExercises.filter(exercise => {
      const matchesSearch = exercise.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           exercise.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (category === "all") {
        return matchesSearch;
      }
      
      return exercise.type === category && matchesSearch;
    });
  };

  // Function to handle exercise selection
  const handleExerciseSelect = (path: string) => {
    setLocation(path);
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg font-quicksand">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto mb-8">
          <h1 className="text-3xl font-quicksand font-bold mb-2">CBT Exercises Library</h1>
          <p className="text-lg text-muted-foreground mb-6">
            Explore our collection of evidence-based Cognitive Behavioral Therapy exercises
            designed to improve your mental wellbeing.
          </p>
          
          <div className="relative mb-6">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search for exercises..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Tabs defaultValue="all">
            <TabsList className="mb-6">
              <TabsTrigger value="all">All Exercises</TabsTrigger>
              <TabsTrigger value="cognitive" className="flex items-center">
                <PenLine className="h-4 w-4 mr-2" /> Cognitive
              </TabsTrigger>
              <TabsTrigger value="breathing" className="flex items-center">
                <Wind className="h-4 w-4 mr-2" /> Breathing
              </TabsTrigger>
              <TabsTrigger value="gratitude" className="flex items-center">
                <Heart className="h-4 w-4 mr-2" /> Gratitude
              </TabsTrigger>
              <TabsTrigger value="mindfulness" className="flex items-center">
                <Brain className="h-4 w-4 mr-2" /> Mindfulness
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {getFilteredExercises("all").map((exercise) => (
                  <ExerciseCard 
                    key={exercise.id} 
                    exercise={exercise} 
                    onStartExercise={() => handleExerciseSelect(exercise.path)}
                  />
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="cognitive" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {getFilteredExercises("cognitive").map((exercise) => (
                  <ExerciseCard 
                    key={exercise.id} 
                    exercise={exercise} 
                    onStartExercise={() => handleExerciseSelect(exercise.path)}
                  />
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="breathing" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {getFilteredExercises("breathing").map((exercise) => (
                  <ExerciseCard 
                    key={exercise.id} 
                    exercise={exercise} 
                    onStartExercise={() => handleExerciseSelect(exercise.path)}
                  />
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="gratitude" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {getFilteredExercises("gratitude").map((exercise) => (
                  <ExerciseCard 
                    key={exercise.id} 
                    exercise={exercise} 
                    onStartExercise={() => handleExerciseSelect(exercise.path)}
                  />
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="mindfulness" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {getFilteredExercises("mindfulness").map((exercise) => (
                  <ExerciseCard 
                    key={exercise.id} 
                    exercise={exercise} 
                    onStartExercise={() => handleExerciseSelect(exercise.path)}
                  />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
