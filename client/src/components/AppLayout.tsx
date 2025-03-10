import React, { useState } from "react";
import { Sidebar } from "@/components/ui/sidebar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useUserContext } from "@/contexts/UserContext";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { user } = useUserContext();
  const [_location, navigate] = useLocation();

  // If user is not logged in, redirect to auth page
  if (!user) {
    navigate("/auth");
    return null;
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <Sidebar className="hidden md:flex" />

      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white">
              <i className="fas fa-brain text-sm"></i>
            </div>
            <h1 className="text-xl font-bold font-quicksand text-primary">MindWell</h1>
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="w-10 h-10 rounded-full">
                <i className="fas fa-bars text-primary"></i>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0">
              <Sidebar />
            </SheetContent>
          </Sheet>
        </header>

        {children}
      </main>
    </div>
  );
}
