
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../lib/api';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Progress } from '../ui/progress';
import { useToast } from '../ui/use-toast';
import Confetti from 'react-confetti';

interface GuidedBreathingProps {
  onComplete?: () => void;
}

type BreathingPattern = {
  name: string;
  description: string;
  inhale: number;
  hold1: number;
  exhale: number;
  hold2: number;
};

export default function GuidedBreathing({ onComplete }: GuidedBreathingProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Breathing patterns
  const breathingPatterns: Record<string, BreathingPattern> = {
    box: {
      name: 'Box Breathing',
      description: 'Equal inhale, hold, exhale, and second hold. Great for stress reduction.',
      inhale: 4,
      hold1: 4,
      exhale: 4,
      hold2: 4
    },
    relaxing: {
      name: 'Relaxing Breath',
      description: 'Longer exhale promotes relaxation and calm.',
      inhale: 4,
      hold1: 0,
      exhale: 6,
      hold2: 0
    },
    energizing: {
      name: 'Energizing Breath',
      description: 'Longer inhale increases energy and alertness.',
      inhale: 6,
      hold1: 0,
      exhale: 4,
      hold2: 0
    },
    '4-7-8': {
      name: '4-7-8 Breath',
      description: 'Longer hold and exhale for deep relaxation. Great for sleep.',
      inhale: 4,
      hold1: 7,
      exhale: 8,
      hold2: 0
    }
  };
  
  // States
  const [selectedPattern, setSelectedPattern] = useState<string>('box');
  const [duration, setDuration] = useState<number>(300); // 5 minutes in seconds
  const [withAudio, setWithAudio] = useState<boolean>(true);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [phase, setPhase] = useState<'inhale' | 'hold1' | 'exhale' | 'hold2'>('inhale');
  const [phaseProgress, setPhaseProgress] = useState<number>(0);
  const [totalTimeLeft, setTotalTimeLeft] = useState<number>(duration);
  const [totalProgress, setTotalProgress] = useState<number>(0);
  const [cycleCount, setCycleCount] = useState<number>(0);
  const [showConfetti, setShowConfetti] = useState<boolean>(false);
  
  // Refs
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const phaseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Effect for managing the overall timer
  useEffect(() => {
    if (isActive) {
      startTimeRef.current = Date.now();
      
      timerRef.current = setInterval(() => {
        const elapsedSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000);
        const newTimeLeft = Math.max(0, duration - elapsedSeconds);
        setTotalTimeLeft(newTimeLeft);
        
        // Update progress
        setTotalProgress(Math.min(100, (1 - newTimeLeft / duration) * 100));
        
        // Timer completed
        if (newTimeLeft === 0) {
          handleComplete();
        }
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isActive, duration]);
  
  // Effect for managing breathing phases
  useEffect(() => {
    if (isActive) {
      manageBreathingPhase();
    } else {
      if (phaseTimerRef.current) {
        clearTimeout(phaseTimerRef.current);
        phaseTimerRef.current = null;
      }
    }
    
    return () => {
      if (phaseTimerRef.current) {
        clearTimeout(phaseTimerRef.current);
        phaseTimerRef.current = null;
      }
    };
  }, [isActive, phase]);
  
  // Reset duration
  useEffect(() => {
    if (!isActive) {
      setTotalTimeLeft(duration);
    }
  }, [duration, isActive]);
  
  // Complete exercise mutation
  const completeMutation = useMutation({
    mutationFn: async () => {
      if (!user) return null;
      
      const elapsedSeconds = duration - totalTimeLeft;
      const xpEarned = Math.max(15, Math.min(50, Math.floor(elapsedSeconds / 60) * 10));
      
      return apiRequest('POST', '/api/exercises', {
        userId: user.id,
        type: 'breathing',
        duration: elapsedSeconds,
        notes: `Completed ${cycleCount} cycles of ${breathingPatterns[selectedPattern].name}`,
        xpEarned: xpEarned
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/exercises'] });
      toast({
        title: "Breathing exercise completed!",
        description: `Well done on completing your breathing session.`,
      });
      
      if (onComplete) {
        onComplete();
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save breathing exercise completion.",
        variant: "destructive"
      });
    }
  });
  
  // Handle start/stop
  const toggleExercise = () => {
    setIsActive(!isActive);
    
    if (!isActive) {
      setPhase('inhale');
      setPhaseProgress(0);
      setCycleCount(0);
    }
  };
  
  // Handle completion
  const handleComplete = () => {
    setIsActive(false);
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (phaseTimerRef.current) {
      clearTimeout(phaseTimerRef.current);
      phaseTimerRef.current = null;
    }
    
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 5000);
    
    completeMutation.mutate();
  };
  
  // Manage breathing phase
  const manageBreathingPhase = () => {
    const pattern = breathingPatterns[selectedPattern];
    let phaseDuration = 1000; // default 1 second
    
    switch (phase) {
      case 'inhale':
        phaseDuration = pattern.inhale * 1000;
        if (withAudio) {
          playAudio('inhale');
        }
        break;
      case 'hold1':
        phaseDuration = pattern.hold1 * 1000;
        if (pattern.hold1 === 0) {
          nextPhase();
          return;
        }
        if (withAudio) {
          playAudio('hold');
        }
        break;
      case 'exhale':
        phaseDuration = pattern.exhale * 1000;
        if (withAudio) {
          playAudio('exhale');
        }
        break;
      case 'hold2':
        phaseDuration = pattern.hold2 * 1000;
        if (pattern.hold2 === 0) {
          nextPhase();
          return;
        }
        if (withAudio) {
          playAudio('hold');
        }
        break;
    }
    
    // Progress animation
    let progress = 0;
    const interval = 50; // Update every 50ms for smooth animation
    const steps = phaseDuration / interval;
    let step = 0;
    
    const progressInterval = setInterval(() => {
      step++;
      progress = (step / steps) * 100;
      setPhaseProgress(progress);
      
      if (progress >= 100) {
        clearInterval(progressInterval);
      }
    }, interval);
    
    // Move to next phase after duration
    phaseTimerRef.current = setTimeout(() => {
      clearInterval(progressInterval);
      nextPhase();
    }, phaseDuration);
  };
  
  // Move to next phase
  const nextPhase = () => {
    switch (phase) {
      case 'inhale':
        setPhase('hold1');
        break;
      case 'hold1':
        setPhase('exhale');
        break;
      case 'exhale':
        setPhase('hold2');
        break;
      case 'hold2':
        setPhase('inhale');
        // Completed one full cycle
        setCycleCount(prev => prev + 1);
        break;
    }
    
    setPhaseProgress(0);
  };
  
  // Play audio cue
  const playAudio = (type: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    
    audioRef.current = new Audio(`/sounds/breathing/${type}.mp3`);
    audioRef.current.play().catch(console.error);
  };
  
  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Get instruction text
  const getInstructionText = () => {
    switch (phase) {
      case 'inhale':
        return 'Breathe In';
      case 'hold1':
        return 'Hold';
      case 'exhale':
        return 'Breathe Out';
      case 'hold2':
        return 'Hold';
      default:
        return '';
    }
  };
  
  return (
    <div className="space-y-6">
      {showConfetti && <Confetti width={window.innerWidth} height={window.innerHeight} recycle={false} />}
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Breathing Pattern</Label>
          <Select
            value={selectedPattern}
            onValueChange={setSelectedPattern}
            disabled={isActive}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select pattern" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(breathingPatterns).map(([key, pattern]) => (
                <SelectItem key={key} value={key}>{pattern.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="text-sm text-gray-600">
          {breathingPatterns[selectedPattern].description}
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch
            id="with-audio"
            checked={withAudio}
            onCheckedChange={setWithAudio}
            disabled={isActive}
          />
          <Label htmlFor="with-audio">Audio Guidance</Label>
        </div>
        
        <div className="flex items-center justify-between">
          <Label>Duration: {Math.floor(duration / 60)} minutes</Label>
          <Select
            value={String(duration)}
            onValueChange={(val) => setDuration(Number(val))}
            disabled={isActive}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Select duration" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="120">2 minutes</SelectItem>
              <SelectItem value="300">5 minutes</SelectItem>
              <SelectItem value="600">10 minutes</SelectItem>
              <SelectItem value="900">15 minutes</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="bg-gray-100 rounded-lg p-6 text-center relative">
        <div className="absolute top-4 right-4 text-sm font-mono bg-white px-2 py-1 rounded">
          {formatTime(totalTimeLeft)}
        </div>
        
        <div className="text-3xl font-bold mb-2">
          {getInstructionText()}
        </div>
        
        <div className="text-sm text-gray-500 mb-4">
          {isActive ? `Cycle ${cycleCount + 1}` : 'Press Start to begin'}
        </div>
        
        <div className="w-full max-w-xs mx-auto mb-6 relative">
          <div className="w-48 h-48 rounded-full border-8 border-blue-100 mx-auto flex items-center justify-center">
            <div 
              className="w-36 h-36 rounded-full bg-blue-500 transition-all duration-500"
              style={{ 
                transform: `scale(${phase === 'inhale' || phase === 'hold1' ? 
                  0.6 + (phaseProgress / 100) * 0.4 : 
                  1 - (phaseProgress / 100) * 0.4
                })`,
                opacity: 0.7
              }}
            ></div>
          </div>
        </div>
        
        <div className="mb-4">
          <Progress value={phaseProgress} className="h-2" />
        </div>
        
        <div className="mb-6">
          <Progress value={totalProgress} className="h-1" />
        </div>
        
        <Button 
          onClick={toggleExercise}
          className={isActive ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"}
          size="lg"
        >
          {isActive ? "Stop" : "Start"}
        </Button>
      </div>
      
      <div className="grid grid-cols-2 text-center text-sm gap-2">
        <div className="bg-blue-50 p-3 rounded">
          <div className="font-semibold">Inhale</div>
          <div>{breathingPatterns[selectedPattern].inhale}s</div>
        </div>
        <div className="bg-purple-50 p-3 rounded">
          <div className="font-semibold">Hold</div>
          <div>{breathingPatterns[selectedPattern].hold1}s</div>
        </div>
        <div className="bg-green-50 p-3 rounded">
          <div className="font-semibold">Exhale</div>
          <div>{breathingPatterns[selectedPattern].exhale}s</div>
        </div>
        <div className="bg-yellow-50 p-3 rounded">
          <div className="font-semibold">Hold</div>
          <div>{breathingPatterns[selectedPattern].hold2}s</div>
        </div>
      </div>
    </div>
  );
}
