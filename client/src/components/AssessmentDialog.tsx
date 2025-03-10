import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { assessmentQuestions, calculateAssessmentScore } from "@/lib/exercises";
import { useUserContext } from "@/contexts/UserContext";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AssessmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AssessmentDialog({ isOpen, onClose }: AssessmentDialogProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [isComplete, setIsComplete] = useState(false);
  const [score, setScore] = useState(0);
  const { user } = useUserContext();
  const { toast } = useToast();
  
  const question = assessmentQuestions[currentQuestion];
  const progress = (currentQuestion / assessmentQuestions.length) * 100;
  
  const saveMutation = useMutation({
    mutationFn: async (assessmentData: { answers: Record<number, number>; score: number; userId: number }) => {
      const res = await apiRequest("POST", "/api/assessment", assessmentData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assessment"] });
      queryClient.invalidateQueries({ queryKey: ["/api/assessment/latest"] });
      toast({
        title: "Assessment saved",
        description: "Your mental health assessment has been recorded",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to save assessment",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const handleAnswer = (value: string) => {
    const numValue = parseInt(value, 10);
    const newAnswers = { ...answers, [question.id]: numValue };
    setAnswers(newAnswers);
    
    if (currentQuestion < assessmentQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Complete the assessment
      const finalScore = calculateAssessmentScore(newAnswers);
      setScore(finalScore);
      setIsComplete(true);
      
      // Save to server
      if (user) {
        saveMutation.mutate({
          answers: newAnswers,
          score: finalScore,
          userId: user.id,
        });
      }
    }
  };
  
  const handleClose = () => {
    // Reset state
    setCurrentQuestion(0);
    setAnswers({});
    setIsComplete(false);
    onClose();
  };
  
  const getWellnessMessage = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Fair";
    if (score >= 20) return "Needs attention";
    return "Requires support";
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isComplete ? "Assessment Complete" : "Mental Health Assessment"}
          </DialogTitle>
          <DialogDescription>
            {isComplete 
              ? "Based on your answers, we've calculated your mental wellness score." 
              : "Please answer honestly to help us personalize your experience."}
          </DialogDescription>
        </DialogHeader>
        
        {!isComplete ? (
          <div className="py-4">
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span>Question {currentQuestion + 1} of {assessmentQuestions.length}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
            
            <div className="mb-6">
              <h3 className="text-base font-medium mb-4">{question.question}</h3>
              
              <RadioGroup onValueChange={handleAnswer}>
                {question.options.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2 mb-2">
                    <RadioGroupItem value={option.value.toString()} id={`option-${option.value}`} />
                    <Label htmlFor={`option-${option.value}`}>{option.label}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>
        ) : (
          <div className="py-4 text-center">
            <div className="relative w-32 h-32 mx-auto mb-4">
              <svg className="w-32 h-32 -rotate-90" viewBox="0 0 36 36">
                <path 
                  className="stroke-[3] fill-none stroke-gray-200" 
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                />
                <path 
                  className="stroke-[3] fill-none stroke-primary" 
                  strokeDasharray={`${score}, 100`}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                />
              </svg>
              <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
                <span className="text-xl font-semibold">{score}%</span>
              </div>
            </div>
            
            <h3 className="text-xl font-semibold font-quicksand mb-1">
              Mental Wellness: {getWellnessMessage(score)}
            </h3>
            <p className="text-gray-500 mb-4">
              We'll use this score to personalize your recommendations.
            </p>
          </div>
        )}
        
        <DialogFooter>
          {isComplete ? (
            <Button 
              onClick={handleClose} 
              className="w-full bg-primary hover:bg-primary/90"
            >
              Continue to Dashboard
            </Button>
          ) : (
            <Button 
              variant="outline" 
              onClick={() => setCurrentQuestion(currentQuestion - 1)} 
              disabled={currentQuestion === 0}
              className="mr-2"
            >
              Back
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
