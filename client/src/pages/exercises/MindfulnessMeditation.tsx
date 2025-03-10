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
import { Brain, ArrowLeft, Award, Volume2, VolumeX } from "lucide-react";

interface MindfulnessStep {
  instruction: string;
  duration: number; // in seconds
}

export default function MindfulnessMeditation() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Meditation exercise state
  const [currentStep, setCurrentStep] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [totalSecondsLeft, setTotalSecondsLeft] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [audioEnabled, setAudioEnabled] = useState(true);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Mindfulness steps
  const steps: MindfulnessStep[] = [
    { instruction: "Find a comfortable position and gently close your eyes.", duration: 15 },
    { instruction: "Take a deep breath in through your nose...", duration: 5 },
    { instruction: "...and slowly exhale through your mouth.", duration: 5 },
    { instruction: "Notice how your body feels right now, without judgment.", duration: 15 },
    { instruction: "Focus your attention on your breathing. Notice the sensations as air enters and leaves your body.", duration: 20 },
    { instruction: "When your mind wanders, gently bring your attention back to your breath.", duration: 20 },
    { instruction: "Expand your awareness to the sensations in your whole body.", duration: 20 },
    { instruction: "Notice any thoughts that arise, but let them pass without judging them.", duration: 20 },
    { instruction: "Return your focus to your breath whenever you notice your mind has wandered.", duration: 20 },
    { instruction: "Begin to deepen your breath, preparing to conclude the practice.", duration: 10 },
    { instruction: "When you're ready, gently open your eyes and return your awareness to the room.", duration: 10 },
    { instruction: "Take a moment to notice how you feel now compared to when you started.", duration: 15 }
  ];
  
  // Calculate total duration
  const totalDuration = steps.reduce((total, step) => total + step.duration, 0);
  
  // Complete exercise mutation
  const completeMutation = useMutation({
    mutationFn: async () => {
      if (!user) return;
      
      // Calculate duration and XP
      const completedDuration = totalDuration - totalSecondsLeft;
      const xp = Math.max(20, Math.min(60, Math.floor(completedDuration / 10)));
      setXpEarned(xp);
      
      return apiRequest('POST', '/api/exercises', {
        userId: user.id,
        type: 'mindfulness',
        duration: completedDuration,
        notes: `Completed ${currentStep} of ${steps.length} steps`,
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
      if (currentStep >= steps.length - 1) {
        // Create mindfulness achievement if not exists
        apiRequest('POST', '/api/achievements', {
          userId: user?.id,
          badgeId: 'mindfulness'
        }).then(() => {
          queryClient.invalidateQueries({ queryKey: ['/api/achievements'] });
          toast({
            title: "Achievement Unlocked!",
            description: "Mindfulness: Complete a full meditation session",
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
  
  // Initialize timers
  useEffect(() => {
    // Set up audio
    audioRef.current = new Audio('https://cdn.pixabay.com/download/audio/2021/11/25/audio_0dda1bac75.mp3?filename=relaxing-meditation-128980.mp3');
    if (audioRef.current) {
      audioRef.current.loop = true;
      audioRef.current.volume = 0.4;
    }
    
    setSecondsLeft(steps[0].duration);
    setTotalSecondsLeft(totalDuration);
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);
  
  // Handle timer
  useEffect(() => {
    if (!isActive) return;
    
    if (audioRef.current && audioEnabled) {
      audioRef.current.play().catch(e => console.error("Audio play failed:", e));
    }
    
    timerRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        const newTime = prev - 1;
        
        if (newTime <= 0) {
          // Move to next step
          const nextStep = currentStep + 1;
          
          if (nextStep >= steps.length) {
            // Meditation complete
            handleComplete();
            return 0;
          } else {
            setCurrentStep(nextStep);
            return steps[nextStep].duration;
          }
        }
        
        return newTime;
      });
      
      setTotalSecondsLeft(prev => {
        const newTotal = prev - 1;
        setProgress(((totalDuration - newTotal) / totalDuration) * 100);
        return Math.max(0, newTotal);
      });
    }, 1000);
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioRef.current) audioRef.current.pause();
    };
  }, [isActive, currentStep]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);
  
  const handleStart = () => {
    setIsActive(true);
  };
  
  const handlePause = () => {
    setIsActive(false);
    if (audioRef.current) audioRef.current.pause();
  };
  
  const handleComplete = () => {
    setIsActive(false);
    if (timerRef.current) clearInterval(timerRef.current);
    if (audioRef.current) audioRef.current.pause();
    completeMutation.mutate();
  };
  
  const toggleAudio = () => {
    setAudioEnabled(!audioEnabled);
    if (audioRef.current) {
      if (audioEnabled) {
        audioRef.current.pause();
      } else if (isActive) {
        audioRef.current.play().catch(e => console.error("Audio play failed:", e));
      }
    }
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
                  <Brain className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Mindfulness Meditation</CardTitle>
                  <CardDescription>
                    A guided meditation to help you focus on the present moment
                  </CardDescription>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleAudio}
                title={audioEnabled ? "Mute background sounds" : "Enable background sounds"}
              >
                {audioEnabled ? (
                  <Volume2 className="h-5 w-5" />
                ) : (
                  <VolumeX className="h-5 w-5" />
                )}
              </Button>
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
            
            <div className="h-64 bg-primary/5 rounded-xl flex items-center justify-center my-6 overflow-hidden relative">
              {/* Ambient pulsing circle */}
              <motion.div
                animate={{ 
                  scale: isActive ? [1, 1.1, 1] : 1,
                  opacity: isActive ? [0.5, 0.2, 0.5] : 0.5
                }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 4,
                  ease: "easeInOut"
                }}
                className="absolute w-40 h-40 bg-primary/20 rounded-full"
              />
              
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.5 }}
                  className="text-center p-8 max-w-sm relative z-10"
                >
                  <p className="font-quicksand text-xl text-primary">
                    {steps[currentStep].instruction}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Current Step: {currentStep + 1}/{steps.length}</span>
                <span className="text-sm">Remaining: {formatTime(totalSecondsLeft)}</span>
              </div>
              <Progress value={progress} className="h-2" />
              <div className="flex justify-between items-center text-xs text-muted-foreground">
                <span>Beginning</span>
                <span>Halfway</span>
                <span>End</span>
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col sm:flex-row gap-3 justify-between">
            <div className="flex gap-3">
              {!isActive ? (
                <Button 
                  onClick={handleStart} 
                  className="flex-1"
                >
                  {progress === 0 ? "Start Meditation" : "Resume"}
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
              disabled={progress < 30} // Only enable after 30% completion
            >
              Complete Meditation
            </Button>
          </CardFooter>
        </Card>
        
        <Card className="max-w-2xl mx-auto mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Benefits of Mindfulness</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-2">
              <li>Reduces stress and anxiety</li>
              <li>Improves focus and concentration</li>
              <li>Enhances self-awareness</li>
              <li>Helps manage difficult emotions</li>
              <li>Promotes better sleep</li>
              <li>Increases present moment awareness</li>
              <li>Reduces rumination and negative thinking</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}