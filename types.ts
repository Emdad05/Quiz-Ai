export enum Difficulty {
  EASY = 'Easy',
  MEDIUM = 'Medium',
  HARD = 'Hard'
}

export enum QuizType {
  MULTIPLE_CHOICE = 'Multiple Choice',
  TRUE_FALSE = 'True/False',
}

export interface FileUpload {
  data: string;
  mimeType: string;
}

export interface QuizConfig {
  userName: string;
  topic?: string;
  questionCount: number;
  durationMinutes: number;
  difficulty: Difficulty;
  quizType: QuizType;
  content: string;
  fileUploads: FileUpload[];
}

export interface Question {
  id: number;
  questionText: string;
  options: string[]; // Empty for Short Answer (legacy support)
  correctOptionIndex?: number; // For MC/TF
  answer?: string; // For Short Answer (legacy support)
  explanation: string;
}

export type QuizStatus = 'IN_PROGRESS' | 'COMPLETED';

export interface QuizResult {
  id: string;
  title: string;
  timestamp: number;
  status: QuizStatus;
  questions: Question[];
  userAnswers: Record<number, number | string>;
  timeTakenSeconds: number;
  currentIndex?: number;
  markedForReview?: number[];
}

export type AppState = 'LANDING' | 'API_MANAGEMENT' | 'HOW_TO_USE' | 'SETUP' | 'GENERATING' | 'QUIZ' | 'RESULTS' | 'REVIEW' | 'HISTORY';

export interface GeneratedQuizData {
  title: string;
  questions: Question[];
}