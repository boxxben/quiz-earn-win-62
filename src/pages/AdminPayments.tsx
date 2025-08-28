import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { mockWithdrawals } from '@/data/mockData';
import { ArrowLeft, CheckCircle, XCircle, Clock } from '@phosphor-icons/react';
import { useToast } from '@/hooks/use-toast';

export default function AdminPayments() {
  const { user, hydrated } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Redirect if not admin (after hydration)
  React.useEffect(() => {
    if (hydrated && !user?.isAdmin) {
      navigate('/home');
    }
  }, [hydrated, user?.isAdmin, navigate]);

  if (!hydrated) return null;
  if (!user?.isAdmin) return null;

  const formatCurrency = (amount: number) => `₦${amount.toLocaleString()}`;
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleApproval = (withdrawalId: string, action: 'approve' | 'reject') => {
    console.log(`${action} withdrawal ${withdrawalId}`);
    toast({
      title: `Request ${action === 'approve' ? 'Approved' : 'Rejected'}`,
      description: `Withdrawal request has been ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
      variant: action === 'approve' ? 'default' : 'destructive'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock size={12} className="mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle size={12} className="mr-1" />Approved</Badge>;
      case 'rejected':
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
              <p className="text-2xl font-bold text-yellow-600">{mockWithdrawals.filter(w => w.status === 'pending').length}</p>
              <p className="text-sm text-muted-foreground">Pending</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{mockWithdrawals.filter(w => w.status === 'approved').length}</p>
              <p className="text-sm text-muted-foreground">Approved</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-red-600">{mockWithdrawals.filter(w => w.status === 'rejected').length}</p>
              <p className="text-sm text-muted-foreground">Rejected</p>
            </CardContent>
          </Card>
        </div>

        {/* Withdrawal Requests */}
        <Card>
          <CardHeader>
            <CardTitle>Withdrawal Requests ({mockWithdrawals.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockWithdrawals.map((withdrawal) => (
                <div key={withdrawal.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold text-lg">{formatCurrency(withdrawal.amount)}</h3>
                        {getStatusBadge(withdrawal.status)}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                        <div>
                          <p className="text-muted-foreground">Bank Details</p>
                          <p className="font-medium">{withdrawal.bankName}</p>
                          <p className="text-muted-foreground">****{withdrawal.accountNumber.slice(-4)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Request Date</p>
                          <p className="font-medium">{formatDate(withdrawal.requestDate)}</p>
                        </div>
                      </div>
                      
                      {withdrawal.processedDate && (
                        <div className="text-xs text-muted-foreground">
                          <p>Processed: {formatDate(withdrawal.processedDate)}</p>
                        </div>
                      )}
                    </div>
                    
                    {withdrawal.status === 'pending' && (
                      <div className="flex space-x-2 ml-4">
                        <Button
                          size="sm"
                          onClick={() => handleApproval(withdrawal.id, 'approve')}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle size={14} className="mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleApproval(withdrawal.id, 'reject')}
                        >
                          <XCircle size={14} className="mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {mockWithdrawals.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No withdrawal requests found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="pb-6"></div>
    </div>
  );
}