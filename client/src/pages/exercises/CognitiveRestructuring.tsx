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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { PenLine, ArrowLeft, Award, CheckCircle2 } from "lucide-react";

interface CognitiveStep {
  title: string;
  description: string;
  inputLabel: string;
  placeholder: string;
}

export default function CognitiveRestructuring() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Cognitive restructuring state
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [startTime] = useState(Date.now());
  const [showConfetti, setShowConfetti] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [responses, setResponses] = useState<string[]>(["", "", "", "", ""]);
  
  // Cognitive restructuring steps
  const steps: CognitiveStep[] = [
    {
      title: "Identify Negative Thought",
      description: "What negative thought or belief is bothering you right now?",
      inputLabel: "Negative Thought",
      placeholder: "e.g., I'm going to fail at this project and everyone will think I'm incompetent."
    },
    {
      title: "Identify Cognitive Distortions",
      description: "What type of thinking pattern might this represent?",
      inputLabel: "Cognitive Distortions",
      placeholder: "e.g., Catastrophizing, All-or-nothing thinking, Mind reading..."
    },
    {
      title: "Examine the Evidence",
      description: "What evidence supports this thought? What evidence contradicts it?",
      inputLabel: "Evidence Analysis",
      placeholder: "For: I've struggled with similar projects before.\nAgainst: I've successfully completed many other projects."
    },
    {
      title: "Alternative Perspective",
      description: "What's another way to look at this situation?",
      inputLabel: "Alternative Thought",
      placeholder: "e.g., This project is challenging, but I can ask for help if needed. Everyone faces difficulties sometimes."
    },
    {
      title: "Balanced Thought",
      description: "What's a more balanced and realistic thought to replace the negative one?",
      inputLabel: "Balanced Thought",
      placeholder: "e.g., This project is challenging, but I have the skills to complete it. If I struggle, I can seek help and learn from the experience."
    }
  ];
  
  // Update progress when step changes
  useEffect(() => {
    setProgress(((currentStep + 1) / steps.length) * 100);
  }, [currentStep]);
  
  // Complete exercise mutation
  const completeMutation = useMutation({
    mutationFn: async () => {
      if (!user) return;
      
      // Calculate duration and XP
      const durationInSeconds = Math.round((Date.now() - startTime) / 1000);
      const xp = Math.max(25, Math.min(70, Math.floor(durationInSeconds / 15)));
      setXpEarned(xp);
      
      // Format notes
      const notes = steps.map((step, index) => 
        `${step.title}: ${responses[index] || "Not provided"}`
      ).join("\n\n");
      
      return apiRequest('POST', '/api/exercises', {
        userId: user.id,
        type: 'cognitive',
        duration: durationInSeconds,
        notes,
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
      
      // Check if all steps are completed with reasonable responses
      const isComplete = responses.every(r => r.length > 10);
      
      if (isComplete) {
        // Create CBT achievement if not exists
        apiRequest('POST', '/api/achievements', {
          userId: user?.id,
          badgeId: 'cbt-champion'
        }).then(() => {
          queryClient.invalidateQueries({ queryKey: ['/api/achievements'] });
          toast({
            title: "Achievement Unlocked!",
            description: "CBT Champion: Complete a cognitive restructuring exercise",
            variant: "default",
          });
        });
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save your progress. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  const handleNextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prevStep => prevStep + 1);
    }
  };
  
  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prevStep => prevStep - 1);
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const updatedResponses = [...responses];
    updatedResponses[currentStep] = e.target.value;
    setResponses(updatedResponses);
  };
  
  const handleComplete = () => {
    completeMutation.mutate();
  };
  
  const canProceed = responses[currentStep].trim().length > 0;
  
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
                <PenLine className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle>Cognitive Restructuring</CardTitle>
                <CardDescription>
                  Challenge and reframe negative thoughts with this guided exercise
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
              {/* Progress bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Step {currentStep + 1} of {steps.length}</span>
                  <span>{progress.toFixed(0)}% Complete</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
              
              {/* Step indicator */}
              <div className="flex justify-between">
                {steps.map((step, index) => (
                  <div 
                    key={index}
                    className={`flex flex-col items-center relative ${index > currentStep ? 'opacity-40' : ''}`}
                  >
                    <div 
                      className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 text-white text-sm
                        ${index < currentStep 
                          ? 'bg-green-500' 
                          : index === currentStep 
                            ? 'bg-primary' 
                            : 'bg-gray-300'}`}
                    >
                      {index < currentStep ? <CheckCircle2 className="w-4 h-4" /> : index + 1}
                    </div>
                    <span className="text-xs text-center hidden md:block">{step.title}</span>
                    
                    {/* Connector line */}
                    {index < steps.length - 1 && (
                      <div 
                        className={`absolute top-4 h-0.5 w-[calc(100%-2rem)] left-8 -translate-y-1/2 
                          ${index < currentStep ? 'bg-green-500' : 'bg-gray-300'}`}
                      />
                    )}
                  </div>
                ))}
              </div>
              
              {/* Current step content */}
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="bg-accent/10 p-6 rounded-lg"
              >
                <h3 className="text-xl font-semibold mb-3">{steps[currentStep].title}</h3>
                <p className="text-muted-foreground mb-6">{steps[currentStep].description}</p>
                
                <div className="space-y-2">
                  <label htmlFor="response" className="text-sm font-medium">
                    {steps[currentStep].inputLabel}
                  </label>
                  <Textarea
                    id="response"
                    value={responses[currentStep]}
                    onChange={handleInputChange}
                    placeholder={steps[currentStep].placeholder}
                    className="min-h-32"
                  />
                </div>
              </motion.div>
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col sm:flex-row gap-3 justify-between">
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={handlePrevStep}
                disabled={currentStep === 0}
                className="flex-1"
              >
                Previous
              </Button>
              
              {currentStep < steps.length - 1 ? (
                <Button 
                  onClick={handleNextStep}
                  disabled={!canProceed}
                  className="flex-1"
                >
                  Next
                </Button>
              ) : (
                <Button 
                  variant="default" 
                  onClick={handleComplete} 
                  className="bg-green-600 hover:bg-green-700 flex-1"
                  disabled={!canProceed}
                >
                  Complete Exercise
                </Button>
              )}
            </div>
          </CardFooter>
        </Card>
        
        <Card className="max-w-2xl mx-auto mt-6">
          <CardHeader>
            <CardTitle className="text-lg">About Cognitive Restructuring</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              Cognitive restructuring is a core technique in Cognitive Behavioral Therapy (CBT) that helps you identify, challenge, and modify unhelpful thoughts and beliefs.
            </p>
            <h4 className="font-semibold mb-2">Common Cognitive Distortions:</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li><span className="font-medium">Catastrophizing:</span> Expecting the worst possible outcome</li>
              <li><span className="font-medium">All-or-nothing thinking:</span> Seeing things in black and white categories</li>
              <li><span className="font-medium">Mind reading:</span> Assuming you know what others are thinking</li>
              <li><span className="font-medium">Emotional reasoning:</span> Believing something is true because it "feels" true</li>
              <li><span className="font-medium">Overgeneralization:</span> Drawing broad conclusions from a single event</li>
              <li><span className="font-medium">Personalization:</span> Taking excessive responsibility for external events</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}