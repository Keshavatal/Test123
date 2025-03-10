import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Wind, XCircle, Award } from "lucide-react";

export default function BreathingExercise() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Breathing exercise state
  const [phase, setPhase] = useState<"inhale" | "hold" | "exhale" | "rest">("inhale");
  const [secondsLeft, setSecondsLeft] = useState(180); // 3 minutes
  const [progress, setProgress] = useState(0);
  const [cycles, setCycles] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  
  const phaseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  const breathingPatterns = {
    inhale: 4,
    hold: 4,
    exhale: 4,
    rest: 2
  };
  
  // Complete exercise mutation
  const completeMutation = useMutation({
    mutationFn: async () => {
      if (!user) return;
      
      // Calculate duration and XP
      const totalSeconds = 180 - secondsLeft;
      const xp = Math.max(10, Math.min(50, Math.floor(totalSeconds / 10)));
      setXpEarned(xp);
      
      return apiRequest('POST', '/api/exercises', {
        userId: user.id,
        type: 'breathing',
        duration: totalSeconds,
        notes: `Completed ${cycles} breathing cycles`,
        xpEarned: xp
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/exercises'] });
      queryClient.invalidateQueries({ queryKey: ['/api/me'] });
      setShowConfetti(true);
      
      toast({
        title: "Exercise Completed!",
        description: `Great job! You've earned ${xpEarned} XP.`,
      });
      
      // Check for achievement
      if (cycles >= 5) {
        // Create breath master achievement if not exists
        apiRequest('POST', '/api/achievements', {
          userId: user?.id,
          badgeId: 'breath-master'
        }).then(() => {
          queryClient.invalidateQueries({ queryKey: ['/api/achievements'] });
          toast({
            title: "Achievement Unlocked!",
            description: "Breath Master: Complete 5 breathing cycles",
            variant: "default",
          });
        });
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save your progress. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Handle phase transitions
  useEffect(() => {
    if (!isActive) return;
    
    let countdown = phase === "inhale" ? breathingPatterns.inhale : 
                   phase === "hold" ? breathingPatterns.hold : 
                   phase === "exhale" ? breathingPatterns.exhale : 
                   breathingPatterns.rest;
    
    phaseTimerRef.current = setInterval(() => {
      countdown--;
      
      if (countdown <= 0) {
        // Move to next phase
        if (phase === "inhale") {
          setPhase("hold");
        } else if (phase === "hold") {
          setPhase("exhale");
        } else if (phase === "exhale") {
          setPhase("rest");
        } else {
          // Completed one cycle
          setCycles(prev => prev + 1);
          setPhase("inhale");
        }
        
        clearInterval(phaseTimerRef.current!);
      }
    }, 1000);
    
    return () => {
      if (phaseTimerRef.current) clearInterval(phaseTimerRef.current);
    };
  }, [phase, isActive]);
  
  // Handle overall timer
  useEffect(() => {
    if (!isActive) return;
    
    timerRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        const newTime = prev - 1;
        setProgress(((180 - newTime) / 180) * 100);
        
        if (newTime <= 0) {
          handleComplete();
          return 0;
        }
        
        return newTime;
      });
    }, 1000);
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (phaseTimerRef.current) clearInterval(phaseTimerRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);
  
  const handleStart = () => {
    setIsActive(true);
  };
  
  const handlePause = () => {
    setIsActive(false);
  };
  
  const handleComplete = () => {
    setIsActive(false);
    if (phaseTimerRef.current) clearInterval(phaseTimerRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    completeMutation.mutate();
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  if (!user) {
    return null;
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-accent/20 pt-10">
      <div className="container mx-auto px-4">
        <Button 
          variant="ghost" 
          className="mb-6"
          onClick={() => setLocation('/exercises')}
        >
          ← Back to Exercises
        </Button>
        
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center mr-3">
                  <Wind className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Breathing Exercise</CardTitle>
                  <CardDescription>
                    Calm your mind and reduce anxiety with deep breathing
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            {showConfetti && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-full h-full overflow-hidden">
                  {/* Confetti effect */}
                  {Array.from({ length: 50 }).map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute"
                      initial={{
                        top: -20,
                        left: Math.random() * 100 + "%",
                        width: Math.random() * 10 + 5,
                        height: Math.random() * 10 + 5,
                        backgroundColor: 
                          ["#FFD700", "#FF6347", "#4169E1", "#32CD32", "#FF69B4"][
                            Math.floor(Math.random() * 5)
                          ]
                      }}
                      animate={{
                        top: "100%",
                        rotate: Math.random() * 360,
                        x: Math.random() * 200 - 100
                      }}
                      transition={{
                        duration: Math.random() * 2 + 2,
                        ease: "easeOut"
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          
            <div className="flex flex-col items-center my-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={phase}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.5 }}
                  className="relative"
                >
                  <div 
                    className={`w-48 h-48 rounded-full flex items-center justify-center
                      ${phase === "inhale" ? "bg-blue-500/20 animate-expand" : 
                        phase === "hold" ? "bg-purple-500/20" : 
                        phase === "exhale" ? "bg-green-500/20 animate-contract" : 
                        "bg-gray-500/20"}`}
                  >
                    <div 
                      className={`w-36 h-36 rounded-full flex items-center justify-center
                        ${phase === "inhale" ? "bg-blue-500/30" : 
                          phase === "hold" ? "bg-purple-500/30" : 
                          phase === "exhale" ? "bg-green-500/30" : 
                          "bg-gray-500/30"}`}
                    >
                      <div 
                        className={`w-24 h-24 rounded-full flex items-center justify-center text-white text-lg font-semibold
                          ${phase === "inhale" ? "bg-blue-500" : 
                            phase === "hold" ? "bg-purple-500" : 
                            phase === "exhale" ? "bg-green-500" : 
                            "bg-gray-500"}`}
                      >
                        <span>{phase}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
              
              <div className="mt-8 text-center">
                <h3 className="text-xl font-semibold mb-2">
                  {phase === "inhale" ? "Breathe In" : 
                   phase === "hold" ? "Hold" : 
                   phase === "exhale" ? "Breathe Out" : 
                   "Rest"}
                </h3>
                <p className="text-muted-foreground">
                  Follow the circle's rhythm for a calming effect
                </p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Time Remaining: {formatTime(secondsLeft)}</span>
                <span className="text-sm">Cycles: {cycles}</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col sm:flex-row gap-3 justify-between">
            <div className="flex gap-3">
              {!isActive ? (
                <Button 
                  onClick={handleStart} 
                  className="flex-1"
                >
                  {secondsLeft === 180 ? "Start Exercise" : "Resume"}
                </Button>
              ) : (
                <Button 
                  onClick={handlePause} 
                  variant="outline" 
                  className="flex-1"
                >
                  Pause
                </Button>
              )}
              
              <Button 
                variant="secondary" 
                onClick={() => setLocation('/exercises')}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
            
            <Button 
              variant="default" 
              onClick={handleComplete} 
              className="bg-green-600 hover:bg-green-700 flex-1"
              disabled={cycles < 1}
            >
              Complete Exercise
            </Button>
          </CardFooter>
        </Card>
        
        <Card className="max-w-2xl mx-auto mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal pl-5 space-y-2">
              <li>Sit comfortably with your back straight and shoulders relaxed.</li>
              <li>When prompted to <strong>Breathe In</strong>, inhale deeply through your nose for 4 seconds.</li>
              <li>When prompted to <strong>Hold</strong>, hold your breath for 4 seconds.</li>
              <li>When prompted to <strong>Breathe Out</strong>, exhale slowly through your mouth for 4 seconds.</li>
              <li>When prompted to <strong>Rest</strong>, rest for 2 seconds before starting the next cycle.</li>
              <li>Continue following the breathing pattern for at least 5 cycles.</li>
              <li>Focus on your breathing and the sensation of air entering and leaving your body.</li>
            </ol>
          </CardContent>
        </Card>
      </div>
      
      <style jsx global>{`
        @keyframes expand {
          0% { transform: scale(0.9); }
          100% { transform: scale(1.1); }
        }
        
        @keyframes contract {
          0% { transform: scale(1.1); }
          100% { transform: scale(0.9); }
        }
        
        .animate-expand {
          animation: expand 4s infinite alternate;
        }
        
        .animate-contract {
          animation: contract 4s infinite alternate;
        }
      `}</style>
    </div>
  );
}