import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { 
  Users, 
  Brain, 
  CreditCard, 
  TrendUp,
  UserCheck,
  ArrowLeft,
  Eye,
  BellSimple
} from '@phosphor-icons/react';

export default function AdminDashboard() {
  const { user, hydrated, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = React.useState({
    totalUsers: 0,
    activeQuizzes: 0,
    pendingWithdrawals: 0,
    totalEarnings: 0
  });
  const [topUsers, setTopUsers] = React.useState<any[]>([]);
  const [pendingWithdrawals, setPendingWithdrawals] = React.useState<any[]>([]);
  
  // Redirect if not admin (after hydration)
  React.useEffect(() => {
    if (hydrated && !user?.isAdmin) {
      navigate('/home');
    }
  }, [hydrated, user?.isAdmin, navigate]);

  // Fetch dashboard stats
  React.useEffect(() => {
    const fetchStats = async () => {
      const { data: profiles } = await supabase.from('profiles').select('*');
      const { data: quizzes } = await supabase.from('quizzes').select('*').eq('status', 'active');
      const { data: transactions } = await supabase.from('transactions').select('*').eq('status', 'pending').eq('type', 'withdrawal');
      
      setStats({
        totalUsers: profiles?.length || 0,
        activeQuizzes: quizzes?.length || 0,
        pendingWithdrawals: transactions?.length || 0,
        totalEarnings: profiles?.reduce((sum, p) => sum + (p.total_earnings || 0), 0) || 0
      });

      // Get top 5 users for recent activity
      const topProfiles = profiles?.sort((a, b) => (b.total_earnings || 0) - (a.total_earnings || 0)).slice(0, 5) || [];
      setTopUsers(topProfiles);

      // Set pending withdrawals (mock for now)
      setPendingWithdrawals(transactions?.slice(0, 3) || []);
    };

    if (user?.isAdmin) {
      fetchStats();
    }
  }, [user?.isAdmin]);

  if (!hydrated) {
    return null;
  }

  if (!user?.isAdmin) {
    return null;
  }

  const formatCurrency = (amount: number) => `₦${amount.toLocaleString()}`;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Button variant="ghost" size="sm" onClick={() => navigate('/profile')} className="text-primary-foreground hover:bg-white/20">
              <ArrowLeft size={20} />
            </Button>
            <h1 className="text-xl font-bold ml-4">Admin Dashboard</h1>
          </div>
          <Button variant="ghost" size="sm" onClick={logout} className="text-primary-foreground hover:bg-white/20">
            Logout
          </Button>
        </div>
        <p className="text-primary-foreground/80">Manage your Quiz2cash platform</p>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-full">
                  <Users size={20} className="text-blue-600 dark:text-blue-300" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="bg-green-100 dark:bg-green-900 p-2 rounded-full">
                  <Brain size={20} className="text-green-600 dark:text-green-300" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.activeQuizzes}</p>
                  <p className="text-sm text-muted-foreground">Active Quizzes</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="bg-purple-100 dark:bg-purple-900 p-2 rounded-full">
                  <TrendUp size={20} className="text-purple-600 dark:text-purple-300" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{formatCurrency(stats.totalEarnings)}</p>
                  <p className="text-sm text-muted-foreground">Total Earnings</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="bg-orange-100 dark:bg-orange-900 p-2 rounded-full">
                  <CreditCard size={20} className="text-orange-600 dark:text-orange-300" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.pendingWithdrawals}</p>
                  <p className="text-sm text-muted-foreground">Pending Withdrawals</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild variant="outline" className="w-full justify-start">
              <Link to="/admin/announcements">
                <BellSimple size={16} className="mr-2" />
                Send Announcements
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link to="/admin/users">
                <Users size={16} className="mr-2" />
                Manage Users
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link to="/admin/quizzes">
                <Brain size={16} className="mr-2" />
                Manage Quizzes
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link to="/admin/payments">
                <CreditCard size={16} className="mr-2" />
                Payment Requests
                {stats.pendingWithdrawals > 0 && (
                  <Badge variant="destructive" className="ml-auto">
                    {stats.pendingWithdrawals}
                  </Badge>
                )}
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent User Activity</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/admin/users">
                <Eye size={16} className="mr-1" />
                View All
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topUsers.length > 0 ? topUsers.map((user, index) => (
                <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-sm font-medium">{user.name?.charAt(0) || 'U'}</span>
                    </div>
                    <div>
                      <p className="font-medium">{user.name || 'Unknown User'}</p>
                      <p className="text-sm text-muted-foreground">
                        {user.quizzes_won || 0} quizzes won
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-accent">
                      {formatCurrency(user.total_earnings || 0)}
                    </p>
                    <p className="text-xs text-muted-foreground">Total Earned</p>
                  </div>
                </div>
              )) : (
                <p className="text-center text-muted-foreground py-4">No users found</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pending Withdrawals */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Pending Withdrawals</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/admin/payments">
                <Eye size={16} className="mr-1" />
                View All
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingWithdrawals.length > 0 ? pendingWithdrawals.map(withdrawal => (
                <div key={withdrawal.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{formatCurrency(withdrawal.amount || 0)}</p>
                    <p className="text-sm text-muted-foreground">
                      Withdrawal Request
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline">
                      Approve
                    </Button>
                    <Button size="sm" variant="destructive">
                      Reject
                    </Button>
                  </div>
                </div>
              )) : (
                <p className="text-center text-muted-foreground py-4">No pending withdrawals</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="pb-6"></div>
    </div>
  );
}