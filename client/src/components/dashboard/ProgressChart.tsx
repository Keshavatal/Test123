import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/card";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, subDays, parseISO, isWithinInterval, subMonths } from "date-fns";

type TimeRange = "7days" | "30days" | "90days";

export default function ProgressChart() {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState<TimeRange>("7days");

  const { data: moods, isLoading: isMoodsLoading } = useQuery({
    queryKey: ['/api/moods'],
    enabled: !!user
  });

  const { data: exercises, isLoading: isExercisesLoading } = useQuery({
    queryKey: ['/api/exercises'],
    enabled: !!user
  });

  const getFilteredData = () => {
    if (!moods || !exercises) return [];

    // Define the date range
    const now = new Date();
    let startDate;
    
    switch (timeRange) {
      case "30days":
        startDate = subDays(now, 30);
        break;
      case "90days":
        startDate = subMonths(now, 3);
        break;
      case "7days":
      default:
        startDate = subDays(now, 7);
        break;
    }

    // Filter moods within date range
    const filteredMoods = moods.filter(mood => 
      isWithinInterval(parseISO(mood.createdAt), { start: startDate, end: now })
    );

    // Filter exercises within date range
    const filteredExercises = exercises.filter(exercise => 
      isWithinInterval(parseISO(exercise.createdAt), { start: startDate, end: now })
    );

    // Group by day
    const dateMap = new Map();

    // Add mood data
    filteredMoods.forEach(mood => {
      const day = format(parseISO(mood.createdAt), 'yyyy-MM-dd');
      if (!dateMap.has(day)) {
        dateMap.set(day, {
          date: day,
          moodAvg: 0,
          moodCount: 0,
          exerciseCount: 0,
          exerciseDuration: 0
        });
      }
      
      const entry = dateMap.get(day);
      entry.moodAvg = (entry.moodAvg * entry.moodCount + mood.intensity) / (entry.moodCount + 1);
      entry.moodCount += 1;
    });

    // Add exercise data
    filteredExercises.forEach(exercise => {
      const day = format(parseISO(exercise.createdAt), 'yyyy-MM-dd');
      if (!dateMap.has(day)) {
        dateMap.set(day, {
          date: day,
          moodAvg: 0,
          moodCount: 0,
          exerciseCount: 0,
          exerciseDuration: 0
        });
      }
      
      const entry = dateMap.get(day);
      entry.exerciseCount += 1;
      entry.exerciseDuration += exercise.duration;
    });

    // Convert map to array and sort by date
    let chartData = Array.from(dateMap.values());
    chartData.sort((a, b) => a.date.localeCompare(b.date));

    // Format dates for display
    chartData = chartData.map(item => ({
      ...item,
      dateFormatted: format(parseISO(item.date), 'MMM dd')
    }));

    return chartData;
  };

  const chartData = getFilteredData();
  const isLoading = isMoodsLoading || isExercisesLoading || !user;

  // For customizing tooltips
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-md shadow-md text-sm">
          <p className="font-quicksand font-medium mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={`item-${index}`} style={{ color: entry.color }}>
              {entry.name}: {entry.value.toFixed(1)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="w-full h-64 bg-background rounded-xl p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-quicksand font-medium">Your Wellness Journey</h3>
        <Select 
          value={timeRange} 
          onValueChange={(value) => setTimeRange(value as TimeRange)}
        >
          <SelectTrigger className="w-[180px] h-8 text-sm bg-white">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7days">Last 7 days</SelectItem>
            <SelectItem value="30days">Last 30 days</SelectItem>
            <SelectItem value="90days">Last 3 months</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="w-full h-full flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Loading your progress data...</p>
        </div>
      ) : chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
            <XAxis 
              dataKey="dateFormatted" 
              stroke="hsl(var(--muted-foreground))"
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))" 
              tick={{ fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="moodAvg" 
              name="Mood" 
              stroke="hsl(var(--primary))" 
              activeDot={{ r: 8 }} 
              strokeWidth={2}
            />
            <Line 
              type="monotone" 
              dataKey="exerciseCount" 
              name="Exercises" 
              stroke="hsl(var(--secondary))" 
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-primary opacity-30 mb-2">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
          </svg>
          <p className="text-sm text-muted-foreground">Track your mood and complete exercises to see your progress here</p>
        </div>
      )}
    </Card>
  );
}
