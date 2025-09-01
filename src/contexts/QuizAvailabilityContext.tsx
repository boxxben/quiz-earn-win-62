import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Quiz } from '@/types';

interface QuizAvailabilityContextType {
  availableQuizzes: Quiz[];
  startQuiz: (quizId: string) => Promise<boolean>;
  refreshQuizzes: () => void;
}

const QuizAvailabilityContext = createContext<QuizAvailabilityContextType | undefined>(undefined);

export function QuizAvailabilityProvider({ children }: { children: React.ReactNode }) {
  const [availableQuizzes, setAvailableQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch quizzes from Supabase
  const fetchQuizzes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('quizzes')
      .select('*')
      .order('created_at', { ascending: false });

    if (data && !error) {
      const quizzes = data.map(quiz => ({
        id: quiz.id,
        title: quiz.title,
        description: quiz.description || '',
        entryFee: quiz.entry_fee,
        prizePool: quiz.prize_pool,
        startTime: new Date(quiz.start_time),
        endTime: new Date(quiz.end_time),
        duration: quiz.duration,
        status: quiz.status as 'upcoming' | 'active' | 'completed',
        isAvailable: quiz.is_available,
        questions: quiz.questions as any[],
        rewardProgression: quiz.reward_progression as any[],
        penaltyAmount: quiz.penalty_amount
      }));
      setAvailableQuizzes(quizzes);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchQuizzes();
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
    fetchQuizzes();
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