import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface BreathingAnimationProps {
  isPlaying: boolean;
  phase: "inhale" | "hold" | "exhale" | "rest";
  progress: number;
}

export function BreathingAnimation({ isPlaying, phase, progress }: BreathingAnimationProps) {
  const [opacity, setOpacity] = useState(0.7);

  useEffect(() => {
    if (!isPlaying) return;

    // Adjust animation based on breathing phase
    if (phase === "inhale") {
      setOpacity(1);
    } else if (phase === "exhale") {
      setOpacity(0.5);
    } else {
      setOpacity(0.7);
    }
  }, [isPlaying, phase]);

  const circleVariants = {
    inhale: {
      scale: [1, 1.5],
      opacity: [0.7, 1],
      transition: { duration: 4, ease: "easeInOut" }
    },
    hold: {
      scale: 1.5,
      opacity: 1,
      transition: { duration: 4, ease: "linear" }
    },
    exhale: {
      scale: [1.5, 1],
      opacity: [1, 0.7],
      transition: { duration: 4, ease: "easeInOut" }
    },
    rest: {
      scale: 1,
      opacity: 0.7,
      transition: { duration: 2, ease: "linear" }
    },
    paused: {
      scale: 1.25,
      opacity: 0.8,
      transition: { duration: 0 }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <motion.div
        className="relative flex items-center justify-center"
        initial={{ scale: 1, opacity: 0.7 }}
        animate={isPlaying ? phase : "paused"}
        variants={circleVariants}
      >
        {/* Outer circle */}
        <div className="absolute w-32 h-32 rounded-full bg-gradient-to-r from-primary/60 to-accent-foreground/40 opacity-30 blur-md" />
        
        {/* Inner circle - breathing indicator */}
        <div className="relative w-24 h-24 rounded-full bg-gradient-to-r from-primary to-accent-foreground flex items-center justify-center">
          <span className="text-white font-semibold text-sm uppercase tracking-wide">
            {phase}
          </span>
        </div>
      </motion.div>
      
      <AnimatePresence>
        {isPlaying && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mt-6 text-center"
          >
            <div className="text-lg font-medium mb-2">
              {phase === "inhale" && "Breathe In..."}
              {phase === "hold" && "Hold..."}
              {phase === "exhale" && "Breathe Out..."}
              {phase === "rest" && "Rest..."}
            </div>
            <div className="text-sm text-muted-foreground">
              Follow the circle's rhythm
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}