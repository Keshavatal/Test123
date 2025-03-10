import { Card, CardContent } from "@/components/ui/card";
import { PenLine, Wind, Heart, Brain } from "lucide-react";

export interface ExerciseProps {
  id: string;
  title: string;
  description: string;
  duration: number;
  type: "cognitive" | "breathing" | "gratitude" | "mindfulness";
  path: string;
}

interface ExerciseCardProps {
  exercise: ExerciseProps;
  onStartExercise?: (exercise: ExerciseProps) => void;
}

export default function ExerciseCard({ exercise, onStartExercise }: ExerciseCardProps) {
  const getIcon = () => {
    switch (exercise.type) {
      case "cognitive":
        return <PenLine className="text-xl text-primary" />;
      case "breathing":
        return <Wind className="text-xl text-primary" />;
      case "gratitude":
        return <Heart className="text-xl text-primary" />;
      case "mindfulness":
        return <Brain className="text-xl text-primary" />;
      default:
        return <PenLine className="text-xl text-primary" />;
    }
  };

  const handleClick = () => {
    if (onStartExercise) {
      onStartExercise(exercise);
    }
  };

  return (
    <Card 
      className="bg-background rounded-xl p-5 hover:shadow-md transition duration-300 cursor-pointer group"
      onClick={handleClick}
    >
      <CardContent className="p-0">
        <div className="flex justify-between items-start mb-3">
          <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center">
            {getIcon()}
          </div>
          <span className="text-xs font-quicksand bg-primary bg-opacity-20 text-primary px-2 py-1 rounded-full">
            {exercise.duration} min
          </span>
        </div>
        <h4 className="font-quicksand font-semibold text-lg mb-1">{exercise.title}</h4>
        <p className="text-sm text-textColor opacity-80 mb-3">{exercise.description}</p>
        <button className="text-primary text-sm font-quicksand font-medium group-hover:underline">
          Start exercise <span className="inline-block ml-1 transform group-hover:translate-x-1 transition duration-300">→</span>
        </button>
      </CardContent>
    </Card>
  );
}
