import React from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useUserContext } from "@/contexts/UserContext";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [location] = useLocation();
  const { user } = useUserContext();

  const menuItems = [
    {
      name: "Dashboard",
      path: "/",
      icon: "fa-home",
    },
    {
      name: "Chatbot",
      path: "/chatbot",
      icon: "fa-comments",
    },
    {
      name: "Journal",
      path: "/journal",
      icon: "fa-book",
    },
    {
      name: "Exercises",
      path: "/exercises",
      icon: "fa-tasks",
    },
    {
      name: "Progress",
      path: "/progress",
      icon: "fa-chart-line",
    },
    {
      name: "Achievements",
      path: "/achievements",
      icon: "fa-trophy",
    },
  ];

  return (
    <aside className={cn("hidden md:flex md:flex-col w-72 bg-white rounded-r-3xl shadow-lg p-6 overflow-y-auto", className)}>
      <div className="flex items-center gap-3 mb-10">
        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white">
          <i className="fas fa-brain"></i>
        </div>
        <h1 className="text-2xl font-bold font-quicksand text-primary">MindWell</h1>
      </div>
      
      <nav className="flex-1">
        <div className="space-y-2">
          {menuItems.map((item) => (
            <Link key={item.path} href={item.path}>
              <a
                className={cn(
                  "flex items-center gap-3 rounded-xl p-3 transition-all duration-200",
                  location === item.path
                    ? "text-primary bg-background font-medium"
                    : "text-foreground hover:text-primary hover:bg-background"
                )}
              >
                <i className={`fas ${item.icon} w-6`}></i>
                <span>{item.name}</span>
              </a>
            </Link>
          ))}
        </div>
      </nav>
      
      {user ? (
        <div className="mt-auto pt-6 border-t border-gray-100">
          <div className="bg-accent bg-opacity-30 rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white">
                  <span className="text-lg font-semibold">{user.firstName.charAt(0)}</span>
                </div>
              </div>
              <div>
                <h3 className="font-semibold font-quicksand">{user.firstName} {user.lastName}</h3>
                <div className="text-sm text-gray-500 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-400"></span>
                  <span>Level {user.level}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-auto pt-6 border-t border-gray-100">
          <Link href="/auth">
            <a className="w-full py-2.5 rounded-xl bg-primary text-white font-medium hover:bg-opacity-90 transition-colors flex items-center justify-center gap-2 btn-hover-effect">
              <i className="fas fa-sign-in-alt"></i>
              <span>Sign In</span>
            </a>
          </Link>
        </div>
      )}
    </aside>
  );
}
