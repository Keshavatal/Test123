import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { format, parseISO, subDays } from "date-fns";
import { 
  LineChart, 
  Line, 
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend 
} from "recharts";
import { 
  TrendingUp, 
  Calendar, 
  Activity, 
  Award, 
  Check,
  Heart,
  Clock,
  Smile,
  Frown,
  Meh,
  CloudRain,
  Zap
} from "lucide-react";

export default function ProgressPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      setLocation('/login');
    }
  }, [user, authLoading, setLocation]);

  const { data: moods, isLoading: moodsLoading } = useQuery({
    queryKey: ['/api/moods'],
    enabled: !!user
  });

  const { data: exercises, isLoading: exercisesLoading } = useQuery({
    queryKey: ['/api/exercises'],
    enabled: !!user
  });

  const { data: assessment, isLoading: assessmentLoading } = useQuery({
    queryKey: ['/api/assessment'],
    enabled: !!user
  });

  const { data: achievements, isLoading: achievementsLoading } = useQuery({
    queryKey: ['/api/achievements'],
    enabled: !!user
  });

  // Calculate overall progress percentage
  const calculateOverallProgress = () => {
    if (!user || !assessment) return 0;
    
    // Base progress on assessment score
    let progress = assessment.score;
    
    // Adjust based on completed exercises
    if (exercises && exercises.length > 0) {
      // Each completed exercise adds a bit to progress
      const exerciseContribution = Math.min(exercises.length * 2, 20);
      progress += exerciseContribution;
    }
    
    // Cap at 100%
    return Math.min(progress, 100);
  };

  // Generate mood distribution data
  const getMoodDistribution = () => {
    if (!moods || moods.length === 0) return [];
    
    const distribution: Record<string, number> = {
      happy: 0,
      calm: 0,
      neutral: 0,
      anxious: 0,
      sad: 0
    };
    
    moods.forEach(mood => {
      if (distribution[mood.mood] !== undefined) {
        distribution[mood.mood]++;
      }
    });
    
    return Object.keys(distribution).map(mood => ({
      name: mood.charAt(0).toUpperCase() + mood.slice(1),
      value: distribution[mood]
    }));
  };

  // Generate exercise type distribution data
  const getExerciseTypeDistribution = () => {
    if (!exercises || exercises.length === 0) return [];
    
    const distribution: Record<string, number> = {
      cognitive: 0,
      breathing: 0,
      gratitude: 0,
      mindfulness: 0
    };
    
    exercises.forEach(exercise => {
      if (distribution[exercise.type] !== undefined) {
        distribution[exercise.type]++;
      }
    });
    
    return Object.keys(distribution).map(type => ({
      name: type.charAt(0).toUpperCase() + type.slice(1),
      value: distribution[type]
    }));
  };

  // Generate mood trend data
  const getMoodTrendData = () => {
    if (!moods || moods.length === 0) return [];
    
    // Group moods by day
    const moodsByDay: Record<string, { total: number, count: number }> = {};
    
    moods.forEach(mood => {
      const day = format(parseISO(mood.createdAt), 'yyyy-MM-dd');
      
      if (!moodsByDay[day]) {
        moodsByDay[day] = { total: 0, count: 0 };
      }
      
      moodsByDay[day].total += mood.intensity;
      moodsByDay[day].count++;
    });
    
    // Create data for last 7 days
    const result = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = subDays(today, i);
      const day = format(date, 'yyyy-MM-dd');
      const displayDay = format(date, 'EEE');
      
      if (moodsByDay[day]) {
        const avgMood = moodsByDay[day].total / moodsByDay[day].count;
        result.push({
          day: displayDay,
          mood: avgMood
        });
      } else {
        result.push({
          day: displayDay,
          mood: 0
        });
      }
    }
    
    return result;
  };

  // Generate exercise trend data
  const getExerciseTrendData = () => {
    if (!exercises || exercises.length === 0) return [];
    
    // Group exercises by day
    const exercisesByDay: Record<string, { count: number, duration: number }> = {};
    
    exercises.forEach(exercise => {
      const day = format(parseISO(exercise.createdAt), 'yyyy-MM-dd');
      
      if (!exercisesByDay[day]) {
        exercisesByDay[day] = { count: 0, duration: 0 };
      }
      
      exercisesByDay[day].count++;
      exercisesByDay[day].duration += exercise.duration / 60; // Convert to minutes
    });
    
    // Create data for last 7 days
    const result = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = subDays(today, i);
      const day = format(date, 'yyyy-MM-dd');
      const displayDay = format(date, 'EEE');
      
      if (exercisesByDay[day]) {
        result.push({
          day: displayDay,
          count: exercisesByDay[day].count,
          duration: Math.round(exercisesByDay[day].duration)
        });
      } else {
        result.push({
          day: displayDay,
          count: 0,
          duration: 0
        });
      }
    }
    
    return result;
  };

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-md shadow-md text-sm">
          <p className="font-quicksand font-medium mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={`item-${index}`} className="text-xs" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const moodColors = ["#98FF98", "#7CB9E8", "#A9A9A9", "#FFD700", "#ADD8E6"];
  const exerciseColors = ["#FF8C84", "#7CB9E8", "#98FF98", "#E6E6FA"];

  if (authLoading || moodsLoading || exercisesLoading || assessmentLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg font-quicksand">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const progressPercentage = calculateOverallProgress();
  const moodDistribution = getMoodDistribution();
  const exerciseTypeDistribution = getExerciseTypeDistribution();
  const moodTrendData = getMoodTrendData();
  const exerciseTrendData = getExerciseTrendData();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-quicksand font-bold mb-2">Your Progress</h1>
          <p className="text-lg text-muted-foreground">
            Track your mental wellness journey and see how far you've come
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Overall Progress Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-lg">
                <TrendingUp className="mr-2 h-5 w-5 text-primary" />
                Overall Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-quicksand font-semibold mb-2">{progressPercentage}%</div>
              <Progress value={progressPercentage} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">Based on assessment and completed exercises</p>
            </CardContent>
          </Card>
          
          {/* Streak Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-lg">
                <Zap className="mr-2 h-5 w-5 text-secondary" />
                Daily Streak
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-quicksand font-semibold mb-2">{user.streak} days</div>
              <Progress value={(user.streak / 10) * 100} className="h-2 bg-muted" />
              <p className="text-xs text-muted-foreground mt-2">Keep it going to earn more achievements!</p>
            </CardContent>
          </Card>
          
          {/* XP Points Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-lg">
                <Award className="mr-2 h-5 w-5 text-primary" />
                XP Points
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-quicksand font-semibold mb-2">{user.xpPoints} XP</div>
              <Progress 
                value={(user.xpPoints % (user.level * 100)) / (user.level * 100) * 100} 
                className="h-2" 
              />
              <p className="text-xs text-muted-foreground mt-2">Level {user.level} • {(user.level * 100) - (user.xpPoints % (user.level * 100))} XP to next level</p>
            </CardContent>
          </Card>
          
          {/* Exercises Completed Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-lg">
                <Activity className="mr-2 h-5 w-5 text-accent" />
                Exercises Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-quicksand font-semibold mb-2">{exercises?.length || 0}</div>
              <Progress value={exercises ? Math.min((exercises.length / 20) * 100, 100) : 0} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">
                {exercises && exercises.length > 0 
                  ? `Last exercise: ${format(parseISO(exercises[0].createdAt), 'MMM d')}`
                  : 'No exercises completed yet'
                }
              </p>
            </CardContent>
          </Card>
        </div>
        
        <Tabs defaultValue="trends" className="mb-8">
          <TabsList className="mb-6">
            <TabsTrigger value="trends" className="flex items-center">
              <TrendingUp className="h-4 w-4 mr-2" /> Trends
            </TabsTrigger>
            <TabsTrigger value="moods" className="flex items-center">
              <Smile className="h-4 w-4 mr-2" /> Mood Analytics
            </TabsTrigger>
            <TabsTrigger value="exercises" className="flex items-center">
              <Activity className="h-4 w-4 mr-2" /> Exercise Analytics
            </TabsTrigger>
            <TabsTrigger value="achievements" className="flex items-center">
              <Award className="h-4 w-4 mr-2" /> Achievements
            </TabsTrigger>
          </TabsList>
          
          {/* Trends Tab */}
          <TabsContent value="trends">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Smile className="h-5 w-5 mr-2" /> Mood Trends
                  </CardTitle>
                  <CardDescription>How your mood has changed over the last 7 days</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    {moodTrendData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={moodTrendData} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                          <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" />
                          <YAxis stroke="hsl(var(--muted-foreground))" domain={[0, 5]} />
                          <Tooltip content={<CustomTooltip />} />
                          <Line
                            type="monotone"
                            dataKey="mood"
                            name="Mood Score"
                            stroke="hsl(var(--primary))"
                            strokeWidth={2}
                            activeDot={{ r: 8 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <Smile className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground">No mood data recorded yet</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Track your mood daily to see trends
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Activity className="h-5 w-5 mr-2" /> Exercise Trends
                  </CardTitle>
                  <CardDescription>Your exercise activity over the last 7 days</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    {exerciseTrendData.length > 0 && exerciseTrendData.some(d => d.count > 0) ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={exerciseTrendData} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                          <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" />
                          <YAxis stroke="hsl(var(--muted-foreground))" />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend />
                          <Bar
                            dataKey="count"
                            name="Exercises"
                            fill="hsl(var(--primary))"
                            barSize={20}
                          />
                          <Bar
                            dataKey="duration"
                            name="Minutes"
                            fill="hsl(var(--secondary))"
                            barSize={20}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground">No exercise data recorded yet</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Complete exercises to see your trends
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Mood Analytics Tab */}
          <TabsContent value="moods">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Smile className="h-5 w-5 mr-2" /> Mood Distribution
                  </CardTitle>
                  <CardDescription>Breakdown of your recorded moods</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    {moodDistribution.length > 0 && moodDistribution.some(d => d.value > 0) ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={moodDistribution}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {moodDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={moodColors[index % moodColors.length]} />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomTooltip />} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <Smile className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground">No mood data recorded yet</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Track your mood daily to see distribution
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Smile className="h-5 w-5 mr-2" /> Mood Insights
                  </CardTitle>
                  <CardDescription>Understanding your emotional patterns</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="flex items-start space-x-4">
                      <div className="bg-primary/10 rounded-full p-3">
                        <Calendar className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-quicksand font-semibold mb-1">Tracking Consistency</h3>
                        <p className="text-sm text-muted-foreground">
                          {moods && moods.length > 0 
                            ? `You've tracked your mood ${moods.length} times. Keep it up!`
                            : "You haven't tracked your mood yet. Start today!"
                          }
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-4">
                      <div className="bg-secondary/10 rounded-full p-3">
                        <Smile className="h-6 w-6 text-secondary" />
                      </div>
                      <div>
                        <h3 className="font-quicksand font-semibold mb-1">Most Common Mood</h3>
                        <p className="text-sm text-muted-foreground">
                          {moodDistribution.length > 0 
                            ? `Your most common mood is ${moodDistribution.sort((a, b) => b.value - a.value)[0].name}`
                            : "Start tracking to discover your most common mood"
                          }
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-4">
                      <div className="bg-accent/10 rounded-full p-3">
                        <TrendingUp className="h-6 w-6 text-accent" />
                      </div>
                      <div>
                        <h3 className="font-quicksand font-semibold mb-1">Mood Improvement</h3>
                        <p className="text-sm text-muted-foreground">
                          {moodTrendData.length > 0 && moodTrendData.some(d => d.mood > 0) 
                            ? "Your mood shows improvement over time. Great job!"
                            : "Not enough data to analyze mood improvement yet"
                          }
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-4">
                      <div className="bg-primary/10 rounded-full p-3">
                        <Activity className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-quicksand font-semibold mb-1">Exercise Impact</h3>
                        <p className="text-sm text-muted-foreground">
                          {exercises && exercises.length > 0 && moods && moods.length > 0
                            ? "Exercises appear to positively impact your mood"
                            : "Complete more exercises to see their impact on your mood"
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Exercise Analytics Tab */}
          <TabsContent value="exercises">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Activity className="h-5 w-5 mr-2" /> Exercise Types
                  </CardTitle>
                  <CardDescription>Breakdown of exercises you've completed</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    {exerciseTypeDistribution.length > 0 && exerciseTypeDistribution.some(d => d.value > 0) ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={exerciseTypeDistribution}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {exerciseTypeDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={exerciseColors[index % exerciseColors.length]} />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomTooltip />} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground">No exercise data recorded yet</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Complete different types of exercises to see distribution
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Clock className="h-5 w-5 mr-2" /> Exercise Insights
                  </CardTitle>
                  <CardDescription>Understanding your exercise patterns</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="flex items-start space-x-4">
                      <div className="bg-primary/10 rounded-full p-3">
                        <Clock className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-quicksand font-semibold mb-1">Total Exercise Time</h3>
                        <p className="text-sm text-muted-foreground">
                          {exercises && exercises.length > 0 
                            ? `You've spent ${Math.round(exercises.reduce((total, ex) => total + ex.duration, 0) / 60)} minutes on exercises`
                            : "You haven't completed any exercises yet"
                          }
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-4">
                      <div className="bg-secondary/10 rounded-full p-3">
                        <Heart className="h-6 w-6 text-secondary" />
                      </div>
                      <div>
                        <h3 className="font-quicksand font-semibold mb-1">Favorite Exercise Type</h3>
                        <p className="text-sm text-muted-foreground">
                          {exerciseTypeDistribution.length > 0 && exerciseTypeDistribution.some(d => d.value > 0) 
                            ? `Your favorite exercise type is ${exerciseTypeDistribution.sort((a, b) => b.value - a.value)[0].name}`
                            : "Complete exercises to discover your favorite type"
                          }
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-4">
                      <div className="bg-accent/10 rounded-full p-3">
                        <Calendar className="h-6 w-6 text-accent" />
                      </div>
                      <div>
                        <h3 className="font-quicksand font-semibold mb-1">Exercise Consistency</h3>
                        <p className="text-sm text-muted-foreground">
                          {exerciseTrendData.filter(d => d.count > 0).length > 0 
                            ? `You've exercised on ${exerciseTrendData.filter(d => d.count > 0).length} of the last 7 days`
                            : "Try to exercise consistently for best results"
                          }
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-4">
                      <div className="bg-primary/10 rounded-full p-3">
                        <Award className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-quicksand font-semibold mb-1">Achievement Progress</h3>
                        <p className="text-sm text-muted-foreground">
                          {exercises && exercises.length > 0 
                            ? `You're making great progress! Keep going to unlock more achievements`
                            : "Complete exercises to earn achievements"
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Achievements Tab */}
          <TabsContent value="achievements">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Award className="h-5 w-5 mr-2" /> Your Achievements
                </CardTitle>
                <CardDescription>Badges and milestones you've earned on your journey</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Mood Master Badge */}
                  <div className={`border rounded-lg p-4 ${achievements?.some(a => a.badgeId === 'mood-master') ? 'bg-primary/10' : 'bg-muted/50'}`}>
                    <div className="flex items-center mb-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-3 ${achievements?.some(a => a.badgeId === 'mood-master') ? 'bg-accent' : 'bg-muted'}`}>
                        <Smile className={`h-6 w-6 ${achievements?.some(a => a.badgeId === 'mood-master') ? 'text-primary' : 'text-muted-foreground/40'}`} />
                      </div>
                      <div>
                        <h3 className="font-quicksand font-semibold">Mood Master</h3>
                        <p className="text-xs text-muted-foreground">Track your mood for 7 consecutive days</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm">
                        {achievements?.some(a => a.badgeId === 'mood-master') 
                          ? <span className="text-primary flex items-center"><Check className="h-4 w-4 mr-1" /> Unlocked</span>
                          : 'Not unlocked yet'
                        }
                      </p>
                      <p className="text-xs">+25 XP</p>
                    </div>
                  </div>
                  
                  {/* 7-Day Streak Badge */}
                  <div className={`border rounded-lg p-4 ${user.streak >= 7 ? 'bg-primary/10' : 'bg-muted/50'}`}>
                    <div className="flex items-center mb-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-3 ${user.streak >= 7 ? 'bg-accent' : 'bg-muted'}`}>
                        <Zap className={`h-6 w-6 ${user.streak >= 7 ? 'text-primary' : 'text-muted-foreground/40'}`} />
                      </div>
                      <div>
                        <h3 className="font-quicksand font-semibold">7-Day Streak</h3>
                        <p className="text-xs text-muted-foreground">Use the app for 7 consecutive days</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm">
                        {user.streak >= 7
                          ? <span className="text-primary flex items-center"><Check className="h-4 w-4 mr-1" /> Unlocked</span>
                          : `Progress: ${user.streak}/7 days`
                        }
                      </p>
                      <p className="text-xs">+30 XP</p>
                    </div>
                  </div>
                  
                  {/* Journal Master Badge */}
                  <div className={`border rounded-lg p-4 ${achievements?.some(a => a.badgeId === 'journal-master') ? 'bg-primary/10' : 'bg-muted/50'}`}>
                    <div className="flex items-center mb-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-3 ${achievements?.some(a => a.badgeId === 'journal-master') ? 'bg-accent' : 'bg-muted'}`}>
                        <BookOpen className={`h-6 w-6 ${achievements?.some(a => a.badgeId === 'journal-master') ? 'text-primary' : 'text-muted-foreground/40'}`} />
                      </div>
                      <div>
                        <h3 className="font-quicksand font-semibold">Journal Master</h3>
                        <p className="text-xs text-muted-foreground">Create 5 journal entries</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm">
                        {achievements?.some(a => a.badgeId === 'journal-master') 
                          ? <span className="text-primary flex items-center"><Check className="h-4 w-4 mr-1" /> Unlocked</span>
                          : 'Not unlocked yet'
                        }
                      </p>
                      <p className="text-xs">+25 XP</p>
                    </div>
                  </div>
                  
                  {/* Mindfulness Badge */}
                  <div className={`border rounded-lg p-4 ${achievements?.some(a => a.badgeId === 'mindfulness') ? 'bg-primary/10' : 'bg-muted/50'}`}>
                    <div className="flex items-center mb-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-3 ${achievements?.some(a => a.badgeId === 'mindfulness') ? 'bg-accent' : 'bg-muted'}`}>
                        <Brain className={`h-6 w-6 ${achievements?.some(a => a.badgeId === 'mindfulness') ? 'text-primary' : 'text-muted-foreground/40'}`} />
                      </div>
                      <div>
                        <h3 className="font-quicksand font-semibold">Mindfulness</h3>
                        <p className="text-xs text-muted-foreground">Complete a mindfulness meditation</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm">
                        {achievements?.some(a => a.badgeId === 'mindfulness') 
                          ? <span className="text-primary flex items-center"><Check className="h-4 w-4 mr-1" /> Unlocked</span>
                          : 'Not unlocked yet'
                        }
                      </p>
                      <p className="text-xs">+20 XP</p>
                    </div>
                  </div>
                  
                  {/* Breath Master Badge */}
                  <div className={`border rounded-lg p-4 ${achievements?.some(a => a.badgeId === 'breath-master') ? 'bg-primary/10' : 'bg-muted/50'}`}>
                    <div className="flex items-center mb-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-3 ${achievements?.some(a => a.badgeId === 'breath-master') ? 'bg-accent' : 'bg-muted'}`}>
                        <Wind className={`h-6 w-6 ${achievements?.some(a => a.badgeId === 'breath-master') ? 'text-primary' : 'text-muted-foreground/40'}`} />
                      </div>
                      <div>
                        <h3 className="font-quicksand font-semibold">Breath Master</h3>
                        <p className="text-xs text-muted-foreground">Complete 3 breathing exercises</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm">
                        {achievements?.some(a => a.badgeId === 'breath-master') 
                          ? <span className="text-primary flex items-center"><Check className="h-4 w-4 mr-1" /> Unlocked</span>
                          : 'Not unlocked yet'
                        }
                      </p>
                      <p className="text-xs">+20 XP</p>
                    </div>
                  </div>
                  
                  {/* CBT Champion Badge */}
                  <div className={`border rounded-lg p-4 ${achievements?.some(a => a.badgeId === 'cbt-champion') ? 'bg-primary/10' : 'bg-muted/50'}`}>
                    <div className="flex items-center mb-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-3 ${achievements?.some(a => a.badgeId === 'cbt-champion') ? 'bg-accent' : 'bg-muted'}`}>
                        <PenLine className={`h-6 w-6 ${achievements?.some(a => a.badgeId === 'cbt-champion') ? 'text-primary' : 'text-muted-foreground/40'}`} />
                      </div>
                      <div>
                        <h3 className="font-quicksand font-semibold">CBT Champion</h3>
                        <p className="text-xs text-muted-foreground">Complete 5 cognitive exercises</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm">
                        {achievements?.some(a => a.badgeId === 'cbt-champion') 
                          ? <span className="text-primary flex items-center"><Check className="h-4 w-4 mr-1" /> Unlocked</span>
                          : 'Not unlocked yet'
                        }
                      </p>
                      <p className="text-xs">+40 XP</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      
      <Footer />
    </div>
  );
}
