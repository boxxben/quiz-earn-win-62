import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import NotificationModal from '@/components/NotificationModal';
import { useQuizAvailability } from '@/contexts/QuizAvailabilityContext';
import { formatDiamonds } from '@/lib/currency';
import { 
  Wallet, 
  Plus, 
  ArrowDown, 
  Brain, 
  Clock, 
  Users, 
  Coins,
  BellSimple
} from '@phosphor-icons/react';

export default function Home() {
  const { user, hydrated } = useAuth();
  const { unreadCount } = useNotifications();
  const { availableQuizzes } = useQuizAvailability();

  const upcomingQuizzes = availableQuizzes.filter(quiz => quiz.status === 'upcoming').slice(0, 3);
  const activeQuizzes = availableQuizzes.filter(quiz => quiz.status === 'active').slice(0, 2);

  

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    
    if (diff < 0) return 'Active Now';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-6 pb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Hello, {user?.name?.split(' ')[0]}! 👋</h1>
            <p className="text-primary-foreground/80">Ready to earn some money?</p>
          </div>
          <div className="relative">
            <NotificationModal>
              <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-white/20">
                <BellSimple size={20} />
              </Button>
            </NotificationModal>
            {unreadCount > 0 && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-accent rounded-full flex items-center justify-center animate-pulse-notification">
                <span className="text-xs font-bold text-accent-foreground">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Balance Card */}
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-primary-foreground/80 text-sm">Wallet Balance</p>
                <p className="text-2xl font-bold text-primary-foreground">
                  {formatDiamonds(user?.balance || 0)}
                </p>
              </div>
              <Wallet size={32} className="text-primary-foreground/80" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="px-6 -mt-4 space-y-6">
        {/* Quick Actions */}
        <Card className="bg-card border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <Button asChild variant="outline" className="flex-col h-auto py-4 space-y-2">
                <Link to="/quizzes">
                  <Brain size={24} className="text-primary" />
                  <span className="text-xs">Join Quiz</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="flex-col h-auto py-4 space-y-2">
                <Link to="/wallet/deposit">
                  <Plus size={24} className="text-accent" />
                  <span className="text-xs">Add Funds</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="flex-col h-auto py-4 space-y-2">
                <Link to="/wallet/withdraw">
                  <ArrowDown size={24} className="text-orange-500" />
                  <span className="text-xs">Withdraw</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Active Quizzes */}
        {activeQuizzes.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Active Now</h2>
              <Link to="/quizzes" className="text-primary text-sm hover:underline">
                View All
              </Link>
            </div>
            <div className="space-y-3">
              {activeQuizzes.map(quiz => (
                <Card key={quiz.id} className="border-accent/30 bg-accent/5">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground mb-1">{quiz.title}</h3>
                        <p className="text-sm text-muted-foreground mb-2">{quiz.description}</p>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <div className="flex items-center">
                            <Coins size={16} className="mr-1" />
                            {formatDiamonds(quiz.entryFee)}
                          </div>
                          <div className="flex items-center">
                            <Users size={16} className="mr-1" />
                            <span className={quiz.isAvailable ? 'text-green-600 font-semibold' : 'text-destructive'}>
                              {quiz.isAvailable ? 'Available' : 'Taken'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Badge variant="default" className="bg-accent text-accent-foreground">
                        LIVE
                      </Badge>
                    </div>
                    <Button asChild size="sm" className="w-full">
                      <Link to={`/quiz/${quiz.id}`}>Join Now - Win {formatDiamonds(quiz.prizePool)}</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Quizzes */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Upcoming Quizzes</h2>
            <Link to="/quizzes" className="text-primary text-sm hover:underline">
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {upcomingQuizzes.map(quiz => (
              <Card key={quiz.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground mb-1">{quiz.title}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{quiz.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <Coins size={16} className="mr-1" />
                          {formatDiamonds(quiz.entryFee)}
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
                  <Button asChild variant="outline" size="sm" className="w-full">
                    <Link to={`/quiz/${quiz.id}`}>
                      View Details - Prize: {formatDiamonds(quiz.prizePool)}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Stats Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Your Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{user?.quizzesPlayed || 0}</p>
                <p className="text-sm text-muted-foreground">Quizzes Played</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-accent">{formatDiamonds(user?.totalEarnings || 0)}</p>
                <p className="text-sm text-muted-foreground">Total Earnings</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="pb-6"></div>
    </div>
  );
}