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
import { Input } from '@/components/ui/input';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

interface Step {
  title: string;
  description: string;
  inputLabel: string;
  placeholder: string;
}

export default function CognitiveRestructuring() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState<Record<number, string>>({});
  const startTime = useState<number>(Date.now())[0];

  const steps: Step[] = [
    {
      title: "Identify the Negative Thought",
      description: "Write down a negative thought you've experienced recently.",
      inputLabel: "Negative Thought",
      placeholder: "E.g., I always mess things up and can't do anything right.",
    },
    {
      title: "Identify the Evidence",
      description: "What evidence supports this negative thought? Be objective.",
      inputLabel: "Supporting Evidence",
      placeholder: "E.g., I made a mistake on my presentation yesterday.",
    },
    {
      title: "Challenge the Thought",
      description: "What evidence contradicts this negative thought?",
      inputLabel: "Contradicting Evidence",
      placeholder: "E.g., I successfully completed three other presentations this month that went well.",
    },
    {
      title: "Alternative Perspective",
      description: "What's a more balanced and realistic way to look at this situation?",
      inputLabel: "Alternative Thought",
      placeholder: "E.g., I made a mistake, but that doesn't mean I always mess up. I've had many successes too.",
    },
    {
      title: "New Thought",
      description: "Rewrite your original thought in a more balanced, realistic way.",
      inputLabel: "Balanced Thought",
      placeholder: "E.g., I made a mistake in my presentation, but that's normal and doesn't define my abilities. I've given many successful presentations before.",
    }
  ];

  const completeMutation = useMutation({
    mutationFn: async () => {
      if (!user) return;
      
      // Calculate duration
      const durationInSeconds = Math.round((Date.now() - startTime) / 1000);
      
      return apiRequest('POST', '/api/exercises', {
        type: 'cognitive',
        duration: durationInSeconds,
        notes: JSON.stringify(responses),
        xpEarned: 40 // Fixed XP reward for completing this exercise
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/exercises'] });
      
      // Create journal entry from the exercise
      if (responses[0] && responses[4]) {
        createJournalMutation.mutate();
      } else {
        toast({
          title: "Exercise completed!",
          description: "Great job challenging your negative thoughts.",
        });
        setLocation('/');
      }
    }
  });

  const createJournalMutation = useMutation({
    mutationFn: async () => {
      if (!user) return;
      
      return apiRequest('POST', '/api/journals', {
        title: "Cognitive Restructuring Exercise",
        content: `Original thought: ${responses[0]}\n\nBalanced thought: ${responses[4]}\n\nEvidence for: ${responses[1]}\n\nEvidence against: ${responses[2]}\n\nAlternative perspective: ${responses[3]}`,
        mood: "reflective"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/journals'] });
      
      toast({
        title: "Exercise completed!",
        description: "Great job challenging your negative thoughts. A journal entry has been created.",
      });
      
      setLocation('/');
    }
  });

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Complete exercise
      if (user) {
        completeMutation.mutate();
      } else {
        toast({
          title: "Login required",
          description: "Please log in to save your progress.",
          variant: "destructive",
        });
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleInputChange = (value: string) => {
    setResponses(prev => ({
      ...prev,
      [currentStep]: value
    }));
  };

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const canContinue = !!responses[currentStep]?.trim();

  return (
    <Card className="max-w-2xl mx-auto mt-8">
      <CardHeader>
        <CardTitle className="font-quicksand text-primary">Cognitive Restructuring</CardTitle>
        <CardDescription>
          Challenge negative thoughts with this step-by-step exercise
        </CardDescription>
        <div className="w-full bg-muted h-2 mt-4 rounded-full">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          ></div>
        </div>
      </CardHeader>
      
      <CardContent>
        <h3 className="text-xl font-quicksand font-semibold mb-2">{currentStepData.title}</h3>
        <p className="text-muted-foreground mb-4">{currentStepData.description}</p>
        
        <div className="space-y-3">
          <Label htmlFor="response">{currentStepData.inputLabel}</Label>
          <Textarea
            id="response"
            placeholder={currentStepData.placeholder}
            className="min-h-32"
            value={responses[currentStep] || ''}
            onChange={(e) => handleInputChange(e.target.value)}
          />
        </div>

        {currentStep > 0 && (
          <div className="mt-6">
            <Separator className="my-4" />
            <h4 className="text-sm font-medium mb-2">Previous Responses</h4>
            <div className="space-y-2">
              {Object.entries(responses)
                .filter(([key]) => parseInt(key) < currentStep)
                .map(([key, value]) => (
                  <div key={key} className="bg-muted p-3 rounded-md">
                    <p className="text-xs font-medium text-muted-foreground mb-1">{steps[parseInt(key)].inputLabel}</p>
                    <p className="text-sm">{value}</p>
                  </div>
                ))
              }
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={handleBack}
          disabled={currentStep === 0}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        
        <Button
          onClick={handleNext}
          disabled={!canContinue || completeMutation.isPending}
        >
          {isLastStep ? (
            <>
              Complete <Check className="ml-2 h-4 w-4" />
            </>
          ) : (
            <>
              Next <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
