
import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { useUserContext } from "../hooks/useUserContext";
import { useToast } from "../hooks/useToast";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { apiRequest } from "../lib/api";
import { Wand2, Send, Volume2, VolumeX, Play, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import ReactMarkdown from "react-markdown";

interface ChatMessage {
  id: number;
  content: string;
  isUserMessage: boolean;
  createdAt: string;
}

export default function ExerciseChatbot() {
  const { user } = useUserContext();
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [activeExercise, setActiveExercise] = useState<string | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const queryClient = useQueryClient();
  const [isPlaying, setIsPlaying] = useState(false);
  const [breathingPhase, setBreathingPhase] = useState<"inhale" | "hold" | "exhale" | "rest">("inhale");
  const [timer, setTimer] = useState(0);
  const [exerciseProgress, setExerciseProgress] = useState(0);
  const speechSynthesisRef = useRef<SpeechSynthesis | null>(
    typeof window !== "undefined" ? window.speechSynthesis : null
  );

  // Fetch chat history
  const { data: chatHistory = [], isLoading } = useQuery<ChatMessage[]>({
    queryKey: ["/api/chat"],
    enabled: !!user,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      const res = await apiRequest("POST", "/api/chat", { content: message });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat"] });
      setMessage("");
      // Check if this was an exercise start command
      checkForExerciseStart();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatHistory]);

  // If no messages and first load, create initial bot message
  useEffect(() => {
    if (!isLoading && chatHistory && chatHistory.length === 0 && user) {
      sendMessageMutation.mutate("Hello, I'd like to try some interactive exercises.");
    }
  }, [isLoading, chatHistory, user, sendMessageMutation]);

  // Handle audio for bot messages
  useEffect(() => {
    if (audioEnabled && chatHistory && chatHistory.length > 0) {
      const lastMessage = chatHistory[chatHistory.length - 1];
      if (!lastMessage.isUserMessage) {
        speakText(lastMessage.content);
      }
    }
    // Return a cleanup function to stop any ongoing speech
    return () => {
      if (speechSynthesisRef.current) {
        speechSynthesisRef.current.cancel();
      }
    };
  }, [chatHistory, audioEnabled]);

  const speakText = (text: string) => {
    if (!speechSynthesisRef.current) return;
    
    // Cancel any ongoing speech
    speechSynthesisRef.current.cancel();
    
    // Create a new speech utterance
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9; // Slightly slower rate for better comprehension
    utterance.pitch = 1.0;
    
    // Find a good voice (preferably female)
    const voices = speechSynthesisRef.current.getVoices();
    const preferredVoice = voices.find(voice => 
      voice.name.includes("Female") || voice.name.includes("Samantha") || voice.name.includes("Google")
    );
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }
    
    // Speak the text
    speechSynthesisRef.current.speak(utterance);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    sendMessageMutation.mutate(message);
  };

  // Check if the last message indicates starting an exercise
  const checkForExerciseStart = () => {
    if (!chatHistory || chatHistory.length < 2) return;
    
    const userMessage = chatHistory[chatHistory.length - 2]; // User's last message
    const botResponse = chatHistory[chatHistory.length - 1]; // Bot's response
    
    if (!userMessage?.isUserMessage || botResponse?.isUserMessage) return;
    
    const userText = userMessage.content.toLowerCase();
    const botText = botResponse.content.toLowerCase();
    
    // Check for exercise cues in the user's message and bot's response
    if (
      (userText.includes("breathing") || userText.includes("breath")) ||
      (botText.includes("inhale") && botText.includes("exhale"))
    ) {
      setActiveExercise("breathing");
      setupBreathingExercise();
    } else if (
      (userText.includes("mindfulness") || userText.includes("meditat")) ||
      (botText.includes("mindful") && botText.includes("meditation"))
    ) {
      setActiveExercise("mindfulness");
    } else if (
      (userText.includes("muscle") || userText.includes("relax")) ||
      (botText.includes("muscle") && botText.includes("tense"))
    ) {
      setActiveExercise("relaxation");
    } else if (
      (userText.includes("gratitude") || userText.includes("grateful")) ||
      (botText.includes("gratitude") && botText.includes("thankful"))
    ) {
      setActiveExercise("gratitude");
    } else if (
      (userText.includes("cbt") || userText.includes("thought") || userText.includes("cognitive")) ||
      (botText.includes("thought") && botText.includes("evidence"))
    ) {
      setActiveExercise("cbt");
    }
  };

  // Setup breathing exercise
  const setupBreathingExercise = () => {
    setBreathingPhase("inhale");
    setTimer(4); // Start with inhale for 4 seconds
    setIsPlaying(false);
    setExerciseProgress(0);
  };

  // Start the interactive breathing exercise
  const startBreathingExercise = () => {
    setIsPlaying(true);
    
    const interval = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          // Transition to next phase
          switch (breathingPhase) {
            case "inhale":
              setBreathingPhase("hold");
              speakText("Hold");
              return 4; // Hold for 4 seconds
            case "hold":
              setBreathingPhase("exhale");
              speakText("Exhale");
              return 6; // Exhale for 6 seconds
            case "exhale":
              setBreathingPhase("rest");
              return 2; // Rest for 2 seconds
            case "rest":
              setBreathingPhase("inhale");
              speakText("Inhale");
              // Update progress (each complete cycle is 10%)
              setExerciseProgress(prev => {
                const newProgress = prev + 10;
                if (newProgress >= 100) {
                  clearInterval(interval);
                  setIsPlaying(false);
                  completeExercise("Breathing Exercise", 60);
                  return 100;
                }
                return newProgress;
              });
              return 4; // Back to inhale for 4 seconds
          }
        }
        return prev - 1;
      });
    }, 1000);

    // Start with first instruction
    speakText("Inhale deeply");
    
    return () => clearInterval(interval);
  };

  // Complete an exercise and log it
  const completeExercise = async (type: string, duration: number) => {
    if (!user) return;
    
    try {
      await apiRequest("POST", "/api/exercises", {
        type,
        duration,
        notes: `Completed ${type} via interactive chatbot`,
      });
      
      toast({
        title: "Exercise Completed!",
        description: `You've earned XP for completing a ${type}`,
      });
      
      setActiveExercise(null);
      
      // Send a message to the chatbot about completion
      sendMessageMutation.mutate(`I just completed the ${type.toLowerCase()}. How did I do?`);
    } catch (error) {
      toast({
        title: "Failed to log exercise",
        description: "Your progress wasn't saved",
        variant: "destructive",
      });
    }
  };

  // Format message content with proper styling
  const formatMessageContent = (content: string) => {
    // Replace markdown-style numbered lists with styled lists
    return content.replace(/(\d+\.\s[^\n]+)/g, "<li>$1</li>");
  };

  // Start exercise based on type
  const startExercise = (type: string) => {
    setActiveExercise(type);

    // Send a message to start the guided exercise
    let startMessage = "";

    switch (type) {
      case "breathing":
        startMessage = "Guide me through a breathing exercise to reduce anxiety.";
        break;
      case "mindfulness":
        startMessage = "I'd like to try a mindfulness meditation exercise.";
        break;
      case "cbt":
        startMessage = "Help me challenge negative thoughts with cognitive restructuring.";
        break;
      case "gratitude":
        startMessage = "I want to practice gratitude. Can you guide me?";
        break;
      case "relaxation":
        startMessage = "Guide me through a progressive muscle relaxation exercise.";
        break;
      default:
        startMessage = `I want to try a ${type} exercise.`;
    }

    sendMessageMutation.mutate(startMessage);
  };

  // Quick reply options
  const quickReplies = [
    { text: "Breathing exercise", action: () => startExercise("breathing") },
    { text: "Mindfulness meditation", action: () => startExercise("mindfulness") },
    { text: "Challenge negative thoughts", action: () => startExercise("cbt") },
    { text: "Gratitude practice", action: () => startExercise("gratitude") },
    { text: "Muscle relaxation", action: () => startExercise("relaxation") },
  ];

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Interactive Exercise Assistant</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="md:col-span-2">
          <Card className="h-[calc(100vh-12rem)] flex flex-col">
            <CardHeader className="py-3">
              <CardTitle className="text-lg flex justify-between items-center">
                <span>Exercise Chatbot</span>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => setAudioEnabled(!audioEnabled)}
                  className="h-8 w-8 p-0" 
                  title={audioEnabled ? "Disable audio guidance" : "Enable audio guidance"}
                >
                  {audioEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                </Button>
              </CardTitle>
            </CardHeader>
            
            <CardContent className="flex-1 overflow-y-auto py-0 flex flex-col">
              {isLoading ? (
                <div className="flex justify-center items-center h-full">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div className="space-y-4 flex-1">
                  {chatHistory.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${
                        msg.isUserMessage ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`flex gap-3 max-w-[80%] ${
                          msg.isUserMessage ? "flex-row-reverse" : ""
                        }`}
                      >
                        <Avatar className={`h-8 w-8 ${msg.isUserMessage ? "bg-primary" : "bg-muted"}`}>
                          <AvatarFallback>
                            {msg.isUserMessage ? user?.username?.charAt(0).toUpperCase() : "AI"}
                          </AvatarFallback>
                        </Avatar>
                        <div
                          className={`rounded-lg p-3 text-sm ${
                            msg.isUserMessage
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </CardContent>
            
            <form onSubmit={handleSendMessage} className="p-4 border-t">
              <div className="flex gap-2">
                <Textarea
                  placeholder="Type a message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="resize-none"
                  rows={1}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      if (message.trim()) {
                        handleSendMessage(e);
                      }
                    }
                  }}
                />
                <Button type="submit" size="sm" disabled={!message.trim() || sendMessageMutation.isLoading}>
                  {sendMessageMutation.isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-2 mt-2">
                {quickReplies.map((reply) => (
                  <Button
                    key={reply.text}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={reply.action}
                  >
                    <Wand2 className="h-3 w-3 mr-1" /> {reply.text}
                  </Button>
                ))}
              </div>
            </form>
          </Card>
        </div>
        
        <div>
          <Card className="h-full">
            <CardHeader className="py-3">
              <CardTitle className="text-lg">Exercise Visuals</CardTitle>
            </CardHeader>
            <CardContent>
              {activeExercise === "breathing" && (
                <div className="flex flex-col items-center gap-4">
                  <div className="relative w-32 h-32 mb-6">
                    <div 
                      className={`absolute inset-0 rounded-full border-4 border-primary 
                        ${isPlaying ? 'transition-all duration-1000' : ''}
                      `} 
                      style={{ 
                        transform: `scale(${breathingPhase === 'inhale' ? 1 + (4-timer)/4 : 
                          breathingPhase === 'exhale' ? 1 + timer/6 : 
                          breathingPhase === 'hold' ? 2 : 1})`,
                        opacity: breathingPhase === 'rest' ? 0.5 : 1
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-bold">{timer}</span>
                    </div>
                  </div>
                  
                  <Badge variant="outline" className="mb-2">
                    {breathingPhase.charAt(0).toUpperCase() + breathingPhase.slice(1)}
                  </Badge>
                  
                  <div className="w-full bg-muted rounded-full h-2 mb-4">
                    <div 
                      className="bg-primary h-2 rounded-full" 
                      style={{ width: `${exerciseProgress}%` }}
                    />
                  </div>
                  
                  {!isPlaying ? (
                    <Button onClick={startBreathingExercise} className="w-full">
                      <Play className="h-4 w-4 mr-2" /> Start Exercise
                    </Button>
                  ) : (
                    <Button variant="outline" onClick={() => setIsPlaying(false)} className="w-full">
                      Pause
                    </Button>
                  )}
                </div>
              )}
              
              {activeExercise === "mindfulness" && (
                <div className="flex flex-col items-center gap-4">
                  <div className="text-center mb-4">
                    <p className="text-lg font-medium">Mindfulness Meditation</p>
                    <p className="text-sm text-muted-foreground">Focus on the present moment</p>
                  </div>
                  <div className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center">
                    <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center">
                      <div className="w-16 h-16 rounded-full bg-primary/30 animate-pulse"></div>
                    </div>
                  </div>
                  <p className="text-center mt-4">Follow the chatbot's instructions while focusing on the pulsing circle</p>
                </div>
              )}
              
              {activeExercise === "cbt" && (
                <div className="flex flex-col items-center gap-4 text-center">
                  <h3 className="font-medium">Thought Restructuring</h3>
                  <div className="grid grid-cols-2 gap-2 w-full text-sm">
                    <div className="bg-destructive/10 p-2 rounded-lg">
                      <p className="font-medium text-destructive">Negative Thought</p>
                    </div>
                    <div className="bg-primary/10 p-2 rounded-lg">
                      <p className="font-medium text-primary">Alternative View</p>
                    </div>
                  </div>
                  <p className="text-sm">Follow the chatbot's instructions to challenge and reframe negative thoughts</p>
                </div>
              )}
              
              {activeExercise === "gratitude" && (
                <div className="flex flex-col items-center gap-4">
                  <h3 className="font-medium">Gratitude Practice</h3>
                  <div className="bg-muted p-3 rounded-lg w-full">
                    <ul className="list-disc pl-5 space-y-2 text-sm">
                      <li>Today I'm grateful for...</li>
                      <li>Something that made me smile...</li>
                      <li>A person who helped me...</li>
                    </ul>
                  </div>
                  <p className="text-xs text-center">Complete the sentences as guided by the chatbot</p>
                </div>
              )}
              
              {activeExercise === "relaxation" && (
                <div className="flex flex-col items-center gap-4">
                  <h3 className="font-medium">Progressive Muscle Relaxation</h3>
                  <div className="relative w-full h-40">
                    <div className="h-full w-full relative bg-muted rounded-lg overflow-hidden">
                      {/* Simple body outline */}
                      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-32 w-16 rounded-full border-2 border-primary"></div>
                      <div className="absolute left-1/2 top-[20%] -translate-x-1/2 h-8 w-8 rounded-full border-2 border-primary"></div>
                      <div className="absolute left-[25%] top-[35%] h-12 w-3 rounded-full border-2 border-primary"></div>
                      <div className="absolute right-[25%] top-[35%] h-12 w-3 rounded-full border-2 border-primary"></div>
                      <div className="absolute left-[35%] bottom-[15%] h-14 w-3 rounded-full border-2 border-primary"></div>
                      <div className="absolute right-[35%] bottom-[15%] h-14 w-3 rounded-full border-2 border-primary"></div>
                    </div>
                  </div>
                  <p className="text-sm text-center">Follow the instructions to tense and relax each muscle group</p>
                </div>
              )}
              
              {!activeExercise && (
                <div className="flex flex-col items-center justify-center h-[calc(100%-2rem)]">
                  <p className="text-center text-muted-foreground mb-4">
                    Select an exercise from the quick reply options or ask the chatbot to guide you.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {quickReplies.slice(0, 4).map((reply) => (
                      <Button
                        key={reply.text}
                        variant="outline"
                        size="sm"
                        className="h-20 flex flex-col gap-1"
                        onClick={reply.action}
                      >
                        <Wand2 className="h-4 w-4" />
                        <span className="text-xs text-center">{reply.text}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
