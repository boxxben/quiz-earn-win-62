import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { mockQuestions } from '@/data/mockData';
import { useQuizAvailability } from '@/contexts/QuizAvailabilityContext';
import { Clock, ArrowRight, TrendUp, Warning } from '@phosphor-icons/react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { formatDiamonds } from '@/lib/currency';

export default function QuizPlayEnhanced() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { availableQuizzes } = useQuizAvailability();
  
  const quiz = availableQuizzes.find(q => q.id === quizId);
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

  if (!quiz) {
    navigate('/quizzes');
    return null;
  }

  const currentQuestion = mockQuestions[currentQuestionIndex];
  const totalQuestions = mockQuestions.length;
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;
  const midwayPoint = Math.floor(totalQuestions / 2);
  const isAtMidway = currentQuestionIndex === midwayPoint && !hasShownWarning;
  const currentReward = quiz.rewardProgression.find(r => r.questionNumber === currentQuestionIndex + 1);
  const canQuit = currentQuestionIndex >= midwayPoint;

  // Timer effect
  useEffect(() => {
    if (timeLeft > 0 && !isAnswered) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !isAnswered) {
      handleNext();
    }
  }, [timeLeft, isAnswered]);

  // Reset for new question
  useEffect(() => {
    setSelectedAnswer(null);
    setIsAnswered(false);
    setTimeLeft(30);
    setFeedbackAnimation('');
    
    // Show midway warning
    if (isAtMidway) {
      setShowMidwayWarning(true);
      setHasShownWarning(true);
    }
  }, [currentQuestionIndex]);

  const handleAnswerSelect = (optionIndex: number) => {
    if (isAnswered) return;
    
    setSelectedAnswer(optionIndex);
    setIsAnswered(true);
    
    const isCorrect = optionIndex === currentQuestion.correctOption;
    
    // Animate feedback
    if (isCorrect) {
      setFeedbackAnimation('animate-pulse bg-green-100');
      const reward = currentReward?.correctReward || 0;
      const newBalance = playerBalance + reward;
      if (newBalance <= 2000) {
        setAccumulatedReward(prev => prev + reward);
        toast({
          title: "Correct! ✅",
          description: `You earned ${formatDiamonds(reward)}!`,
          className: "border-green-500 bg-green-50 text-green-800"
        });
      } else {
        toast({
          title: "Wallet Limit Reached! ⚠️",
          description: "You can't hold more than 2000 diamonds",
          variant: "destructive"
        });
      }
    } else {
      setFeedbackAnimation('animate-shake bg-red-100');
      setPlayerBalance(prev => prev - quiz.penaltyAmount);
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

  const handleNext = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Quiz completed, navigate to results
      const correctCount = answers.reduce((count, answer, index) => {
        return count + (answer === mockQuestions[index]?.correctOption ? 1 : 0);
      }, 0);
      
      const finalCorrectCount = selectedAnswer === currentQuestion.correctOption 
        ? correctCount + 1 
        : correctCount;
      
      const finalReward = finalCorrectCount > midwayPoint ? accumulatedReward : 0;
      
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
  };

  const handleQuit = () => {
    if (!canQuit) {
      toast({
        title: "Cannot Quit Yet",
        description: `You must complete at least ${midwayPoint + 1} questions before quitting`,
        variant: "destructive"
      });
      return;
    }

    const currentCorrect = answers.reduce((count, answer, index) => {
      return count + (answer === mockQuestions[index]?.correctOption ? 1 : 0);
    }, 0);
    
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
    <div className="min-h-screen bg-background">
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