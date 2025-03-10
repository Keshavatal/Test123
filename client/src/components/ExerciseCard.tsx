import React from "react";
import { Card } from "@/components/ui/card";
import { Exercise } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useUserContext } from "@/contexts/UserContext";

interface ExerciseCardProps {
  exercise: Exercise;
  onStartExercise: (exercise: Exercise) => void;
}

export function ExerciseCard({ exercise, onStartExercise }: ExerciseCardProps) {
  const { user, updateUserState } = useUserContext();
  const { toast } = useToast();
  
  const completeExerciseMutation = useMutation({
    mutationFn: async (exerciseId: number) => {
      if (!user) throw new Error("User not logged in");
      
      const res = await apiRequest("POST", "/api/exercises/complete", {
        userId: user.id,
        exerciseId,
      });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/exercises/completions"] });
      
      if (user) {
        // Update user XP and level in context
        updateUserState({
          ...user,
          xp: data.userXp,
          level: data.userLevel,
        });
      }
      
      toast({
        title: "Exercise completed!",
        description: `You earned ${exercise.xpReward} XP`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to complete exercise",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleStartExercise = () => {
    onStartExercise(exercise);
  };

  return (
    <Card className="overflow-hidden app-card h-full">
      <div className={`h-40 ${exercise.iconBg} flex items-center justify-center`}>
        <i className={`fas ${exercise.icon} text-5xl text-primary`}></i>
      </div>
      <div className="p-5">
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-quicksand font-semibold text-lg">{exercise.title}</h3>
          <span className="bg-accent bg-opacity-30 text-purple-600 text-xs px-2 py-1 rounded-full">
            {exercise.durationMinutes} min
          </span>
        </div>
        <p className="text-gray-500 text-sm mb-4">{exercise.description}</p>
        <button 
          className="w-full py-2.5 rounded-xl bg-primary text-white font-medium hover:bg-opacity-90 transition-colors btn-hover-effect"
          onClick={handleStartExercise}
        >
          Start Exercise
        </button>
      </div>
    </Card>
  );
}
