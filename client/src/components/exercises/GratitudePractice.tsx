import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Heart, Sparkles, Check } from 'lucide-react';
import { motion } from 'framer-motion';

interface GratitudeItem {
  id: number;
  content: string;
}

export default function GratitudePractice() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [gratitudeItems, setGratitudeItems] = useState<GratitudeItem[]>([
    { id: 1, content: '' },
    { id: 2, content: '' },
    { id: 3, content: '' }
  ]);
  const startTime = useState<number>(Date.now())[0];

  const completeMutation = useMutation({
    mutationFn: async () => {
      if (!user) return;
      
      // Calculate duration
      const durationInSeconds = Math.round((Date.now() - startTime) / 1000);
      
      return apiRequest('POST', '/api/exercises', {
        type: 'gratitude',
        duration: durationInSeconds,
        notes: gratitudeItems.map(item => item.content).join('\n'),
        xpEarned: 30 // Fixed XP reward
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/exercises'] });
      
      // Create journal entry with gratitude items
      createJournalMutation.mutate();
    }
  });

  const createJournalMutation = useMutation({
    mutationFn: async () => {
      if (!user) return;
      
      return apiRequest('POST', '/api/journals', {
        title: "Today's Gratitude Practice",
        content: `Things I'm grateful for today:\n\n1. ${gratitudeItems[0].content}\n\n2. ${gratitudeItems[1].content}\n\n3. ${gratitudeItems[2].content}`,
        mood: "grateful"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/journals'] });
      
      toast({
        title: "Gratitude practice completed!",
        description: "Your gratitude journal has been saved.",
      });
      
      setLocation('/');
    }
  });

  const handleInputChange = (id: number, content: string) => {
    setGratitudeItems(prev => 
      prev.map(item => item.id === id ? { ...item, content } : item)
    );
  };

  const handleComplete = () => {
    if (gratitudeItems.every(item => item.content.trim())) {
      if (user) {
        completeMutation.mutate();
      } else {
        toast({
          title: "Login required",
          description: "Please log in to save your gratitude practice.",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Please complete all fields",
        description: "Fill in all three gratitude items before submitting.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="max-w-2xl mx-auto mt-8">
      <CardHeader>
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center mb-2"
        >
          <Heart className="text-red-400 mr-2 h-6 w-6" />
          <CardTitle className="font-quicksand text-primary">Gratitude Practice</CardTitle>
        </motion.div>
        <CardDescription>
          Taking time to appreciate the positive aspects of your life can improve your mood and overall wellbeing.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="bg-primary/5 p-4 rounded-lg mb-6">
          <h3 className="text-md font-quicksand font-medium flex items-center">
            <Sparkles className="text-primary h-4 w-4 mr-2" />
            Write down three things you're grateful for today
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            These can be big or small things, from a delicious cup of coffee to a supportive relationship.
          </p>
        </div>
        
        <div className="space-y-6">
          {gratitudeItems.map((item, index) => (
            <motion.div 
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <h4 className="font-quicksand font-medium mb-2">
                {index + 1}. I'm grateful for...
              </h4>
              <Textarea
                placeholder={`E.g., ${[
                  "the supportive friend who listened to me yesterday",
                  "having access to clean water and healthy food",
                  "the beautiful sunset I saw while walking home"
                ][index]}`}
                className="min-h-20"
                value={item.content}
                onChange={(e) => handleInputChange(item.id, e.target.value)}
              />
            </motion.div>
          ))}
        </div>
      </CardContent>
      
      <CardFooter>
        <Button
          className="w-full bg-primary hover:bg-primary/80"
          onClick={handleComplete}
          disabled={completeMutation.isPending || createJournalMutation.isPending}
        >
          {completeMutation.isPending || createJournalMutation.isPending ? (
            "Saving..."
          ) : (
            <>
              Complete Gratitude Practice <Check className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
