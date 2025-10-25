import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CheckCircle, XCircle, Clock } from '@phosphor-icons/react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { nairaTodiamonds, diamondsToNaira } from '@/lib/currency';
import { MAX_WALLET_BALANCE } from '@/lib/constants';

export default function AdminPayments() {
  const { user, hydrated } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [withdrawals, setWithdrawals] = React.useState<any[]>([]);
  const [processingIds, setProcessingIds] = React.useState<Set<string>>(new Set());
  const [userNames, setUserNames] = React.useState<Record<string, string>>({});
  
  // Redirect if not admin (after hydration)
  React.useEffect(() => {
    if (hydrated && !user?.isAdmin) {
      navigate('/home');
    }
  }, [hydrated, user?.isAdmin, navigate]);

  React.useEffect(() => {
    const fetchWithdrawals = async () => {
      const { data } = await supabase
        .from('transactions')
        .select('*')
        .in('type', ['withdrawal', 'deposit'])
        .order('created_at', { ascending: false });
      setWithdrawals(data || []);

      // Fetch user names for display in admin log
      const userIds = Array.from(new Set((data || []).map((t: any) => t.user_id).filter(Boolean)));
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id,name')
          .in('user_id', userIds);
        const map: Record<string, string> = {};
        (profiles || []).forEach((p: any) => { map[p.user_id] = p.name; });
        setUserNames(map);
      } else {
        setUserNames({});
      }
    };
    
    if (user?.isAdmin) {
      fetchWithdrawals();
    }
  }, [user?.isAdmin]);

  if (!hydrated) return null;
  if (!user?.isAdmin) return null;

  const formatCurrency = (amount: number) => `₦${amount.toLocaleString()}`;
  
  const formatDate = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString() + ' at ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleApproval = async (transactionId: string, action: 'approve' | 'reject', transaction: any) => {
    console.log('handleApproval called:', { transactionId, action, transactionType: transaction.type, amount: transaction.amount });
    
    try {
      // Prevent double-clicking
      if (processingIds.has(transactionId)) {
        console.log('Already processing this transaction, skipping');
        return;
      }
      
      setProcessingIds(prev => new Set(prev).add(transactionId));
      
      const newStatus = action === 'approve' ? 'completed' : 'failed';
      console.log('New status:', newStatus);
      
      // First, update transaction status to prevent race conditions
      console.log('Updating transaction status...');
      const { data: updatedRows, error: txError } = await supabase
        .from('transactions')
        .update({ status: newStatus })
        .eq('id', transactionId)
        .eq('status', 'pending') // Only update if still pending
        .select('id');
        
      if (txError) {
        console.error('Transaction update error:', txError);
        throw new Error(`Failed to update transaction: ${txError.message}`);
      }
      if (!updatedRows || updatedRows.length === 0) {
        throw new Error('This request has already been processed.');
      }
      
      // Get user profile for balance operations (only if approving)
      if (action === 'approve') {
        console.log('Fetching user profile...');
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('balance')
          .eq('user_id', transaction.user_id)
          .maybeSingle();

        if (profileError) {
          console.error('Profile fetch error:', profileError);
          throw new Error(`Failed to fetch profile: ${profileError.message}`);
        }

        if (!profile) {
          console.error('Profile not found for user:', transaction.user_id);
          throw new Error('User profile not found');
        }

        console.log('Current balance:', profile.balance);

        // Calculate new balance based on transaction type
        let newBalance: number;
        if (transaction.type === 'deposit') {
          // Credit user wallet for deposits (convert naira -> diamonds)
          newBalance = profile.balance + nairaTodiamonds(transaction.amount);
          console.log('Deposit: Adding', nairaTodiamonds(transaction.amount), 'new balance:', newBalance);
        } else if (transaction.type === 'withdrawal') {
          // Deduct from user wallet for withdrawals. Some legacy records may store amount in Naira.
          const deductionDiamonds = transaction.amount > MAX_WALLET_BALANCE
            ? nairaTodiamonds(transaction.amount) // amount is in Naira, convert to diamonds
            : transaction.amount; // amount is already in diamonds
          newBalance = profile.balance - deductionDiamonds;
          console.log('Withdrawal: Deducting', deductionDiamonds, 'new balance:', newBalance);
          
          if (newBalance < 0) {
            console.error('Insufficient balance');
            throw new Error('Insufficient balance for withdrawal');
          }
        } else {
          console.error('Invalid transaction type:', transaction.type);
          throw new Error('Invalid transaction type');
        }

        // Update user balance
        console.log('Updating user balance to:', newBalance);
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ balance: newBalance })
          .eq('user_id', transaction.user_id);

        if (updateError) {
          console.error('Balance update error:', updateError);
          throw new Error(`Failed to update balance: ${updateError.message}`);
        }
        
        console.log('Balance updated successfully');
      }

      // Update local state
      setWithdrawals(prev => prev.map(w => 
        w.id === transactionId ? { ...w, status: newStatus } : w
      ));
      // Clear processing id after success
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(transactionId);
        return newSet;
      });
      
      toast({
        title: `Request ${action === 'approve' ? 'Approved' : 'Rejected'}`,
        description: `${transaction.type === 'deposit' ? 'Deposit' : 'Withdrawal'} request has been ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
      });
      } catch (error: any) {
      // Remove from processing on error
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(transactionId);
        return newSet;
      });

      // Try to sync the transaction status from DB (in case it was already processed)
      try {
        const { data: latest } = await supabase
          .from('transactions')
          .select('id,status')
          .eq('id', transactionId)
          .maybeSingle();
        if (latest?.status) {
          setWithdrawals(prev => prev.map(w => w.id === transactionId ? { ...w, status: latest.status } : w));
        }
      } catch {}
      
      toast({
        title: 'Error',
        description: (error && error.message) || 'Failed to process request',
        variant: 'destructive'
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock size={12} className="mr-1" />Pending</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle size={12} className="mr-1" />Approved</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle size={12} className="mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
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
          <h1 className="text-xl font-bold ml-4">Payment Requests</h1>
        </div>
        <p className="text-primary-foreground/80">Manage withdrawal requests and payments</p>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-yellow-600">{withdrawals.filter(w => w.status === 'pending').length}</p>
              <p className="text-sm text-muted-foreground">Pending</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{withdrawals.filter(w => w.status === 'completed').length}</p>
              <p className="text-sm text-muted-foreground">Approved</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-red-600">{withdrawals.filter(w => w.status === 'failed').length}</p>
              <p className="text-sm text-muted-foreground">Rejected</p>
            </CardContent>
          </Card>
        </div>

        {/* Payment Requests */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Requests ({withdrawals.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {withdrawals.map((withdrawal) => (
                <div key={withdrawal.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge variant={withdrawal.type === 'deposit' ? 'default' : 'secondary'} className="mr-2">
                          {withdrawal.type === 'deposit' ? 'Deposit' : 'Withdrawal'}
                        </Badge>
                          <h3 className="font-semibold text-lg">{formatCurrency(withdrawal.type === 'deposit' ? withdrawal.amount : (withdrawal.amount > MAX_WALLET_BALANCE ? withdrawal.amount : diamondsToNaira(withdrawal.amount)))}</h3>
                        {getStatusBadge(withdrawal.status)}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                        <div>
                          <p className="text-muted-foreground">User</p>
                          <p className="font-medium">{userNames[withdrawal.user_id] || 'Unknown'}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">User ID</p>
                          <p className="font-medium">{withdrawal.user_id?.slice(0, 8)}...</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Request Date</p>
                          <p className="font-medium">{formatDate(withdrawal.created_at)}</p>
                        </div>
                        {withdrawal.paystack_reference && (
                          <div className="col-span-2">
                            <p className="text-muted-foreground">Deposit ID</p>
                            <p className="font-medium font-mono text-primary">{withdrawal.paystack_reference}</p>
                          </div>
                        )}
                      </div>
                      
                      {withdrawal.description && (
                        <div className="text-sm mb-2">
                          <p className="text-muted-foreground">Description</p>
                          <p className="font-medium">{withdrawal.description}</p>
                        </div>
                      )}
                    </div>
                    
                    {(withdrawal.status === 'pending') && !processingIds.has(withdrawal.id) && (
                      <div className="flex space-x-2 ml-4">
                        <Button
                          size="sm"
                          onClick={() => handleApproval(withdrawal.id, 'approve', withdrawal)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle size={14} className="mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleApproval(withdrawal.id, 'reject', withdrawal)}
                        >
                          <XCircle size={14} className="mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}
                    {processingIds.has(withdrawal.id) && (
                      <div className="ml-4 text-sm text-muted-foreground">Processing...</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {withdrawals.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No payment requests found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="pb-6"></div>
    </div>
  );
}