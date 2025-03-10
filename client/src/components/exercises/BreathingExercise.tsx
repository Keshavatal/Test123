import { useState, useEffect, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wind, X } from 'lucide-react';

interface BreathingExerciseProps {
  duration?: number; // in seconds, default 120
  onComplete?: () => void;
}

export default function BreathingExercise({ duration = 120, onComplete }: BreathingExerciseProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [seconds, setSeconds] = useState(duration);
  const [breathingPhase, setBreathingPhase] = useState<'in' | 'hold' | 'out'>('in');
  const [breathingCount, setBreathingCount] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const breathingRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  const completeMutation = useMutation({
    mutationFn: async () => {
      if (!user) return;
      
      // Calculate actual duration
      const actualDuration = Math.round((Date.now() - startTimeRef.current) / 1000);
      
      return apiRequest('POST', '/api/exercises', {
        type: 'breathing',
        duration: actualDuration,
        notes: 'Completed breathing exercise',
        xpEarned: Math.round(actualDuration / 60 * 10) // 10 XP per minute
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/exercises'] });
      
      toast({
        title: "Exercise completed!",
        description: "Great job completing your breathing exercise.",
      });
      
      if (onComplete) {
        onComplete();
      } else {
        setLocation('/');
      }
    }
  });

  useEffect(() => {
    // Start the breathing cycle
    breathingRef.current = setInterval(() => {
      setBreathingCount(prev => {
        const newCount = prev + 1;
        if (newCount <= 4) {
          setBreathingPhase('in');
        } else if (newCount <= 8) {
          setBreathingPhase('hold');
        } else if (newCount <= 12) {
          setBreathingPhase('out');
        } else {
          return 0; // Reset count
        }
        return newCount;
      });
    }, 1000);

    // Start the timer
    timerRef.current = setInterval(() => {
      setSeconds(prev => {
        if (prev <= 1) {
          handleComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (breathingRef.current) clearInterval(breathingRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleComplete = () => {
    if (breathingRef.current) clearInterval(breathingRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    setIsActive(false);
    
    if (user) {
      completeMutation.mutate();
    } else if (onComplete) {
      onComplete();
    } else {
      setLocation('/');
    }
  };

  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4">
      <Card className="max-w-md w-full bg-white rounded-2xl shadow-xl">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-quicksand font-bold">Breathing Exercise</h3>
            <Button variant="ghost" size="icon" onClick={handleComplete}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          
          <div className="text-center py-8">
            <div className={`w-40 h-40 mx-auto bg-primary bg-opacity-20 rounded-full flex items-center justify-center mb-6 ${breathingPhase === 'in' ? 'animate-breathe-in' : breathingPhase === 'out' ? 'animate-breathe-out' : ''}`}>
              <div className="w-32 h-32 bg-primary bg-opacity-30 rounded-full flex items-center justify-center">
                <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center">
                  <Wind className="h-8 w-8 text-white" />
                </div>
              </div>
            </div>
            <p className="text-lg font-quicksand font-medium mb-2">
              {breathingPhase === 'in' ? 'Breathe in...' : 
               breathingPhase === 'hold' ? 'Hold...' : 
               'Breathe out...'}
            </p>
            <p className="text-sm text-textColor opacity-70">Follow the circle's rhythm</p>
          </div>
          
          <div className="flex justify-between items-center">
            <div>
              <span className="font-quicksand">Time remaining</span>
              <p className="text-2xl font-quicksand font-bold">{formatTime(seconds)}</p>
            </div>
            <Button 
              className="bg-primary text-white font-quicksand font-medium hover:bg-primary/80"
              onClick={handleComplete}
              disabled={completeMutation.isPending}
            >
              Finish Early
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
