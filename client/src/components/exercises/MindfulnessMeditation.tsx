import { useState, useEffect, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Brain, Volume2, VolumeX, Play, Pause, Check } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { motion, AnimatePresence } from 'framer-motion';
import { Progress } from '@/components/ui/progress';

interface MindfulnessStep {
  instruction: string;
  duration: number; // in seconds
}

export default function MindfulnessMeditation() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(80);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Mindfulness steps
  const steps: MindfulnessStep[] = [
    { instruction: "Find a comfortable position and gently close your eyes.", duration: 10 },
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

  // Initialize audio
  useEffect(() => {
    audioRef.current = new Audio('https://cdn.pixabay.com/download/audio/2022/03/10/audio_1fb29c0109.mp3?filename=ambient-piano-amp-strings-10711.mp3');
    audioRef.current.loop = true;
    audioRef.current.volume = volume / 100;
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Handle volume change
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume / 100;
    }
  }, [volume, isMuted]);

  // Control meditation timer
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setSecondsElapsed(prev => {
          const newSeconds = prev + 1;
          
          // Check if we need to move to next step
          const currentStepEndTime = steps.slice(0, currentStep + 1).reduce((total, step) => total + step.duration, 0);
          if (newSeconds >= currentStepEndTime && currentStep < steps.length - 1) {
            setCurrentStep(prev => prev + 1);
          }
          
          // Check if we've reached the end
          if (newSeconds >= totalDuration) {
            handleComplete();
            return totalDuration;
          }
          
          return newSeconds;
        });
      }, 1000);
      
      // Start audio
      if (audioRef.current && !isMuted) {
        audioRef.current.play().catch(e => console.error("Audio play failed:", e));
      }
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      // Pause audio
      if (audioRef.current) {
        audioRef.current.pause();
      }
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isPlaying, currentStep, isMuted]);

  const completeMutation = useMutation({
    mutationFn: async () => {
      if (!user) return;
      
      // Calculate actual duration
      const actualDuration = Math.round((Date.now() - startTimeRef.current) / 1000);
      
      return apiRequest('POST', '/api/exercises', {
        type: 'mindfulness',
        duration: actualDuration,
        notes: 'Completed mindfulness meditation',
        xpEarned: Math.round(actualDuration / 60 * 15) // 15 XP per minute
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/exercises'] });
      
      toast({
        title: "Meditation completed!",
        description: "Great job completing your mindfulness practice.",
      });
      
      setLocation('/');
    }
  });

  const handlePlayPause = () => {
    setIsPlaying(prev => !prev);
  };

  const handleMuteToggle = () => {
    setIsMuted(prev => !prev);
  };

  const handleComplete = () => {
    setIsPlaying(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    if (audioRef.current) {
      audioRef.current.pause();
    }
    
    if (user) {
      completeMutation.mutate();
    } else {
      toast({
        title: "Login required",
        description: "Please log in to save your meditation progress.",
        variant: "destructive",
      });
    }
  };

  // Calculate progress percentage
  const progressPercentage = (secondsElapsed / totalDuration) * 100;

  return (
    <Card className="max-w-2xl mx-auto mt-8">
      <CardHeader>
        <div className="flex items-center mb-2">
          <Brain className="text-primary mr-2 h-6 w-6" />
          <CardTitle className="font-quicksand text-primary">Mindfulness Meditation</CardTitle>
        </div>
        <CardDescription>
          A guided meditation to help you focus on the present moment
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="relative h-64 bg-primary/5 rounded-xl flex items-center justify-center mb-6 overflow-hidden">
          {/* Ambient pulsing circle */}
          <motion.div
            animate={{ 
              scale: isPlaying ? [1, 1.1, 1] : 1,
              opacity: isPlaying ? [0.5, 0.2, 0.5] : 0.5
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
        
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-1">
            <span>{Math.floor(secondsElapsed / 60)}:{(secondsElapsed % 60).toString().padStart(2, '0')}</span>
            <span>{Math.floor(totalDuration / 60)}:{(totalDuration % 60).toString().padStart(2, '0')}</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 w-1/3">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleMuteToggle}
            >
              {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </Button>
            <Slider
              disabled={isMuted}
              value={[volume]}
              min={0}
              max={100}
              step={1}
              onValueChange={(vals) => setVolume(vals[0])}
              className="w-full"
            />
          </div>
          
          <Button
            size="lg"
            onClick={handlePlayPause}
            className={`rounded-full w-14 h-14 ${isPlaying ? 'bg-primary/80' : 'bg-primary'}`}
          >
            {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-1" />}
          </Button>
          
          <div className="w-1/3 flex justify-end">
            <Button 
              variant="outline" 
              onClick={handleComplete}
              disabled={completeMutation.isPending}
            >
              <Check className="mr-2 h-4 w-4" /> Complete
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
