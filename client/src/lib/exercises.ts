import { Exercise } from "@shared/schema";

// Assessment questions for mental health evaluation
export const assessmentQuestions = [
  {
    id: 1,
    question: "Over the past 2 weeks, how often have you felt down, depressed, or hopeless?",
    options: [
      { value: 0, label: "Not at all" },
      { value: 1, label: "Several days" },
      { value: 2, label: "More than half the days" },
      { value: 3, label: "Nearly every day" }
    ]
  },
  {
    id: 2,
    question: "Over the past 2 weeks, how often have you had little interest or pleasure in doing things?",
    options: [
      { value: 0, label: "Not at all" },
      { value: 1, label: "Several days" },
      { value: 2, label: "More than half the days" },
      { value: 3, label: "Nearly every day" }
    ]
  },
  {
    id: 3,
    question: "Over the past 2 weeks, how often have you been feeling nervous, anxious, or on edge?",
    options: [
      { value: 0, label: "Not at all" },
      { value: 1, label: "Several days" },
      { value: 2, label: "More than half the days" },
      { value: 3, label: "Nearly every day" }
    ]
  },
  {
    id: 4,
    question: "Over the past 2 weeks, how often have you had trouble relaxing?",
    options: [
      { value: 0, label: "Not at all" },
      { value: 1, label: "Several days" },
      { value: 2, label: "More than half the days" },
      { value: 3, label: "Nearly every day" }
    ]
  },
  {
    id: 5,
    question: "Over the past 2 weeks, how often have you had trouble falling or staying asleep, or sleeping too much?",
    options: [
      { value: 0, label: "Not at all" },
      { value: 1, label: "Several days" },
      { value: 2, label: "More than half the days" },
      { value: 3, label: "Nearly every day" }
    ]
  },
  {
    id: 6,
    question: "Over the past 2 weeks, how often have you felt tired or had little energy?",
    options: [
      { value: 0, label: "Not at all" },
      { value: 1, label: "Several days" },
      { value: 2, label: "More than half the days" },
      { value: 3, label: "Nearly every day" }
    ]
  },
  {
    id: 7,
    question: "Over the past 2 weeks, how often have you been bothered by trouble concentrating on things?",
    options: [
      { value: 0, label: "Not at all" },
      { value: 1, label: "Several days" },
      { value: 2, label: "More than half the days" },
      { value: 3, label: "Nearly every day" }
    ]
  },
  {
    id: 8,
    question: "Over the past 2 weeks, how often have you been easily annoyed or irritable?",
    options: [
      { value: 0, label: "Not at all" },
      { value: 1, label: "Several days" },
      { value: 2, label: "More than half the days" },
      { value: 3, label: "Nearly every day" }
    ]
  },
  {
    id: 9,
    question: "How would you rate your overall mental wellbeing right now?",
    options: [
      { value: 0, label: "Very poor" },
      { value: 1, label: "Poor" },
      { value: 2, label: "Fair" },
      { value: 3, label: "Good" },
      { value: 4, label: "Very good" }
    ]
  },
  {
    id: 10,
    question: "How much is your current mental health affecting your daily life?",
    options: [
      { value: 0, label: "Not at all" },
      { value: 1, label: "A little bit" },
      { value: 2, label: "Moderately" },
      { value: 3, label: "Quite a bit" },
      { value: 4, label: "Extremely" }
    ]
  }
];

// Mood tracking options
export const moodOptions = [
  { value: "great", label: "Great", emoji: "😊" },
  { value: "good", label: "Good", emoji: "🙂" },
  { value: "okay", label: "Okay", emoji: "😐" },
  { value: "low", label: "Low", emoji: "😕" },
  { value: "sad", label: "Sad", emoji: "😢" }
];

// Calculate assessment score (0-100)
export const calculateAssessmentScore = (answers: Record<number, number>): number => {
  // Maximum possible score from all questions
  const maxScore = assessmentQuestions.reduce((sum, q) => {
    const maxOption = Math.max(...q.options.map(o => o.value));
    return sum + maxOption;
  }, 0);
  
  // User's total score
  const userScore = Object.values(answers).reduce((sum, value) => sum + value, 0);
  
  // Convert to 0-100 scale (inverted, since lower scores are better for mental health)
  return Math.round(100 - ((userScore / maxScore) * 100));
};

// Calculate exercise recommendations based on assessment
export const getRecommendedExercises = (exercises: Exercise[], assessmentScore: number): Exercise[] => {
  // For demo purposes, just returning all exercises
  // In a real app, you would filter/sort based on the user's assessment
  return exercises;
};

// Journaling prompts
export const journalPrompts = [
  "What are three good things that happened today?",
  "What's something that challenged you today and how did you handle it?",
  "Describe a moment that made you feel grateful today.",
  "What negative thoughts did you experience today? Can you reframe them?",
  "What's one thing you're looking forward to tomorrow?",
  "What self-care activities did you engage in today?",
  "What's one thing you accomplished today, no matter how small?",
  "If you could change one thing about today, what would it be and why?",
  "What made you smile or laugh today?",
  "What did you learn about yourself today?"
];
