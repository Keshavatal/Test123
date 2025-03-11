import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface MindfulnessAnimationProps {
  isPlaying: boolean;
  duration?: number; // seconds for one full cycle
}

export function MindfulnessAnimation({ isPlaying, duration = 8 }: MindfulnessAnimationProps) {
  const [cycle, setCycle] = useState(0);
  
  // Increment cycle counter for animation effects
  useEffect(() => {
    if (!isPlaying) return;
    
    const interval = setInterval(() => {
      setCycle((prev) => (prev + 1) % 5);
    }, duration * 1000);
    
    return () => clearInterval(interval);
  }, [isPlaying, duration]);
  
  // Create array of dots for animation
  const dots = Array.from({ length: 8 }).map((_, i) => {
    const angle = (i / 8) * Math.PI * 2;
    const x = Math.cos(angle) * 40;
    const y = Math.sin(angle) * 40;
    
    return { x, y, id: i };
  });
  
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <motion.div
        className="relative w-32 h-32 flex items-center justify-center"
        animate={isPlaying ? { rotate: 360 } : { rotate: 0 }}
        transition={isPlaying ? { 
          duration: duration,
          ease: "linear",
          repeat: Infinity
        } : {}}
      >
        {dots.map((dot, index) => (
          <motion.div
            key={dot.id}
            className="absolute w-4 h-4 rounded-full bg-accent-foreground"
            style={{ left: "calc(50% + " + dot.x + "px)", top: "calc(50% + " + dot.y + "px)" }}
            animate={isPlaying ? { 
              scale: [1, 1.5, 1],
              opacity: [0.7, 1, 0.7],
            } : { scale: 1, opacity: 0.7 }}
            transition={isPlaying ? {
              delay: index * 0.3,
              duration: 4,
              repeat: Infinity,
              repeatType: "mirror"
            } : {}}
          />
        ))}
        
        {/* Center circle */}
        <motion.div 
          className="w-16 h-16 rounded-full bg-gradient-to-r from-primary to-accent-foreground flex items-center justify-center z-10"
          animate={isPlaying ? {
            scale: [1, 1.2, 1],
            opacity: [0.8, 1, 0.8],
          } : { scale: 1, opacity: 0.8 }}
          transition={isPlaying ? { 
            duration: 6, 
            repeat: Infinity,
            repeatType: "mirror"
          } : {}}
        >
          <span className="text-white text-xs">Focus</span>
        </motion.div>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isPlaying ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        className="mt-6 text-center"
      >
        <div className="text-lg font-medium mb-2">
          Breathe and center yourself
        </div>
        <div className="text-sm text-muted-foreground">
          {cycle === 0 && "Focus on your breath..."}
          {cycle === 1 && "Notice any sensations..."}
          {cycle === 2 && "Observe your thoughts..."}
          {cycle === 3 && "Let them pass by..."}
          {cycle === 4 && "Return to your breath..."}
        </div>
      </motion.div>
    </div>
  );
}