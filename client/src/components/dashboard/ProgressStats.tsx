import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Flame, Trophy } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface ProgressRing {
  value: number;
  size: number;
  strokeWidth: number;
  circleColor: string;
  progressColor: string;
}

function ProgressRing({ value, size, strokeWidth, circleColor, progressColor }: ProgressRing) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <div className="relative w-16 h-16 mr-4 flex-shrink-0">
      <svg className="progress-ring w-full h-full -rotate-90" viewBox={`0 0 ${size} ${size}`}>
        <circle 
          className="progress-ring__circle" 
          stroke={circleColor} 
          strokeWidth={strokeWidth} 
          fill="transparent" 
          r={radius} 
          cx={size/2} 
          cy={size/2}
        />
        <circle 
          className="progress-ring__circle" 
          stroke={progressColor} 
          strokeWidth={strokeWidth} 
          fill="transparent" 
          r={radius} 
          cx={size/2} 
          cy={size/2}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-quicksand font-semibold text-sm">{value}%</span>
      </div>
    </div>
  );
}

export default function ProgressStats() {
  const { user } = useAuth();
  const [overallProgress, setOverallProgress] = useState(0);

  const { data: exercises, isLoading: isExercisesLoading } = useQuery({
    queryKey: ['/api/exercises'],
    enabled: !!user
  });

  const { data: assessment, isLoading: isAssessmentLoading } = useQuery({
    queryKey: ['/api/assessment'],
    enabled: !!user
  });

  useEffect(() => {
    // Calculate overall progress based on exercises completed and assessment score
    if (user) {
      // This is a simplified calculation - in a real app, you might have a more complex algorithm
      let progress = 0;
      
      // If assessment is completed, start with that score
      if (assessment && assessment.score) {
        progress = assessment.score;
      }
      
      // If exercises are completed, add to progress
      if (exercises && exercises.length > 0) {
        // Each exercise adds a small amount to progress, capped at 75
        const exerciseContribution = Math.min(exercises.length * 5, 75);
        progress = Math.max(progress, exerciseContribution);
      }
      
      setOverallProgress(Math.min(progress, 100));
    }
  }, [user, exercises, assessment]);

  const isLoading = isExercisesLoading || isAssessmentLoading || !user;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="bg-background">
            <CardContent className="p-4">
              <div className="flex items-center">
                <Skeleton className="w-16 h-16 rounded-full mr-4" />
                <div>
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <Card className="bg-background rounded-xl">
        <CardContent className="p-4 flex items-center">
          <ProgressRing 
            value={overallProgress} 
            size={36} 
            strokeWidth={3} 
            circleColor="hsl(var(--accent))"
            progressColor="hsl(var(--primary))"
          />
          <div>
            <h4 className="font-quicksand font-medium text-textColor">Overall Progress</h4>
            <p className="text-sm text-textColor opacity-70">
              {overallProgress > 0 ? `${overallProgress > 5 ? 'Up' : 'Down'} ${Math.abs(5)}% from last week` : 'Just getting started!'}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-background rounded-xl">
        <CardContent className="p-4 flex items-center">
          <div className="w-16 h-16 mr-4 flex-shrink-0 bg-secondary bg-opacity-20 rounded-full flex items-center justify-center">
            <Flame className="h-6 w-6 text-secondary" />
          </div>
          <div>
            <h4 className="font-quicksand font-medium text-textColor">Daily Streak</h4>
            <p className="text-2xl font-quicksand font-bold">{user?.streak || 0} days</p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-background rounded-xl">
        <CardContent className="p-4 flex items-center">
          <div className="w-16 h-16 mr-4 flex-shrink-0 bg-primary bg-opacity-20 rounded-full flex items-center justify-center">
            <Trophy className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h4 className="font-quicksand font-medium text-textColor">XP Points</h4>
            <p className="text-2xl font-quicksand font-bold">{user?.xpPoints || 0} XP</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
