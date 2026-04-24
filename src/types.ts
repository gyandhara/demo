export interface User {
  uid: string;
  email: string;
  role: 'student' | 'admin';
  displayName: string;
  classLevel: string;
  totalScore: number;
  createdAt: any;
  updatedAt: any;
}

export interface Quiz {
  id: string; // Document ID
  title: string;
  description: string;
  classLevel: string;
  subject: string;
  topic: string;
  durationMinutes: number;
  totalQuestions: number;
  createdAt: any;
  createdBy: string;
}

export interface Question {
  id: string; // Document ID
  quizId: string;
  text: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
}

export interface QuizAttempt {
  id: string; // Document ID
  userId: string;
  quizId: string;
  score: number;
  totalQuestions: number;
  completedAt: any;
}
