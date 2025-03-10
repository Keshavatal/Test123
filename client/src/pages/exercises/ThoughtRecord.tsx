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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { PenLine, ArrowLeft, Award, Save } from "lucide-react";

interface ThoughtRecordEntry {
  situation: string;
  emotions: string;
  automaticThoughts: string;
  evidence: string;
  alternativeThoughts: string;
  outcome: string;
}

export default function ThoughtRecord() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Thought record state
  const [activeTab, setActiveTab] = useState("situation");
  const [showConfetti, setShowConfetti] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [startTime] = useState(Date.now());
  const [thoughtRecord, setThoughtRecord] = useState<ThoughtRecordEntry>({
    situation: "",
    emotions: "",
    automaticThoughts: "",
    evidence: "",
    alternativeThoughts: "",
    outcome: ""
  });
  
  // Track progress
  const [progress, setProgress] = useState(0);
  
  // Calculate progress based on filled fields
  useEffect(() => {
    const fields = Object.values(thoughtRecord);
    const filledFields = fields.filter(field => field.trim().length > 0).length;
    setProgress((filledFields / fields.length) * 100);
  }, [thoughtRecord]);
  
  // Complete exercise mutation
  const completeMutation = useMutation({
    mutationFn: async () => {
      if (!user) return;
      
      // Calculate duration and XP
      const durationInSeconds = Math.round((Date.now() - startTime) / 1000);
      const xp = Math.max(25, Math.min(75, Math.floor(durationInSeconds / 12)));
      setXpEarned(xp);
      
      // Format notes
      const notes = `
        Situation: ${thoughtRecord.situation}
        Emotions: ${thoughtRecord.emotions}
        Automatic Thoughts: ${thoughtRecord.automaticThoughts}
        Evidence: ${thoughtRecord.evidence}
        Alternative Thoughts: ${thoughtRecord.alternativeThoughts}
        Outcome: ${thoughtRecord.outcome}
      `;
      
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
      
      // Check for achievement
      if (progress >= 80) {
        // Create CBT achievement if not exists
        apiRequest('POST', '/api/achievements', {
          userId: user?.id,
          badgeId: 'cbt-champion'
        }).then(() => {
          queryClient.invalidateQueries({ queryKey: ['/api/achievements'] });
          toast({
            title: "Achievement Unlocked!",
            description: "CBT Champion: Complete a thought record exercise",
            variant: "default",
          });
        });
      }
      
      // Create journal entry
      apiRequest('POST', '/api/journals', {
        userId: user.id,
        title: "Thought Record Reflection",
        content: `
          **Situation:** ${thoughtRecord.situation}
          
          **Emotions:** ${thoughtRecord.emotions}
          
          **Automatic Thoughts:** ${thoughtRecord.automaticThoughts}
          
          **Evidence:** ${thoughtRecord.evidence}
          
          **Alternative Thoughts:** ${thoughtRecord.alternativeThoughts}
          
          **Outcome:** ${thoughtRecord.outcome}
        `,
        mood: "reflective"
      }).then(() => {
        queryClient.invalidateQueries({ queryKey: ['/api/journals'] });
        toast({
          title: "Journal Created",
          description: "Your thought record has been saved to your journal.",
        });
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save your progress. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  const handleInputChange = (field: keyof ThoughtRecordEntry, value: string) => {
    setThoughtRecord(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };
  
  const handleComplete = () => {
    completeMutation.mutate();
  };
  
  const handleNext = () => {
    const tabs = ["situation", "emotions", "automatic-thoughts", "evidence", "alternative-thoughts", "outcome"];
    const currentIndex = tabs.indexOf(activeTab);
    if (currentIndex < tabs.length - 1) {
      setActiveTab(tabs[currentIndex + 1]);
    }
  };
  
  const handlePrevious = () => {
    const tabs = ["situation", "emotions", "automatic-thoughts", "evidence", "alternative-thoughts", "outcome"];
    const currentIndex = tabs.indexOf(activeTab);
    if (currentIndex > 0) {
      setActiveTab(tabs[currentIndex - 1]);
    }
  };
  
  const canComplete = progress >= 50;
  
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
        
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center mr-3">
                <PenLine className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle>Thought Record</CardTitle>
                <CardDescription>
                  Record and analyze your thoughts to identify thinking patterns
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
              {/* Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Progress</span>
                  <span>{progress.toFixed(0)}% Complete</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
              
              {/* Thought Record Form */}
              <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                <TabsList className="grid grid-cols-3 md:grid-cols-6">
                  <TabsTrigger value="situation">Situation</TabsTrigger>
                  <TabsTrigger value="emotions">Emotions</TabsTrigger>
                  <TabsTrigger value="automatic-thoughts">Thoughts</TabsTrigger>
                  <TabsTrigger value="evidence">Evidence</TabsTrigger>
                  <TabsTrigger value="alternative-thoughts">Alternatives</TabsTrigger>
                  <TabsTrigger value="outcome">Outcome</TabsTrigger>
                </TabsList>
                
                <TabsContent value="situation" className="space-y-4 p-4 bg-accent/5 rounded-lg mt-4">
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Describe the Situation</h3>
                    <p className="text-muted-foreground mb-4">
                      What happened? When and where did it occur? Who was involved?
                    </p>
                    
                    <Textarea 
                      value={thoughtRecord.situation}
                      onChange={(e) => handleInputChange("situation", e.target.value)}
                      placeholder="Example: I was giving a presentation at work and stumbled over my words. My manager looked confused."
                      className="min-h-32"
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="emotions" className="space-y-4 p-4 bg-accent/5 rounded-lg mt-4">
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Identify Your Emotions</h3>
                    <p className="text-muted-foreground mb-4">
                      What emotions did you feel in this situation? How intense were they (0-100%)?
                    </p>
                    
                    <Textarea 
                      value={thoughtRecord.emotions}
                      onChange={(e) => handleInputChange("emotions", e.target.value)}
                      placeholder="Example: Anxiety (80%), Embarrassment (75%), Disappointment (60%)"
                      className="min-h-32"
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="automatic-thoughts" className="space-y-4 p-4 bg-accent/5 rounded-lg mt-4">
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Automatic Thoughts</h3>
                    <p className="text-muted-foreground mb-4">
                      What thoughts automatically came to mind? What were you telling yourself?
                    </p>
                    
                    <Textarea 
                      value={thoughtRecord.automaticThoughts}
                      onChange={(e) => handleInputChange("automaticThoughts", e.target.value)}
                      placeholder="Example: 'I totally messed up. Everyone thinks I'm incompetent now. My manager will never trust me with an important presentation again.'"
                      className="min-h-32"
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="evidence" className="space-y-4 p-4 bg-accent/5 rounded-lg mt-4">
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Evidence</h3>
                    <p className="text-muted-foreground mb-4">
                      What evidence supports and contradicts your automatic thoughts?
                    </p>
                    
                    <Textarea 
                      value={thoughtRecord.evidence}
                      onChange={(e) => handleInputChange("evidence", e.target.value)}
                      placeholder="Supporting evidence: I did stumble over some words.
                      
Contradicting evidence: I recovered quickly. No one commented negatively. Most of my presentation went well."
                      className="min-h-32"
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="alternative-thoughts" className="space-y-4 p-4 bg-accent/5 rounded-lg mt-4">
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Alternative Thoughts</h3>
                    <p className="text-muted-foreground mb-4">
                      What are some alternative, more balanced perspectives on this situation?
                    </p>
                    
                    <Textarea 
                      value={thoughtRecord.alternativeThoughts}
                      onChange={(e) => handleInputChange("alternativeThoughts", e.target.value)}
                      placeholder="Example: 'Everyone makes minor mistakes in presentations. One small stumble doesn't mean the whole presentation was bad. My manager probably didn't even notice or care about the small error.'"
                      className="min-h-32"
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="outcome" className="space-y-4 p-4 bg-accent/5 rounded-lg mt-4">
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Outcome</h3>
                    <p className="text-muted-foreground mb-4">
                      How do you feel now? What did you learn from this exercise?
                    </p>
                    
                    <Textarea 
                      value={thoughtRecord.outcome}
                      onChange={(e) => handleInputChange("outcome", e.target.value)}
                      placeholder="Example: 'I feel more calm now (anxiety 30%). I realized I was catastrophizing a minor mistake. I'll try to be more balanced in my thinking about my performance in the future.'"
                      className="min-h-32"
                    />
                  </div>
                </TabsContent>
              </Tabs>
              
              {/* Navigation buttons below tabs */}
              <div className="flex justify-between pt-4">
                <Button 
                  variant="outline" 
                  onClick={handlePrevious}
                  disabled={activeTab === "situation"}
                >
                  Previous
                </Button>
                
                <Button 
                  onClick={handleNext}
                  disabled={activeTab === "outcome"}
                >
                  Next
                </Button>
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
              <Save className="mr-2 h-4 w-4" /> Save and Complete
            </Button>
          </CardFooter>
        </Card>
        
        <Card className="max-w-3xl mx-auto mt-6">
          <CardHeader>
            <CardTitle className="text-lg">About Thought Records</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              Thought records are a core tool in cognitive behavioral therapy (CBT) that help you identify, evaluate, and change unhelpful thinking patterns. By breaking down your thoughts and examining the evidence, you can develop more balanced perspectives.
            </p>
            
            <h4 className="font-semibold mb-2">When to Use a Thought Record:</h4>
            <ul className="list-disc pl-5 space-y-1 mb-4">
              <li>When you experience strong negative emotions</li>
              <li>When you notice yourself engaging in negative self-talk</li>
              <li>To challenge recurring negative thoughts</li>
              <li>After difficult or triggering situations</li>
              <li>To develop more balanced thinking patterns over time</li>
            </ul>
            
            <div className="bg-accent/5 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Tips for Effective Thought Records:</h4>
              <ul className="list-disc pl-5 space-y-1">
                <li>Be specific when describing situations and thoughts</li>
                <li>Rate emotion intensity to track progress</li>
                <li>Look for themes in your automatic thoughts</li>
                <li>Consider what you'd tell a friend in the same situation</li>
                <li>Practice regularly to build the skill of cognitive restructuring</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}