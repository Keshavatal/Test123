import { apiRequest } from "./queryClient";

export interface RegisterFormData {
  username: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName?: string;
  email: string;
}

export interface LoginFormData {
  username: string;
  password: string;
}

export interface AssessmentQuestion {
  id: number;
  question: string;
  options: {
    value: number;
    label: string;
  }[];
}

export interface AssessmentData {
  responses: Record<number, number>;
  score: number;
}

// Register validation schema
export const registerValidation = {
  username: (value: string) => {
    if (!value) return "Username is required";
    if (value.length < 3) return "Username must be at least 3 characters";
    return true;
  },
  password: (value: string) => {
    if (!value) return "Password is required";
    if (value.length < 6) return "Password must be at least 6 characters";
    return true;
  },
  confirmPassword: (value: string, formData: RegisterFormData) => {
    if (!value) return "Please confirm your password";
    if (value !== formData.password) return "Passwords do not match";
    return true;
  },
  firstName: (value: string) => {
    if (!value) return "First name is required";
    return true;
  },
  email: (value: string) => {
    if (!value) return "Email is required";
    if (!/\S+@\S+\.\S+/.test(value)) return "Invalid email address";
    return true;
  }
};

// Login validation schema
export const loginValidation = {
  username: (value: string) => {
    if (!value) return "Username is required";
    return true;
  },
  password: (value: string) => {
    if (!value) return "Password is required";
    return true;
  }
};

// Sample assessment questions
export const assessmentQuestions: AssessmentQuestion[] = [
  {
    id: 1,
    question: "Over the last 2 weeks, how often have you felt nervous, anxious, or on edge?",
    options: [
      { value: 0, label: "Not at all" },
      { value: 1, label: "Several days" },
      { value: 2, label: "More than half the days" },
      { value: 3, label: "Nearly every day" }
    ]
  },
  {
    id: 2,
    question: "Over the last 2 weeks, how often have you felt down, depressed, or hopeless?",
    options: [
      { value: 0, label: "Not at all" },
      { value: 1, label: "Several days" },
      { value: 2, label: "More than half the days" },
      { value: 3, label: "Nearly every day" }
    ]
  },
  {
    id: 3,
    question: "How often do you have trouble relaxing?",
    options: [
      { value: 0, label: "Not at all" },
      { value: 1, label: "Several days" },
      { value: 2, label: "More than half the days" },
      { value: 3, label: "Nearly every day" }
    ]
  },
  {
    id: 4,
    question: "How often do you have difficulty sleeping?",
    options: [
      { value: 0, label: "Not at all" },
      { value: 1, label: "Several days" },
      { value: 2, label: "More than half the days" },
      { value: 3, label: "Nearly every day" }
    ]
  },
  {
    id: 5,
    question: "How often do you feel tired or have little energy?",
    options: [
      { value: 0, label: "Not at all" },
      { value: 1, label: "Several days" },
      { value: 2, label: "More than half the days" },
      { value: 3, label: "Nearly every day" }
    ]
  },
  {
    id: 6,
    question: "How often do you have negative thoughts about yourself?",
    options: [
      { value: 0, label: "Not at all" },
      { value: 1, label: "Several days" },
      { value: 2, label: "More than half the days" },
      { value: 3, label: "Nearly every day" }
    ]
  },
  {
    id: 7,
    question: "How often do you have difficulty concentrating?",
    options: [
      { value: 0, label: "Not at all" },
      { value: 1, label: "Several days" },
      { value: 2, label: "More than half the days" },
      { value: 3, label: "Nearly every day" }
    ]
  },
  {
    id: 8,
    question: "How able are you to cope with stressful situations?",
    options: [
      { value: 3, label: "Very able" },
      { value: 2, label: "Somewhat able" },
      { value: 1, label: "Not very able" },
      { value: 0, label: "Not at all able" }
    ]
  },
  {
    id: 9,
    question: "How often do you practice self-care activities?",
    options: [
      { value: 3, label: "Daily" },
      { value: 2, label: "Several times a week" },
      { value: 1, label: "Rarely" },
      { value: 0, label: "Never" }
    ]
  },
  {
    id: 10,
    question: "How would you rate your overall mental wellbeing right now?",
    options: [
      { value: 3, label: "Excellent" },
      { value: 2, label: "Good" },
      { value: 1, label: "Fair" },
      { value: 0, label: "Poor" }
    ]
  }
];

// Submit assessment data
export const submitAssessment = async (responses: Record<number, number>) => {
  // Calculate score (0-100 scale)
  const maxPossibleScore = assessmentQuestions.length * 3; // Max score per question is 3
  const totalScore = Object.values(responses).reduce((sum, val) => sum + val, 0);
  const normalizedScore = Math.round((totalScore / maxPossibleScore) * 100);
  
  const assessmentData: AssessmentData = {
    responses,
    score: normalizedScore
  };
  
  return apiRequest('POST', '/api/assessment', assessmentData);
};
