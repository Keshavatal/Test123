
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../lib/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Progress } from '../components/ui/progress';
import { useToast } from '../components/ui/use-toast';
import { Trash, CheckCircle, Plus, Calendar } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '../components/ui/dialog';
import { format, parseISO } from 'date-fns';

interface Goal {
  id: number;
  userId: number;
  title: string;
  description?: string;
  targetDate?: string;
  completed: boolean;
  progress: number;
  createdAt: string;
}

export default function Goals() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    targetDate: ''
  });
  
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [progressValue, setProgressValue] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  
  // Fetch goals
  const { data: goals = [], isLoading } = useQuery({
    queryKey: ['/api/goals'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/goals');
      return response;
    },
    enabled: !!user
  });
  
  // Create goal mutation
  const createGoalMutation = useMutation({
    mutationFn: async (goalData: any) => {
      return apiRequest('POST', '/api/goals', goalData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/goals'] });
      toast({
        title: "Goal created",
        description: "Your goal has been created successfully.",
      });
      setNewGoal({
        title: '',
        description: '',
        targetDate: ''
      });
      setOpenDialog(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create goal.",
        variant: "destructive"
      });
    }
  });
  
  // Update goal mutation
  const updateGoalMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: any }) => {
      return apiRequest('PUT', `/api/goals/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/goals'] });
      toast({
        title: "Goal updated",
        description: "Your goal has been updated successfully.",
      });
      setEditingGoal(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update goal.",
        variant: "destructive"
      });
    }
  });
  
  // Delete goal mutation
  const deleteGoalMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/goals/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/goals'] });
      toast({
        title: "Goal deleted",
        description: "Your goal has been deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete goal.",
        variant: "destructive"
      });
    }
  });
  
  // Handle create goal
  const handleCreateGoal = () => {
    if (!newGoal.title.trim()) {
      toast({
        title: "Error",
        description: "Goal title is required.",
        variant: "destructive"
      });
      return;
    }
    
    createGoalMutation.mutate(newGoal);
  };
  
  // Handle update goal
  const handleUpdateGoal = () => {
    if (!editingGoal) return;
    
    updateGoalMutation.mutate({
      id: editingGoal.id,
      data: {
        title: editingGoal.title,
        description: editingGoal.description,
        targetDate: editingGoal.targetDate,
        progress: progressValue
      }
    });
  };
  
  // Handle complete goal
  const handleCompleteGoal = (goal: Goal) => {
    updateGoalMutation.mutate({
      id: goal.id,
      data: {
        completed: true,
        progress: 100
      }
    });
  };
  
  // Set up edit mode
  useEffect(() => {
    if (editingGoal) {
      setProgressValue(editingGoal.progress);
    }
  }, [editingGoal]);
  
  // Format date for display
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'No date set';
    try {
      return format(parseISO(dateStr), 'MMM d, yyyy');
    } catch {
      return 'Invalid date';
    }
  };
  
  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Goals</h1>
        
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700">
              <Plus className="mr-2 h-4 w-4" /> New Goal
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Goal</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Goal Title</Label>
                <Input
                  id="title"
                  value={newGoal.title}
                  onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                  placeholder="Enter goal title"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={newGoal.description}
                  onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                  placeholder="Describe your goal..."
                  rows={3}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="target-date">Target Date (Optional)</Label>
                <Input
                  id="target-date"
                  type="date"
                  value={newGoal.targetDate}
                  onChange={(e) => setNewGoal({ ...newGoal, targetDate: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={handleCreateGoal} className="bg-green-600 hover:bg-green-700">
                Create Goal
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      {isLoading ? (
        <div className="text-center py-10">Loading goals...</div>
      ) : goals.length === 0 ? (
        <Card>
          <CardContent className="text-center py-10">
            <p className="text-gray-500 mb-4">You haven't set any goals yet.</p>
            <Button onClick={() => setOpenDialog(true)} className="bg-green-600 hover:bg-green-700">
              <Plus className="mr-2 h-4 w-4" /> Create Your First Goal
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {goals.map((goal: Goal) => (
            <Card key={goal.id} className={goal.completed ? "border-green-500" : ""}>
              <CardHeader className="pb-2">
                <CardTitle className="flex justify-between items-start">
                  <span className={goal.completed ? "line-through text-green-600" : ""}>
                    {goal.title}
                  </span>
                  <div className="flex space-x-2">
                    {!goal.completed && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleCompleteGoal(goal)}
                        title="Mark as completed"
                      >
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </Button>
                    )}
                    
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => deleteGoalMutation.mutate(goal.id)}
                      title="Delete goal"
                    >
                      <Trash className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </CardTitle>
                {goal.targetDate && (
                  <div className="text-sm text-gray-500 flex items-center mt-1">
                    <Calendar className="h-3 w-3 mr-1" /> {formatDate(goal.targetDate)}
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {goal.description && (
                  <p className="text-gray-600 mb-4 text-sm">{goal.description}</p>
                )}
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{goal.progress}%</span>
                  </div>
                  <Progress value={goal.progress} className="h-2" />
                </div>
              </CardContent>
              <CardFooter>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="w-full" 
                      onClick={() => setEditingGoal(goal)}
                      disabled={goal.completed}
                    >
                      Update Progress
                    </Button>
                  </DialogTrigger>
                  {editingGoal && (
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Update Goal Progress</DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="edit-title">Goal Title</Label>
                          <Input
                            id="edit-title"
                            value={editingGoal.title}
                            onChange={(e) => setEditingGoal({ ...editingGoal, title: e.target.value })}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="edit-description">Description</Label>
                          <Textarea
                            id="edit-description"
                            value={editingGoal.description || ''}
                            onChange={(e) => setEditingGoal({ ...editingGoal, description: e.target.value })}
                            rows={3}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="edit-target-date">Target Date</Label>
                          <Input
                            id="edit-target-date"
                            type="date"
                            value={editingGoal.targetDate || ''}
                            onChange={(e) => setEditingGoal({ ...editingGoal, targetDate: e.target.value })}
                          />
                        </div>
                        <div className="grid gap-2">
                          <div className="flex justify-between">
                            <Label htmlFor="progress">Progress: {progressValue}%</Label>
                          </div>
                          <Input
                            id="progress"
                            type="range"
                            min="0"
                            max="100"
                            value={progressValue}
                            onChange={(e) => setProgressValue(parseInt(e.target.value))}
                            className="w-full"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <DialogClose asChild>
                          <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button onClick={handleUpdateGoal} className="bg-green-600 hover:bg-green-700">
                          Save Changes
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  )}
                </Dialog>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
