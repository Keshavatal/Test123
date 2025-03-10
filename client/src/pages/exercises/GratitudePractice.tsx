import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Heart, ArrowLeft, Award, PlusCircle, Trash2 } from "lucide-react";

interface GratitudeItem {
  id: number;
  content: string;
}

export default function GratitudePractice() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Gratitude practice state
  const [gratitudeItems, setGratitudeItems] = useState<GratitudeItem[]>([
    { id: 1, content: '' },
    { id: 2, content: '' },
    { id: 3, content: '' }
  ]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [startTime] = useState<number>(Date.now());
  
  // Journal creation mutation
  const createJournalMutation = useMutation({
    mutationFn: async () => {
      if (!user) return;
      
      const formattedDate = new Date().toLocaleDateString();
      
      return apiRequest('POST', '/api/journals', {
        userId: user.id,
        title: `Gratitude Journal - ${formattedDate}`,
        content: gratitudeItems.map((item, index) => `${index + 1}. ${item.content}`).join('\n\n'),
        mood: 'positive'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/journals'] });
      
      toast({
        title: "Journal Created",
        description: "Your gratitude items have been saved to your journal.",
      });
      
      // Navigate back to exercises after a brief delay
      setTimeout(() => {
        setLocation('/exercises');
      }, 2000);
    }
  });
  
  // Complete exercise mutation
  const completeMutation = useMutation({
    mutationFn: async () => {
      if (!user) return;
      
      // Calculate duration and XP
      const durationInSeconds = Math.round((Date.now() - startTime) / 1000);
      const xp = Math.max(20, Math.min(50, 30 + Math.floor(durationInSeconds / 30)));
      setXpEarned(xp);
      
      return apiRequest('POST', '/api/exercises', {
        userId: user.id,
        type: 'gratitude',
        duration: durationInSeconds,
        notes: gratitudeItems.map((item, index) => `${index + 1}. ${item.content}`).join('\n\n'),
        xpEarned: xp
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/exercises'] });
      queryClient.invalidateQueries({ queryKey: ['/api/me'] });
      setShowConfetti(true);
      
      toast({
        title: "Exercise Completed!",
        description: `Great job! You've earned ${xpEarned} XP.`,
      });
      
      // Create journal entry with gratitude items
      createJournalMutation.mutate();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save your progress. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  const handleInputChange = (id: number, content: string) => {
    setGratitudeItems(prevItems => 
      prevItems.map(item => 
        item.id === id ? { ...item, content } : item
      )
    );
  };
  
  const handleAddItem = () => {
    const newId = Math.max(...gratitudeItems.map(item => item.id)) + 1;
    setGratitudeItems([...gratitudeItems, { id: newId, content: '' }]);
  };
  
  const handleRemoveItem = (id: number) => {
    if (gratitudeItems.length <= 1) {
      toast({
        title: "Cannot Remove",
        description: "You need at least one gratitude item.",
        variant: "destructive",
      });
      return;
    }
    
    setGratitudeItems(prevItems => prevItems.filter(item => item.id !== id));
  };
  
  const handleComplete = () => {
    completeMutation.mutate();
  };
  
  const canComplete = gratitudeItems.filter(item => item.content.trim().length > 0).length >= 1;
  
  const getRandomPrompt = () => {
    const prompts = [
      "Someone who helped me recently...",
      "Something beautiful I saw today...",
      "A small pleasure I enjoyed today...",
      "Something I'm looking forward to...",
      "A quality I appreciate about myself...",
      "A challenge I overcame recently...",
      "Something that made me smile today...",
      "A person who inspires me...",
      "A skill or ability I'm thankful for...",
      "A comfort or convenience I often take for granted..."
    ];
    
    return prompts[Math.floor(Math.random() * prompts.length)];
  };
  
  if (!user) {
    return null;
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-accent/20 pt-10">
      <div className="container mx-auto px-4">
        <Button 
          variant="ghost" 
          className="mb-6"
          onClick={() => setLocation('/exercises')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Exercises
        </Button>
        
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center mr-3">
                <Heart className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle>Gratitude Practice</CardTitle>
                <CardDescription>
                  Focus on the positive aspects of your life to improve your mood
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            {showConfetti && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-full h-full overflow-hidden">
                  {Array.from({ length: 50 }).map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute"
                      initial={{
                        top: -20,
                        left: Math.random() * 100 + "%",
                        width: Math.random() * 10 + 5,
                        height: Math.random() * 10 + 5,
                        backgroundColor: 
                          ["#FFD700", "#FF6347", "#4169E1", "#32CD32", "#FF69B4"][
                            Math.floor(Math.random() * 5)
                          ]
                      }}
                      animate={{
                        top: "100%",
                        rotate: Math.random() * 360,
                        x: Math.random() * 200 - 100
                      }}
                      transition={{
                        duration: Math.random() * 2 + 2,
                        ease: "easeOut"
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
            
            <div className="space-y-6 my-4">
              <div className="bg-accent/10 p-6 rounded-lg mb-6">
                <h3 className="text-xl font-semibold mb-3">Write What You're Grateful For</h3>
                <p className="text-muted-foreground mb-6">
                  Take a moment to reflect on the positive aspects of your life. List at least three things you're grateful for today, big or small.
                </p>
                
                <div className="space-y-4">
                  {gratitudeItems.map((item, index) => (
                    <div key={item.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label htmlFor={`item-${item.id}`} className="text-sm font-medium">
                          {index + 1}. I'm grateful for...
                        </label>
                        
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleRemoveItem(item.id)}
                          className="h-8 w-8"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <Textarea
                        id={`item-${item.id}`}
                        value={item.content}
                        onChange={(e) => handleInputChange(item.id, e.target.value)}
                        placeholder={getRandomPrompt()}
                        className="min-h-20"
                      />
                    </div>
                  ))}
                  
                  <Button 
                    variant="outline" 
                    onClick={handleAddItem} 
                    className="w-full"
                  >
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Another Item
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col sm:flex-row gap-3 justify-between">
            <Button 
              variant="secondary" 
              onClick={() => setLocation('/exercises')}
              className="flex-1"
            >
              Cancel
            </Button>
            
            <Button 
              variant="default" 
              onClick={handleComplete} 
              className="bg-green-600 hover:bg-green-700 flex-1"
              disabled={!canComplete}
            >
              Complete Exercise
            </Button>
          </CardFooter>
        </Card>
        
        <Card className="max-w-2xl mx-auto mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Benefits of Gratitude Practice</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-accent/5 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Mental Benefits</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Reduces negative emotions</li>
                  <li>Increases happiness and life satisfaction</li>
                  <li>Improves self-esteem</li>
                  <li>Enhances resilience to stress</li>
                </ul>
              </div>
              
              <div className="bg-accent/5 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Physical Benefits</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Improves sleep quality</li>
                  <li>Reduces symptoms of illness</li>
                  <li>Decreases blood pressure</li>
                  <li>Increases energy levels</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}