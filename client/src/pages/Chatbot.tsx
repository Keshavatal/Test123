import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { apiRequest } from "@/lib/api";
import { useUserContext } from "@/contexts/UserContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send } from "lucide-react";

interface ChatMessage {
  id: number;
  content: string;
  isUserMessage: boolean;
  createdAt: string;
}

export default function Chatbot() {
  const { user } = useUserContext();
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [activeExercise, setActiveExercise] = useState<string | null>(null);
  const queryClient = useQueryClient();

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

  // If no messages and first load, create initial bot message
  useEffect(() => {
    if (!isLoading && chatHistory && chatHistory.length === 0 && user) {
      sendMessageMutation.mutate("Hello, I'd like some help with my mental health.");
    }
  }, [isLoading, chatHistory, user, sendMessageMutation]);

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
    { text: "I'm feeling anxious", action: () => sendMessageMutation.mutate("I'm feeling anxious today. What can I do?") },
    { text: "Breathing exercise", action: () => startExercise("breathing") },
    { text: "Challenge negative thoughts", action: () => startExercise("cbt") },
    { text: "Gratitude practice", action: () => startExercise("gratitude") },
    { text: "Help me sleep", action: () => sendMessageMutation.mutate("I'm having trouble sleeping. Any tips?") },
  ];

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Chat with Your Mental Health Assistant</h1>

      <Card className="shadow-lg">
        <CardContent className="p-4">
          {/* Chat Messages Display */}
          <ScrollArea className="h-[400px] pr-4">
            {isLoading ? (
              <div className="flex justify-center items-center h-full">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : chatHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                <p>Start chatting with your mental health assistant.</p>
                <p className="text-sm mt-2">
                  Ask about exercises, coping strategies, or share how you're feeling.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {chatHistory.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.isUserMessage ? "justify-end" : "justify-start"}`}
                  >
                    <div className="flex items-start gap-2 max-w-[80%]">
                      {!msg.isUserMessage && (
                        <Avatar className="h-8 w-8">
                          <AvatarImage src="/bot-avatar.png" alt="AI" />
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            AI
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div
                        className={`rounded-lg p-3 ${
                          msg.isUserMessage
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      </div>
                      {msg.isUserMessage && (
                        <Avatar className="h-8 w-8">
                          <AvatarImage src="/user-avatar.png" alt="You" />
                          <AvatarFallback className="bg-secondary text-secondary-foreground">
                            {user?.firstName?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>

          {/* Quick Replies */}
          <div className="my-4 flex flex-wrap gap-2">
            {quickReplies.map((reply, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={reply.action}
                className="text-xs"
              >
                {reply.text}
              </Button>
            ))}
          </div>

          {/* Message Input */}
          <form onSubmit={handleSendMessage} className="flex gap-2 mt-4">
            <Input
              placeholder="Type your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={sendMessageMutation.isPending || !message.trim()}>
              {sendMessageMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              <span className="ml-2">Send</span>
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Exercise UI - Would be extended based on active exercise */}
      {activeExercise && (
        <Card className="mt-4 p-4">
          <CardContent>
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">
                {activeExercise.charAt(0).toUpperCase() + activeExercise.slice(1)} Exercise
              </h2>
              <Button size="sm" variant="outline" onClick={() => setActiveExercise(null)}>
                Close
              </Button>
            </div>
            <p className="text-muted-foreground mt-2">
              Follow the guidance provided by the assistant in the chat above.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
import React from 'react';

function Chatbot() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Mental Health Chatbot</h1>
      <div className="bg-white rounded-lg shadow p-4">
        <div className="mb-4 h-64 overflow-y-auto border rounded p-2">
          {/* Chat messages will appear here */}
          <div className="mb-2">
            <div className="bg-blue-100 p-2 rounded-lg inline-block">
              Hello! How can I help you with your mental health today?
            </div>
          </div>
        </div>
        <div className="flex">
          <input 
            type="text" 
            className="flex-1 p-2 border rounded-l"
            placeholder="Type your message here..."
          />
          <button className="bg-blue-500 text-white p-2 rounded-r">
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default Chatbot;
