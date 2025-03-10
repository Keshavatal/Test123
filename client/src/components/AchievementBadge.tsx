import React from "react";

interface AchievementBadgeProps {
  title: string;
  icon: string;
  iconBg: string;
  unlocked: boolean;
}

export function AchievementBadge({ title, icon, iconBg, unlocked }: AchievementBadgeProps) {
  return (
    <div className={`flex flex-col items-center ${unlocked ? "app-card" : "opacity-50"}`}>
      <div className={`w-16 h-16 rounded-full ${unlocked ? iconBg : "bg-gray-200"} flex items-center justify-center mb-2`}>
        <i className={`fas ${unlocked ? icon : "fa-lock"} text-${unlocked ? "primary" : "gray-400"} text-xl`}></i>
      </div>
      <span className="text-sm font-medium">{title}</span>
    </div>
  );
}
