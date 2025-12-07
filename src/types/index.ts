export interface User {
  id: string;
  name: string;
  email: string;
  country: string;
  balance: number;
  totalEarnings: number;
  quizzesPlayed: number;
  quizzesWon: number;
  rank: number;
  avatar?: string;
  isAdmin?: boolean;
  isVip?: boolean;
  vipExpiresAt?: Date | null;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  entryFee: number;
  prizePool: number;
  startTime: Date;
  endTime: Date;
  duration: number; // in minutes
  status: 'upcoming' | 'active' | 'completed';
  isAvailable: boolean; // First come first serve availability
  questions: Question[];
  rewardProgression: QuizReward[]; // Progressive rewards per question
  penaltyAmount: number; // Amount deducted for wrong answers
  isVip?: boolean; // VIP quiz flag
}

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctOption: number;
  timeLimit: number; // in seconds
}

export interface QuizReward {
  questionNumber: number;
  correctReward: number; // Amount earned for correct answer
}

export interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'quiz_fee' | 'quiz_reward';
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  description: string;
  date: Date;
}

export interface QuizResult {
  id: string;
  quizId: string;
  userId: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  timeSpent: number;
  earnings: number;
  rank: number;
  completedAt: Date;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  avatar?: string;
  points: number;
  totalEarnings: number;
}

export interface WithdrawalRequest {
  id: string;
  userId: string;
  amount: number;
  bankName: string;
  accountNumber: string;
  status: 'pending' | 'approved' | 'rejected';
  requestDate: Date;
  processedDate?: Date;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'announcement' | 'quiz' | 'earnings' | 'system';
  isRead: boolean;
  createdAt: Date;
  userId?: string; // If null, it's for all users
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success';
  createdAt: Date;
  createdBy: string;
}