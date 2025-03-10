import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Smile, Flame, BookOpen, Brain, Wind } from 'lucide-react';

interface Badge {
  id: string;
  name: string;
  icon: React.ReactNode;
  isCompleted: boolean;
}

export default function AchievementsSection() {
  const { user } = useAuth();

  const { data: achievements, isLoading: isAchievementsLoading } = useQuery({
    queryKey: ['/api/achievements'],
    enabled: !!user,
  });

  const { data: exercises, isLoading: isExercisesLoading } = useQuery({
    queryKey: ['/api/exercises'],
    enabled: !!user,
  });

  const { data: journals, isLoading: isJournalsLoading } = useQuery({
    queryKey: ['/api/journals'],
    enabled: !!user,
  });

  // Define all possible badges
  const badgesList: Badge[] = [
    {
      id: 'mood-master',
      name: 'Mood Master',
      icon: <Smile className="text-2xl text-primary" />,
      isCompleted: achievements?.some(a => a.badgeId === 'mood-master') || false
    },
    {
      id: '7-day-streak',
      name: '7-Day Streak',
      icon: <Zap className="text-2xl text-primary" />,
      isCompleted: (user?.streak || 0) >= 7
    },
    {
      id: 'journal-master',
      name: 'Journal Master',
      icon: <BookOpen className="text-2xl text-primary" />,
      isCompleted: (journals?.length || 0) >= 5
    },
    {
      id: 'mindfulness',
      name: 'Mindfulness',
      icon: <Brain className="text-2xl text-primary" />,
      isCompleted: exercises?.some(e => e.type === 'mindfulness') || false
    },
    {
      id: 'breath-master',
      name: 'Breath Master',
      icon: <Wind className="text-2xl text-primary" />,
      isCompleted: exercises?.filter(e => e.type === 'breathing')?.length >= 3 || false
    }
  ];

  const isLoading = isAchievementsLoading || isExercisesLoading || isJournalsLoading || !user;

  import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { Smile, BookOpen, Brain, Wind, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// Calculate XP progress for next level
  const calculateXPProgress = () => {
    if (!user) return { currentXP: 0, required: 100, progress: 0 };
    
    const currentXP = user.xpPoints;
    const level = user.level;
    const xpForNextLevel = level * 100; // 100 XP per level
    const xpProgress = (currentXP % xpForNextLevel) / xpForNextLevel * 100;
    
    return {
      currentXP,
      required: xpForNextLevel,
      progress: xpProgress
    };
  };

  const xpInfo = calculateXPProgress();

  if (isLoading) {
    return (
      <Card className="bg-white rounded-2xl shadow-md mb-8">
        <CardContent className="p-6">
          <Skeleton className="h-6 w-1/3 mb-4" />
          <div className="flex flex-wrap gap-3 mb-4">
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} className="w-14 h-14 rounded-full" />
            ))}
          </div>
          <Skeleton className="h-24 w-full rounded-xl" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white rounded-2xl shadow-md mb-8">
      <CardContent className="p-6">
        <h3 className="text-xl font-quicksand font-bold mb-4">Your Achievements</h3>
        <div className="flex flex-wrap gap-3 mb-4">
          {badgesList.map((badge) => (
            <div key={badge.id} className="flex flex-col items-center">
              <div className={`w-14 h-14 rounded-full bg-accent flex items-center justify-center mb-1 relative ${!badge.isCompleted ? 'opacity-40' : ''}`}>
                {badge.icon}
                {badge.isCompleted && (
                  <div className="absolute -right-1 -bottom-1 w-6 h-6 bg-secondary rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white w-3 h-3">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </div>
                )}
              </div>
              <span className={`text-xs font-quicksand text-center ${!badge.isCompleted ? 'opacity-60' : ''}`}>
                {badge.name}
              </span>
            </div>
          ))}
        </div>

        <div className="bg-background rounded-xl p-4">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-quicksand font-medium">Level Progress</h4>
            <span className="text-sm font-quicksand">Level {user?.level || 1}</span>
          </div>
          <Progress value={xpInfo.progress} className="h-2.5" />
          <div className="flex justify-between mt-1">
            <span className="text-xs opacity-70">{user?.xpPoints || 0} XP</span>
            <span className="text-xs opacity-70">{xpInfo.required} XP needed</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
