import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { assessmentQuestions, submitAssessment } from "@/lib/auth";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Loader2, ArrowLeft, ArrowRight, CheckCircle } from "lucide-react";

export default function InitialAssessment() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState<Record<number, number>>({});
  
  const assessmentMutation = useMutation({
    mutationFn: submitAssessment,
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['/api/assessment'] });
      await refreshUser();
      
      toast({
        title: "Assessment completed!",
        description: "Thank you for completing the assessment. Your personalized journey awaits!",
      });
      
      // Redirect to dashboard
      setLocation('/');
    },
    onError: () => {
      toast({
        title: "Error submitting assessment",
        description: "There was a problem saving your assessment. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleSelectOption = (questionId: number, value: number) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleNext = () => {
    if (currentStep < assessmentQuestions.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Submit assessment
      assessmentMutation.mutate(responses);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const currentQuestion = assessmentQuestions[currentStep];
  const hasAnsweredCurrent = responses[currentQuestion.id] !== undefined;
  const progress = (Object.keys(responses).length / assessmentQuestions.length) * 100;
  const progressText = `${Object.keys(responses).length} of ${assessmentQuestions.length} questions answered`;

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-primary">Mental Wellness Assessment</CardTitle>
        <CardDescription>
          Help us understand your current mental health status to personalize your experience
        </CardDescription>
        <div className="mt-4">
          <Progress value={progress} className="h-2" />
          <p className="text-sm text-muted-foreground mt-1">{progressText}</p>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="text-xl font-quicksand font-medium">
          {currentQuestion.question}
        </div>
        
        <RadioGroup 
          value={responses[currentQuestion.id]?.toString()} 
          onValueChange={(value) => handleSelectOption(currentQuestion.id, parseInt(value))}
          className="space-y-3"
        >
          {currentQuestion.options.map((option) => (
            <div key={option.value} className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
              <RadioGroupItem 
                value={option.value.toString()} 
                id={`option-${option.value}`}
              />
              <Label htmlFor={`option-${option.value}`} className="flex-1 cursor-pointer">
                {option.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
        
        {currentStep > 0 && (
          <div className="pt-4">
            <Separator className="mb-4" />
            <h4 className="text-sm font-medium mb-2">Previous questions</h4>
            <div className="space-y-2">
              {assessmentQuestions.slice(0, currentStep).map((q, index) => {
                const response = responses[q.id];
                const selectedOption = q.options.find(opt => opt.value === response);
                
                return (
                  <div key={q.id} className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span className="text-muted-foreground">{index + 1}. {q.question.substring(0, 60)}...</span>
                    {selectedOption && (
                      <span className="ml-auto font-medium">{selectedOption.label}</span>
                    )}
                  </div>
                );
              })}
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
          disabled={!hasAnsweredCurrent || assessmentMutation.isPending}
        >
          {assessmentMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
              Submitting...
            </>
          ) : currentStep === assessmentQuestions.length - 1 ? (
            <>
              Complete Assessment <CheckCircle className="ml-2 h-4 w-4" />
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
