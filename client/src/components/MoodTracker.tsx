import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { InsertMood } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { moodOptions } from "@/lib/exercises";

interface MoodTrackerProps {
  userId: number;
  onMoodSelected?: (mood: string) => void;
}

export function MoodTracker({ userId, onMoodSelected }: MoodTrackerProps) {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const { toast } = useToast();

  const saveMoodMutation = useMutation({
    mutationFn: async (moodData: InsertMood) => {
      const res = await apiRequest("POST", "/api/moods", moodData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/moods"] });
      queryClient.invalidateQueries({ queryKey: ["/api/moods/latest"] });
      toast({
        title: "Mood recorded",
        description: "Your mood has been saved successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to record mood",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleMoodSelection = (mood: string) => {
    setSelectedMood(mood);
    
    // Save mood to database
    saveMoodMutation.mutate({
      userId,
      mood,
      note: "",
    });
    
    // Call the optional callback
    if (onMoodSelected) {
      onMoodSelected(mood);
    }
  };

  return (
    <section className="mb-10 animate-slide-up">
      <div className="bg-white rounded-2xl shadow-md p-6">
        <h2 className="text-xl font-semibold font-quicksand mb-4">How are you feeling today?</h2>
        <div className="flex flex-wrap gap-3 justify-center md:justify-start">
          {moodOptions.map((mood) => (
            <button
              key={mood.value}
              onClick={() => handleMoodSelection(mood.value)}
              className={`mood-btn flex flex-col items-center p-3 rounded-xl transition-all duration-200 btn-hover-effect ${
                selectedMood === mood.value ? "bg-background" : "hover:bg-background"
              }`}
            >
              <div className="text-3xl mb-2">{mood.emoji}</div>
              <span className="text-sm">{mood.label}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
