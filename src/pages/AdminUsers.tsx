import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { mockLeaderboard } from '@/data/mockData';
import { 
  ArrowLeft, 
  MagnifyingGlass, 
  DotsThree,
  UserCheck,
  UserMinus,
  Eye,
  Wallet
} from '@phosphor-icons/react';

export default function AdminUsers() {
  const { user, hydrated } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Redirect if not admin (after hydration)
  React.useEffect(() => {
    if (hydrated && !user?.isAdmin) {
      navigate('/home');
    }
  }, [hydrated, user?.isAdmin, navigate]);

  if (!hydrated) {
    return null;
  }

  if (!user?.isAdmin) {
    return null;
  }

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const formatCurrency = (amount: number) => `₦${amount.toLocaleString()}`;

  // Mock user data with additional fields
  const mockUsers = mockLeaderboard.map(user => ({
    ...user,
    email: `${user.userName.toLowerCase()}@example.com`,
    status: Math.random() > 0.1 ? 'Active' : 'Banned',
    joinDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toLocaleDateString(),
    lastActive: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
    balance: Math.floor(Math.random() * 50000) + 1000
  }));

  const filteredUsers = mockUsers.filter(user => {
    const matchesSearch = user.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || user.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleUserAction = (userId: string, action: string) => {
    console.log(`${action} user ${userId}`);
    
    switch (action) {
      case 'view':
        toast({
          title: 'User Profile',
          description: 'Viewing user profile details',
        });
        break;
      case 'wallet':
        toast({
          title: 'Wallet Access',
          description: 'Accessing user wallet information',
        });
        break;
      case 'ban':
        toast({
          title: 'User Banned',
          description: 'User has been banned successfully',
          variant: 'destructive'
        });
        break;
      case 'unban':
        toast({
          title: 'User Unbanned',
          description: 'User has been unbanned successfully',
        });
        break;
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
          <h1 className="text-xl font-bold ml-4">Manage Users</h1>
        </div>
        <p className="text-primary-foreground/80">View and manage user accounts</p>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Search and Filters */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="relative">
              <MagnifyingGlass size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Status</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Banned">Banned</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* User Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-primary">{mockUsers.length}</p>
              <p className="text-sm text-muted-foreground">Total Users</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-accent">{mockUsers.filter(u => u.status === 'Active').length}</p>
              <p className="text-sm text-muted-foreground">Active</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-destructive">{mockUsers.filter(u => u.status === 'Banned').length}</p>
              <p className="text-sm text-muted-foreground">Banned</p>
            </CardContent>
          </Card>
        </div>

        {/* Users List */}
        <Card>
          <CardHeader>
            <CardTitle>Users ({filteredUsers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredUsers.map((user) => (
                <div key={user.userId} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <img
                      src={user.avatar}
                      alt={user.userName}
                      className="w-12 h-12 rounded-full"
                    />
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <p className="font-semibold">{user.userName}</p>
                        <Badge variant={user.status === 'Active' ? 'default' : 'destructive'} className={user.status === 'Active' ? 'bg-accent text-accent-foreground' : ''}>
                          {user.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground mt-1">
                        <span>Joined: {user.joinDate}</span>
                        <span>Last active: {user.lastActive}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-semibold text-accent mb-1">{formatCurrency(user.balance)}</p>
                    <p className="text-xs text-muted-foreground mb-2">Balance</p>
                    <div className="flex space-x-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUserAction(user.userId, 'view')}
                      >
                        <Eye size={14} />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUserAction(user.userId, 'wallet')}
                      >
                        <Wallet size={14} />
                      </Button>
                      {user.status === 'Active' ? (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleUserAction(user.userId, 'ban')}
                        >
                          <UserMinus size={14} />
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleUserAction(user.userId, 'unban')}
                          className="bg-accent hover:bg-accent/90"
                        >
                          <UserCheck size={14} />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {filteredUsers.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No users found matching your criteria</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('All');
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="pb-6"></div>
    </div>
  );
}