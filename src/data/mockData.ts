import { Quiz, Transaction, LeaderboardEntry, Question, WithdrawalRequest } from '@/types';

export const mockQuestions: Question[] = [
  {
    id: '1',
    text: 'What is the capital of Nigeria?',
    options: ['Lagos', 'Abuja', 'Kano', 'Port Harcourt'],
    correctOption: 1,
    timeLimit: 30
  },
  {
    id: '2',
    text: 'Which planet is known as the Red Planet?',
    options: ['Venus', 'Mars', 'Jupiter', 'Saturn'],
    correctOption: 1,
    timeLimit: 30
  },
  {
    id: '3',
    text: 'Who wrote the novel "Things Fall Apart"?',
    options: ['Wole Soyinka', 'Chinua Achebe', 'Chimamanda Adichie', 'Ben Okri'],
    correctOption: 1,
    timeLimit: 30
  },
  {
    id: '4',
    text: 'What is the largest ocean on Earth?',
    options: ['Atlantic', 'Indian', 'Arctic', 'Pacific'],
    correctOption: 3,
    timeLimit: 30
  },
  {
    id: '5',
    text: 'In which year did Nigeria gain independence?',
    options: ['1958', '1960', '1962', '1963'],
    correctOption: 1,
    timeLimit: 30
  }
];

export const mockQuizzes: Quiz[] = [
  {
    id: '1',
    title: 'Win Big Challenge',
    description: 'Answer questions correctly to win amazing prizes',
    entryFee: 10,
    prizePool: 100,
    startTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
    endTime: new Date(Date.now() + 3 * 60 * 60 * 1000),
    duration: 15,
    status: 'upcoming',
    isAvailable: true,
    questions: mockQuestions,
    rewardProgression: [
      { questionNumber: 1, correctReward: 4 },
      { questionNumber: 2, correctReward: 5 },
      { questionNumber: 3, correctReward: 7 },
      { questionNumber: 4, correctReward: 9 },
      { questionNumber: 5, correctReward: 11 }
    ],
    penaltyAmount: 1
  },
  {
    id: '2',
    title: 'Mega Prize Quiz',
    description: 'High stakes quiz with massive rewards',
    entryFee: 20,
    prizePool: 1000,
    startTime: new Date(Date.now() + 1 * 60 * 60 * 1000), // 1 hour from now
    endTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
    duration: 20,
    status: 'upcoming',
    isAvailable: true,
    questions: mockQuestions,
    rewardProgression: [
      { questionNumber: 1, correctReward: 40 },
      { questionNumber: 2, correctReward: 80 },
      { questionNumber: 3, correctReward: 160 },
      { questionNumber: 4, correctReward: 320 },
      { questionNumber: 5, correctReward: 400 }
    ],
    penaltyAmount: 4
  },
  {
    id: '3',
    title: 'Diamond Prize Quiz',
    description: 'Ultimate quiz with diamond rewards',
    entryFee: 200,
    prizePool: 4000,
    startTime: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
    endTime: new Date(Date.now() + 30 * 60 * 1000),
    duration: 25,
    status: 'active',
    isAvailable: true,
    questions: mockQuestions,
    rewardProgression: [
      { questionNumber: 1, correctReward: 200 },
      { questionNumber: 2, correctReward: 400 },
      { questionNumber: 3, correctReward: 800 },
      { questionNumber: 4, correctReward: 1200 },
      { questionNumber: 5, correctReward: 1400 }
    ],
    penaltyAmount: 10
  }
];

export const mockTransactions: Transaction[] = [
  {
    id: '1',
    type: 'deposit',
    amount: 200,
    status: 'completed',
    description: 'Wallet deposit via Paystack',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
  },
  {
    id: '2',
    type: 'quiz_fee',
    amount: -10,
    status: 'completed',
    description: 'Entry fee for General Knowledge Challenge',
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
  },
  {
    id: '3',
    type: 'quiz_reward',
    amount: 50,
    status: 'completed',
    description: 'Reward for Science Trivia - 1st Place',
    date: new Date(Date.now() - 12 * 60 * 60 * 1000)
  },
  {
    id: '4',
    type: 'withdrawal',
    amount: -100,
    status: 'pending',
    description: 'Withdrawal to GTBank ****1234',
    date: new Date(Date.now() - 2 * 60 * 60 * 1000)
  }
];

export const mockLeaderboard: LeaderboardEntry[] = [
  {
    rank: 1,
    userId: '1',
    userName: 'QuizMaster',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=QuizMaster',
    points: 15420,
    totalEarnings: 45000
  },
  {
    rank: 2,
    userId: '2',
    userName: 'BrainBox',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=BrainBox',
    points: 12850,
    totalEarnings: 38500
  },
  {
    rank: 3,
    userId: '3',
    userName: 'SmartGuy',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=SmartGuy',
    points: 11200,
    totalEarnings: 33600
  },
  {
    rank: 4,
    userId: '4',
    userName: 'WiseOwl',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=WiseOwl',
    points: 9750,
    totalEarnings: 29250
  },
  {
    rank: 5,
    userId: '5',
    userName: 'StudyBuddy',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=StudyBuddy',
    points: 8640,
    totalEarnings: 25920
  }
];

export const mockWithdrawals: WithdrawalRequest[] = [
  {
    id: '1',
    userId: '1',
    amount: 5000,
    bankName: 'GTBank',
    accountNumber: '0123456789',
    status: 'pending',
    requestDate: new Date(Date.now() - 2 * 60 * 60 * 1000)
  },
  {
    id: '2',
    userId: '2',
    amount: 10000,
    bankName: 'First Bank',
    accountNumber: '9876543210',
    status: 'approved',
    requestDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
    processedDate: new Date(Date.now() - 12 * 60 * 60 * 1000)
  }
];