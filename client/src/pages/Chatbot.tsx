import React, { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useUserContext } from "@/contexts/UserContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { ChatMessage } from "@shared/schema";
import { InteractiveExercise } from "@/components/InteractiveExercise";
import { Brain, Wind, Heart, SunMedium, AlertCircle } from "lucide-react";

export default function Chatbot() {
  const { user } = useUserContext();
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [activeExercise, setActiveExercise] = useState<string | null>(null);
  
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
  
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    sendMessageMutation.mutate(message);
  };
  
  // Start exercise based on type
  const startExercise = (type: string) => {
    setActiveExercise(type);
    
    // Send a message to start the guided exercise
    let startMessage = "";
    switch (type) {
      case "breathing":
        startMessage = "I'd like to try a guided breathing exercise. Please lead me through it step by step.";
        break;
      case "cognitive":
        startMessage = "Can you guide me through a cognitive restructuring exercise to challenge my negative thoughts?";
        break;
      case "mindfulness":
        startMessage = "I need a guided mindfulness meditation exercise. Please lead me through it.";
        break;
      case "gratitude":
        startMessage = "I want to practice gratitude. Can you guide me through a gratitude exercise?";
        break;
      default:
        startMessage = `Please guide me through a ${type} exercise step by step.`;
    }
    
    sendMessageMutation.mutate(startMessage);
  };
  
  // Complete the exercise and return to normal chat
  const completeExercise = () => {
    setActiveExercise(null);
    
    // Send a thank you message
    sendMessageMutation.mutate("Thank you for guiding me through that exercise. It was helpful.");
    
    toast({
      title: "Exercise Completed!",
      description: "Great job completing your exercise. You're building positive habits.",
    });
  };
  
  // Enhanced quick reply options with exercise shortcuts
  const quickReplies = [
    {
      text: "I'm feeling anxious today",
      icon: <AlertCircle className="h-4 w-4" />,
      action: () => sendMessageMutation.mutate("I'm feeling anxious today")
    },
    {
      text: "Guide me through breathing",
      icon: <Wind className="h-4 w-4" />,
      action: () => startExercise("breathing")
    },
    {
      text: "Cognitive restructuring",
      icon: <Brain className="h-4 w-4" />,
      action: () => startExercise("cognitive")
    },
    {
      text: "Mindfulness session",
      icon: <SunMedium className="h-4 w-4" />,
      action: () => startExercise("mindfulness")
    },
    {
      text: "Gratitude practice",
      icon: <Heart className="h-4 w-4" />,
      action: () => startExercise("gratitude")
    }
  ];

  return (
    <div className="h-[calc(100vh-130px)] md:h-[calc(100vh-100px)] flex flex-col">
      <header className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold font-quicksand text-foreground">
          AI Wellness Coach
        </h1>
        <p className="text-gray-500 mt-1">
          {activeExercise 
            ? `Interactive ${activeExercise.charAt(0).toUpperCase() + activeExercise.slice(1)} Exercise` 
            : "Chat with your personal CBT coach"}
        </p>
      </header>

      {activeExercise ? (
        <InteractiveExercise 
          exerciseType={activeExercise}
          messages={chatHistory ?? []}
          onSendMessage={(msg) => sendMessageMutation.mutate(msg)}
          onComplete={completeExercise}
        />
      ) : (
        <Card className="flex-1 flex flex-col overflow-hidden mb-4">
          <div className="flex items-center gap-3 p-4 border-b">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
              <i className="fas fa-robot text-white"></i>
            </div>
            <div>
              <h2 className="font-semibold font-quicksand">MindWell AI</h2>
              <p className="text-xs text-gray-500">Your CBT wellness coach</p>
            </div>
          </div>
          
          <ScrollArea className="flex-1 p-4 bg-background">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-pulse flex flex-col gap-2 w-2/3">
                  <div className="h-10 bg-gray-200 rounded-lg"></div>
                  <div className="h-16 bg-gray-200 rounded-lg"></div>
                  <div className="h-10 bg-gray-200 rounded-lg self-end"></div>
                </div>
              </div>
            ) : chatHistory.length === 0 ? (
              <div className="flex gap-3 mb-6">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-robot text-white text-xs"></i>
                </div>
                <div className="bg-white rounded-lg p-3 rounded-tl-none shadow-sm max-w-[80%]">
                  <p className="text-sm">
                    Hi {user?.firstName || "there"}! I'm your AI wellness coach using cognitive behavioral therapy techniques. How are you feeling today?
                  </p>
                </div>
              </div>
            ) : (
              chatHistory.map((message: ChatMessage) => (
                <div 
                  key={message.id} 
                  className={`flex gap-3 mb-6 ${message.isUserMessage ? "justify-end" : ""}`}
                >
                  {!message.isUserMessage && (
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <i className="fas fa-robot text-white text-xs"></i>
                    </div>
                  )}
                  <div 
                    className={`${
                      message.isUserMessage 
                        ? "bg-primary text-white rounded-lg p-3 rounded-tr-none shadow-sm max-w-[80%]" 
                        : "bg-white rounded-lg p-3 rounded-tl-none shadow-sm max-w-[80%]"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                  {message.isUserMessage && (
                    <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-medium text-purple-600">
                        {user?.firstName?.charAt(0) || "U"}
                      </span>
                    </div>
                  )}
                </div>
              ))
            )}
            
            {/* Quick Reply Exercise Options (only show after AI response) */}
            {chatHistory.length > 0 && !chatHistory[chatHistory.length - 1]?.isUserMessage && (
              <div className="flex flex-wrap gap-2 mb-6 ml-12">
                {quickReplies.map((reply, index) => (
                  <button 
                    key={index}
                    onClick={reply.action}
                    className="flex items-center gap-2 bg-white px-4 py-2 rounded-full text-sm font-medium border border-primary text-primary hover:bg-primary hover:text-white transition-colors"
                  >
                    {reply.icon}
                    <span>{reply.text}</span>
                  </button>
                ))}
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </ScrollArea>
          
          <form onSubmit={handleSendMessage} className="p-4 border-t bg-white">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Input
                  type="text"
                  placeholder="Type your message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-full"
                />
              </div>
              <Button 
                type="submit"
                size="icon"
                className="rounded-full bg-primary text-white hover:bg-primary/90"
                disabled={sendMessageMutation.isPending}
              >
                {sendMessageMutation.isPending ? (
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                ) : (
                  <i className="fas fa-paper-plane"></i>
                )}
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}
