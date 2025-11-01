import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Quiz } from '@/types';
import { useAuth } from './AuthContext';

interface QuizAvailabilityContextType {
  availableQuizzes: Quiz[];
  startQuiz: (quizId: string) => Promise<boolean>;
  refreshQuizzes: () => void;
}

const QuizAvailabilityContext = createContext<QuizAvailabilityContextType | undefined>(undefined);

export function QuizAvailabilityProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [availableQuizzes, setAvailableQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch quizzes from Supabase
  const fetchQuizzes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('quizzes')
      .select('*')
      .eq('is_available', true)
      .order('created_at', { ascending: false });

    if (data && !error) {
      // Get user's quiz attempts if logged in
      let userAttempts: string[] = [];
      if (user?.id) {
        const { data: attempts } = await supabase
          .from('quiz_attempts')
          .select('quiz_id')
          .eq('user_id', user.id);
        
        userAttempts = attempts?.map(a => a.quiz_id) || [];
      }

      // Filter out quizzes the user has already taken
      const quizzes = data
        .filter(quiz => !userAttempts.includes(quiz.id))
        .map(quiz => ({
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
  }, [user?.id]);

  const startQuiz = async (quizId: string): Promise<boolean> => {
    const quiz = availableQuizzes.find(q => q.id === quizId);
    
    if (!quiz) {
      return false; // Quiz not found
    }

    // Users can now retake quizzes - no need to check availability
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