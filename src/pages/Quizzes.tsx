import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuizAvailability } from '@/contexts/QuizAvailabilityContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/currency';
import { 
  MagnifyingGlass, 
  Clock, 
  Users, 
  Coins, 
  Fire,
  FunnelSimple
} from '@phosphor-icons/react';

const entryFees = ['All', '0-10', '11-20', '21-100', '100+'];

export default function Quizzes() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { availableQuizzes, startQuiz, refreshQuizzes } = useQuizAvailability();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFeeRange, setSelectedFeeRange] = useState('All');
  const [startingQuiz, setStartingQuiz] = useState<string | null>(null);

  // Refresh quizzes when component mounts
  React.useEffect(() => {
    refreshQuizzes();
  }, []);

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    
    if (diff < 0) return 'Active Now';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) return `Starts in ${hours}h ${minutes}m`;
    return `Starts in ${minutes}m`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-accent text-accent-foreground';
      case 'upcoming':
        return 'bg-primary text-primary-foreground';
      case 'completed':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-secondary text-secondary-foreground';
    }
  };

  const handleJoinQuiz = async (quizId: string, entryFee: number) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in to join quizzes",
        variant: "destructive"
      });
      navigate('/login');
      return;
    }

    // Check minimum balance (entry fee)
    if (user.balance < entryFee) {
      toast({
        title: "Insufficient Balance",
        description: `You need ${formatCurrency(entryFee)} to join this quiz`,
        variant: "destructive"
      });
      navigate('/deposit');
      return;
    }

    setStartingQuiz(quizId);
    
    const success = await startQuiz(quizId);
    
    if (success) {
      toast({
        title: "Quiz Started! 🎉",
        description: "Good luck! Remember, you can't quit until halfway through.",
        className: "border-green-500 bg-green-50 text-green-800"
      });
      navigate(`/quiz/${quizId}/play`);
    } else {
      toast({
        title: "Quiz Unavailable",
        description: "This quiz is no longer available. Someone else took the last spot!",
        variant: "destructive"
      });
    }
    
    setStartingQuiz(null);
  };

  const filterQuizzes = () => {
    return availableQuizzes.filter(quiz => {
      const matchesSearch = quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           quiz.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFee = selectedFeeRange === 'All' || (() => {
        const feeInCoins = Math.ceil(quiz.entryFee / 50);
        switch (selectedFeeRange) {
          case '0-10': return feeInCoins <= 10;
          case '11-20': return feeInCoins > 10 && feeInCoins <= 20;
          case '21-100': return feeInCoins > 20 && feeInCoins <= 100;
          case '100+': return feeInCoins > 100;
          default: return true;
        }
      })();
      
      return matchesSearch && matchesFee;
    });
  };

  const filteredQuizzes = filterQuizzes();
  const activeQuizzes = filteredQuizzes.filter(q => q.status === 'active');
  const upcomingQuizzes = filteredQuizzes.filter(q => q.status === 'upcoming');

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-6">
        <h1 className="text-2xl font-bold mb-2">Available Quizzes</h1>
        <p className="text-primary-foreground/80">Join quizzes and win amazing prizes</p>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Search and Filters */}
        <Card>
          <CardContent className="p-4 space-y-4">
            {/* Search */}
            <div className="relative">
              <MagnifyingGlass size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search quizzes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Filters */}
            <div className="flex space-x-2">
              <Select value={selectedFeeRange} onValueChange={setSelectedFeeRange}>
                <SelectTrigger className="flex-1 bg-background">
                  <SelectValue placeholder="Select fee range" />
                </SelectTrigger>
                <SelectContent className="bg-popover border border-border shadow-lg z-50">
                  {entryFees.map(fee => (
                    <SelectItem key={fee} value={fee} className="cursor-pointer">
                      {fee === 'All' ? 'Any Fee' : `${fee} coins`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Active Quizzes */}
        {activeQuizzes.length > 0 && (
          <div>
            <div className="flex items-center mb-4">
              <Fire size={20} className="text-accent mr-2" />
              <h2 className="text-xl font-bold">Live Quizzes</h2>
            </div>
            <div className="space-y-3">
              {activeQuizzes.map(quiz => (
                <Card key={quiz.id} className="border-accent/30 bg-accent/5 hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <h3 className="font-semibold text-foreground mr-2">{quiz.title}</h3>
                          <Badge className="bg-accent text-accent-foreground">LIVE</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{quiz.description}</p>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <div className="flex items-center">
                            <Coins size={16} className="mr-1" />
                            <span className="text-foreground font-medium">{formatCurrency(quiz.entryFee)}</span>
                          </div>
                          <div className="flex items-center">
                            <Users size={16} className="mr-1" />
                            <span className={quiz.isAvailable ? 'text-green-600 font-semibold' : 'text-destructive'}>
                              {quiz.isAvailable ? 'Available' : 'Taken'}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <Clock size={16} className="mr-1" />
                            {quiz.duration}min
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-accent">Prize Pool: <span className="text-foreground">{formatCurrency(quiz.prizePool)}</span></p>
                      </div>
                      <Button 
                        size="sm" 
                        disabled={!quiz.isAvailable || startingQuiz === quiz.id}
                        onClick={() => handleJoinQuiz(quiz.id, quiz.entryFee)}
                        className="min-w-[80px]"
                      >
                        {startingQuiz === quiz.id ? 'Starting...' : 
                         !quiz.isAvailable ? 'Taken' : 
                         'Join Now'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Quizzes */}
        <div>
          <h2 className="text-xl font-bold mb-4">Upcoming Quizzes</h2>
          <div className="space-y-3">
            {upcomingQuizzes.map(quiz => (
              <Card key={quiz.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <h3 className="font-semibold text-foreground mr-2">{quiz.title}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{quiz.description}</p>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <div className="flex items-center">
                            <Coins size={16} className="mr-1" />
                            <span className="text-foreground font-medium">{formatCurrency(quiz.entryFee)}</span>
                          </div>
                          <div className="flex items-center">
                            <Users size={16} className="mr-1" />
                            <span className={quiz.isAvailable ? 'text-green-600 font-semibold' : 'text-destructive'}>
                              {quiz.isAvailable ? 'Available' : 'Taken'}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <Clock size={16} className="mr-1" />
                            {formatTime(quiz.startTime)}
                          </div>
                        </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-primary">Prize Pool: <span className="text-foreground">{formatCurrency(quiz.prizePool)}</span></p>
                      <p className="text-xs text-muted-foreground">
                        Starts {quiz.startTime.toLocaleDateString()} at {quiz.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      disabled={!quiz.isAvailable}
                      onClick={() => navigate(`/quiz/${quiz.id}`)}
                    >
                      {!quiz.isAvailable ? 'Taken' : 'View Details'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {filteredQuizzes.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground mb-4">No quizzes found matching your criteria</p>
              <Button onClick={() => {
                setSearchTerm('');
                setSelectedFeeRange('All');
              }}>
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="pb-6"></div>
    </div>
  );
}