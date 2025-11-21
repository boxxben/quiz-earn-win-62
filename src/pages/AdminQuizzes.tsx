import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useQuizAvailability } from '@/contexts/QuizAvailabilityContext';
import { formatCurrency, formatDiamonds } from '@/lib/currency';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, 
  MagnifyingGlass, 
  Plus,
  Eye,
  PencilSimple,
  Trash,
  Users,
  Clock,
  Coins,
  MagicWand
} from '@phosphor-icons/react';

export default function AdminQuizzes() {
  const { user, hydrated } = useAuth();
  const navigate = useNavigate();
  const { availableQuizzes, refreshQuizzes } = useQuizAvailability();
  const { toast } = useToast();
  
  // Redirect if not admin (after hydration)
  React.useEffect(() => {
    if (hydrated && !user?.isAdmin) {
      navigate('/home');
    }
  }, [hydrated, user?.isAdmin, navigate]);

  // Refresh quizzes when component mounts
  React.useEffect(() => {
    refreshQuizzes();
  }, []);

  if (!hydrated) {
    return null;
  }

  if (!user?.isAdmin) {
    return null;
  }

  const [searchTerm, setSearchTerm] = useState('');
  const [isBulkGenerating, setIsBulkGenerating] = useState(false);

  
  
  const formatTime = (date: Date) => {
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const filteredQuizzes = availableQuizzes.filter(quiz => 
    quiz.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-accent text-accent-foreground">Active</Badge>;
      case 'upcoming':
        return <Badge variant="secondary">Upcoming</Badge>;
      case 'completed':
        return <Badge variant="outline">Completed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleQuizAction = async (quizId: string, action: string) => {
    console.log(`${action} quiz ${quizId}`);
    
    if (action === 'view') {
      navigate(`/quiz/${quizId}`);
    } else if (action === 'edit') {
      navigate(`/admin/quiz/${quizId}/edit`);
    } else if (action === 'delete') {
      if (confirm('Are you sure you want to delete this quiz?')) {
        const { error } = await supabase
          .from('quizzes')
          .delete()
          .eq('id', quizId);
        
        if (error) {
          toast({
            title: "Delete Failed",
            description: "Failed to delete quiz. Please try again.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Quiz Deleted",
            description: "Quiz has been successfully deleted.",
          });
          refreshQuizzes();
        }
      }
    }
  };

  const handleBulkGenerate = async () => {
    setIsBulkGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('bulk-generate-quizzes', {
        body: {
          numberOfQuizzes: 50,
          questionsPerQuiz: Math.floor(Math.random() * 6) + 10 // 10-15 questions
        }
      });

      if (error) throw error;

      toast({
        title: "Bulk Generation Complete",
        description: `Successfully generated ${data.created} out of ${data.total} quizzes with AI`,
      });

      refreshQuizzes(); // Refresh the quiz list
    } catch (error) {
      console.error('Error bulk generating quizzes:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate quizzes. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsBulkGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-6">
        <div className="flex items-center mb-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/admin')} className="text-primary-foreground hover:bg-white/20">
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-xl font-bold ml-4">Manage Quizzes</h1>
        </div>
        <p className="text-primary-foreground/80">Create and manage quiz content</p>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Search and Add */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <MagnifyingGlass size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search quizzes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button onClick={() => navigate('/admin/quiz/create')}>
                <Plus size={16} className="mr-2" />
                Add Quiz
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quiz Stats */}
        <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-primary">{availableQuizzes.length}</p>
                <p className="text-sm text-muted-foreground">Total Quizzes</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-accent">{availableQuizzes.filter(q => q.status === 'active').length}</p>
                <p className="text-sm text-muted-foreground">Active</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-blue-600">{availableQuizzes.filter(q => q.status === 'upcoming').length}</p>
                <p className="text-sm text-muted-foreground">Upcoming</p>
              </CardContent>
            </Card>
        </div>

        {/* Quizzes List */}
        <Card>
          <CardHeader>
            <CardTitle>Quizzes ({filteredQuizzes.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredQuizzes.map((quiz) => (
                <div key={quiz.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold text-lg">{quiz.title}</h3>
                        {getStatusBadge(quiz.status)}
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{quiz.description}</p>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center space-x-2">
                          <Coins size={16} className="text-primary" />
                          <span>Entry Fee: {formatDiamonds(quiz.entryFee)}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Users size={16} className="text-accent" />
                          <span>Status: {quiz.isAvailable ? 'Available' : 'Taken'}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock size={16} className="text-orange-500" />
                          <span>Duration: {quiz.duration} min</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span>Prize Pool: {formatDiamonds(quiz.prizePool)}</span>
                        </div>
                      </div>
                      
                      <div className="mt-3 text-xs text-muted-foreground">
                        <p>Start: {formatTime(quiz.startTime)}</p>
                        <p>End: {formatTime(quiz.endTime)}</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col space-y-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleQuizAction(quiz.id, 'view')}
                      >
                        <Eye size={14} className="mr-1" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleQuizAction(quiz.id, 'edit')}
                      >
                        <PencilSimple size={14} className="mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleQuizAction(quiz.id, 'delete')}
                      >
                        <Trash size={14} className="mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                  
                  {/* Availability Status */}
                  <div className="mt-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Availability</span>
                      <span className={quiz.isAvailable ? 'text-green-600 font-semibold' : 'text-destructive font-semibold'}>
                        {quiz.isAvailable ? 'Available' : 'Taken'}
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all ${quiz.isAvailable ? 'bg-green-500' : 'bg-destructive'}`}
                        style={{ width: quiz.isAvailable ? '100%' : '0%' }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {filteredQuizzes.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No quizzes found matching your search</p>
                <Button 
                  variant="outline"
                  onClick={() => setSearchTerm('')}
                >
                  Clear Search
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={handleBulkGenerate}
              disabled={isBulkGenerating}
            >
              <MagicWand size={16} className="mr-2" />
              {isBulkGenerating ? 'Generating 50 Quizzes...' : 'Generate 50 AI Quizzes'}
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => navigate('/admin/quiz/create')}
            >
              <Plus size={16} className="mr-2" />
              Create Single Quiz
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => handleQuizAction('', 'schedule')}
            >
              <Clock size={16} className="mr-2" />
              Schedule Weekly Quizzes
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => handleQuizAction('', 'analytics')}
            >
              <Eye size={16} className="mr-2" />
              View Analytics
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="pb-6"></div>
    </div>
  );
}