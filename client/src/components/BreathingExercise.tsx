import React, { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Exercise } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useUserContext } from "@/contexts/UserContext";
import { useToast } from "@/hooks/use-toast";

interface BreathingExerciseProps {
  exercise: Exercise;
  isOpen: boolean;
  onClose: () => void;
}

export function BreathingExercise({ exercise, isOpen, onClose }: BreathingExerciseProps) {
  const [secondsLeft, setSecondsLeft] = useState(exercise.durationMinutes * 60);
  const [breatheInPhase, setBreatheInPhase] = useState(true);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const phaseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { user, updateUserState } = useUserContext();
  const { toast } = useToast();
  
  const totalDuration = exercise.durationMinutes * 60;
  
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

  useEffect(() => {
    if (isOpen) {
      // Start timer
      timerRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            // Exercise complete
            if (timerRef.current) clearInterval(timerRef.current);
            if (phaseTimerRef.current) clearInterval(phaseTimerRef.current);
            
            // Record completion
            if (user) {
              completeExerciseMutation.mutate(exercise.id);
            }
            
            return 0;
          }
          // Update progress percentage
          setProgress(((totalDuration - prev + 1) / totalDuration) * 100);
          return prev - 1;
        });
      }, 1000);

      // Start breathe in/out phases (4 seconds each)
      phaseTimerRef.current = setInterval(() => {
        setBreatheInPhase((prev) => !prev);
      }, 4000);
    }

    return () => {
      // Clean up timers
      if (timerRef.current) clearInterval(timerRef.current);
      if (phaseTimerRef.current) clearInterval(phaseTimerRef.current);
    };
  }, [isOpen, exercise.id, totalDuration, user]);

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' + secs : secs}`;
  };

  const handleFinish = () => {
    // Clean up timers
    if (timerRef.current) clearInterval(timerRef.current);
    if (phaseTimerRef.current) clearInterval(phaseTimerRef.current);
    
    // Record completion if at least 50% complete
    if (progress >= 50 && user) {
      completeExerciseMutation.mutate(exercise.id);
    }
    
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleFinish()}>
      <DialogContent className="bg-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold font-quicksand mb-2">Breathing Exercise</DialogTitle>
          <DialogDescription>
            Follow the circle as it expands and contracts. Breathe in as it grows, breathe out as it shrinks.
          </DialogDescription>
        </DialogHeader>
        
        <div className="relative w-48 h-48 mx-auto my-8">
          <div className="absolute inset-0 rounded-full bg-primary bg-opacity-20 flex items-center justify-center">
            <div 
              className={`w-32 h-32 rounded-full bg-primary bg-opacity-30 animate-breathe`}
              style={{
                animationPlayState: secondsLeft === 0 ? 'paused' : 'running'
              }}
            ></div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-primary font-medium">
              {breatheInPhase ? "Breathe in..." : "Breathe out..."}
            </span>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Progress</span>
            <span className="text-sm text-gray-500">{formatTime(secondsLeft)}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
        
        <Button 
          className="w-full bg-primary hover:bg-primary/90 mt-4"
          onClick={handleFinish}
        >
          {secondsLeft === 0 ? "Complete" : "Finish Early"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
