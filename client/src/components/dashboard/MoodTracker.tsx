import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { 
  SmilePlus, 
  SmileIcon, 
  Meh, 
  FrownIcon,
  CloudRain
} from "lucide-react";

type Mood = "happy" | "calm" | "neutral" | "anxious" | "sad";

interface MoodOption {
  id: Mood;
  icon: React.ReactNode;
  label: string;
  bgColor: string;
  intensity: number;
}

export default function MoodTracker() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);

  const moodOptions: MoodOption[] = [
    { 
      id: "happy", 
      icon: <SmilePlus className="text-2xl text-white" />, 
      label: "Happy", 
      bgColor: "bg-[#98FF98]",
      intensity: 5
    },
    { 
      id: "calm", 
      icon: <SmileIcon className="text-2xl text-white" />, 
      label: "Calm", 
      bgColor: "bg-[#7CB9E8]",
      intensity: 4 
    },
    { 
      id: "neutral", 
      icon: <Meh className="text-2xl text-white" />, 
      label: "Neutral", 
      bgColor: "bg-gray-300",
      intensity: 3
    },
    { 
      id: "anxious", 
      icon: <FrownIcon className="text-2xl text-white" />, 
      label: "Anxious", 
      bgColor: "bg-yellow-300",
      intensity: 2
    },
    { 
      id: "sad", 
      icon: <CloudRain className="text-2xl text-white" />, 
      label: "Sad", 
      bgColor: "bg-blue-300",
      intensity: 1
    }
  ];

  const moodMutation = useMutation({
    mutationFn: async (mood: Mood) => {
      const selectedOption = moodOptions.find(option => option.id === mood);
      return apiRequest('POST', '/api/moods', {
        mood,
        intensity: selectedOption?.intensity || 3,
        notes: ''
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/moods'] });
      toast({
        title: "Mood tracked!",
        description: "Thanks for sharing how you're feeling today.",
      });
    },
    onError: () => {
      toast({
        title: "Error tracking mood",
        description: "There was a problem recording your mood. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleSelectMood = (mood: Mood) => {
    setSelectedMood(mood);
    if (user) {
      moodMutation.mutate(mood);
    }
  };

  return (
    <Card className="mt-4 md:mt-0 w-full md:w-auto">
      <CardContent className="pt-6">
        <h3 className="font-quicksand font-semibold mb-3">How are you feeling today?</h3>
        <div className="flex space-x-3 justify-between">
          {moodOptions.map((option) => (
            <button 
              key={option.id}
              className={`mood-btn flex flex-col items-center ${selectedMood === option.id ? 'opacity-100' : 'opacity-70'} hover:opacity-100 transition duration-300`} 
              onClick={() => handleSelectMood(option.id)}
              disabled={moodMutation.isPending}
            >
              <div className={`w-12 h-12 rounded-full ${option.bgColor} flex items-center justify-center mb-2`}>
                {option.icon}
              </div>
              <span className="text-sm font-quicksand">{option.label}</span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
