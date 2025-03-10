import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { Link } from 'wouter';

interface Challenge {
  title: string;
  description: string;
  xpReward: number;
  exerciseType: string;
  link: string;
  duration: number;
}

export default function DailyChallengeCard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAccepted, setIsAccepted] = useState(false);

  // Generate a pseudo-random challenge based on the day
  const getDailyChallenge = (): Challenge => {
    const challenges = [
      {
        title: "Mindfulness Session",
        description: "Complete a 5-minute mindfulness session to improve focus and reduce stress.",
        xpReward: 50,
        exerciseType: "mindfulness",
        link: "/exercises/mindfulness",
        duration: 5
      },
      {
        title: "Cognitive Restructuring",
        description: "Challenge negative thoughts with this cognitive restructuring exercise.",
        xpReward: 40,
        exerciseType: "cognitive",
        link: "/exercises/cognitive",
        duration: 5
      },
      {
        title: "Gratitude Practice",
        description: "Write down three things you're grateful for today.",
        xpReward: 30,
        exerciseType: "gratitude",
        link: "/exercises/gratitude",
        duration: 3
      },
      {
        title: "Deep Breathing",
        description: "Practice deep breathing for 3 minutes to reduce anxiety and increase calm.",
        xpReward: 25,
        exerciseType: "breathing",
        link: "/exercises/breathing",
        duration: 3
      }
    ];
    
    // Use the current date to select a challenge
    const date = new Date();
    const day = date.getDate();
    const index = day % challenges.length;
    
    return challenges[index];
  };

  const challenge = getDailyChallenge();

  const acceptChallengeMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/exercises', {
        type: challenge.exerciseType,
        duration: challenge.duration * 60, // Convert to seconds
        notes: `Daily challenge: ${challenge.title}`,
        xpEarned: challenge.xpReward
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/exercises'] });
      setIsAccepted(true);
      
      toast({
        title: "Challenge accepted!",
        description: `You've earned ${challenge.xpReward} XP for accepting the daily challenge.`,
      });
    },
    onError: () => {
      toast({
        title: "Error accepting challenge",
        description: "There was a problem recording your challenge. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleAcceptChallenge = () => {
    if (user) {
      acceptChallengeMutation.mutate();
    } else {
      toast({
        title: "Login required",
        description: "Please log in to accept challenges.",
        variant: "destructive",
      });
    }
  };

  return (
    <section className="bg-gradient-to-r from-primary to-accent rounded-2xl shadow-md p-6 text-white">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-quicksand font-bold">Daily Challenge</h3>
        <span className="bg-white bg-opacity-30 text-white text-xs rounded-full px-3 py-1 font-quicksand">
          +{challenge.xpReward} XP
        </span>
      </div>
      <p className="mb-4">{challenge.description}</p>
      
      {isAccepted ? (
        <Link href={challenge.link}>
          <Button className="bg-white text-primary font-quicksand font-medium hover:bg-opacity-90 w-full">
            Start Exercise <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      ) : (
        <Button 
          className="bg-white text-primary font-quicksand font-medium hover:bg-opacity-90 w-full"
          onClick={handleAcceptChallenge}
          disabled={acceptChallengeMutation.isPending}
        >
          Accept Challenge <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      )}
    </section>
  );
}
