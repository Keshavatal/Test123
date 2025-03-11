
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'wouter';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../lib/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Slider } from '../components/ui/slider';
import { Switch } from '../components/ui/switch';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useToast } from '../components/ui/use-toast';
import Confetti from 'react-confetti';

export default function MeditationTimer() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Timer configuration
  const [duration, setDuration] = useState(300); // 5 minutes in seconds
  const [backgroundSound, setBackgroundSound] = useState<string | null>(null);
  const [guidedMode, setGuidedMode] = useState(true);
  const [intervalBell, setIntervalBell] = useState(true);
  const [bellInterval, setBellInterval] = useState(60); // interval in seconds
  
  // Timer state
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isActive, setIsActive] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const backgroundAudioRef = useRef<HTMLAudioElement | null>(null);
  const bellAudioRef = useRef<HTMLAudioElement | null>(null);
  const lastBellTimeRef = useRef<number>(0);
  
  // Set up audio elements
  useEffect(() => {
    // Bell sound
    bellAudioRef.current = new Audio('/sounds/bell.mp3');
    
    // Background sounds
    if (backgroundSound) {
      backgroundAudioRef.current = new Audio(`/sounds/${backgroundSound}.mp3`);
      backgroundAudioRef.current.loop = true;
    }
    
    return () => {
      // Clean up audio elements
      if (backgroundAudioRef.current) {
        backgroundAudioRef.current.pause();
        backgroundAudioRef.current = null;
      }
      
      if (bellAudioRef.current) {
        bellAudioRef.current.pause();
        bellAudioRef.current = null;
      }
    };
  }, [backgroundSound]);
  
  // Apply new duration to timeLeft when not active
  useEffect(() => {
    if (!isActive) {
      setTimeLeft(duration);
    }
  }, [duration, isActive]);
  
  // Timer logic
  useEffect(() => {
    if (isActive) {
      startTimeRef.current = Date.now();
      lastBellTimeRef.current = Date.now();
      
      // Play starting bell
      if (bellAudioRef.current) {
        bellAudioRef.current.play().catch(console.error);
      }
      
      // Start background sound
      if (backgroundAudioRef.current) {
        backgroundAudioRef.current.play().catch(console.error);
      }
      
      timerRef.current = setInterval(() => {
        const elapsedSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000);
        const newTimeLeft = Math.max(0, duration - elapsedSeconds);
        setTimeLeft(newTimeLeft);
        
        // Update progress
        setProgress(Math.min(100, (1 - newTimeLeft / duration) * 100));
        
        // Play interval bell if enabled
        if (intervalBell && bellAudioRef.current) {
          const timeSinceLastBell = (Date.now() - lastBellTimeRef.current) / 1000;
          if (timeSinceLastBell >= bellInterval) {
            bellAudioRef.current.play().catch(console.error);
            lastBellTimeRef.current = Date.now();
          }
        }
        
        // Timer completed
        if (newTimeLeft === 0) {
          // Play ending bell
          if (bellAudioRef.current) {
            bellAudioRef.current.play().catch(console.error);
          }
          
          // Stop the timer
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          
          // Stop background sound
          if (backgroundAudioRef.current) {
            backgroundAudioRef.current.pause();
            backgroundAudioRef.current.currentTime = 0;
          }
          
          // Set inactive
          setIsActive(false);
          
          // Show celebration
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 5000);
          
          // Complete the meditation
          completeMutation.mutate();
        }
      }, 1000);
    } else {
      // Stop the timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      // Stop background sound
      if (backgroundAudioRef.current) {
        backgroundAudioRef.current.pause();
        backgroundAudioRef.current.currentTime = 0;
      }
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      if (backgroundAudioRef.current) {
        backgroundAudioRef.current.pause();
        backgroundAudioRef.current.currentTime = 0;
      }
    };
  }, [isActive, duration, intervalBell, bellInterval]);
  
  // Complete exercise mutation
  const completeMutation = useMutation({
    mutationFn: async () => {
      if (!user) return null;
      
      const elapsedSeconds = duration - timeLeft;
      const xpEarned = Math.max(20, Math.min(50, Math.floor(elapsedSeconds / 60) * 10));
      
      return apiRequest('POST', '/api/exercises', {
        userId: user.id,
        type: 'meditation',
        duration: elapsedSeconds,
        notes: `Completed ${Math.floor(elapsedSeconds / 60)} minute${Math.floor(elapsedSeconds / 60) !== 1 ? 's' : ''} of ${guidedMode ? 'guided' : 'silent'} meditation`,
        xpEarned: xpEarned
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/exercises'] });
      toast({
        title: "Meditation completed!",
        description: `Well done on completing your meditation session.`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save meditation completion.",
        variant: "destructive"
      });
    }
  });
  
  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Handle start/stop
  const toggleTimer = () => {
    setIsActive(!isActive);
  };
  
  return (
    <div className="container py-8">
      {showConfetti && <Confetti width={window.innerWidth} height={window.innerHeight} recycle={false} />}
      
      <h1 className="text-2xl font-bold mb-6">Meditation Timer</h1>
      
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Timer Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Duration: {Math.floor(duration / 60)} minutes</Label>
                <span className="text-gray-500 text-sm">{formatTime(duration)}</span>
              </div>
              <Slider
                value={[duration]}
                min={60}
                max={3600}
                step={60}
                onValueChange={(value) => setDuration(value[0])}
                disabled={isActive}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Background Sound</Label>
              <Select
                value={backgroundSound || ''}
                onValueChange={(value) => setBackgroundSound(value || null)}
                disabled={isActive}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  <SelectItem value="rain">Rain</SelectItem>
                  <SelectItem value="forest">Forest</SelectItem>
                  <SelectItem value="ocean">Ocean Waves</SelectItem>
                  <SelectItem value="whitenoise">White Noise</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="guided-mode">Guided Meditation</Label>
              <Switch
                id="guided-mode"
                checked={guidedMode}
                onCheckedChange={setGuidedMode}
                disabled={isActive}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="interval-bell">Interval Bell</Label>
              <Switch
                id="interval-bell"
                checked={intervalBell}
                onCheckedChange={setIntervalBell}
                disabled={isActive}
              />
            </div>
            
            {intervalBell && (
              <div className="space-y-2 pl-4 border-l-2 border-gray-200">
                <div className="flex justify-between">
                  <Label>Interval: {Math.floor(bellInterval / 60)} minutes</Label>
                </div>
                <Slider
                  value={[bellInterval]}
                  min={30}
                  max={300}
                  step={30}
                  onValueChange={(value) => setBellInterval(value[0])}
                  disabled={isActive}
                />
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <div className="text-center w-full">
              <div className="text-4xl font-mono font-bold mb-2">
                {formatTime(timeLeft)}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6">
                <div 
                  className="bg-green-600 h-2.5 rounded-full transition-all duration-1000"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
            
            <div className="flex gap-4 w-full">
              <Button 
                variant="outline" 
                onClick={() => setLocation('/exercises')}
                className="flex-1"
                disabled={isActive}
              >
                Back
              </Button>
              <Button
                variant={isActive ? "destructive" : "default"}
                className={`flex-1 ${isActive ? "" : "bg-green-600 hover:bg-green-700"}`}
                onClick={toggleTimer}
              >
                {isActive ? "Stop" : "Start"}
              </Button>
            </div>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Meditation Guide</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {guidedMode ? (
              <>
                <h4 className="font-semibold">Guided Meditation Steps:</h4>
                <ol className="list-decimal pl-5 space-y-2">
                  <li>Find a comfortable position with your back straight.</li>
                  <li>Close your eyes and take a few deep breaths.</li>
                  <li>Bring your attention to your breath, noticing the sensations as you inhale and exhale.</li>
                  <li>When your mind wanders, gently bring your focus back to your breath.</li>
                  <li>Expand your awareness to include bodily sensations.</li>
                  <li>Notice any thoughts or emotions without judgment.</li>
                  <li>In the final minutes, bring your awareness back to your breath.</li>
                  <li>Gently open your eyes when the timer ends.</li>
                </ol>
              </>
            ) : (
              <>
                <h4 className="font-semibold">Silent Meditation Tips:</h4>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Focus on your natural breath without trying to control it.</li>
                  <li>Use a gentle mental label like "in" and "out" if it helps maintain focus.</li>
                  <li>Acknowledge distractions without frustration, then return to your anchor point.</li>
                  <li>Maintain a sense of gentle curiosity about your experience.</li>
                  <li>Remember that a wandering mind is normal; noticing it is part of the practice.</li>
                </ul>
              </>
            )}
            
            <h4 className="font-semibold mt-4">Benefits of Regular Meditation:</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>Reduces stress and anxiety</li>
              <li>Improves focus and concentration</li>
              <li>Promotes emotional health and well-being</li>
              <li>Enhances self-awareness</li>
              <li>May reduce age-related memory loss</li>
              <li>Can generate kindness and compassion</li>
              <li>Helps with sleep quality</li>
              <li>Assists with pain management</li>
              <li>Can decrease blood pressure</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
