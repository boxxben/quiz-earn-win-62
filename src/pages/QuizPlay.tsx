import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useQuizAvailability } from '@/contexts/QuizAvailabilityContext';
import { Clock, ArrowRight } from '@phosphor-icons/react';

export default function QuizPlay() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const { availableQuizzes } = useQuizAvailability();
  
  const quiz = availableQuizzes.find(q => q.id === quizId);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isAnswered, setIsAnswered] = useState(false);

  if (!quiz) {
    navigate('/quizzes');
    return null;
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const totalQuestions = quiz.questions.length;
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
        return count + (answer === quiz.questions[index]?.correctOption ? 1 : 0);
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

  const getMillionaireOptionStyle = (optionIndex: number) => {
    if (!isAnswered) {
      return selectedAnswer === optionIndex 
        ? 'border-yellow-400 bg-blue-600/50 shadow-lg shadow-yellow-400/50' 
        : 'border-blue-400 bg-blue-700/50 hover:border-yellow-400 hover:bg-blue-600/50 hover:shadow-lg hover:shadow-blue-400/30';
    }
    
    // Show correct/incorrect after answering
    if (optionIndex === currentQuestion.correctOption) {
      return 'border-green-400 bg-green-600/30 shadow-lg shadow-green-400/50';
    }
    
    if (optionIndex === selectedAnswer && selectedAnswer !== currentQuestion.correctOption) {
      return 'border-red-400 bg-red-600/30 shadow-lg shadow-red-400/50';
    }
    
    return 'border-blue-400 bg-blue-700/30 opacity-60';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-32 h-32 border border-white/20 rounded-full"></div>
        <div className="absolute top-40 right-32 w-24 h-24 border border-white/20 rounded-full"></div>
        <div className="absolute bottom-40 left-1/4 w-16 h-16 border border-white/20 rounded-full"></div>
      </div>

      {/* Header */}
      <div className="relative z-10 text-center py-6">
        <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-black mx-auto w-fit px-8 py-3 rounded-full shadow-lg">
          <h1 className="text-xl font-bold">{quiz.title}</h1>
        </div>
        
        <div className="mt-4 flex justify-center items-center space-x-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20">
            <p className="text-white/80 text-sm">Question {currentQuestionIndex + 1} of {totalQuestions}</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20 flex items-center space-x-2">
            <Clock size={20} className="text-white" />
            <span className={`font-bold text-white ${timeLeft <= 10 ? 'text-red-300' : 'text-white'}`}>
              {timeLeft}s
            </span>
          </div>
        </div>
        
        <div className="mt-4 mx-8">
          <Progress value={progress} className="h-3 bg-white/20" />
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[60vh] px-6">
        
        {/* Question Display */}
        <div className="w-full max-w-4xl mb-12">
          <div className="bg-gradient-to-r from-blue-800 to-blue-700 rounded-lg p-8 border-4 border-yellow-400 shadow-2xl">
            <h2 className="text-white text-2xl md:text-3xl font-bold text-center leading-relaxed">
              {currentQuestion.text}
            </h2>
          </div>
        </div>

        {/* Answer Options - 2x2 Grid */}
        <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-6">
          {currentQuestion.options.map((option, index) => {
            const letters = ['A', 'B', 'C', 'D'];
            return (
              <button
                key={index}
                onClick={() => handleAnswerSelect(index)}
                disabled={isAnswered}
                className={`group relative p-6 rounded-lg border-4 transition-all duration-300 transform hover:scale-105 ${getMillionaireOptionStyle(index)}`}
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center border-2 border-yellow-300 shadow-lg">
                    <span className="text-black text-xl font-bold">{letters[index]}:</span>
                  </div>
                  <span className="text-white text-lg md:text-xl font-semibold flex-1 text-left">
                    {option}
                  </span>
                </div>
                
                {/* Glow effect for selected/correct answers */}
                {isAnswered && index === currentQuestion.correctOption && (
                  <div className="absolute inset-0 rounded-lg bg-green-400/20 border-4 border-green-400 animate-pulse"></div>
                )}
                {isAnswered && index === selectedAnswer && selectedAnswer !== currentQuestion.correctOption && (
                  <div className="absolute inset-0 rounded-lg bg-red-400/20 border-4 border-red-400"></div>
                )}
              </button>
            );
          })}
        </div>

        {/* Next Button */}
        {isAnswered && (
          <div className="mt-12">
            <Button
              onClick={handleNext}
              size="lg"
              className="bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-300 hover:to-yellow-500 text-black font-bold px-12 py-4 text-xl rounded-full border-4 border-yellow-300 shadow-2xl transform hover:scale-105 transition-all duration-300"
            >
              {currentQuestionIndex < totalQuestions - 1 ? (
                <>
                  Next Question
                  <ArrowRight size={24} className="ml-2" />
                </>
              ) : (
                'Finish Quiz'
              )}
            </Button>
          </div>
        )}

        {/* Answer feedback */}
        {isAnswered && (
          <div className="mt-8 text-center">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-6 py-4 border border-white/20">
              <p className="text-white text-xl font-bold mb-2">
                {selectedAnswer === currentQuestion.correctOption ? '✅ Correct!' : '❌ Incorrect'}
              </p>
              {selectedAnswer !== currentQuestion.correctOption && (
                <p className="text-white/80">
                  The correct answer was: <span className="font-semibold text-yellow-300">{currentQuestion.options[currentQuestion.correctOption]}</span>
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}