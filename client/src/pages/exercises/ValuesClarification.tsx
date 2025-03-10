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
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { PenLine, ArrowLeft, Award, Save } from "lucide-react";

interface ValueCategory {
  name: string;
  description: string;
  values: Value[];
}

interface Value {
  name: string;
  importance: number;
  description: string;
}

export default function ValuesClarification() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Values clarification state
  const [activeTab, setActiveTab] = useState("personal");
  const [progress, setProgress] = useState(0);
  const [selectedValues, setSelectedValues] = useState<string[]>([]);
  const [valueDescriptions, setValueDescriptions] = useState<Record<string, string>>({});
  const [showConfetti, setShowConfetti] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [startTime] = useState(Date.now());
  
  // Value categories
  const valueCategories: ValueCategory[] = [
    {
      name: "personal",
      description: "Personal growth and development values",
      values: [
        { name: "Growth", importance: 0, description: "" },
        { name: "Learning", importance: 0, description: "" },
        { name: "Health", importance: 0, description: "" },
        { name: "Self-care", importance: 0, description: "" },
        { name: "Creativity", importance: 0, description: "" },
        { name: "Adventure", importance: 0, description: "" },
        { name: "Independence", importance: 0, description: "" },
        { name: "Spirituality", importance: 0, description: "" }
      ]
    },
    {
      name: "relationship",
      description: "Relationship and social values",
      values: [
        { name: "Family", importance: 0, description: "" },
        { name: "Friendship", importance: 0, description: "" },
        { name: "Community", importance: 0, description: "" },
        { name: "Respect", importance: 0, description: "" },
        { name: "Trust", importance: 0, description: "" },
        { name: "Honesty", importance: 0, description: "" },
        { name: "Empathy", importance: 0, description: "" },
        { name: "Generosity", importance: 0, description: "" }
      ]
    },
    {
      name: "work",
      description: "Work and achievement values",
      values: [
        { name: "Success", importance: 0, description: "" },
        { name: "Achievement", importance: 0, description: "" },
        { name: "Recognition", importance: 0, description: "" },
        { name: "Leadership", importance: 0, description: "" },
        { name: "Teamwork", importance: 0, description: "" },
        { name: "Excellence", importance: 0, description: "" },
        { name: "Innovation", importance: 0, description: "" },
        { name: "Service", importance: 0, description: "" }
      ]
    },
    {
      name: "ethical",
      description: "Ethical and moral values",
      values: [
        { name: "Integrity", importance: 0, description: "" },
        { name: "Justice", importance: 0, description: "" },
        { name: "Fairness", importance: 0, description: "" },
        { name: "Compassion", importance: 0, description: "" },
        { name: "Responsibility", importance: 0, description: "" },
        { name: "Equality", importance: 0, description: "" },
        { name: "Environmental Stewardship", importance: 0, description: "" },
        { name: "Peace", importance: 0, description: "" }
      ]
    }
  ];
  
  // Update values data structure based on user input
  const [values, setValues] = useState<ValueCategory[]>(valueCategories);
  
  // Top values (importance ≥ 7)
  const [topValues, setTopValues] = useState<Value[]>([]);
  
  // Calculate progress
  useEffect(() => {
    // Count values with importance set
    const totalPossibleValues = values.reduce((acc, category) => acc + category.values.length, 0);
    const valuesRated = values.reduce((acc, category) => {
      return acc + category.values.filter(value => value.importance > 0).length;
    }, 0);
    
    // Count values with descriptions
    const valuesWithDescription = Object.values(valueDescriptions).filter(desc => desc.trim().length > 0).length;
    
    // Calculate progress (50% for ratings, 50% for descriptions)
    const ratingProgress = (valuesRated / totalPossibleValues) * 50;
    const descriptionProgress = (valuesWithDescription / Math.min(3, totalPossibleValues)) * 50;
    
    setProgress(Math.min(100, ratingProgress + descriptionProgress));
  }, [values, valueDescriptions]);
  
  // Update top values when importance ratings change
  useEffect(() => {
    const newTopValues: Value[] = [];
    
    values.forEach(category => {
      category.values.forEach(value => {
        if (value.importance >= 7) {
          newTopValues.push({
            ...value,
            description: valueDescriptions[value.name] || ""
          });
        }
      });
    });
    
    setTopValues(newTopValues.sort((a, b) => b.importance - a.importance));
  }, [values, valueDescriptions]);
  
  // Complete exercise mutation
  const completeMutation = useMutation({
    mutationFn: async () => {
      if (!user) return;
      
      // Calculate duration and XP
      const durationInSeconds = Math.round((Date.now() - startTime) / 1000);
      const xp = Math.max(20, Math.min(70, Math.floor(durationInSeconds / 15)));
      setXpEarned(xp);
      
      // Format notes
      const notes = `Top Values:
${topValues.map(value => `- ${value.name} (${value.importance}/10): ${valueDescriptions[value.name] || 'No description'}`).join('\n')}`;
      
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
      if (topValues.length >= 3) {
        // Create CBT achievement if not exists
        apiRequest('POST', '/api/achievements', {
          userId: user?.id,
          badgeId: 'cbt-champion'
        }).then(() => {
          queryClient.invalidateQueries({ queryKey: ['/api/achievements'] });
          toast({
            title: "Achievement Unlocked!",
            description: "CBT Champion: Complete values clarification exercise",
            variant: "default",
          });
        });
      }
      
      // Create journal entry
      apiRequest('POST', '/api/journals', {
        userId: user.id,
        title: "My Core Values",
        content: `# My Core Values

${topValues.map(value => `## ${value.name} (${value.importance}/10)
${valueDescriptions[value.name] || 'No description'}`).join('\n\n')}

This values clarification exercise has helped me identify what's truly important to me and where I want to focus my energy.`,
        mood: "reflective"
      }).then(() => {
        queryClient.invalidateQueries({ queryKey: ['/api/journals'] });
        toast({
          title: "Journal Created",
          description: "Your core values have been saved to your journal.",
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
  
  const handleImportanceChange = (categoryIndex: number, valueIndex: number, newImportance: number) => {
    const updatedValues = [...values];
    updatedValues[categoryIndex].values[valueIndex].importance = newImportance;
    setValues(updatedValues);
  };
  
  const handleDescriptionChange = (valueName: string, description: string) => {
    setValueDescriptions(prev => ({
      ...prev,
      [valueName]: description
    }));
  };
  
  const handleComplete = () => {
    completeMutation.mutate();
  };
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };
  
  const canComplete = progress >= 50 && topValues.length >= 1;
  
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
                <CardTitle>Values Clarification</CardTitle>
                <CardDescription>
                  Identify your core values to guide your actions and decisions
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
              
              {/* Instructions */}
              <div className="bg-accent/10 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Instructions:</h3>
                <ol className="list-decimal pl-5 space-y-1">
                  <li>Rate each value on a scale of 0-10 based on its importance to you</li>
                  <li>Focus on what truly matters to you, not what you think should matter</li>
                  <li>Write descriptions for your highest-rated values (7-10)</li>
                  <li>Reflect on how these values guide your decisions and actions</li>
                </ol>
              </div>
              
              {/* Values Clarification */}
              <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                <TabsList className="grid grid-cols-2 md:grid-cols-4">
                  <TabsTrigger value="personal">Personal</TabsTrigger>
                  <TabsTrigger value="relationship">Relationships</TabsTrigger>
                  <TabsTrigger value="work">Work & Achievement</TabsTrigger>
                  <TabsTrigger value="ethical">Ethical & Moral</TabsTrigger>
                </TabsList>
                
                {values.map((category, categoryIndex) => (
                  <TabsContent key={category.name} value={category.name} className="space-y-4 p-4 bg-accent/5 rounded-lg mt-4">
                    <div>
                      <h3 className="text-xl font-semibold mb-2">{category.description}</h3>
                      <p className="text-muted-foreground mb-4">
                        Rate how important each value is to you from 0 (not important) to 10 (extremely important).
                      </p>
                      
                      <div className="space-y-6">
                        {category.values.map((value, valueIndex) => (
                          <div key={value.name} className="space-y-2">
                            <div className="flex justify-between">
                              <Label className="font-medium">{value.name}</Label>
                              <span className="text-sm font-medium">{value.importance}/10</span>
                            </div>
                            <Slider
                              value={[value.importance]}
                              min={0}
                              max={10}
                              step={1}
                              onValueChange={([newValue]) => handleImportanceChange(categoryIndex, valueIndex, newValue)}
                            />
                            
                            {value.importance >= 7 && (
                              <div className="mt-2 pt-2 border-t">
                                <Label htmlFor={`desc-${value.name}`} className="text-sm">
                                  Why is {value.name} important to you?
                                </Label>
                                <Textarea
                                  id={`desc-${value.name}`}
                                  value={valueDescriptions[value.name] || ""}
                                  onChange={(e) => handleDescriptionChange(value.name, e.target.value)}
                                  placeholder={`Describe why ${value.name} is a core value for you and how it guides your life...`}
                                  className="mt-1"
                                />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>
                ))}
                
                {/* Top Values Summary */}
                <TabsContent value="summary" className="space-y-4 p-4 bg-accent/5 rounded-lg mt-4">
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Your Top Values</h3>
                    <p className="text-muted-foreground mb-4">
                      These are your highest-rated values that appear most important to you.
                    </p>
                    
                    {topValues.length > 0 ? (
                      <div className="space-y-6">
                        {topValues.map((value) => (
                          <div key={value.name} className="bg-white p-4 rounded-lg shadow-sm">
                            <div className="flex justify-between items-center mb-2">
                              <h4 className="font-semibold text-lg">{value.name}</h4>
                              <span className="bg-primary/10 text-primary px-2 py-1 rounded-full text-xs font-medium">
                                {value.importance}/10
                              </span>
                            </div>
                            <p className="text-muted-foreground text-sm">
                              {valueDescriptions[value.name] || "No description provided yet."}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-accent/10 p-4 rounded-lg text-center">
                        <p>You haven't rated any values as 7 or higher yet.</p>
                        <p className="text-sm text-muted-foreground mt-2">
                          Rate your most important values to see them here.
                        </p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
              
              {/* Bottom navigation buttons */}
              <div className="flex justify-between pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    const tabs = ["personal", "relationship", "work", "ethical", "summary"];
                    const currentIndex = tabs.indexOf(activeTab);
                    if (currentIndex > 0) {
                      setActiveTab(tabs[currentIndex - 1]);
                    }
                  }}
                  disabled={activeTab === "personal"}
                >
                  Previous
                </Button>
                
                <Button 
                  onClick={() => {
                    const tabs = ["personal", "relationship", "work", "ethical", "summary"];
                    const currentIndex = tabs.indexOf(activeTab);
                    if (currentIndex < tabs.length - 1) {
                      setActiveTab(tabs[currentIndex + 1]);
                    }
                  }}
                  disabled={activeTab === "summary"}
                >
                  Next
                </Button>
              </div>
              
              {/* Add "See Summary" button */}
              {activeTab !== "summary" && (
                <div className="flex justify-center">
                  <Button 
                    variant="ghost" 
                    onClick={() => setActiveTab("summary")}
                    className="mt-2"
                  >
                    See Your Top Values
                  </Button>
                </div>
              )}
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
            <CardTitle className="text-lg">Why Values Matter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-accent/5 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Benefits of Values Clarification</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Provides direction for meaningful life decisions</li>
                  <li>Helps resolve internal conflicts</li>
                  <li>Creates a stronger sense of purpose</li>
                  <li>Improves resilience during challenges</li>
                  <li>Enhances overall well-being and life satisfaction</li>
                </ul>
              </div>
              
              <div className="bg-accent/5 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Using Your Values</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Refer to them when making important decisions</li>
                  <li>Use them to set meaningful goals</li>
                  <li>Align daily activities with what truly matters to you</li>
                  <li>Communicate your needs and boundaries to others</li>
                  <li>Revisit and refine them as you grow and change</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}