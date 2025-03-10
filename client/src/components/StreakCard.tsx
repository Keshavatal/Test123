import React from "react";

interface StreakCardProps {
  currentStreak: number;
}

export function StreakCard({ currentStreak }: StreakCardProps) {
  // Get current day of week (0 = Sunday, 1 = Monday, etc.)
  const today = new Date().getDay();
  
  // Reorder days to start from Monday (1) to Sunday (7)
  const daysOfWeek = [
    { label: "M", value: 1 },
    { label: "T", value: 2 },
    { label: "W", value: 3 },
    { label: "T", value: 4 },
    { label: "F", value: 5 },
    { label: "S", value: 6 },
    { label: "S", value: 0 },
  ];

  // Convert Sunday (0) to 7 for easier comparison
  const adjustedToday = today === 0 ? 7 : today;
  
  // Calculate which days to mark as completed based on streak and current day
  const getCompletedDays = () => {
    const completed: number[] = [];
    
    // If streak is 0, no days are completed
    if (currentStreak === 0) return completed;
    
    // Add current day
    completed.push(adjustedToday);
    
    // Add previous days based on streak length
    for (let i = 1; i < currentStreak; i++) {
      const prevDay = adjustedToday - i;
      // Handle wrap around to previous week
      const day = prevDay <= 0 ? prevDay + 7 : prevDay;
      completed.push(day);
    }
    
    return completed;
  };
  
  const completedDays = getCompletedDays();

  return (
    <div className="bg-white rounded-2xl shadow-md p-6 app-card">
      <div className="flex items-center mb-2">
        <div className="w-10 h-10 rounded-full bg-accent bg-opacity-30 flex items-center justify-center mr-3">
          <i className="fas fa-fire text-purple-500"></i>
        </div>
        <div>
          <h3 className="font-quicksand font-semibold">Streak</h3>
          <p className="text-xs text-gray-500">Stay consistent</p>
        </div>
      </div>
      <div className="flex justify-between mt-2">
        {daysOfWeek.map((day) => {
          const isCompleted = completedDays.includes(day.value);
          const isToday = day.value === adjustedToday;
          
          return (
            <div key={day.label} className="flex flex-col items-center">
              <span className="text-xs text-gray-500 mb-2">{day.label}</span>
              {isCompleted ? (
                isToday ? (
                  <div className="w-6 h-6 rounded-full flex items-center justify-center bg-primary text-white font-bold text-xs">
                    <span>{currentStreak}</span>
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full flex items-center justify-center bg-accent text-purple-600 text-xs">
                    <i className="fas fa-check"></i>
                  </div>
                )
              ) : (
                <div className="w-6 h-6 rounded-full flex items-center justify-center bg-gray-200 text-gray-400 text-xs">
                  <span>{day.value}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
