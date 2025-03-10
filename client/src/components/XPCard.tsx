import React from "react";

interface XPCardProps {
  xp: number;
  level: number;
  nextLevelXp: number;
}

export function XPCard({ xp, level, nextLevelXp }: XPCardProps) {
  const xpPercentage = (xp % 100) / (nextLevelXp - (level - 1) * 100) * 100;

  return (
    <div className="bg-white rounded-2xl shadow-md p-6 app-card">
      <div className="flex items-center mb-2">
        <div className="w-10 h-10 rounded-full bg-secondary bg-opacity-20 flex items-center justify-center mr-3">
          <i className="fas fa-bolt text-secondary"></i>
        </div>
        <div>
          <h3 className="font-quicksand font-semibold">XP Points</h3>
          <p className="text-xs text-gray-500">Level {level}</p>
        </div>
      </div>
      <div className="mt-2">
        <div className="flex justify-between text-xs mb-1">
          <span>{xp % 100} / {nextLevelXp - (level - 1) * 100} XP</span>
          <span>Next Level</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-secondary rounded-full" 
            style={{ width: `${xpPercentage}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}
