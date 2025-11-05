import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, ArrowRight, TrendUp, Warning } from '@phosphor-icons/react';
import { useAuth } from '@/contexts/AuthContext';
import { useTransactions } from '@/contexts/TransactionContext';
import { useToast } from '@/hooks/use-toast';
import { formatDiamonds } from '@/lib/currency';
import { supabase } from '@/integrations/supabase/client';
import { useQuizAvailability } from '@/contexts/QuizAvailabilityContext';
import { MAX_WALLET_BALANCE } from '@/lib/constants';

export default function QuizPlayEnhanced() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addTransaction } = useTransactions();
  const { toast } = useToast();
  const { availableQuizzes } = useQuizAvailability();
  
  const [quiz, setQuiz] = useState<any>(null);
  const [randomizedQuestions, setRandomizedQuestions] = useState<any[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isAnswered, setIsAnswered] = useState(false);
  const [playerBalance, setPlayerBalance] = useState(user?.balance || 200);
  const [accumulatedReward, setAccumulatedReward] = useState(0);
  const [showMidwayWarning, setShowMidwayWarning] = useState(false);
  const [hasShownWarning, setHasShownWarning] = useState(false);
  const [feedbackAnimation, setFeedbackAnimation] = useState('');
  const [diamondOverlay, setDiamondOverlay] = useState({ show: false, amount: 0, type: '' });
  const [showWinAnimation, setShowWinAnimation] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Fetch quiz and randomize questions on mount
  useEffect(() => {
    const fetchQuiz = async () => {
      setLoading(true);

      const normalizeArray = (raw: any): any[] => {
        if (Array.isArray(raw)) return raw;
        if (typeof raw === 'string') {
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) return parsed;
            if (Array.isArray((parsed as any)?.questions)) return (parsed as any).questions;
          } catch {}
          return [];
        }
        if (raw && typeof raw === 'object') {
          if (Array.isArray((raw as any).questions)) return (raw as any).questions;
        }
        return [];
      };

      const normalizeQuestions = (arr: any[]): any[] => {
        const letterIndex = (val: any) => {
          if (typeof val === 'string') {
            const up = val.trim().toUpperCase();
            const idx = ['A','B','C','D'].indexOf(up);
            if (idx >= 0) return idx;
          }
          if (typeof val === 'number') {
            // Support 1-based indices
            if (val >= 1 && val <= 4) return val - 1;
            if (val >= 0 && val <= 3) return val;
          }
          return 0;
        };

        const extractOptions = (q: any): string[] => {
          // Array form
          if (Array.isArray(q?.options)) return q.options;

          // Object with A-D or a-d
          if (q?.options && typeof q.options === 'object') {
            const mapAD = ['A','B','C','D'].map(k => q.options[k] ?? q.options[k.toLowerCase()]).filter(Boolean);
            if (mapAD.length === 4) return mapAD as string[];

            const mapNum = ['1','2','3','4'].map(k => q.options[k]).filter(Boolean);
            if (mapNum.length === 4) return mapNum as string[];
          }

          // Separate keys optionA..optionD
          const optAD = ['optionA','optionB','optionC','optionD'].map(k => q[k]).filter(Boolean);
          if (optAD.length === 4) return optAD as string[];

          // choices or answers array
          if (Array.isArray(q?.choices)) return q.choices;
          if (Array.isArray(q?.answerOptions)) return q.answerOptions;
          if (Array.isArray(q?.answers)) return q.answers;

          return [];
        };

        return (arr || []).map((q: any, idx: number) => {
          const opts = extractOptions(q);

          // Determine correct index
          let answerIdx: number | null = null;
          if (typeof q.correctOption !== 'undefined') {
            answerIdx = letterIndex(q.correctOption);
          } else if (typeof q.answer !== 'undefined') {
            answerIdx = letterIndex(q.answer);
          } else if (typeof q.correct !== 'undefined') {
            answerIdx = letterIndex(q.correct);
          } else if (q.correct_answer) {
            // Could be letter or text
            const byLetter = letterIndex(q.correct_answer);
            if (byLetter !== null) answerIdx = byLetter;
            if (answerIdx === null && Array.isArray(opts)) {
              const textIdx = opts.findIndex((o: string) => String(o).trim() === String(q.correct_answer).trim());
              if (textIdx >= 0) answerIdx = textIdx;
            }
          } else if (q.answer_text && Array.isArray(opts)) {
            const textIdx = opts.findIndex((o: string) => String(o).trim() === String(q.answer_text).trim());
            if (textIdx >= 0) answerIdx = textIdx;
          }

          const finalIdx = Math.max(0, Math.min(3, (answerIdx ?? 0)));

          const text = q.text || q.question || q.questionText || q.prompt || '';

          return {
            id: q.id || `q${idx+1}`,
            text,
            options: opts,
            correctOption: finalIdx,
            timeLimit: q.timeLimit || 30,
          };
        }).filter(q => q.text && Array.isArray(q.options) && q.options.length === 4);
      };
      const { data } = await supabase
        .from('quizzes')
        .select('*')
        .eq('id', quizId)
        .maybeSingle();

      if (data) {
        const normalizedQuestions = normalizeQuestions(normalizeArray(data.questions));
        let normalizedRewards = normalizeArray(data.reward_progression);

        // Fallback: generate progressive rewards if missing/empty
        if (!Array.isArray(normalizedRewards) || normalizedRewards.length === 0) {
          const qCount = normalizedQuestions.length;
          if (qCount > 0) {
            const base = Math.max(5, Math.floor((data.prize_pool || 1000) / qCount / 2));
            normalizedRewards = Array.from({ length: qCount }, (_, i) => ({
              questionNumber: i + 1,
              correctReward: Math.floor(base * (1 + i * 0.3))
            }));
          } else {
            normalizedRewards = [];
          }
        }

        const quizData = {
          id: data.id,
          title: data.title,
          description: data.description,
          entryFee: data.entry_fee,
          prizePool: data.prize_pool,
          startTime: new Date(data.start_time),
          endTime: new Date(data.end_time),
          duration: data.duration,
          status: data.status,
          isAvailable: data.is_available,
          penaltyAmount: data.penalty_amount,
          questions: normalizedQuestions as any[],
          rewardProgression: normalizedRewards as any[]
        };

        console.info('QuizPlayEnhanced loaded quiz', {
          id: quizData.id,
          qCount: quizData.questions.length,
          sample: quizData.questions[0]
        });
        setQuiz(quizData);
        if (quizData.questions.length > 0) {
          const shuffled = [...quizData.questions].sort(() => Math.random() - 0.5);
          setRandomizedQuestions(shuffled);
        }
      } else {
        // Fallback to context cache
        const fallback = availableQuizzes.find(q => q.id === quizId);
        if (fallback) {
          const normalizedQuestions = normalizeQuestions(normalizeArray(fallback.questions));
          const quizData = { ...fallback, questions: normalizedQuestions } as any;
          setQuiz(quizData);
          if (quizData.questions.length > 0) {
            const shuffled = [...quizData.questions].sort(() => Math.random() - 0.5);
            setRandomizedQuestions(shuffled);
          }
        } else {
          setQuiz(null);
        }
      }
      setLoading(false);
    };

    fetchQuiz();
  }, [quizId, availableQuizzes]);
  
  // Sound functions
  const playSound = (frequency: number, duration: number, type: 'sine' | 'square' | 'sawtooth' = 'sine') => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = type;
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration);
    } catch (error) {
      // Fallback if Web Audio API is not supported
      console.log('Audio not supported');
    }
  };

  const playStartSound = () => playSound(440, 0.5, 'sine');
  const playCorrectSound = () => {
    playSound(523, 0.2, 'sine'); // C5
    setTimeout(() => playSound(659, 0.2, 'sine'), 100); // E5
  };
  const playIncorrectSound = () => playSound(220, 0.5, 'square');
  const playWinSound = () => {
    playSound(523, 0.3, 'sine'); // C5
    setTimeout(() => playSound(659, 0.3, 'sine'), 200); // E5
    setTimeout(() => playSound(784, 0.3, 'sine'), 400); // G5
    setTimeout(() => playSound(1047, 0.5, 'sine'), 600); // C6
  };
  const playQuitSound = () => playSound(196, 0.8, 'sawtooth');

  // Ensure hooks run before early returns to keep stable order
  useEffect(() => {
    playStartSound();
  }, []);

  useEffect(() => {
    if (timeLeft > 0 && !isAnswered) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !isAnswered) {
      handleNext();
    }
  }, [timeLeft, isAnswered]);

  // Reset for new question and handle midway warning
  useEffect(() => {
    setSelectedAnswer(null);
    setIsAnswered(false);
    setTimeLeft(30);
    setFeedbackAnimation('');

    const total = randomizedQuestions.length;
    const midway = Math.floor(total / 2);
    const atMidway = currentQuestionIndex === midway && !hasShownWarning;
    if (atMidway) {
      setShowMidwayWarning(true);
      setHasShownWarning(true);
    }
  }, [currentQuestionIndex, randomizedQuestions.length, hasShownWarning]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">Loading quiz...</div>
      </div>
    );
  }

  if (!quiz || !quiz.questions || quiz.questions.length === 0 || randomizedQuestions.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Quiz Not Available</h1>
          <Button onClick={() => navigate('/quizzes')}>Back to Quizzes</Button>
        </div>
      </div>
    );
  }

  const currentQuestion = randomizedQuestions[currentQuestionIndex];
  const totalQuestions = randomizedQuestions.length;
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;
  const midwayPoint = Math.floor(totalQuestions / 2);
  const isAtMidway = currentQuestionIndex === midwayPoint && !hasShownWarning;
  const currentReward = (quiz.rewardProgression || []).find((r: any) => r.questionNumber === currentQuestionIndex + 1);
  const canQuit = currentQuestionIndex >= midwayPoint;


  const handleAnswerSelect = async (optionIndex: number) => {
    if (isAnswered) return;
    
    setSelectedAnswer(optionIndex);
    setIsAnswered(true);
    
    const isCorrect = optionIndex === currentQuestion.correctOption;
    
    // Animate feedback
    if (isCorrect) {
      setFeedbackAnimation('animate-pulse bg-green-100');
      const reward = currentReward?.correctReward || 0;
      const newBalance = playerBalance + reward;
      
      // Play correct sound
      playCorrectSound();
      
      // Show diamond overlay animation
      setDiamondOverlay({ show: true, amount: reward, type: 'correct' });
      setTimeout(() => setDiamondOverlay({ show: false, amount: 0, type: '' }), 2000);
      
      if (newBalance <= MAX_WALLET_BALANCE) {
        setAccumulatedReward(prev => prev + reward);
        setPlayerBalance(newBalance);
        
        // Update balance in database immediately
        await supabase
          .from('profiles')
          .update({ balance: newBalance })
          .eq('user_id', user!.id);
        
        // Record credit transaction
        await supabase.from('transactions').insert({
          user_id: user!.id,
          type: 'quiz_reward',
          amount: reward,
          status: 'completed',
          description: `Correct answer reward - ${quiz.title}`
        });
        
        // Update local transaction context
        addTransaction({
          type: 'quiz_reward',
          amount: reward,
          status: 'completed',
          description: `Correct answer reward - ${quiz.title}`
        });
        
        toast({
          title: "Correct! ✅",
          description: `You earned ${formatDiamonds(reward)}!`,
          className: "border-green-500 bg-green-50 text-green-800"
        });
      } else {
        toast({
          title: "Wallet Limit Reached! ⚠️",
          description: `You can't hold more than ${MAX_WALLET_BALANCE} diamonds`,
          variant: "destructive"
        });
      }
    } else {
      setFeedbackAnimation('animate-shake bg-red-100');
      const newBalance = playerBalance - quiz.penaltyAmount;
      setPlayerBalance(newBalance);
      
      // Update balance in database immediately
      await supabase
        .from('profiles')
        .update({ balance: newBalance })
        .eq('user_id', user!.id);
      
      // Record penalty transaction
      await supabase.from('transactions').insert({
        user_id: user!.id,
        type: 'quiz_fee',
        amount: quiz.penaltyAmount,
        status: 'completed',
        description: `Wrong answer penalty - ${quiz.title}`
      });
      
      // Update local transaction context
      addTransaction({
        type: 'quiz_fee',
        amount: -quiz.penaltyAmount,
        status: 'completed',
        description: `Wrong answer penalty - ${quiz.title}`
      });
      
      // Play incorrect sound
      playIncorrectSound();
      
      // Show penalty overlay animation
      setDiamondOverlay({ show: true, amount: quiz.penaltyAmount, type: 'incorrect' });
      setTimeout(() => setDiamondOverlay({ show: false, amount: 0, type: '' }), 2000);
      
      toast({
        title: "Incorrect ❌",
        description: `${formatDiamonds(quiz.penaltyAmount)} deducted from your balance`,
        variant: "destructive"
      });
    }
    
    // Store the answer
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = optionIndex;
    setAnswers(newAnswers);
    
    // Clear animation after delay
    setTimeout(() => setFeedbackAnimation(''), 1000);
  };

  const handleNext = async () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
        // Quiz completed, navigate to results
        const correctCount = answers.reduce((count, answer, index) => {
          return count + (answer === randomizedQuestions[index]?.correctOption ? 1 : 0);
        }, 0);
      
      const finalCorrectCount = selectedAnswer === currentQuestion.correctOption 
        ? correctCount + 1 
        : correctCount;
      
      const finalReward = finalCorrectCount > midwayPoint ? accumulatedReward : 0;
      
      // Record quiz attempt
      await supabase.from('quiz_attempts').insert({
        user_id: user!.id,
        quiz_id: quizId,
        score: finalCorrectCount,
        total_questions: totalQuestions,
        reward_earned: finalReward
      });
      
      // Show win animation and play sound if all questions correct
      if (finalCorrectCount === totalQuestions) {
        setShowWinAnimation(true);
        playWinSound();
        setTimeout(() => {
          navigate(`/quiz/${quizId}/results`, { 
            state: { 
              score: finalCorrectCount,
              totalQuestions,
              answers: [...answers, selectedAnswer || -1],
              quizTitle: quiz.title,
              finalReward: finalReward,
              balanceChange: finalReward - (quiz.entryFee + ((totalQuestions - finalCorrectCount) * quiz.penaltyAmount))
            }
          });
        }, 3000);
      } else {
        navigate(`/quiz/${quizId}/results`, { 
          state: { 
            score: finalCorrectCount,
            totalQuestions,
            answers: [...answers, selectedAnswer || -1],
            quizTitle: quiz.title,
            finalReward: finalReward,
            balanceChange: finalReward - (quiz.entryFee + ((totalQuestions - finalCorrectCount) * quiz.penaltyAmount))
          }
        });
      }
    }
  };

  const handleQuit = async () => {
    if (!canQuit) {
      toast({
        title: "Cannot Quit Yet",
        description: `You must complete at least ${midwayPoint + 1} questions before quitting`,
        variant: "destructive"
      });
      return;
    }

    // Play quit sound
    playQuitSound();

    const currentCorrect = answers.reduce((count, answer, index) => {
      return count + (answer === randomizedQuestions[index]?.correctOption ? 1 : 0);
    }, 0);
    
    // Record quiz attempt
    await supabase.from('quiz_attempts').insert({
      user_id: user!.id,
      quiz_id: quizId,
      score: currentCorrect,
      total_questions: currentQuestionIndex + 1,
      reward_earned: 0
    });
    
    navigate(`/quiz/${quizId}/results`, { 
      state: { 
        score: currentCorrect,
        totalQuestions: currentQuestionIndex + 1,
        answers: answers,
        quizTitle: quiz.title,
        finalReward: 0, // No reward for quitting
        balanceChange: -(quiz.entryFee + ((currentQuestionIndex + 1 - currentCorrect) * quiz.penaltyAmount)),
        isQuit: true
      }
    });
  };

  const getOptionStyle = (optionIndex: number) => {
    const baseStyle = 'w-full p-4 text-left rounded-lg border-2 transition-all duration-300';
    
    if (!isAnswered) {
      return `${baseStyle} ${selectedAnswer === optionIndex 
        ? 'border-primary bg-primary/10 text-primary transform scale-105' 
        : 'border-border hover:border-primary/50 hover:bg-primary/5'}`;
    }
    
    // Show correct/incorrect after answering with animations
    if (optionIndex === currentQuestion.correctOption) {
      return `${baseStyle} border-green-500 bg-green-50 text-green-800 animate-pulse`;
    }
    
    if (optionIndex === selectedAnswer && selectedAnswer !== currentQuestion.correctOption) {
      return `${baseStyle} border-red-500 bg-red-50 text-red-800 animate-shake`;
    }
    
    return `${baseStyle} border-border bg-muted text-muted-foreground opacity-60`;
  };

  return (
    <div className="min-h-screen bg-background relative">
      {/* Diamond Overlay Animation */}
      {diamondOverlay.show && (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
          <div className={`text-6xl font-bold animate-bounce ${
            diamondOverlay.type === 'correct' 
              ? 'text-green-500 animate-pulse' 
              : 'text-red-500 animate-shake'
          }`}>
            {diamondOverlay.type === 'correct' ? '+' : '-'}{formatDiamonds(diamondOverlay.amount)}
          </div>
        </div>
      )}

      {/* Win Animation Overlay */}
      {showWinAnimation && (
        <div className="fixed inset-0 z-50 bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 flex items-center justify-center animate-pulse">
          <div className="text-center text-white relative">
            {/* Explosion effect */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-32 h-32 bg-white rounded-full animate-ping opacity-30"></div>
              <div className="absolute w-48 h-48 bg-yellow-300 rounded-full animate-ping opacity-20 animation-delay-200"></div>
              <div className="absolute w-64 h-64 bg-amber-300 rounded-full animate-ping opacity-10 animation-delay-400"></div>
            </div>
            
            {/* Content */}
            <div className="relative z-10">
              <div className="text-8xl mb-4 animate-bounce">🎉</div>
              <div className="text-6xl font-bold mb-2 animate-pulse drop-shadow-lg">PERFECT!</div>
              <div className="text-3xl font-semibold animate-bounce drop-shadow-md">All Questions Correct!</div>
              <div className="text-xl mt-4 animate-pulse">Redirecting to results...</div>
              
              {/* Floating confetti */}
              <div className="absolute top-0 left-1/4 text-4xl animate-bounce animation-delay-100">🎊</div>
              <div className="absolute top-10 right-1/4 text-3xl animate-bounce animation-delay-300">✨</div>
              <div className="absolute bottom-20 left-1/3 text-5xl animate-bounce animation-delay-500">🏆</div>
              <div className="absolute bottom-10 right-1/3 text-3xl animate-bounce animation-delay-700">💎</div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className={`bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-6 transition-all duration-500 ${feedbackAnimation}`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-lg font-bold">{quiz.title}</h1>
            <p className="text-primary-foreground/80 text-sm">
              Question {currentQuestionIndex + 1} of {totalQuestions}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm text-primary-foreground/80">Balance</p>
              <p className="font-bold">{formatDiamonds(playerBalance)}</p>
            </div>
            <div className="flex items-center space-x-2">
              <Clock size={20} />
              <span className={`font-bold ${timeLeft <= 10 ? 'text-red-200 animate-pulse' : ''}`}>
                {timeLeft}s
              </span>
            </div>
          </div>
        </div>
        
        <Progress value={progress} className="h-2 bg-primary-foreground/20" />
        
        {/* Accumulated Reward Display */}
        <div className="flex items-center justify-between mt-3 text-sm">
          <div className="flex items-center space-x-2">
            <TrendUp size={16} />
            <span>Accumulated Reward: {formatDiamonds(accumulatedReward)}</span>
          </div>
          <div>
            Next Reward: {formatDiamonds(currentReward?.correctReward || 0)}
          </div>
        </div>
      </div>

      {/* Midway Warning */}
      {showMidwayWarning && (
        <div className="px-6 pt-6">
          <Alert className="border-orange-500 bg-orange-50 text-orange-800 animate-bounce">
            <Warning size={20} />
            <AlertDescription>
              <strong>Caution: Stakes are increasing!</strong> You're now past the halfway point. 
              Rewards are getting bigger, but so are the penalties. You can quit now if you want to keep your current winnings.
            </AlertDescription>
          </Alert>
        </div>
      )}

      <div className="px-6 py-6">
        {/* Question */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold leading-relaxed flex-1">
                {currentQuestion.text}
              </h2>
              <div className="text-right ml-4">
                <p className="text-sm text-muted-foreground">Reward</p>
                <p className="text-lg font-bold text-accent">
                  {formatDiamonds(currentReward?.correctReward || 0)}
                </p>
                <p className="text-xs text-destructive">
                  Penalty: -{formatDiamonds(quiz.penaltyAmount)}
                </p>
              </div>
            </div>
            
            {/* Options */}
            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  disabled={isAnswered}
                  className={getOptionStyle(index)}
                >
                  <div className="flex items-center">
                    <div className="w-6 h-6 rounded-full border-2 border-current flex items-center justify-center mr-3 text-sm font-bold">
                      {String.fromCharCode(65 + index)}
                    </div>
                    <span className="font-medium">{option}</span>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={handleNext}
            disabled={!isAnswered && timeLeft > 0}
            size="lg"
            className="w-full"
          >
            {currentQuestionIndex < totalQuestions - 1 ? (
              <>
                Next Question
                <ArrowRight size={20} className="ml-2" />
              </>
            ) : (
              'Finish Quiz'
            )}
          </Button>

          {canQuit && (
            <Button
              onClick={handleQuit}
              variant="destructive"
              size="lg"
              className="w-full"
            >
              Quit & Collect Current Winnings
            </Button>
          )}
        </div>

        {/* Answer feedback */}
        {isAnswered && (
          <Card className={`mt-4 transition-all duration-500 ${
            selectedAnswer === currentQuestion.correctOption 
              ? 'border-green-500 bg-green-50' 
              : 'border-red-500 bg-red-50'
          }`}>
            <CardContent className="p-4">
              <p className={`text-sm font-medium mb-1 ${
                selectedAnswer === currentQuestion.correctOption 
                  ? 'text-green-800' 
                  : 'text-red-800'
              }`}>
                {selectedAnswer === currentQuestion.correctOption 
                  ? `✅ Correct! +${formatDiamonds(currentReward?.correctReward || 0)}` 
                  : `❌ Incorrect! -${formatDiamonds(quiz.penaltyAmount)}`
                }
              </p>
              {selectedAnswer !== currentQuestion.correctOption && (
                <p className="text-sm text-red-600">
                  The correct answer was: {currentQuestion.options[currentQuestion.correctOption]}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Progress Summary */}
        <Card className="mt-4 bg-muted/50">
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm text-muted-foreground">Progress</p>
                <p className="font-bold">{currentQuestionIndex + 1}/{totalQuestions}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Current Balance</p>
                <p className="font-bold text-primary">{formatDiamonds(playerBalance)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Potential Reward</p>
                <p className="font-bold text-accent">{formatDiamonds(accumulatedReward)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}