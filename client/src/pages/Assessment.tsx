import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLocation } from "wouter";
import InitialAssessment from "@/components/auth/InitialAssessment";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function Assessment() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      setLocation('/login');
    } else if (user && user.initialAssessmentCompleted) {
      // Redirect to dashboard if assessment already completed
      setLocation('/');
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) {
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
        <div className="max-w-3xl mx-auto text-center mb-8">
          <h1 className="text-3xl font-quicksand font-bold text-primary mb-4">Let's Get to Know You Better</h1>
          <p className="text-lg text-muted-foreground">
            Complete this brief assessment to help us personalize your mental wellness journey.
            Your responses will help us recommend the most effective exercises for your needs.
          </p>
        </div>
        
        <InitialAssessment />
      </main>
      
      <Footer />
    </div>
  );
}
