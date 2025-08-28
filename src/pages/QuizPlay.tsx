import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { mockQuizzes, mockQuestions } from '@/data/mockData';
import { Clock, ArrowRight } from '@phosphor-icons/react';

export default function QuizPlay() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  
  const quiz = mockQuizzes.find(q => q.id === quizId);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isAnswered, setIsAnswered] = useState(false);

  if (!quiz) {
    navigate('/quizzes');
    return null;
  }

  const currentQuestion = mockQuestions[currentQuestionIndex];
  const totalQuestions = mockQuestions.length;
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;

  // Timer effect
  useEffect(() => {
    if (timeLeft > 0 && !isAnswered) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !isAnswered) {
      // Auto submit when time runs out
      handleNext();
    }
  }, [timeLeft, isAnswered]);

  // Reset for new question
  useEffect(() => {
    setSelectedAnswer(null);
    setIsAnswered(false);
    setTimeLeft(30);
  }, [currentQuestionIndex]);

  const handleAnswerSelect = (optionIndex: number) => {
    if (isAnswered) return;
    
    setSelectedAnswer(optionIndex);
    setIsAnswered(true);
    
    // Store the answer
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = optionIndex;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Quiz completed, navigate to results
      const correctCount = answers.reduce((count, answer, index) => {
        return count + (answer === mockQuestions[index]?.correctOption ? 1 : 0);
      }, 0);
      
      // Add current answer if selected
      const finalCorrectCount = selectedAnswer === currentQuestion.correctOption 
        ? correctCount + 1 
        : correctCount;
      
      navigate(`/quiz/${quizId}/results`, { 
        state: { 
          score: finalCorrectCount,
          totalQuestions,
          answers: [...answers, selectedAnswer || -1],
          quizTitle: quiz.title
        }
      });
    }
  };

  const getOptionStyle = (optionIndex: number) => {
    if (!isAnswered) {
      return selectedAnswer === optionIndex 
        ? 'border-primary bg-primary/10 text-primary' 
        : 'border-border hover:border-primary/50';
    }
    
    // Show correct/incorrect after answering
    if (optionIndex === currentQuestion.correctOption) {
      return 'border-accent bg-accent text-accent-foreground';
    }
    
    if (optionIndex === selectedAnswer && selectedAnswer !== currentQuestion.correctOption) {
      return 'border-destructive bg-destructive text-destructive-foreground';
    }
    
    return 'border-border bg-muted text-muted-foreground';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-lg font-bold">{quiz.title}</h1>
            <p className="text-primary-foreground/80 text-sm">
              Question {currentQuestionIndex + 1} of {totalQuestions}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Clock size={20} />
            <span className={`font-bold ${timeLeft <= 10 ? 'text-red-200' : ''}`}>
              {timeLeft}s
            </span>
          </div>
        </div>
        
        <Progress value={progress} className="h-2 bg-primary-foreground/20" />
      </div>

      <div className="px-6 py-6">
        {/* Question */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-6 leading-relaxed">
              {currentQuestion.text}
            </h2>
            
            {/* Options */}
            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  disabled={isAnswered}
                  className={`w-full p-4 text-left rounded-lg border-2 transition-all ${getOptionStyle(index)}`}
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

        {/* Next Button */}
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

        {/* Answer feedback */}
        {isAnswered && (
          <Card className="mt-4 border-accent/30 bg-accent/5">
            <CardContent className="p-4">
              <p className="text-sm font-medium text-accent mb-1">
                {selectedAnswer === currentQuestion.correctOption ? '✅ Correct!' : '❌ Incorrect'}
              </p>
              {selectedAnswer !== currentQuestion.correctOption && (
                <p className="text-sm text-muted-foreground">
                  The correct answer was: {currentQuestion.options[currentQuestion.correctOption]}
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}