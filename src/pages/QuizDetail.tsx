import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTransactions } from '@/contexts/TransactionContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useQuizAvailability } from '@/contexts/QuizAvailabilityContext';
import { formatCurrency, formatDiamonds } from '@/lib/currency';
import { supabase } from '@/integrations/supabase/client';
import { 
  ArrowLeft, 
  Clock, 
  Users, 
  Coins, 
  Trophy,
  CheckCircle,
  Info,
  Crown,
  Lock
} from '@phosphor-icons/react';

export default function QuizDetail() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const { addTransaction } = useTransactions();
  const { toast } = useToast();
  
  const [quiz, setQuiz] = React.useState<any>(null);
  const [hasAttempted, setHasAttempted] = React.useState(false);
  const [isCheckingAttempt, setIsCheckingAttempt] = React.useState(true);
  const [customEntryFee, setCustomEntryFee] = useState<number>(0);
  const [isVipQuiz, setIsVipQuiz] = useState(false);

  const isVipActive = user?.isVip && user?.vipExpiresAt && new Date(user.vipExpiresAt) > new Date();

  React.useEffect(() => {
    const fetchQuizAndAttempt = async () => {
      const { data: quizData } = await supabase.from('quizzes').select('*').eq('id', quizId).single();
      
      if (quizData) {
        // Map database fields to component format
        setQuiz({
          id: quizData.id,
          title: quizData.title,
          description: quizData.description,
          entryFee: quizData.entry_fee,
          prizePool: quizData.prize_pool,
          startTime: new Date(quizData.start_time),
          endTime: new Date(quizData.end_time),
          duration: quizData.duration,
          status: quizData.status,
          isAvailable: quizData.is_available,
          penaltyAmount: quizData.penalty_amount,
          isVip: quizData.is_vip
        });
        setIsVipQuiz(quizData.is_vip);
        setCustomEntryFee(quizData.entry_fee);
      }
      
      if (user) {
        const { data: attempts } = await supabase
          .from('quiz_attempts')
          .select('id')
          .eq('quiz_id', quizId)
          .eq('user_id', user.id);
        
        setHasAttempted(attempts && attempts.length > 0);
      }
      
      setIsCheckingAttempt(false);
    };
    
    fetchQuizAndAttempt();
  }, [quizId, user]);
  
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

  const getEffectiveEntryFee = () => {
    if (isVipQuiz && isVipActive) {
      return customEntryFee;
    }
    return quiz.entryFee;
  };

  const getEffectivePrizePool = () => {
    if (isVipQuiz && isVipActive) {
      return customEntryFee * 2; // 2x the entry fee for VIP quizzes
    }
    return quiz.prizePool;
  };

  const canJoin = () => {
    if (!user) return false;
    if (hasAttempted) return false;
    // VIP quiz restriction
    if (isVipQuiz && !isVipActive) return false;
    const effectiveFee = getEffectiveEntryFee();
    if (user.balance < effectiveFee) return false;
    if (!quiz.isAvailable) return false;
    if (quiz.status === 'completed') return false;
    return true;
  };

  const handleJoinQuiz = async () => {
    if (!canJoin()) return;
    
    const effectiveFee = getEffectiveEntryFee();
    const effectivePrize = getEffectivePrizePool();
    
    if (user!.balance < effectiveFee) {
      toast({
        title: 'Insufficient Balance',
        description: `You need ${formatDiamonds(effectiveFee)} to join this quiz. Please add money to your wallet.`,
        variant: 'destructive'
      });
      return;
    }

    const newBalance = user!.balance - effectiveFee;

    // Update balance in database immediately
    const { error: balanceError } = await supabase
      .from('profiles')
      .update({ balance: newBalance })
      .eq('user_id', user!.id);

    if (balanceError) {
      toast({
        title: 'Error',
        description: 'Failed to process entry fee. Please try again.',
        variant: 'destructive'
      });
      return;
    }

    // Mark quiz as unavailable and update entry fee/prize if VIP
    const quizUpdate: any = { is_available: false };
    if (isVipQuiz && isVipActive) {
      quizUpdate.entry_fee = effectiveFee;
      quizUpdate.prize_pool = effectivePrize;
    }
    
    await supabase
      .from('quizzes')
      .update(quizUpdate)
      .eq('id', quizId);

    // Record transaction in database
    await supabase.from('transactions').insert({
      user_id: user!.id,
      type: 'quiz_fee',
      amount: -effectiveFee,
      status: 'completed',
      description: `Quiz entry fee - ${quiz.title}`
    });

    // Update local state
    updateUser({ balance: newBalance });
    addTransaction({
      type: 'quiz_fee',
      amount: -effectiveFee,
      status: 'completed',
      description: `Quiz entry fee - ${quiz.title}`
    });

    
    // Navigate to quiz play
    navigate(`/quiz/${quizId}/play`);
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
                <div className="flex items-center gap-2 mb-2">
                  <CardTitle className="text-xl">{quiz.title}</CardTitle>
                  {isVipQuiz && (
                    <Badge className="bg-yellow-500 text-yellow-950">
                      <Crown size={12} className="mr-1" weight="fill" />
                      VIP
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground mb-3">{quiz.description}</p>
              </div>
              {quiz.status === 'active' && (
                <Badge className="bg-accent text-accent-foreground">LIVE</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* VIP Quiz - Custom Entry Fee */}
            {isVipQuiz && isVipActive && (
              <Card className="border-yellow-500/30 bg-yellow-500/5">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-2 text-yellow-600">
                    <Crown size={20} weight="fill" />
                    <span className="font-semibold">VIP Privilege - Set Your Entry Fee</span>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="entryFee">Entry Fee (Diamonds)</Label>
                    <Input
                      id="entryFee"
                      type="number"
                      min={1}
                      max={user?.balance || 100}
                      value={customEntryFee}
                      onChange={(e) => setCustomEntryFee(Math.max(1, parseInt(e.target.value) || 1))}
                      className="border-yellow-500/30"
                    />
                    <p className="text-xs text-muted-foreground">
                      Prize Pool: <span className="font-bold text-yellow-600">{formatDiamonds(customEntryFee * 2)}</span> (2x entry fee)
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* VIP Quiz - Not a VIP user warning */}
            {isVipQuiz && !isVipActive && (
              <Card className="border-yellow-500/30 bg-yellow-500/5">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-yellow-600 mb-2">
                    <Lock size={20} />
                    <span className="font-semibold">VIP Only Quiz</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    This quiz is exclusive to VIP members. Upgrade to VIP to access this quiz and set your own entry fees!
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Prize Pool */}
            <div className="text-center p-4 bg-accent/10 rounded-lg">
              <Trophy size={32} className="mx-auto mb-2 text-accent" />
              <p className="text-2xl font-bold text-accent">{formatDiamonds(getEffectivePrizePool())}</p>
              <p className="text-sm text-muted-foreground">Total Prize Pool</p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 border rounded-lg">
                <Coins size={20} className="mx-auto mb-1 text-primary" />
                <p className="font-semibold">{formatDiamonds(getEffectiveEntryFee())}</p>
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
          {hasAttempted && (
            <Card className="border-destructive/30 bg-destructive/5">
              <CardContent className="p-4 text-center">
                <p className="text-sm text-destructive mb-2">Already Attempted</p>
                <p className="text-xs text-muted-foreground">You cannot retake a quiz you've already attempted</p>
              </CardContent>
            </Card>
          )}
          
          {!canJoin() && user && user.balance < quiz.entryFee && !hasAttempted && (
            <Card className="border-destructive/30 bg-destructive/5">
              <CardContent className="p-4 text-center">
                <p className="text-sm text-destructive mb-2">Insufficient Balance</p>
                <p className="text-xs text-muted-foreground mb-3">
                  You need {formatDiamonds(quiz.entryFee - user.balance)} more to join this quiz
                </p>
                <Button asChild size="sm" variant="outline">
                  <a href="/wallet/deposit">Add Money</a>
                </Button>
              </CardContent>
            </Card>
          )}
          
          {!quiz.isAvailable && !hasAttempted && (
            <Card className="border-destructive/30 bg-destructive/5">
              <CardContent className="p-4 text-center">
                <p className="text-sm text-destructive">Quiz Taken</p>
                <p className="text-xs text-muted-foreground">Someone else has already started this quiz</p>
              </CardContent>
            </Card>
          )}

          <Button 
            onClick={handleJoinQuiz}
            disabled={!canJoin() || isCheckingAttempt}
            size="lg"
            className={`w-full ${isVipQuiz ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600' : ''}`}
          >
            {isCheckingAttempt ? 'Loading...' : 
             hasAttempted ? 'Already Attempted' : 
             isVipQuiz && !isVipActive ? 'VIP Only' :
             `${quiz.status === 'active' ? 'Join Now' : 'Join Quiz'} - ${formatDiamonds(getEffectiveEntryFee())}`}
          </Button>
        </div>
      </div>

      <div className="pb-6"></div>
    </div>
  );
}