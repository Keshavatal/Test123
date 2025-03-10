import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Bot, Send } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface Message {
  id: number;
  content: string;
  isUserMessage: boolean;
  createdAt: string;
}

export default function ChatbotInterface() {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const { data: messages, isLoading } = useQuery<Message[]>({
    queryKey: ['/api/chat'],
    enabled: !!user,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      return apiRequest('POST', '/api/chat', { content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat'] });
      setMessage('');
    },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && user) {
      sendMessageMutation.mutate(message);
    }
  };

  // Auto-scroll to bottom when new messages come in
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // If no messages and first load, create initial bot message
  useEffect(() => {
    if (!isLoading && messages && messages.length === 0 && user) {
      sendMessageMutation.mutate('Start');
    }
  }, [isLoading, messages, user]);

  return (
    <Card className="bg-white rounded-2xl shadow-md mb-8">
      <CardContent className="p-6">
        <div className="flex items-center mb-6">
          <div className="w-12 h-12 rounded-full bg-primary bg-opacity-20 flex items-center justify-center mr-3">
            <Bot className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-quicksand font-bold">MindBot</h3>
            <p className="text-sm text-textColor opacity-70">Your CBT wellness assistant</p>
          </div>
        </div>

        <div 
          ref={chatContainerRef}
          className="bg-background rounded-xl p-4 h-96 overflow-y-auto mb-4 flex flex-col"
        >
          {isLoading ? (
            <div className="space-y-4">
              <div className="flex items-end">
                <div className="w-8 h-8 rounded-full bg-primary bg-opacity-20 flex items-center justify-center mr-2 flex-shrink-0">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <Skeleton className="h-24 w-3/4 rounded-2xl rounded-bl-none" />
              </div>
            </div>
          ) : messages && messages.length > 0 ? (
            messages.map((msg) => (
              <div key={msg.id} className={`mb-4 flex items-end ${!msg.isUserMessage ? '' : 'self-end'}`}>
                {!msg.isUserMessage && (
                  <div className="w-8 h-8 rounded-full bg-primary bg-opacity-20 flex items-center justify-center mr-2 flex-shrink-0">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div className={`${!msg.isUserMessage 
                  ? 'bg-primary bg-opacity-10 rounded-2xl rounded-bl-none' 
                  : 'bg-secondary bg-opacity-10 rounded-2xl rounded-br-none'} 
                  py-3 px-4 max-w-[80%]`}
                >
                  <p className="text-sm whitespace-pre-line">{msg.content}</p>
                </div>
                {msg.isUserMessage && (
                  <div className="w-8 h-8 rounded-full bg-secondary bg-opacity-20 flex items-center justify-center ml-2 flex-shrink-0">
                    <span className="text-xs font-quicksand font-medium text-secondary">
                      {user?.firstName ? user.firstName.charAt(0) : ''}
                      {user?.lastName ? user.lastName.charAt(0) : ''}
                    </span>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p>Start a conversation with MindBot</p>
            </div>
          )}

          {sendMessageMutation.isPending && (
            <div className="flex items-end mb-4">
              <div className="w-8 h-8 rounded-full bg-primary bg-opacity-20 flex items-center justify-center mr-2 flex-shrink-0">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div className="bg-primary bg-opacity-10 rounded-2xl rounded-bl-none py-3 px-4">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSendMessage} className="relative">
          <Input
            type="text"
            placeholder="Type your message here..."
            className="w-full py-3 px-4 pr-12 rounded-xl bg-background border-none focus:ring-2 focus:ring-primary"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={sendMessageMutation.isPending || !user}
          />
          <Button
            type="submit"
            size="icon"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 w-10 h-10 rounded-full bg-primary text-white"
            disabled={sendMessageMutation.isPending || !message.trim() || !user}
          >
            <Send className="h-5 w-5" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
