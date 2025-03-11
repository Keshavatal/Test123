
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'wouter';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import GuidedBreathing from '../components/breathing/GuidedBreathing';

export default function GuidedBreathingExercise() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  
  const handleComplete = () => {
    // Optional navigation or other actions after completion
  };
  
  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">Guided Breathing Exercise</h1>
      
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Exercise</CardTitle>
          </CardHeader>
          <CardContent>
            <GuidedBreathing onComplete={handleComplete} />
          </CardContent>
          <CardFooter>
            <Button 
              variant="outline" 
              onClick={() => setLocation('/exercises')}
              className="w-full"
            >
              Back to Exercises
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Benefits of Breathing Exercises</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              Breathing exercises are powerful tools for mental wellness. They help activate the parasympathetic nervous system, which controls relaxation.
            </p>
            
            <h4 className="font-semibold">Health Benefits:</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>Reduces stress and anxiety</li>
              <li>Lowers blood pressure and heart rate</li>
              <li>Improves concentration and focus</li>
              <li>Helps manage pain</li>
              <li>Improves sleep quality</li>
              <li>Enhances emotional regulation</li>
              <li>Boosts immune function</li>
            </ul>
            
            <h4 className="font-semibold">When to Practice:</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>Before stressful situations</li>
              <li>During moments of anxiety</li>
              <li>Before important meetings or performances</li>
              <li>To help fall asleep</li>
              <li>When feeling overwhelmed</li>
              <li>As part of a morning or evening routine</li>
            </ul>
            
            <p className="text-sm text-gray-600 italic">
              Note: For maximum benefits, practice breathing exercises regularly. Even a few minutes daily can make a significant difference to your wellbeing.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
