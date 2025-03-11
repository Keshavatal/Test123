import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Chatbot from '@/components/Chatbot';

const ChatbotPage: React.FC = () => {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-3xl font-bold">Mental Health Assistant</h1>
      <p className="text-muted-foreground">
        Talk to our AI assistant about your feelings, get support, or try guided exercises.
      </p>

      <Card className="h-[70vh]">
        <CardHeader className="bg-primary/5">
          <CardTitle>Conversation</CardTitle>
        </CardHeader>
        <CardContent className="p-0 h-[calc(70vh-56px)]">
          <Chatbot />
        </CardContent>
      </Card>
    </div>
  );
};

export default ChatbotPage;