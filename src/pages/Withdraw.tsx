import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
// import { useTransactions } from '@/contexts/TransactionContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { formatDiamonds, diamondsToNaira, nairaTodiamonds } from '@/lib/currency';
import { ArrowLeft, Bank, Clock } from '@phosphor-icons/react';
import { supabase } from '@/integrations/supabase/client';
import { DIAMOND_TO_NAIRA_RATE, MIN_WITHDRAWAL_DIAMONDS } from '@/lib/constants';

const banks = [
  'Access Bank', 'Fidelity Bank', 'First Bank of Nigeria',
  'Guaranty Trust Bank', 'United Bank for Africa', 'Zenith Bank',
  'Sterling Bank', 'Union Bank', 'Wema Bank', 'Polaris Bank'
];

export default function Withdraw() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    amount: '',
    bankName: '',
    accountNumber: '',
    accountName: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const formatCurrency = (amount: number) => `₦${amount.toLocaleString()}`;
  const currentBalance = user?.balance || 0;
  const minWithdrawalDiamonds = MIN_WITHDRAWAL_DIAMONDS;
  const maxWithdrawalDiamonds = currentBalance;
  const minWithdrawalNaira = diamondsToNaira(minWithdrawalDiamonds);
  const maxWithdrawalNaira = diamondsToNaira(maxWithdrawalDiamonds);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const withdrawAmountNaira = parseInt(formData.amount);
    const withdrawDiamonds = nairaTodiamonds(withdrawAmountNaira); // Convert naira to diamonds
    
    if (withdrawAmountNaira < minWithdrawalNaira) {
      toast({
        title: 'Invalid Amount',
        description: `Minimum withdrawal is ${formatCurrency(minWithdrawalNaira)} (${formatDiamonds(minWithdrawalDiamonds)})`,
        variant: 'destructive'
      });
      return;
    }

    if (withdrawDiamonds > currentBalance) {
      toast({
        title: 'Insufficient Balance',
        description: 'You cannot withdraw more than your available balance',
        variant: 'destructive'
      });
      return;
    }

    if (formData.accountNumber.length < 10) {
      toast({
        title: 'Invalid Account Number',
        description: 'Account number must be at least 10 digits',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    
    // Mock withdrawal processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Create withdrawal transaction in database (store amount in diamonds)
    const userId = user?.id;
    if (!userId) {
      toast({ title: 'Not authenticated', description: 'Please log in again.', variant: 'destructive' });
      setIsLoading(false);
      return;
    }

    const { error } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        type: 'withdrawal',
        amount: withdrawDiamonds, // store diamonds as positive integer
        status: 'pending',
        description: `Withdrawal to ${formData.bankName} - ${formData.accountNumber}`
      });

    if (error) {
      toast({ title: 'Error', description: 'Failed to submit withdrawal request.', variant: 'destructive' });
      setIsLoading(false);
      return;
    }
    
    toast({
      title: 'Withdrawal Request Submitted!',
      description: `Your withdrawal of ${formatCurrency(withdrawAmountNaira)} (${formatDiamonds(withdrawDiamonds)}) is being processed. You'll receive it within 24 hours.`,
    });
    
    setIsLoading(false);
    navigate('/wallet');
  };

  const handleAccountNumberChange = (value: string) => {
    // Mock account name lookup
    if (value.length === 10) {
      setFormData(prev => ({ 
        ...prev, 
        accountNumber: value,
        accountName: 'John Doe' // Mock account name
      }));
    } else {
      setFormData(prev => ({ 
        ...prev, 
        accountNumber: value,
        accountName: ''
      }));
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-6">
        <div className="flex items-center mb-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/wallet')} className="text-primary-foreground hover:bg-white/20">
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-xl font-bold ml-4">Withdraw Money</h1>
        </div>
        <p className="text-primary-foreground/80">Transfer your earnings to your bank account</p>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Available Balance */}
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-muted-foreground mb-1">Available for Withdrawal</p>
            <p className="text-2xl font-bold text-primary">
              {formatDiamonds(currentBalance)}
            </p>
            <p className="text-sm text-muted-foreground">
              {formatCurrency(diamondsToNaira(currentBalance))}
            </p>
          </CardContent>
        </Card>

        {/* Withdrawal Form */}
        <Card>
          <CardHeader>
            <CardTitle>Withdrawal Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="amount">Amount (₦)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Enter amount to withdraw"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  required
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Min: {formatCurrency(minWithdrawalNaira)} ({formatDiamonds(minWithdrawalDiamonds)}) | Max: {formatCurrency(maxWithdrawalNaira)} ({formatDiamonds(maxWithdrawalDiamonds)})
                </p>
                {formData.amount && (
                  <p className="text-sm text-primary font-medium mt-1">
                    = {formatDiamonds(nairaTodiamonds(parseInt(formData.amount)))} will be deducted
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="bankName">Bank</Label>
                <Select value={formData.bankName} onValueChange={(value) => setFormData(prev => ({ ...prev, bankName: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your bank" />
                  </SelectTrigger>
                  <SelectContent>
                    {banks.map(bank => (
                      <SelectItem key={bank} value={bank}>{bank}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="accountNumber">Account Number</Label>
                <Input
                  id="accountNumber"
                  type="text"
                  placeholder="Enter your account number"
                  value={formData.accountNumber}
                  onChange={(e) => handleAccountNumberChange(e.target.value)}
                  maxLength={10}
                  required
                />
                {formData.accountName && (
                  <p className="text-sm text-accent mt-1">
                    Account Name: {formData.accountName}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading || !formData.amount || !formData.bankName || !formData.accountNumber}>
                {isLoading ? 'Processing Withdrawal...' : `Withdraw ${formData.amount ? formatCurrency(parseInt(formData.amount)) : '₦0'}`}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Processing Info */}
        <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <Clock size={20} className="text-orange-600 mt-0.5" />
              <div>
                <p className="font-medium text-orange-800 dark:text-orange-200 mb-1">Processing Time</p>
                <p className="text-sm text-orange-700 dark:text-orange-300">
                  Withdrawals are processed within 24 hours on business days. 
                  You'll receive a confirmation once the transfer is completed.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Supported Banks */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Bank size={20} className="mr-2" />
              Supported Banks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {banks.slice(0, 6).map(bank => (
                <div key={bank} className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-accent rounded-full"></div>
                  <span className="text-muted-foreground">{bank}</span>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-3">
              And many more Nigerian banks...
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}