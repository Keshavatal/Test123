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

interface RelaxationStep {
  bodyPart: string;
  instruction: string;
  duration: number; // in seconds
}

export default function ProgressiveRelaxation() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Relaxation exercise state
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
  
  // Progressive relaxation steps
  const steps: RelaxationStep[] = [
    { bodyPart: "Introduction", instruction: "Find a comfortable position. This exercise will guide you through tensing and relaxing different muscle groups.", duration: 15 },
    { bodyPart: "Hands & Arms", instruction: "Clench your fists tightly... Hold... Now release and feel the tension flow away.", duration: 10 },
    { bodyPart: "Hands & Arms", instruction: "Bend your elbows and tense your biceps... Hold... Now relax and notice the difference.", duration: 10 },
    { bodyPart: "Shoulders", instruction: "Raise your shoulders up to your ears... Hold... Now let them drop and feel the relaxation.", duration: 10 },
    { bodyPart: "Neck", instruction: "Press your head back against your chair or bed... Hold... Now release and let your neck relax.", duration: 10 },
    { bodyPart: "Face", instruction: "Scrunch up your face tightly... Hold... Now release and feel your face soften.", duration: 10 },
    { bodyPart: "Jaw", instruction: "Clench your jaw tightly... Hold... Now release and let your jaw hang loose.", duration: 10 },
    { bodyPart: "Chest", instruction: "Take a deep breath and hold it while tensing your chest... Hold... Now exhale and relax.", duration: 10 },
    { bodyPart: "Stomach", instruction: "Tighten your stomach muscles... Hold... Now release and notice the relaxation.", duration: 10 },
    { bodyPart: "Back", instruction: "Arch your back slightly... Hold... Now relax and settle comfortably.", duration: 10 },
    { bodyPart: "Hips & Buttocks", instruction: "Squeeze your buttocks together... Hold... Now release and feel the tension drain away.", duration: 10 },
    { bodyPart: "Legs", instruction: "Extend your legs and point your toes towards your face... Hold... Now relax.", duration: 10 },
    { bodyPart: "Feet", instruction: "Curl your toes downward... Hold... Now release and let your feet relax completely.", duration: 10 },
    { bodyPart: "Whole Body", instruction: "Be aware of your entire body... Notice how relaxed and heavy it feels.", duration: 15 },
    { bodyPart: "Whole Body", instruction: "Take a deep breath in... And out... Feeling completely relaxed and at peace.", duration: 10 },
    { bodyPart: "Conclusion", instruction: "When you're ready, gently wiggle your fingers and toes. Slowly open your eyes if they're closed.", duration: 15 }
  ];
  
  // Calculate total duration
  const totalDuration = steps.reduce((total, step) => total + step.duration, 0);
  
  // Complete exercise mutation
  const completeMutation = useMutation({
    mutationFn: async () => {
      if (!user) return;
      
      // Calculate duration and XP
      const completedDuration = totalDuration - totalSecondsLeft;
      const xp = Math.max(30, Math.min(80, Math.floor(completedDuration / 8)));
      setXpEarned(xp);
      
      return apiRequest('POST', '/api/exercises', {
        userId: user.id,
        type: 'mindfulness',
        duration: completedDuration,
        notes: `Completed ${currentStep} of ${steps.length} steps of progressive muscle relaxation`,
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
      if (currentStep >= steps.length - 2) {
        // Create mindfulness achievement if not exists
        apiRequest('POST', '/api/achievements', {
          userId: user?.id,
          badgeId: 'mindfulness'
        }).then(() => {
          queryClient.invalidateQueries({ queryKey: ['/api/achievements'] });
          toast({
            title: "Achievement Unlocked!",
            description: "Mindfulness: Complete a full relaxation session",
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
    audioRef.current = new Audio('https://cdn.pixabay.com/download/audio/2022/05/16/audio_0296df5506.mp3?filename=relaxing-light-melody-soft-piano-music-119651.mp3');
    if (audioRef.current) {
      audioRef.current.loop = true;
      audioRef.current.volume = 0.3;
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
            // Relaxation complete
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
                  <CardTitle>Progressive Muscle Relaxation</CardTitle>
                  <CardDescription>
                    Tense and relax each muscle group to reduce physical tension
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
              {/* Body part visualization */}
              <div className="absolute inset-0 flex items-center justify-center">
                <svg 
                  viewBox="0 0 200 320" 
                  width="120" 
                  height="180" 
                  className="opacity-20"
                >
                  {/* Simple body outline */}
                  <circle cx="100" cy="60" r="40" /> {/* Head */}
                  <line x1="100" y1="100" x2="100" y2="200" stroke="#000" strokeWidth="4" /> {/* Torso */}
                  <line x1="100" y1="125" x2="50" y2="175" stroke="#000" strokeWidth="4" /> {/* Left arm */}
                  <line x1="100" y1="125" x2="150" y2="175" stroke="#000" strokeWidth="4" /> {/* Right arm */}
                  <line x1="100" y1="200" x2="75" y2="280" stroke="#000" strokeWidth="4" /> {/* Left leg */}
                  <line x1="100" y1="200" x2="125" y2="280" stroke="#000" strokeWidth="4" /> {/* Right leg */}
                  
                  {/* Highlight current body part */}
                  {currentStep > 0 && currentStep < steps.length - 1 && (
                    <>
                      {/* Hands & Arms */}
                      {(steps[currentStep].bodyPart === "Hands & Arms") && (
                        <>
                          <circle cx="50" cy="175" r="12" fill="#3182ce" />
                          <circle cx="150" cy="175" r="12" fill="#3182ce" />
                        </>
                      )}
                      
                      {/* Shoulders */}
                      {steps[currentStep].bodyPart === "Shoulders" && (
                        <>
                          <circle cx="80" cy="115" r="12" fill="#3182ce" />
                          <circle cx="120" cy="115" r="12" fill="#3182ce" />
                        </>
                      )}
                      
                      {/* Neck */}
                      {steps[currentStep].bodyPart === "Neck" && (
                        <rect x="90" y="90" width="20" height="20" fill="#3182ce" />
                      )}
                      
                      {/* Face */}
                      {steps[currentStep].bodyPart === "Face" && (
                        <circle cx="100" cy="50" r="15" fill="#3182ce" />
                      )}
                      
                      {/* Jaw */}
                      {steps[currentStep].bodyPart === "Jaw" && (
                        <rect x="85" y="70" width="30" height="10" fill="#3182ce" />
                      )}
                      
                      {/* Chest */}
                      {steps[currentStep].bodyPart === "Chest" && (
                        <rect x="85" y="130" width="30" height="25" fill="#3182ce" />
                      )}
                      
                      {/* Stomach */}
                      {steps[currentStep].bodyPart === "Stomach" && (
                        <rect x="85" y="155" width="30" height="25" fill="#3182ce" />
                      )}
                      
                      {/* Back */}
                      {steps[currentStep].bodyPart === "Back" && (
                        <line x1="85" y1="140" x2="115" y2="140" stroke="#3182ce" strokeWidth="10" />
                      )}
                      
                      {/* Hips & Buttocks */}
                      {steps[currentStep].bodyPart === "Hips & Buttocks" && (
                        <rect x="85" y="190" width="30" height="20" fill="#3182ce" />
                      )}
                      
                      {/* Legs */}
                      {steps[currentStep].bodyPart === "Legs" && (
                        <>
                          <line x1="100" y1="200" x2="75" y2="280" stroke="#3182ce" strokeWidth="8" />
                          <line x1="100" y1="200" x2="125" y2="280" stroke="#3182ce" strokeWidth="8" />
                        </>
                      )}
                      
                      {/* Feet */}
                      {steps[currentStep].bodyPart === "Feet" && (
                        <>
                          <rect x="65" y="275" width="20" height="10" fill="#3182ce" />
                          <rect x="115" y="275" width="20" height="10" fill="#3182ce" />
                        </>
                      )}
                      
                      {/* Whole Body */}
                      {steps[currentStep].bodyPart === "Whole Body" && (
                        <rect x="80" y="60" width="40" height="220" fill="#3182ce" fillOpacity="0.3" />
                      )}
                    </>
                  )}
                </svg>
              </div>
              
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
                className="absolute w-40 h-40 bg-primary/10 rounded-full"
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
                  <h3 className="text-xl font-medium text-primary mb-2">
                    {steps[currentStep].bodyPart}
                  </h3>
                  <p className="text-md">
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
                  {progress === 0 ? "Start Exercise" : "Resume"}
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
              disabled={progress < 25} // Only enable after 25% completion
            >
              Complete Exercise
            </Button>
          </CardFooter>
        </Card>
        
        <Card className="max-w-2xl mx-auto mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Benefits of Progressive Muscle Relaxation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-accent/5 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Physical Benefits</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Reduces muscle tension</li>
                  <li>Lowers blood pressure</li>
                  <li>Decreases heart rate</li>
                  <li>Reduces pain and headaches</li>
                  <li>Improves sleep quality</li>
                </ul>
              </div>
              
              <div className="bg-accent/5 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Mental Benefits</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Reduces stress and anxiety</li>
                  <li>Increases body awareness</li>
                  <li>Improves concentration</li>
                  <li>Helps manage panic symptoms</li>
                  <li>Enhances overall well-being</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}