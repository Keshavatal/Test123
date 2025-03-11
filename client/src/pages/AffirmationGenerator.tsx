
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../lib/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Label } from '../components/ui/label';
import { HeartIcon, Share2Icon, RefreshCw, Star, Copy } from 'lucide-react';
import { useToast } from '../components/ui/use-toast';
import Confetti from 'react-confetti';

interface Affirmation {
  id: number;
  userId: number;
  content: string;
  category: string;
  favorite: boolean;
  createdAt: string;
}

export default function AffirmationGenerator() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [challenge, setChallenge] = useState('');
  const [focus, setFocus] = useState('confidence');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedAffirmation, setGeneratedAffirmation] = useState<Affirmation | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  
  // Fetch affirmations
  const { data: affirmations = [], isLoading } = useQuery({
    queryKey: ['/api/affirmations'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/affirmations');
      return response;
    },
    enabled: !!user
  });
  
  // Generate affirmation mutation
  const generateMutation = useMutation({
    mutationFn: async (data: any) => {
      setIsGenerating(true);
      return apiRequest('POST', '/api/affirmations/generate', data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/affirmations'] });
      setGeneratedAffirmation(data);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
      toast({
        title: "Affirmation generated",
        description: "Your personalized affirmation is ready.",
      });
      setIsGenerating(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate affirmation.",
        variant: "destructive"
      });
      setIsGenerating(false);
    }
  });
  
  // Toggle favorite mutation
  const toggleFavoriteMutation = useMutation({
    mutationFn: async ({ id, favorite }: { id: number, favorite: boolean }) => {
      return apiRequest('PUT', `/api/affirmations/${id}`, { favorite });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/affirmations'] });
      toast({
        title: "Updated",
        description: "Affirmation updated successfully.",
      });
    }
  });
  
  // Delete affirmation mutation
  const deleteAffirmationMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/affirmations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/affirmations'] });
      toast({
        title: "Deleted",
        description: "Affirmation deleted successfully.",
      });
    }
  });
  
  // Handle generate affirmation
  const handleGenerateAffirmation = () => {
    if (!challenge) {
      toast({
        title: "Error",
        description: "Please describe the challenge you're facing.",
        variant: "destructive"
      });
      return;
    }
    
    generateMutation.mutate({ challenge, focus });
  };
  
  // Handle toggle favorite
  const handleToggleFavorite = (affirmation: Affirmation) => {
    toggleFavoriteMutation.mutate({
      id: affirmation.id,
      favorite: !affirmation.favorite
    });
  };
  
  // Handle copy to clipboard
  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Affirmation copied to clipboard.",
    });
  };
  
  // Filter favorite affirmations
  const favoriteAffirmations = affirmations.filter((a: Affirmation) => a.favorite);
  
  // Group affirmations by category
  const affirmationsByCategory = affirmations.reduce((acc: Record<string, Affirmation[]>, affirmation: Affirmation) => {
    const category = affirmation.category || 'General';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(affirmation);
    return acc;
  }, {});
  
  return (
    <div className="container py-8">
      {showConfetti && <Confetti width={window.innerWidth} height={window.innerHeight} recycle={false} />}
      
      <h1 className="text-2xl font-bold mb-6">Affirmation Generator</h1>
      
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Generate a Personalized Affirmation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="challenge">What challenge are you facing?</Label>
              <Input
                id="challenge"
                value={challenge}
                onChange={(e) => setChallenge(e.target.value)}
                placeholder="E.g., anxiety, self-doubt, procrastination"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="focus">What would you like to focus on?</Label>
              <Select value={focus} onValueChange={setFocus}>
                <SelectTrigger id="focus">
                  <SelectValue placeholder="Select focus area" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="confidence">Confidence</SelectItem>
                  <SelectItem value="calm">Calmness</SelectItem>
                  <SelectItem value="motivation">Motivation</SelectItem>
                  <SelectItem value="self-love">Self-Love</SelectItem>
                  <SelectItem value="growth">Growth</SelectItem>
                  <SelectItem value="resilience">Resilience</SelectItem>
                  <SelectItem value="happiness">Happiness</SelectItem>
                  <SelectItem value="forgiveness">Forgiveness</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handleGenerateAffirmation} 
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate Affirmation"
              )}
            </Button>
          </CardFooter>
        </Card>
        
        {generatedAffirmation && (
          <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-center text-lg">Your Affirmation</CardTitle>
            </CardHeader>
            <CardContent>
              <blockquote className="text-center italic text-xl font-medium text-gray-900 px-4 py-8">
                "{generatedAffirmation.content}"
              </blockquote>
            </CardContent>
            <CardFooter className="flex justify-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleToggleFavorite(generatedAffirmation)}
              >
                <HeartIcon className={`h-4 w-4 mr-1 ${generatedAffirmation.favorite ? 'text-red-500 fill-red-500' : ''}`} />
                {generatedAffirmation.favorite ? 'Favorited' : 'Favorite'}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopyToClipboard(generatedAffirmation.content)}
              >
                <Copy className="h-4 w-4 mr-1" />
                Copy
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
      
      {favoriteAffirmations.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <Star className="h-5 w-5 text-yellow-500 mr-2" />
            Favorite Affirmations
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {favoriteAffirmations.map((affirmation: Affirmation) => (
              <Card key={affirmation.id} className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
                <CardContent className="pt-6">
                  <blockquote className="italic text-gray-800">
                    "{affirmation.content}"
                  </blockquote>
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleToggleFavorite(affirmation)}
                  >
                    <HeartIcon className="h-4 w-4 text-red-500 fill-red-500" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopyToClipboard(affirmation.content)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      )}
      
      {Object.keys(affirmationsByCategory).length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Your Affirmation Library</h2>
          
          {Object.entries(affirmationsByCategory).map(([category, categoryAffirmations]) => (
            <div key={category} className="mb-6">
              <h3 className="text-lg font-semibold mb-3 capitalize">{category}</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryAffirmations.map((affirmation: Affirmation) => (
                  <Card key={affirmation.id} className={affirmation.favorite ? "border-yellow-300" : ""}>
                    <CardContent className="pt-6">
                      <blockquote className="italic text-gray-800">
                        "{affirmation.content}"
                      </blockquote>
                    </CardContent>
                    <CardFooter className="flex justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleToggleFavorite(affirmation)}
                      >
                        <HeartIcon className={`h-4 w-4 ${affirmation.favorite ? 'text-red-500 fill-red-500' : ''}`} />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyToClipboard(affirmation.content)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
