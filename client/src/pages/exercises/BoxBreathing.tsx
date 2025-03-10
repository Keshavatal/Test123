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
import { Wind, ArrowLeft, Award } from "lucide-react";

export default function BoxBreathing() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Box breathing exercise state
  const [phase, setPhase] = useState<"inhale" | "hold1" | "exhale" | "hold2">("inhale");
  const [secondsLeft, setSecondsLeft] = useState(300); // 5 minutes
  const [progress, setProgress] = useState(0);
  const [cycles, setCycles] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  
  const phaseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  const boxBreathingPattern = {
    inhale: 4,
    hold1: 4,
    exhale: 4,
    hold2: 4
  };
  
  // Complete exercise mutation
  const completeMutation = useMutation({
    mutationFn: async () => {
      if (!user) return;
      
      // Calculate duration and XP
      const totalSeconds = 300 - secondsLeft;
      const xp = Math.max(15, Math.min(60, Math.floor(totalSeconds / 10)));
      setXpEarned(xp);
      
      return apiRequest('POST', '/api/exercises', {
        userId: user.id,
        type: 'breathing',
        duration: totalSeconds,
        notes: `Completed ${cycles} box breathing cycles`,
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
      if (cycles >= 8) {
        // Create breath master achievement if not exists
        apiRequest('POST', '/api/achievements', {
          userId: user?.id,
          badgeId: 'breath-master'
        }).then(() => {
          queryClient.invalidateQueries({ queryKey: ['/api/achievements'] });
          toast({
            title: "Achievement Unlocked!",
            description: "Breath Master: Complete box breathing exercise",
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
    
    let countdown = boxBreathingPattern[phase];
    
    phaseTimerRef.current = setInterval(() => {
      countdown--;
      
      if (countdown <= 0) {
        // Move to next phase
        if (phase === "inhale") {
          setPhase("hold1");
        } else if (phase === "hold1") {
          setPhase("exhale");
        } else if (phase === "exhale") {
          setPhase("hold2");
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
        setProgress(((300 - newTime) / 300) * 100);
        
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
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Exercises
        </Button>
        
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center mr-3">
                  <Wind className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Box Breathing</CardTitle>
                  <CardDescription>
                    A structured breathing technique to reduce stress and anxiety
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
              {/* Box breathing animation */}
              <div className="relative w-64 h-64 mb-8">
                {/* Drawing the box */}
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  {/* Box outline */}
                  <rect
                    x="10"
                    y="10"
                    width="80"
                    height="80"
                    stroke="#cbd5e0"
                    strokeWidth="1"
                    fill="none"
                  />
                  
                  {/* Animated line based on current phase */}
                  {phase === "inhale" && (
                    <motion.line
                      x1="10"
                      y1="10"
                      x2="10"
                      initial={{ y2: 10 }}
                      animate={{ y2: 90 }}
                      transition={{ duration: 4, ease: "linear" }}
                      stroke="#3182ce"
                      strokeWidth="3"
                    />
                  )}
                  
                  {phase === "hold1" && (
                    <motion.line
                      y1="90"
                      x1="10"
                      y2="90"
                      initial={{ x2: 10 }}
                      animate={{ x2: 90 }}
                      transition={{ duration: 4, ease: "linear" }}
                      stroke="#3182ce"
                      strokeWidth="3"
                    />
                  )}
                  
                  {phase === "exhale" && (
                    <motion.line
                      x1="90"
                      y1="90"
                      x2="90"
                      initial={{ y2: 90 }}
                      animate={{ y2: 10 }}
                      transition={{ duration: 4, ease: "linear" }}
                      stroke="#3182ce"
                      strokeWidth="3"
                    />
                  )}
                  
                  {phase === "hold2" && (
                    <motion.line
                      y1="10"
                      x1="90"
                      y2="10"
                      initial={{ x2: 90 }}
                      animate={{ x2: 10 }}
                      transition={{ duration: 4, ease: "linear" }}
                      stroke="#3182ce"
                      strokeWidth="3"
                    />
                  )}
                  
                  {/* Phase labels */}
                  <text x="5" y="50" className="text-xs fill-current text-gray-500" textAnchor="middle" transform="rotate(270, 5, 50)">
                    Inhale (4s)
                  </text>
                  <text x="50" y="95" className="text-xs fill-current text-gray-500" textAnchor="middle">
                    Hold (4s)
                  </text>
                  <text x="95" y="50" className="text-xs fill-current text-gray-500" textAnchor="middle" transform="rotate(90, 95, 50)">
                    Exhale (4s)
                  </text>
                  <text x="50" y="5" className="text-xs fill-current text-gray-500" textAnchor="middle">
                    Hold (4s)
                  </text>
                </svg>
                
                {/* Center instruction */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={phase}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.5 }}
                      className="bg-primary/10 rounded-full w-24 h-24 flex items-center justify-center text-center p-2"
                    >
                      <span className="text-primary font-medium">
                        {phase === "inhale" ? "Breathe In" : 
                         phase === "hold1" ? "Hold" : 
                         phase === "exhale" ? "Breathe Out" : 
                         "Hold"}
                      </span>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
              
              <div className="text-center">
                <h3 className="text-xl font-semibold mb-2">Box Breathing Technique</h3>
                <p className="text-muted-foreground">
                  Follow the moving line around the box
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
                  {secondsLeft === 300 ? "Start Exercise" : "Resume"}
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
              disabled={cycles < 2}
            >
              Complete Exercise
            </Button>
          </CardFooter>
        </Card>
        
        <Card className="max-w-2xl mx-auto mt-6">
          <CardHeader>
            <CardTitle className="text-lg">About Box Breathing</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              Box breathing, also known as square breathing, is a simple but powerful technique used by Navy SEALs, police officers, nurses, and many others to manage stress and improve focus.
            </p>
            
            <h4 className="font-semibold mb-2">Benefits of Box Breathing:</h4>
            <ul className="list-disc pl-5 space-y-1 mb-4">
              <li>Reduces stress and anxiety</li>
              <li>Regulates the autonomic nervous system</li>
              <li>Improves focus and concentration</li>
              <li>Can help manage pain</li>
              <li>Supports better sleep when practiced before bedtime</li>
              <li>Can be practiced anywhere, anytime</li>
            </ul>
            
            <h4 className="font-semibold mb-2">When to Practice:</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>Before stressful situations</li>
              <li>During moments of anxiety</li>
              <li>As part of a daily meditation routine</li>
              <li>Before important meetings or performances</li>
              <li>To help fall asleep</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}