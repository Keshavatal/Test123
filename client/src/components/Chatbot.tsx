
import { useState, useEffect, useRef } from "react";
import { Send, Plus, ArrowDown } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { useToast } from "./ui/use-toast";
import { apiRequest } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { Spinner } from "./ui/spinner";

interface Message {
  id: number;
  content: string;
  isUserMessage: boolean;
  createdAt: string;
}

export function Chatbot() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  useEffect(() => {
    if (user) {
      fetchMessages();
    }
  }, [user]);
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const fetchMessages = async () => {
    try {
      setLoading(true);
      const data = await apiRequest("GET", "/api/chat");
      setMessages(data);
      setInitialLoad(false);
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) return;
    
    try {
      setLoading(true);
      const data = await apiRequest("POST", "/api/chat", { content: message });
      
      // If data is an array, both user message and AI response were returned
      if (Array.isArray(data)) {
        setMessages(prev => [...prev, ...data]);
      } else {
        // Only user message was returned
        setMessages(prev => [...prev, data]);
      }
      
      setMessage("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const startNewConversation = async () => {
    setMessages([]);
  };
  
  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="flex flex-row items-center">
        <CardTitle className="flex-1">Wellness Assistant</CardTitle>
        <Button 
          variant="outline" 
          size="sm" 
          className="h-8 gap-1"
          onClick={startNewConversation}
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">New Chat</span>
        </Button>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
        {initialLoad ? (
          <div className="flex justify-center items-center h-full">
            <Spinner className="h-8 w-8" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center h-full text-gray-500 p-8">
            <div className="rounded-full bg-primary/10 p-3 mb-4">
              <div className="rounded-full bg-primary/20 p-2">
                😌
              </div>
            </div>
            <h3 className="text-lg font-medium mb-2">Welcome to your Wellness Assistant</h3>
            <p>
              I'm here to provide support for your mental wellbeing using
              evidence-based CBT techniques. What's on your mind today?
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${
                msg.isUserMessage ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  msg.isUserMessage
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
        
        {messages.length > 2 && (
          <div className="flex justify-center">
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 gap-1"
              onClick={scrollToBottom}
            >
              <ArrowDown className="h-4 w-4" />
              <span>Scroll to bottom</span>
            </Button>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="p-4 pt-0">
        <form onSubmit={handleSubmit} className="flex w-full gap-2">
          <Input
            placeholder="Type your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={loading}
          />
          <Button type="submit" disabled={loading || !message.trim()}>
            {loading ? <Spinner className="h-4 w-4" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
