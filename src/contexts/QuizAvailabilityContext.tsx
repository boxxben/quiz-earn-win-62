import React, { createContext, useContext, useState, useEffect } from 'react';
import { mockQuizzes } from '@/data/mockData';
import { Quiz } from '@/types';

interface QuizAvailabilityContextType {
  availableQuizzes: Quiz[];
  startQuiz: (quizId: string) => Promise<boolean>;
  refreshQuizzes: () => void;
}

const QuizAvailabilityContext = createContext<QuizAvailabilityContextType | undefined>(undefined);

export function QuizAvailabilityProvider({ children }: { children: React.ReactNode }) {
  const [availableQuizzes, setAvailableQuizzes] = useState<Quiz[]>(mockQuizzes);

  // Simulate real-time updates (in production, this would connect to WebSocket/SSE)
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate random quiz being taken to show real-time availability
      setAvailableQuizzes(prev => 
        prev.map(quiz => ({
          ...quiz,
          // Randomly make a quiz unavailable occasionally for demonstration
          isAvailable: Math.random() > 0.98 ? false : quiz.isAvailable
        }))
      );
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const startQuiz = async (quizId: string): Promise<boolean> => {
    const quiz = availableQuizzes.find(q => q.id === quizId);
    
    if (!quiz || !quiz.isAvailable) {
      return false; // Quiz not available
    }

    // Mark quiz as unavailable (first come first serve)
    setAvailableQuizzes(prev => 
      prev.map(q => 
        q.id === quizId 
          ? { ...q, isAvailable: false }
          : q
      )
    );

    return true; // Successfully started quiz
  };

  const refreshQuizzes = () => {
    // In production, this would fetch from API
    setAvailableQuizzes([...mockQuizzes]);
  };

  return (
    <QuizAvailabilityContext.Provider value={{
      availableQuizzes,
      startQuiz,
      refreshQuizzes
    }}>
      {children}
    </QuizAvailabilityContext.Provider>
  );
}

export function useQuizAvailability() {
  const context = useContext(QuizAvailabilityContext);
  if (!context) {
    throw new Error('useQuizAvailability must be used within QuizAvailabilityProvider');
  }
  return context;
}