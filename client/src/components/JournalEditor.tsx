import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useUserContext } from "@/contexts/UserContext";
import { journalPrompts, moodOptions } from "@/lib/exercises";

interface JournalEditorProps {
  onComplete?: () => void;
}

export function JournalEditor({ onComplete }: JournalEditorProps) {
  const { user } = useUserContext();
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mood, setMood] = useState("");
  const [showPrompts, setShowPrompts] = useState(false);

  const saveMutation = useMutation({
    mutationFn: async (journalData: { title: string; content: string; mood: string; userId: number }) => {
      const res = await apiRequest("POST", "/api/journal", journalData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/journal"] });
      toast({
        title: "Journal entry saved",
        description: "Your thoughts have been recorded successfully",
      });
      
      // Reset form
      setTitle("");
      setContent("");
      setMood("");
      
      // Call callback if provided
      if (onComplete) {
        onComplete();
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to save journal entry",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (!title.trim()) {
      toast({
        title: "Title required",
        description: "Please provide a title for your journal entry",
        variant: "destructive",
      });
      return;
    }

    if (!content.trim()) {
      toast({
        title: "Content required",
        description: "Please write something in your journal entry",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to save journal entries",
        variant: "destructive",
      });
      return;
    }

    saveMutation.mutate({
      title,
      content,
      mood,
      userId: user.id,
    });
  };

  const applyPrompt = (prompt: string) => {
    setTitle(prompt);
    setShowPrompts(false);
    // Focus the content textarea
    document.getElementById("journal-content")?.focus();
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>New Journal Entry</span>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowPrompts(!showPrompts)}
            className="text-primary"
          >
            <i className="fas fa-lightbulb mr-2"></i> 
            {showPrompts ? "Hide Prompts" : "Need Inspiration?"}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {showPrompts && (
          <div className="bg-background p-3 rounded-md mb-4">
            <p className="font-medium mb-2 text-sm">Journaling Prompts:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {journalPrompts.map((prompt, index) => (
                <Button 
                  key={index} 
                  variant="outline" 
                  size="sm" 
                  className="justify-start h-auto py-2 text-left"
                  onClick={() => applyPrompt(prompt)}
                >
                  {prompt}
                </Button>
              ))}
            </div>
          </div>
        )}
        
        <div className="space-y-2">
          <Label htmlFor="journal-title">Title</Label>
          <Input
            id="journal-title"
            placeholder="Give your entry a title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="journal-content">Your thoughts</Label>
          <Textarea
            id="journal-content"
            placeholder="Write your thoughts here..."
            className="min-h-[200px]"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="mood">How are you feeling?</Label>
          <Select value={mood} onValueChange={setMood}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select your current mood" />
            </SelectTrigger>
            <SelectContent>
              {moodOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.emoji} {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full bg-primary hover:bg-primary/90"
          onClick={handleSave}
          disabled={saveMutation.isPending}
        >
          {saveMutation.isPending ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              <span>Saving...</span>
            </div>
          ) : (
            "Save Entry"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
