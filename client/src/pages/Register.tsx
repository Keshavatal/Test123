import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLocation } from "wouter";
import RegisterForm from "@/components/auth/RegisterForm";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function Register() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  
  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (!isLoading && user) {
      setLocation('/');
    }
  }, [user, isLoading, setLocation]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-grow flex items-center justify-center p-4">
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="hidden md:block">
            <div className="space-y-6">
              <div className="flex items-center">
                <svg className="h-12 w-12 text-primary animate-float" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" fill="currentColor"/>
                  <path d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z" fill="currentColor"/>
                </svg>
                <h1 className="ml-2 text-3xl font-quicksand font-bold text-primary">MindfulPath</h1>
              </div>
              
              <h2 className="text-2xl font-quicksand font-bold">Begin your journey to mental wellness</h2>
              
              <p className="text-muted-foreground">
                Join MindfulPath and gain access to personalized CBT exercises, mood tracking, and gamified challenges designed to improve your mental wellbeing.
              </p>
              
              <div className="bg-primary/10 rounded-lg p-4">
                <h3 className="font-quicksand font-medium text-primary mb-2">What's included:</h3>
                <ul className="space-y-2">
                  {["Initial mental health assessment", "Personalized exercise recommendations", "Daily wellness challenges", "Progress tracking dashboard", "AI-powered CBT chatbot"].map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary h-5 w-5 mr-2">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          
          <div>
            <RegisterForm />
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
