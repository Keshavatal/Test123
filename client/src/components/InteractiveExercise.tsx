import React, { useState, useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useUserContext } from "@/contexts/UserContext";
import { ChatMessage } from "@shared/schema";
import { Play, Pause, FastForward, Volume2, VolumeX } from "lucide-react";
import { BreathingAnimation } from "@/components/BreathingAnimation";
import { MindfulnessAnimation } from "@/components/MindfulnessAnimation";

interface InteractiveExerciseProps {
  exerciseType: string;
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  onComplete: () => void;
}

export function InteractiveExercise({ 
  exerciseType, 
  messages, 
  onSendMessage, 
  onComplete 
}: InteractiveExerciseProps) {
  const { user } = useUserContext();
  const { toast } = useToast();
  const [userInput, setUserInput] = useState("");
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [timer, setTimer] = useState(0);
  const [maxTime, setMaxTime] = useState(0);
  const [breathingPhase, setBreathingPhase] = useState<"inhale" | "hold" | "exhale" | "rest">("inhale");
  const [showAnimation, setShowAnimation] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const speechSynthesisRef = useRef<SpeechSynthesis | null>(
    typeof window !== "undefined" ? window.speechSynthesis : null
  );
  
  // Exercise completion mutation
  const completeMutation = useMutation({
    mutationFn: async () => {
      if (!user) return;
      
      // Calculate duration in seconds
      const durationInSeconds = Math.max(30, timer); // Minimum 30 seconds
      const xp = Math.max(10, Math.min(50, Math.floor(durationInSeconds / 10))); // 10-50 XP based on duration
      
      return apiRequest("POST", "/api/exercises", {
        userId: user.id,
        type: exerciseType,
        duration: durationInSeconds,
        notes: `Completed interactive ${exerciseType} exercise via chatbot`,
        xpEarned: xp
      });
    },
    onSuccess: () => {
      toast({
        title: "Exercise Completed!",
        description: "Great job! You've earned XP points for your practice.",
      });
      
      onComplete();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to record exercise",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);
  
  // Set up timer and progress tracking
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isPlaying) {
      interval = setInterval(() => {
        setTimer(prevTimer => prevTimer + 1);
        
        // Update progress based on exercise type's typical duration
        // Different exercises have different expected durations
        if (maxTime > 0) {
          const newProgress = Math.min(100, (timer / maxTime) * 100);
          setProgress(newProgress);
        }

        // For breathing exercises, cycle through the phases
        if (exerciseType === "breathing") {
          // Each complete breath cycle is 14 seconds (4-4-4-2)
          const secondsInCycle = timer % 14;
          
          if (secondsInCycle < 4) {
            setBreathingPhase("inhale");
          } else if (secondsInCycle < 8) {
            setBreathingPhase("hold");
          } else if (secondsInCycle < 12) {
            setBreathingPhase("exhale");
          } else {
            setBreathingPhase("rest");
          }
        }
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [isPlaying, timer, maxTime, exerciseType]);
  
  // Determine max time based on exercise type for progress calculation
  useEffect(() => {
    switch (exerciseType) {
      case "breathing":
        setMaxTime(180); // 3 minutes
        break;
      case "cognitive":
        setMaxTime(300); // 5 minutes
        break;
      case "mindfulness":
        setMaxTime(420); // 7 minutes
        break;
      case "gratitude":
        setMaxTime(240); // 4 minutes
        break;
      default:
        setMaxTime(300); // 5 minutes
    }
  }, [exerciseType]);
  
  // Text-to-speech functionality for voice guidance
  const speakMessage = (text: string) => {
    if (!audioEnabled || !speechSynthesisRef.current) return;
    
    speechSynthesisRef.current.cancel(); // Stop any current speech
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9; // Slightly slower for clarity
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    // Try to find a calm, clear voice
    const voices = speechSynthesisRef.current.getVoices();
    const preferredVoice = voices.find(voice => 
      voice.name.includes("Female") || voice.name.includes("Samantha")
    );
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }
    
    speechSynthesisRef.current.speak(utterance);
  };
  
  // Speak bot messages when they arrive
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && !lastMessage.isUserMessage) {
      speakMessage(lastMessage.content);
    }
  }, [messages]);
  
  // Handle user input submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim()) return;
    
    onSendMessage(userInput);
    setUserInput("");
  };
  
  // Format time for display (MM:SS)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };
  
  // Progress indicator based on timer
  const getProgressIndicator = () => {
    if (progress < 25) return "Starting exercise...";
    if (progress < 50) return "Good progress...";
    if (progress < 75) return "Keep going...";
    if (progress < 100) return "Almost there...";
    return "Exercise complete!";
  };
  
  return (
    <div className="flex flex-col h-full">
      <Card className="flex-1 flex flex-col mb-4 overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex justify-between items-center">
            <span>Interactive {exerciseType.charAt(0).toUpperCase() + exerciseType.slice(1)} Exercise</span>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => setShowAnimation(!showAnimation)}
                className="h-8 w-8 p-0" 
                title={showAnimation ? "Hide animation" : "Show animation"}
              >
                {showAnimation ? <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="5"/></svg> : <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/></svg>}
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => setAudioEnabled(!audioEnabled)}
                className="h-8 w-8 p-0" 
                title={audioEnabled ? "Disable audio guidance" : "Enable audio guidance"}
              >
                {audioEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </Button>
            </div>
          </CardTitle>
          <div className="flex items-center gap-3">
            <Progress value={progress} className="flex-1" />
            <span className="text-xs font-medium">{formatTime(timer)}</span>
          </div>
          <p className="text-xs text-muted-foreground">{getProgressIndicator()}</p>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Animation visualization for exercises */}
          {showAnimation && (
            <div className="w-full h-56 mb-6 rounded-lg overflow-hidden bg-accent/5 backdrop-blur-sm flex items-center justify-center">
              {exerciseType === "breathing" && (
                <BreathingAnimation
                  isPlaying={isPlaying}
                  phase={breathingPhase}
                  progress={(timer % 14) / 14 * 100}
                />
              )}
              {exerciseType === "mindfulness" && (
                <MindfulnessAnimation
                  isPlaying={isPlaying}
                  duration={8}
                />
              )}
              {(exerciseType !== "breathing" && exerciseType !== "mindfulness") && (
                <div className="text-center p-4">
                  <div className="text-xl font-medium mb-2">
                    {exerciseType.charAt(0).toUpperCase() + exerciseType.slice(1)} Exercise
                  </div>
                  <p className="text-muted-foreground">
                    Follow the instructions from your wellness coach.
                  </p>
                </div>
              )}
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex gap-3 mb-4 ${message.isUserMessage ? "justify-end" : ""}`}
            >
              {!message.isUserMessage && (
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs">AI</span>
                </div>
              )}
              <div
                className={`p-3 rounded-lg max-w-[80%] ${
                  message.isUserMessage
                    ? "bg-primary text-white rounded-tr-none ml-auto"
                    : "bg-accent/10 rounded-tl-none"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </CardContent>
        
        <CardFooter className="border-t p-3">
          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">
            <div className="flex gap-2 items-center">
              <Button
                type="button"
                size="icon"
                variant={isPlaying ? "outline" : "default"}
                onClick={() => setIsPlaying(!isPlaying)}
                title={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              
              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={() => completeMutation.mutate()}
                title="Complete Exercise"
                disabled={progress < 25}
              >
                <FastForward className="h-4 w-4" />
              </Button>
              
              <Textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Type your response..."
                className="flex-1 h-10 min-h-0 resize-none py-2"
              />
              
              <Button type="submit" size="sm" disabled={!userInput.trim()}>
                Send
              </Button>
            </div>
          </form>
        </CardFooter>
      </Card>
    </div>
  );
}