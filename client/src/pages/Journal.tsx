import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, parseISO } from "date-fns";
import { Loader2, BookOpen, PlusCircle, Calendar, Edit3 } from "lucide-react";

// Journal form schema
const journalFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Journal content is required"),
  mood: z.string().optional(),
});

type JournalFormData = z.infer<typeof journalFormSchema>;

interface Journal {
  id: number;
  userId: number;
  title: string;
  content: string;
  mood?: string;
  createdAt: string;
}

export default function Journal() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeJournal, setActiveJournal] = useState<Journal | null>(null);
  
  const { data: journals, isLoading: journalsLoading } = useQuery<Journal[]>({
    queryKey: ['/api/journals'],
    enabled: !!user
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      setLocation('/login');
    }
  }, [user, authLoading, setLocation]);

  const form = useForm<JournalFormData>({
    resolver: zodResolver(journalFormSchema),
    defaultValues: {
      title: "",
      content: "",
      mood: "",
    }
  });

  // Reset form when activeJournal changes
  useEffect(() => {
    if (activeJournal) {
      form.reset({
        title: activeJournal.title,
        content: activeJournal.content,
        mood: activeJournal.mood || "",
      });
    } else {
      form.reset({
        title: "",
        content: "",
        mood: "",
      });
    }
  }, [activeJournal, form]);

  const createJournalMutation = useMutation({
    mutationFn: async (data: JournalFormData) => {
      return apiRequest('POST', '/api/journals', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/journals'] });
      
      toast({
        title: "Journal entry saved!",
        description: "Your thoughts have been recorded.",
      });
      
      form.reset({
        title: "",
        content: "",
        mood: "",
      });
      
      setActiveJournal(null);
    },
    onError: () => {
      toast({
        title: "Error saving journal",
        description: "There was a problem saving your journal entry. Please try again.",
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: JournalFormData) => {
    if (user) {
      createJournalMutation.mutate(data);
    }
  };

  const handleViewJournal = (journal: Journal) => {
    setActiveJournal(journal);
  };

  const handleNewJournal = () => {
    setActiveJournal(null);
    form.reset({
      title: "",
      content: "",
      mood: "",
    });
  };

  if (authLoading) {
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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <div>
              <h1 className="text-3xl font-quicksand font-bold mb-2">Journal</h1>
              <p className="text-muted-foreground">
                Record your thoughts, feelings, and reflections to track your mental wellness journey
              </p>
            </div>
            
            <Button 
              onClick={handleNewJournal}
              className="mt-4 md:mt-0"
            >
              <PlusCircle className="mr-2 h-4 w-4" /> New Entry
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Journal List */}
            <div className="md:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BookOpen className="h-5 w-5 mr-2" /> Your Entries
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {journalsLoading ? (
                    <div className="flex justify-center p-4">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : journals && journals.length > 0 ? (
                    <div className="space-y-4">
                      {journals.map((journal) => (
                        <div 
                          key={journal.id}
                          className={`p-3 rounded-lg cursor-pointer transition-colors ${activeJournal?.id === journal.id ? 'bg-primary/20' : 'hover:bg-muted'}`}
                          onClick={() => handleViewJournal(journal)}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <h3 className="font-quicksand font-medium">{journal.title}</h3>
                            <span className="text-xs bg-accent px-2 py-0.5 rounded-full">
                              {journal.mood || 'No mood'}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mb-1">
                            {format(parseISO(journal.createdAt), 'MMMM d, yyyy')}
                          </p>
                          <p className="text-sm line-clamp-2">{journal.content}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">No journal entries yet</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Start writing to track your thoughts and feelings
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            {/* Journal Form */}
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>
                    {activeJournal ? (
                      <div className="flex items-center">
                        <Edit3 className="h-5 w-5 mr-2" /> View Journal Entry
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <PlusCircle className="h-5 w-5 mr-2" /> New Journal Entry
                      </div>
                    )}
                  </CardTitle>
                  <CardDescription>
                    {activeJournal 
                      ? `Written on ${format(parseISO(activeJournal.createdAt), 'MMMM d, yyyy')}`
                      : "Write down your thoughts and feelings to track your mental wellness"
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Title</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Give your entry a title" 
                                {...field} 
                                readOnly={!!activeJournal}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="mood"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Current Mood (Optional)</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value} 
                              disabled={!!activeJournal}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="How are you feeling?" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="happy">Happy</SelectItem>
                                <SelectItem value="calm">Calm</SelectItem>
                                <SelectItem value="anxious">Anxious</SelectItem>
                                <SelectItem value="sad">Sad</SelectItem>
                                <SelectItem value="frustrated">Frustrated</SelectItem>
                                <SelectItem value="grateful">Grateful</SelectItem>
                                <SelectItem value="reflective">Reflective</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="content"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Journal Entry</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Write your thoughts here..." 
                                className="min-h-40" 
                                {...field} 
                                readOnly={!!activeJournal}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {!activeJournal && (
                        <Button 
                          type="submit" 
                          className="w-full"
                          disabled={createJournalMutation.isPending}
                        >
                          {createJournalMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                              Saving...
                            </>
                          ) : "Save Journal Entry"}
                        </Button>
                      )}
                    </form>
                  </Form>
                </CardContent>
                {activeJournal && (
                  <CardFooter>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={handleNewJournal}
                    >
                      <PlusCircle className="mr-2 h-4 w-4" /> Write New Entry
                    </Button>
                  </CardFooter>
                )}
              </Card>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
