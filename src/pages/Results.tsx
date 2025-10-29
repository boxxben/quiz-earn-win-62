import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTransactions } from '@/contexts/TransactionContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Trophy, 
  CheckCircle, 
  XCircle, 
  House, 
  Coins,
  Target,
  Clock
} from '@phosphor-icons/react';
import { formatCurrency } from '@/lib/currency';
import { MAX_WALLET_BALANCE } from '@/lib/constants';
import { supabase } from '@/integrations/supabase/client';

export default function Results() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const { addTransaction } = useTransactions();
  const { toast } = useToast();
  
  const { score, totalQuestions, answers, quizTitle, finalReward, balanceChange, isQuit } = location.state || {};
  const quizId = location.pathname.split('/')[2]; // Extract quizId from URL
  
  if (!score && score !== 0) {
    navigate('/home');
    return null;
  }

  const percentage = Math.round((score / totalQuestions) * 100);
  const rank = Math.ceil(Math.random() * 15) + 1; // Mock rank
  
  // Calculate earnings based on performance
  const calculateEarnings = () => {
    if (percentage >= 90) return 2500; // Top performer
    if (percentage >= 80) return 1500; // Good performer
    if (percentage >= 70) return 800;  // Average performer
    if (percentage >= 60) return 400;  // Below average
    return 0; // No earnings for <60%
  };

  const earnings = calculateEarnings();
  
  React.useEffect(() => {
    if (user && quizId) {
      // Calculate new balance but enforce limit
      const newBalance = Math.min(user.balance + earnings, MAX_WALLET_BALANCE);
      
      // Update user stats
      updateUser({
        balance: newBalance,
        totalEarnings: (user.totalEarnings || 0) + earnings,
        quizzesPlayed: (user.quizzesPlayed || 0) + 1,
        quizzesWon: percentage >= 70 ? (user.quizzesWon || 0) + 1 : user.quizzesWon
      });

      // Save quiz attempt and mark quiz as unavailable
      const saveAttempt = async () => {
        // Insert quiz attempt
        const { error: attemptError } = await supabase
          .from('quiz_attempts')
          .insert({
            user_id: user.id,
            quiz_id: quizId,
            score: score,
            total_questions: totalQuestions,
            reward_earned: earnings
          });
        
        if (attemptError) {
          console.error('Error saving quiz attempt:', attemptError);
        }

        // Mark quiz as unavailable (no one can take it again)
        const { error: updateError } = await supabase
          .from('quizzes')
          .update({ is_available: false })
          .eq('id', quizId);
        
        if (updateError) {
          console.error('Error marking quiz unavailable:', updateError);
        }
      };
      
      saveAttempt();

      // Record transaction for earnings (if any)
      if (earnings > 0) {
        addTransaction({
          type: 'quiz_reward',
          amount: earnings,
          status: 'completed',
          description: `Quiz reward - ${quizTitle || 'Quiz'} (${percentage}% score)`
        });

        toast({
          title: 'Congratulations! 🎉',
          description: `You earned ${formatCurrency(earnings)} for your performance!`,
        });
      }
    }
  }, []);

  const getPerformanceMessage = () => {
    if (percentage >= 90) return { message: "Outstanding! 🏆", color: "text-yellow-600" };
    if (percentage >= 80) return { message: "Excellent! 🎯", color: "text-accent" };
    if (percentage >= 70) return { message: "Good Job! 👍", color: "text-blue-600" };
    if (percentage >= 60) return { message: "Keep Practicing! 📚", color: "text-orange-600" };
    return { message: "Better Luck Next Time! 💪", color: "text-muted-foreground" };
  };

  const { message, color } = getPerformanceMessage();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-6 text-center">
        <Trophy size={48} className="mx-auto mb-4 text-primary-foreground" />
        <h1 className="text-2xl font-bold mb-2">Quiz Complete!</h1>
        <p className="text-primary-foreground/80">{quizTitle}</p>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Score Card */}
        <Card className="text-center">
          <CardContent className="p-6">
            <div className="mb-4">
              <div className="text-6xl font-bold text-primary mb-2">{percentage}%</div>
              <p className={`text-lg font-semibold ${color}`}>{message}</p>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div>
                <div className="flex items-center justify-center mb-1">
                  <CheckCircle size={20} className="text-accent mr-1" />
                </div>
                <p className="text-2xl font-bold text-accent">{score}</p>
                <p className="text-sm text-muted-foreground">Correct</p>
              </div>
              <div>
                <div className="flex items-center justify-center mb-1">
                  <XCircle size={20} className="text-destructive mr-1" />
                </div>
                <p className="text-2xl font-bold text-destructive">{totalQuestions - score}</p>
                <p className="text-sm text-muted-foreground">Incorrect</p>
              </div>
              <div>
                <div className="flex items-center justify-center mb-1">
                  <Target size={20} className="text-primary mr-1" />
                </div>
                <p className="text-2xl font-bold text-primary">#{rank}</p>
                <p className="text-sm text-muted-foreground">Your Rank</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Earnings */}
        {earnings > 0 ? (
          <Card className="border-accent/30 bg-accent/5">
            <CardContent className="p-6 text-center">
              <Coins size={32} className="mx-auto mb-3 text-accent" />
              <p className="text-2xl font-bold text-accent mb-2">{formatCurrency(earnings)}</p>
              <p className="text-sm text-muted-foreground">Added to your wallet!</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
            <CardContent className="p-6 text-center">
              <Clock size={32} className="mx-auto mb-3 text-orange-600" />
              <p className="font-medium text-orange-800 dark:text-orange-200 mb-2">No Earnings This Time</p>
              <p className="text-sm text-orange-700 dark:text-orange-300">
                Score 60% or higher to earn money from quizzes
              </p>
            </CardContent>
          </Card>
        )}

        {/* Performance Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Performance Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">Questions Answered</span>
              <span className="font-semibold">{totalQuestions}/{totalQuestions}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Accuracy Rate</span>
              <Badge variant={percentage >= 70 ? "default" : "secondary"} className={percentage >= 70 ? "bg-accent text-accent-foreground" : ""}>
                {percentage}%
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Time Performance</span>
              <span className="font-semibold">Good ⚡</span>
            </div>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">What's Next?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild variant="outline" className="w-full justify-start">
              <a href="/quizzes">
                <Trophy size={16} className="mr-2" />
                Join Another Quiz
              </a>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <a href="/leaderboard">
                <Target size={16} className="mr-2" />
                View Leaderboard
              </a>
            </Button>
            {earnings > 0 && (
              <Button asChild variant="outline" className="w-full justify-start">
                <a href="/wallet">
                  <Coins size={16} className="mr-2" />
                  Check Your Wallet
                </a>
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button onClick={() => navigate('/home')} size="lg" className="w-full">
            <House size={20} className="mr-2" />
            Back to Home
          </Button>
        </div>
      </div>

      <div className="pb-6"></div>
    </div>
  );
}