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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { 
  ArrowLeft, 
  MagnifyingGlass, 
  UserCheck,
  UserMinus,
  Eye,
  Wallet,
  Trash
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
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [walletDialogOpen, setWalletDialogOpen] = useState(false);
  const [walletAmount, setWalletAmount] = useState('');
  const [walletAction, setWalletAction] = useState<'add' | 'deduct'>('add');
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const formatCurrency = (amount: number) => `₦${amount.toLocaleString()}`;

  // Fetch users from Supabase
  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (data && !error) {
      const formattedUsers = data.map(user => ({
        userId: user.user_id,
        userName: user.name,
        email: user.email,
        avatar: user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`,
        status: user.is_suspended ? 'Suspended' : 'Active',
        joinDate: new Date(user.created_at).toLocaleDateString(),
        lastActive: new Date(user.updated_at).toLocaleDateString(),
        balance: user.balance,
        totalEarnings: user.total_earnings,
        rank: user.rank,
        quizzesPlayed: user.quizzes_played,
        quizzesWon: user.quizzes_won,
        country: user.country,
        isSuspended: user.is_suspended
      }));
      setUsers(formattedUsers);
    }
  };

  React.useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || user.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleViewUser = (user: any) => {
    setSelectedUser(user);
    setViewDialogOpen(true);
  };

  const handleWalletManage = (user: any) => {
    setSelectedUser(user);
    setWalletAmount('');
    setWalletDialogOpen(true);
  };

  const handleWalletUpdate = async () => {
    if (!selectedUser || !walletAmount || isNaN(Number(walletAmount))) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid amount',
        variant: 'destructive'
      });
      return;
    }

    setIsProcessing(true);
    const amount = Number(walletAmount);
    const newBalance = walletAction === 'add' 
      ? selectedUser.balance + amount 
      : selectedUser.balance - amount;

    if (newBalance < 0) {
      toast({
        title: 'Invalid Operation',
        description: 'Balance cannot be negative',
        variant: 'destructive'
      });
      setIsProcessing(false);
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .update({ balance: newBalance })
      .eq('user_id', selectedUser.userId);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update wallet balance',
        variant: 'destructive'
      });
    } else {
      toast({
        title: 'Success',
        description: `Wallet ${walletAction === 'add' ? 'credited' : 'debited'} successfully`
      });
      setWalletDialogOpen(false);
      fetchUsers();
    }
    setIsProcessing(false);
  };

  const handleSuspendToggle = async (user: any) => {
    setIsProcessing(true);
    const newSuspendedStatus = !user.isSuspended;

    const { error } = await supabase
      .from('profiles')
      .update({ is_suspended: newSuspendedStatus })
      .eq('user_id', user.userId);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update user status',
        variant: 'destructive'
      });
    } else {
      toast({
        title: 'Success',
        description: `User ${newSuspendedStatus ? 'suspended' : 'unsuspended'} successfully`
      });
      fetchUsers();
    }
    setIsProcessing(false);
  };

  const handleDeleteUser = (user: any) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (!selectedUser) return;

    setIsProcessing(true);
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('user_id', selectedUser.userId);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete user',
        variant: 'destructive'
      });
    } else {
      toast({
        title: 'Success',
        description: 'User deleted successfully'
      });
      setDeleteDialogOpen(false);
      fetchUsers();
    }
    setIsProcessing(false);
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
                  <SelectItem value="Suspended">Suspended</SelectItem>
                </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* User Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-primary">{users.length}</p>
              <p className="text-sm text-muted-foreground">Total Users</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-accent">{users.filter(u => u.status === 'Active').length}</p>
              <p className="text-sm text-muted-foreground">Active</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-destructive">{users.filter(u => u.status === 'Suspended').length}</p>
              <p className="text-sm text-muted-foreground">Suspended</p>
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
                    <div className="flex flex-wrap gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewUser(user)}
                        disabled={isProcessing}
                      >
                        <Eye size={14} />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleWalletManage(user)}
                        disabled={isProcessing}
                      >
                        <Wallet size={14} />
                      </Button>
                      {user.status === 'Active' ? (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleSuspendToggle(user)}
                          disabled={isProcessing}
                        >
                          <UserMinus size={14} />
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleSuspendToggle(user)}
                          className="bg-accent hover:bg-accent/90"
                          disabled={isProcessing}
                        >
                          <UserCheck size={14} />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteUser(user)}
                        disabled={isProcessing}
                      >
                        <Trash size={14} />
                      </Button>
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

      {/* View User Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>Complete profile information</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <img
                  src={selectedUser.avatar}
                  alt={selectedUser.userName}
                  className="w-16 h-16 rounded-full"
                />
                <div>
                  <p className="font-semibold text-lg">{selectedUser.userName}</p>
                  <Badge variant={selectedUser.status === 'Active' ? 'default' : 'destructive'}>
                    {selectedUser.status}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedUser.email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Country</p>
                  <p className="font-medium">{selectedUser.country || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Balance</p>
                  <p className="font-medium text-accent">{formatCurrency(selectedUser.balance)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total Earnings</p>
                  <p className="font-medium">{formatCurrency(selectedUser.totalEarnings)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Quizzes Played</p>
                  <p className="font-medium">{selectedUser.quizzesPlayed}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Quizzes Won</p>
                  <p className="font-medium">{selectedUser.quizzesWon}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Rank</p>
                  <p className="font-medium">#{selectedUser.rank}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Join Date</p>
                  <p className="font-medium">{selectedUser.joinDate}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Wallet Management Dialog */}
      <Dialog open={walletDialogOpen} onOpenChange={setWalletDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Wallet</DialogTitle>
            <DialogDescription>
              Add or deduct balance for {selectedUser?.userName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Current Balance</Label>
              <p className="text-2xl font-bold text-accent mt-1">
                {selectedUser && formatCurrency(selectedUser.balance)}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant={walletAction === 'add' ? 'default' : 'outline'}
                onClick={() => setWalletAction('add')}
                className="flex-1"
              >
                Add Balance
              </Button>
              <Button
                variant={walletAction === 'deduct' ? 'default' : 'outline'}
                onClick={() => setWalletAction('deduct')}
                className="flex-1"
              >
                Deduct Balance
              </Button>
            </div>
            <div>
              <Label htmlFor="amount">Amount (₦)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Enter amount"
                value={walletAmount}
                onChange={(e) => setWalletAmount(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWalletDialogOpen(false)} disabled={isProcessing}>
              Cancel
            </Button>
            <Button onClick={handleWalletUpdate} disabled={isProcessing}>
              {isProcessing ? 'Processing...' : 'Update Balance'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the user account for <strong>{selectedUser?.userName}</strong>. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteUser} disabled={isProcessing} className="bg-destructive hover:bg-destructive/90">
              {isProcessing ? 'Deleting...' : 'Delete User'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="pb-6"></div>
    </div>
  );
}