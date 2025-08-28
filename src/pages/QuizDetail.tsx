import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTransactions } from '@/contexts/TransactionContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { mockQuizzes } from '@/data/mockData';
import { formatCurrency } from '@/lib/currency';
import { 
  ArrowLeft, 
  Clock, 
  Users, 
  Coins, 
  Trophy,
  CheckCircle,
  Info
} from '@phosphor-icons/react';

export default function QuizDetail() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const { addTransaction } = useTransactions();
  const { toast } = useToast();
  
  const quiz = mockQuizzes.find(q => q.id === quizId);
  
  if (!quiz) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Quiz Not Found</h1>
          <Button onClick={() => navigate('/quizzes')}>Back to Quizzes</Button>
        </div>
      </div>
    );
  }

  
  
  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    
    if (diff < 0) return 'Active Now';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const canJoin = () => {
    if (!user) return false;
    if (user.balance < quiz.entryFee) return false;
    if (!quiz.isAvailable) return false;
    if (quiz.status === 'completed') return false;
    return true;
  };

  const handleJoinQuiz = () => {
    if (!canJoin()) return;
    
    if (user!.balance < quiz.entryFee) {
      toast({
        title: 'Insufficient Balance',
        description: `You need ${formatCurrency(quiz.entryFee)} to join this quiz. Please add money to your wallet.`,
        variant: 'destructive'
      });
      return;
    }

    // Deduct entry fee
    updateUser({ balance: user!.balance - quiz.entryFee });

    // Record transaction for entry fee
    addTransaction({
      type: 'quiz_fee',
      amount: -quiz.entryFee,
      status: 'completed',
      description: `Quiz entry fee - ${quiz.title}`
    });

    toast({
      title: 'Quiz Joined!',
      description: `${formatCurrency(quiz.entryFee)} has been deducted from your wallet. Good luck!`,
    });
    
    // Navigate to quiz play
    navigate(`/quiz/${quiz.id}/play`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-6">
        <div className="flex items-center mb-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/quizzes')} className="text-primary-foreground hover:bg-white/20">
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-xl font-bold ml-4">Quiz Details</h1>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Quiz Info */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-xl mb-2">{quiz.title}</CardTitle>
                <p className="text-muted-foreground mb-3">{quiz.description}</p>
              </div>
              {quiz.status === 'active' && (
                <Badge className="bg-accent text-accent-foreground">LIVE</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Prize Pool */}
            <div className="text-center p-4 bg-accent/10 rounded-lg">
              <Trophy size={32} className="mx-auto mb-2 text-accent" />
              <p className="text-2xl font-bold text-accent">{formatCurrency(quiz.prizePool)}</p>
              <p className="text-sm text-muted-foreground">Total Prize Pool</p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 border rounded-lg">
                <Coins size={20} className="mx-auto mb-1 text-primary" />
                <p className="font-semibold">{formatCurrency(quiz.entryFee)}</p>
                <p className="text-xs text-muted-foreground">Entry Fee</p>
              </div>
              <div className="text-center p-3 border rounded-lg">
                <Clock size={20} className="mx-auto mb-1 text-orange-500" />
                <p className="font-semibold">{quiz.duration} min</p>
                <p className="text-xs text-muted-foreground">Duration</p>
              </div>
            </div>

            {/* Participation */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Availability</span>
                <span className={`text-sm font-semibold ${quiz.isAvailable ? 'text-green-600' : 'text-destructive'}`}>
                  {quiz.isAvailable ? 'Available' : 'Taken'}
                </span>
              </div>
              <Progress value={quiz.isAvailable ? 100 : 0} className="h-2" />
            </div>

            {/* Timing */}
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center">
                <Clock size={16} className="mr-2" />
                <span className="text-sm font-medium">
                  {quiz.status === 'active' ? 'Ends in' : 'Starts in'}
                </span>
              </div>
              <span className="text-sm font-semibold text-primary">
                {quiz.status === 'active' ? formatTime(quiz.endTime) : formatTime(quiz.startTime)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Rules */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Info size={20} className="mr-2" />
              Quiz Rules
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start space-x-3">
              <CheckCircle size={16} className="text-accent mt-0.5" />
              <p className="text-sm">Each question has a 30-second time limit</p>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle size={16} className="text-accent mt-0.5" />
              <p className="text-sm">Choose the best answer from 4 options</p>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle size={16} className="text-accent mt-0.5" />
              <p className="text-sm">Top performers win prizes from the pool</p>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle size={16} className="text-accent mt-0.5" />
              <p className="text-sm">Once started, the quiz cannot be paused</p>
            </div>
          </CardContent>
        </Card>

        {/* Prize Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Prize Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center p-2 bg-yellow-50 dark:bg-yellow-950 rounded">
                <span className="text-sm font-medium">🥇 1st Place</span>
                <span className="text-sm font-bold">{formatCurrency(Math.floor(quiz.prizePool * 0.5))}</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-900 rounded">
                <span className="text-sm font-medium">🥈 2nd Place</span>
                <span className="text-sm font-bold">{formatCurrency(Math.floor(quiz.prizePool * 0.3))}</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-orange-50 dark:bg-orange-950 rounded">
                <span className="text-sm font-medium">🥉 3rd Place</span>
                <span className="text-sm font-bold">{formatCurrency(Math.floor(quiz.prizePool * 0.2))}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Join Button */}
        <div className="space-y-3">
          {!canJoin() && user && user.balance < quiz.entryFee && (
            <Card className="border-destructive/30 bg-destructive/5">
              <CardContent className="p-4 text-center">
                <p className="text-sm text-destructive mb-2">Insufficient Balance</p>
                <p className="text-xs text-muted-foreground mb-3">
                  You need {formatCurrency(quiz.entryFee - user.balance)} more to join this quiz
                </p>
                <Button asChild size="sm" variant="outline">
                  <a href="/wallet/deposit">Add Money</a>
                </Button>
              </CardContent>
            </Card>
          )}
          
          {!quiz.isAvailable && (
            <Card className="border-destructive/30 bg-destructive/5">
              <CardContent className="p-4 text-center">
                <p className="text-sm text-destructive">Quiz Taken</p>
                <p className="text-xs text-muted-foreground">Someone else has already started this quiz</p>
              </CardContent>
            </Card>
          )}

          <Button 
            onClick={handleJoinQuiz}
            disabled={!canJoin()}
            size="lg"
            className="w-full"
          >
            {quiz.status === 'active' ? 'Join Now' : 'Join Quiz'} - {formatCurrency(quiz.entryFee)}
          </Button>
        </div>
      </div>

      <div className="pb-6"></div>
    </div>
  );
}