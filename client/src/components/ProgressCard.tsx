import React from "react";

interface ProgressCardProps {
  title: string;
  percentage: number;
  changeText?: string;
}

export function ProgressCard({ title, percentage, changeText }: ProgressCardProps) {
  const dashArray = 100;
  const dashOffset = dashArray - (dashArray * percentage) / 100;

  return (
    <div className="bg-white rounded-2xl shadow-md p-6 flex items-center app-card">
      <div className="relative w-16 h-16 mr-4">
        <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
          <path 
            className="stroke-[3] fill-none stroke-gray-200" 
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
          />
          <path 
            className="stroke-[3] fill-none stroke-primary" 
            strokeDasharray={`${percentage}, 100`}
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
          />
        </svg>
        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
          <span className="text-sm font-semibold">{percentage}%</span>
        </div>
      </div>
      <div>
        <h3 className="font-quicksand font-semibold">{title}</h3>
        {changeText && <p className="text-xs text-gray-500">{changeText}</p>}
      </div>
    </div>
  );
}
