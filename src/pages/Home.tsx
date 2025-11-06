import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import NotificationModal from '@/components/NotificationModal';
import { useQuizAvailability } from '@/contexts/QuizAvailabilityContext';
import { formatDiamonds } from '@/lib/currency';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Wallet, 
  Plus, 
  Brain, 
  BellSimple,
  Heart,
  ChatCircle,
  ShareNetwork,
  Trophy,
  Fire
} from '@phosphor-icons/react';

interface Post {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  likes: number;
  comments: number;
  user_name: string;
  user_avatar: string;
}

export default function Home() {
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const { availableQuizzes } = useQuizAvailability();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [topPlayers, setTopPlayers] = useState<any[]>([]);

  // Fetch community posts
  useEffect(() => {
    const fetchPosts = async () => {
      const { data: postsData } = await supabase
        .from('posts')
        .select(`
          id,
          user_id,
          content,
          likes,
          created_at,
          profiles:user_id (
            name,
            avatar
          )
        `)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (postsData) {
        const formattedPosts = postsData.map((post: any) => ({
          id: post.id,
          user_id: post.user_id,
          content: post.content,
          created_at: post.created_at,
          likes: post.likes,
          comments: 0, // Will add comments feature later
          user_name: post.profiles?.name || 'Unknown User',
          user_avatar: post.profiles?.avatar || ''
        }));
        setPosts(formattedPosts);
      }
    };

    const fetchTopPlayers = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('name, avatar, total_earnings, quizzes_won')
        .order('total_earnings', { ascending: false })
        .limit(5);
      
      if (data) setTopPlayers(data);
    };

    fetchPosts();
    fetchTopPlayers();
  }, []);

  const handleCreatePost = async () => {
    if (!newPost.trim()) return;
    
    setIsPosting(true);
    
    try {
      // Insert post into database
      const { data, error } = await supabase
        .from('posts')
        .insert({
          user_id: user!.id,
          content: newPost
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Add new post to the feed
      const post: Post = {
        id: data.id,
        user_id: user!.id,
        content: newPost,
        created_at: data.created_at,
        likes: 0,
        comments: 0,
        user_name: user!.name,
        user_avatar: user!.avatar || ''
      };
      
      setPosts([post, ...posts]);
      setNewPost('');
      
      toast({
        title: 'Post Shared! 🎉',
        description: 'Your thoughts have been shared with the community',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to share post. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsPosting(false);
    }
  };

  const handleLikePost = async (postId: string, currentLikes: number) => {
    try {
      // Optimistically update UI
      setPosts(posts.map(p => 
        p.id === postId ? { ...p, likes: currentLikes + 1 } : p
      ));

      // Update in database
      const { error } = await supabase
        .from('posts')
        .update({ likes: currentLikes + 1 })
        .eq('id', postId);

      if (error) throw error;

      toast({
        title: '❤️ Liked!',
        description: 'Your support means a lot',
      });
    } catch (error) {
      // Revert on error
      setPosts(posts.map(p => 
        p.id === postId ? { ...p, likes: currentLikes } : p
      ));
      
      toast({
        title: 'Error',
        description: 'Failed to like post. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-6 pb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Fire size={28} className="text-accent" />
              Community Feed
            </h1>
            <p className="text-primary-foreground/80 text-sm">Share your wins and connect with players</p>
          </div>
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm" className="text-primary-foreground hover:bg-white/20">
              <Link to="/wallet">
                <Wallet size={20} />
              </Link>
            </Button>
            <div className="relative">
              <NotificationModal>
                <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-white/20">
                  <BellSimple size={20} />
                </Button>
              </NotificationModal>
              {unreadCount > 0 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-accent rounded-full flex items-center justify-center animate-pulse">
                  <span className="text-xs font-bold text-accent-foreground">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 -mt-2 space-y-4">
        {/* Quick Stats Bar */}
        <Card className="bg-gradient-to-r from-accent/10 to-primary/10 border-accent/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-sm">
              <div className="text-center">
                <p className="font-bold text-lg text-foreground">{formatDiamonds(user?.balance || 0)}</p>
                <p className="text-muted-foreground text-xs">Balance</p>
              </div>
              <div className="h-8 w-px bg-border"></div>
              <div className="text-center">
                <p className="font-bold text-lg text-primary">{user?.quizzesWon || 0}</p>
                <p className="text-muted-foreground text-xs">Wins</p>
              </div>
              <div className="h-8 w-px bg-border"></div>
              <div className="text-center">
                <p className="font-bold text-lg text-accent">{formatDiamonds(user?.totalEarnings || 0)}</p>
                <p className="text-muted-foreground text-xs">Earnings</p>
              </div>
              <div className="h-8 w-px bg-border"></div>
              <Button asChild size="sm" variant="default">
                <Link to="/quizzes">
                  <Brain size={16} className="mr-1" />
                  Play
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Create Post */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user?.avatar} />
                <AvatarFallback>{user?.name?.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <Textarea
                  placeholder="Share your achievement or challenge others..."
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  className="min-h-[60px] resize-none"
                />
                <div className="flex justify-end">
                  <Button 
                    onClick={handleCreatePost} 
                    disabled={!newPost.trim() || isPosting}
                    size="sm"
                  >
                    {isPosting ? 'Posting...' : 'Share'}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Players Sidebar */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy size={20} className="text-accent" />
              Top Players Today
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topPlayers.map((player, idx) => (
              <div key={idx} className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/5 transition-colors">
                <div className="font-bold text-lg w-6 text-center">
                  {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                </div>
                <Avatar className="h-8 w-8">
                  <AvatarImage src={player.avatar} />
                  <AvatarFallback>{player.name?.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{player.name}</p>
                  <p className="text-xs text-muted-foreground">{player.quizzes_won} wins</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-accent">{formatDiamonds(player.total_earnings)}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Community Feed */}
        <div>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <ChatCircle size={24} />
            Community Activity
          </h2>
          <div className="space-y-4">
            {posts.map((post) => (
              <Card key={post.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={post.user_avatar} />
                      <AvatarFallback>{post.user_name?.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-sm">{post.user_name}</p>
                        <span className="text-xs text-muted-foreground">
                          {formatTimeAgo(post.created_at)}
                        </span>
                      </div>
                      <p className="text-sm text-foreground mb-3">{post.content}</p>
                      <div className="flex items-center gap-4 text-muted-foreground">
                        <button 
                          onClick={() => handleLikePost(post.id, post.likes)}
                          className="flex items-center gap-1 hover:text-red-500 transition-colors"
                        >
                          <Heart size={18} />
                          <span className="text-xs">{post.likes}</span>
                        </button>
                        <button className="flex items-center gap-1 hover:text-primary transition-colors">
                          <ChatCircle size={18} />
                          <span className="text-xs">{post.comments}</span>
                        </button>
                        <button className="flex items-center gap-1 hover:text-accent transition-colors">
                          <ShareNetwork size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Quick Action to Quizzes */}
        <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
          <CardContent className="p-6 text-center">
            <Brain size={48} className="mx-auto mb-3 text-primary" />
            <h3 className="text-lg font-bold mb-2">Ready for a Challenge?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {availableQuizzes.length} quizzes available now
            </p>
            <Button asChild size="lg" className="w-full">
              <Link to="/quizzes">Browse All Quizzes</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="pb-6"></div>
    </div>
  );
}