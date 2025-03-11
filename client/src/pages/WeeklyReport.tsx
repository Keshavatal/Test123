
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { format, parseISO } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts';
import { Lightbulb, Clock, Brain, BookOpen, Target } from 'lucide-react';

interface WeeklyReport {
  period: {
    start: string;
    end: string;
  };
  moodData: {
    entries: number;
    average: number | null;
    trend: string;
  };
  exerciseData: {
    count: number;
    totalMinutes: number;
    byType: Record<string, number>;
  };
  journalData: {
    count: number;
  };
  goalData: {
    total: number;
    completed: number;
    inProgress: number;
  };
  insights: string[];
}

export default function WeeklyReport() {
  const { user } = useAuth();
  
  // Fetch weekly report
  const { data: report, isLoading } = useQuery<WeeklyReport>({
    queryKey: ['/api/reports/weekly'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/reports/weekly');
      return response;
    },
    enabled: !!user
  });
  
  // Fetch mood data for chart
  const { data: moodData = [] } = useQuery({
    queryKey: ['/api/moods'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/moods');
      return response;
    },
    enabled: !!user
  });
  
  // Format date
  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), 'MMM d');
    } catch {
      return 'Invalid date';
    }
  };
  
  // Prepare mood chart data
  const moodChartData = moodData
    .filter((mood: any) => {
      if (!report) return false;
      const moodDate = new Date(mood.createdAt);
      const startDate = new Date(report.period.start);
      return moodDate >= startDate;
    })
    .map((mood: any) => ({
      date: formatDate(mood.createdAt),
      value: mood.intensity,
      fullDate: new Date(mood.createdAt)
    }))
    .sort((a: any, b: any) => a.fullDate - b.fullDate);
  
  // Prepare exercise type chart data
  const exerciseTypeChartData = report?.exerciseData.byType
    ? Object.entries(report.exerciseData.byType).map(([name, value]) => ({
        name,
        value
      }))
    : [];
  
  // Prepare goals chart data
  const goalChartData = report?.goalData
    ? [
        { name: 'Completed', value: report.goalData.completed },
        { name: 'In Progress', value: report.goalData.inProgress }
      ]
    : [];
  
  const COLORS = ['#4ade80', '#60a5fa', '#f97316', '#a78bfa', '#fb7185'];
  
  if (isLoading) {
    return (
      <div className="container py-8">
        <h1 className="text-2xl font-bold mb-6">Weekly Mental Health Report</h1>
        <div className="text-center py-10">Loading your weekly report...</div>
      </div>
    );
  }
  
  if (!report) {
    return (
      <div className="container py-8">
        <h1 className="text-2xl font-bold mb-6">Weekly Mental Health Report</h1>
        <Card>
          <CardContent className="text-center py-10">
            <p className="text-gray-500">No report data available. Try tracking more activities.</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-2">Weekly Mental Health Report</h1>
      <p className="text-gray-500 mb-6">
        {formatDate(report.period.start)} - {formatDate(report.period.end)}
      </p>
      
      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center">
              <div className="bg-blue-100 p-3 rounded-full mb-2">
                <Brain className="h-6 w-6 text-blue-600" />
              </div>
              <div className="text-xl font-bold">
                {report.moodData.average !== null 
                  ? report.moodData.average.toFixed(1) + '/5' 
                  : 'N/A'}
              </div>
              <div className="text-sm text-gray-500">Avg. Mood</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center">
              <div className="bg-green-100 p-3 rounded-full mb-2">
                <Clock className="h-6 w-6 text-green-600" />
              </div>
              <div className="text-xl font-bold">
                {report.exerciseData.totalMinutes.toFixed(0)}
              </div>
              <div className="text-sm text-gray-500">Minutes Active</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center">
              <div className="bg-purple-100 p-3 rounded-full mb-2">
                <BookOpen className="h-6 w-6 text-purple-600" />
              </div>
              <div className="text-xl font-bold">
                {report.journalData.count}
              </div>
              <div className="text-sm text-gray-500">Journal Entries</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center">
              <div className="bg-amber-100 p-3 rounded-full mb-2">
                <Target className="h-6 w-6 text-amber-600" />
              </div>
              <div className="text-xl font-bold">
                {report.goalData.completed}/{report.goalData.total}
              </div>
              <div className="text-sm text-gray-500">Goals Completed</div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Mood Trends</CardTitle>
          </CardHeader>
          <CardContent>
            {moodChartData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={moodChartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[1, 5]} />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#4ade80" 
                      strokeWidth={2}
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No mood data available for this week
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Exercise Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {exerciseTypeChartData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={exerciseTypeChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {exerciseTypeChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No exercise data available for this week
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center">
              <Lightbulb className="mr-2 h-5 w-5 text-yellow-500" /> 
              Insights & Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {report.insights.map((insight, index) => (
                <li key={index} className="bg-gray-50 p-3 rounded-md text-sm">
                  {insight}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Goal Progress</CardTitle>
          </CardHeader>
          <CardContent>
            {goalChartData.length > 0 && goalChartData.some(item => item.value > 0) ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={goalChartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" />
                    <Tooltip />
                    <Bar dataKey="value" fill="#4ade80" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No goal data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
