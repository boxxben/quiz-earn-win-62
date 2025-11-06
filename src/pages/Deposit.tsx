import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTransactions } from '@/contexts/TransactionContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { formatDiamonds, nairaTodiamonds, diamondsToNaira } from '@/lib/currency';
import { MAX_WALLET_BALANCE } from '@/lib/constants';
import { ArrowLeft, CreditCard, Bank, Phone, Clock, ShieldCheck } from '@phosphor-icons/react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

const depositSchema = z.object({
  amount: z.string()
    .transform(Number)
    .pipe(
      z.number()
        .min(100, "Minimum deposit is ₦100")
        .positive("Amount must be positive")
    )
});

const quickAmounts = [1000, 2000, 5000, 10000, 20000, 50000];

export default function Deposit() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const { addTransaction } = useTransactions();
  const { toast } = useToast();
  
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [depositId, setDepositId] = useState('');
  const [pendingDeposit, setPendingDeposit] = useState<any>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  
  const currentBalance = user?.balance || 0;
  const maxBalance = MAX_WALLET_BALANCE;
  const availableSpace = maxBalance - currentBalance;
  const maxDepositDiamonds = Math.min(availableSpace, MAX_WALLET_BALANCE);
  const maxDepositNaira = maxDepositDiamonds * 50; // Convert diamonds to naira

  const formatNaira = (amount: number) => `₦${amount.toLocaleString()}`;

  const handleQuickAmount = (value: number) => {
    setAmount(value.toString());
  };

  // Check for pending deposit on mount
  useEffect(() => {
    const checkPendingDeposit = async () => {
      if (user?.id) {
        const { data } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .eq('type', 'deposit')
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(1);
        
        if (data && data.length > 0) {
          setPendingDeposit(data[0]);
          const createdAt = new Date(data[0].created_at).getTime();
          const expiresAt = createdAt + (30 * 60 * 1000); // 30 minutes
          const remaining = Math.floor((expiresAt - Date.now()) / 1000);
          if (remaining > 0) {
            setCountdown(remaining);
          }
        }
      }
    };
    checkPendingDeposit();
  }, [user?.id]);

  // Countdown timer
  useEffect(() => {
    if (countdown !== null && countdown > 0) {
      const timer = setInterval(() => {
        setCountdown(prev => prev !== null && prev > 0 ? prev - 1 : null);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [countdown]);

  const generateDepositId = () => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `DEP-${timestamp}-${random}`;
  };

  const initiateDeposit = async () => {
    // Validate with Zod
    const validation = depositSchema.safeParse({ amount });
    if (!validation.success) {
      const firstError = validation.error.issues[0];
      toast({
        title: 'Validation Error',
        description: firstError.message,
        variant: 'destructive'
      });
      return;
    }

    const depositAmount = validation.data.amount;
    const diamondsToAdd = nairaTodiamonds(depositAmount);

    if (currentBalance >= maxBalance) {
      toast({
        title: 'Wallet Limit Reached',
        description: `You cannot hold more than ${MAX_WALLET_BALANCE} diamonds`,
        variant: 'destructive'
      });
      return;
    }


    const userEmail = user?.email;
    const userId = user?.id;
    
    if (!userEmail || !userId) {
      toast({
        title: 'Authentication Error',
        description: 'User email not found. Please log in again.',
        variant: 'destructive'
      });
      return;
    }

    // Generate deposit ID and show confirmation dialog
    const newDepositId = generateDepositId();
    setDepositId(newDepositId);
    setShowConfirmDialog(true);
  };

  const confirmAndRedirect = async () => {
    const depositAmount = parseInt(amount);
    const userId = user?.id;
    const userEmail = user?.email;

    if (!userId || !userEmail) return;

    setIsLoading(true);
    
    // Create pending transaction in database
    const { error } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        type: 'deposit',
        amount: depositAmount,
        status: 'pending',
        description: `Deposit ID: ${depositId} - Awaiting confirmation`,
        paystack_reference: depositId
      });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to create deposit request. Please try again.',
        variant: 'destructive'
      });
      setIsLoading(false);
      return;
    }

    // Fetch the created transaction
    const { data: transactions } = await supabase
      .from('transactions')
      .select('*')
      .eq('paystack_reference', depositId)
      .single();

    setPendingDeposit(transactions);
    setCountdown(30 * 60); // 30 minutes in seconds

    setShowConfirmDialog(false);
    setIsLoading(false);

    // Open Paystack link in new tab
    window.open('https://paystack.shop/pay/quiz2cash', '_blank');

    toast({
      title: 'Payment Link Opened',
      description: `Use Deposit ID: ${depositId} and pay exactly ₦${depositAmount.toLocaleString()}`,
    });
  };

  const handleHavePaid = async () => {
    if (!pendingDeposit) return;

    const { error } = await supabase
      .from('transactions')
      .update({ status: 'pending_approval' })
      .eq('id', pendingDeposit.id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update status. Please try again.',
        variant: 'destructive'
      });
      return;
    }

    toast({
      title: 'Submitted for Approval',
      description: 'Your payment is being reviewed by admin.',
    });

    setPendingDeposit(null);
    setCountdown(null);
    setAmount('');
  };

  const handleCancelPending = async () => {
    if (!pendingDeposit) return;

    const { error } = await supabase
      .from('transactions')
      .update({ status: 'cancelled', description: `Cancelled by user - ${pendingDeposit?.description || ''}`.trim() })
      .eq('id', pendingDeposit.id)
      .eq('status', 'pending');

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to cancel pending deposit. Please try again.',
        variant: 'destructive'
      });
      return;
    }

    toast({
      title: 'Deposit Cancelled',
      description: 'Your pending deposit has been cancelled.',
    });

    setPendingDeposit(null);
    setCountdown(null);
  };

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || parseInt(amount) < 100) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid amount (minimum ₦100)',
        variant: 'destructive'
      });
      return;
    }
    
    initiateDeposit();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-6">
        <div className="flex items-center mb-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/wallet')} className="text-primary-foreground hover:bg-white/20">
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-xl font-bold ml-4">Add Money</h1>
        </div>
        <p className="text-primary-foreground/80">Top up your wallet to join quizzes</p>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Pending Deposit Status */}
        {pendingDeposit && countdown !== null && countdown > 0 && (
          <Card className="border-blue-500 bg-blue-50">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-blue-800">Pending Payment</p>
                    <p className="text-sm text-blue-600">Deposit ID: {pendingDeposit.paystack_reference}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-blue-800">{formatNaira(pendingDeposit.amount)}</p>
                    <p className="text-sm text-blue-600">{formatCountdown(countdown)}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    onClick={handleHavePaid}
                    className="w-full"
                    variant="default"
                  >
                    I Have Paid
                  </Button>
                  <Button 
                    onClick={handleCancelPending}
                    className="w-full"
                    variant="destructive"
                  >
                    Cancel Deposit
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Wallet Limit Warning */}
        {availableSpace <= 200 && (
          <Card className="border-orange-500 bg-orange-50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock size={20} className="text-orange-600" />
                <div>
                  <p className="font-semibold text-orange-800">
                    {availableSpace === 0 ? 'Wallet Full!' : 'Approaching Wallet Limit'}
                  </p>
                  <p className="text-sm text-orange-600">
                    {availableSpace === 0 
                      ? 'You cannot add more diamonds. Consider withdrawing some funds.'
                      : `You can only add ${formatDiamonds(availableSpace)} more diamonds.`
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Current Balance */}
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-muted-foreground mb-1">Available Balance</p>
            <p className="text-2xl font-bold text-primary">
              {formatDiamonds(currentBalance)}
            </p>
            <p className="text-sm text-muted-foreground">
              {formatNaira(diamondsToNaira(currentBalance))}
            </p>
            <div className="mt-2 text-xs text-muted-foreground">
              Wallet Capacity: {formatDiamonds(currentBalance)} / {formatDiamonds(maxBalance)}
            </div>
          </CardContent>
        </Card>

        {/* Deposit Form */}
        <Card>
          <CardHeader>
            <CardTitle>Deposit Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="amount">Amount (₦)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="100"
                  disabled={availableSpace === 0}
                  required
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Minimum: ₦100 (2💎)
                </p>
                {amount && (
                  <p className="text-sm text-primary font-medium mt-1">
                    = {formatDiamonds(nairaTodiamonds(parseInt(amount) || 0))}
                  </p>
                )}
              </div>

              {/* Quick Amount Buttons */}
              <div>
                <Label>Quick Select</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {quickAmounts
                    .filter(value => nairaTodiamonds(value) <= availableSpace)
                    .map(value => (
                    <Button
                      key={value}
                      type="button"
                      variant={amount === value.toString() ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleQuickAmount(value)}
                      className="flex flex-col h-auto py-2"
                      disabled={nairaTodiamonds(value) > availableSpace}
                    >
                      <span className="text-xs">{formatNaira(value)}</span>
                      <span className="font-semibold">{formatDiamonds(nairaTodiamonds(value))}</span>
                    </Button>
                  ))}
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading || !amount || availableSpace === 0 || (pendingDeposit !== null)}
              >
                {isLoading ? 'Processing...' : 
                 pendingDeposit ? 'Complete Pending Payment First' :
                 availableSpace === 0 ? 'Wallet Full - Cannot Deposit' :
                 amount ? `Proceed to Payment - ${formatNaira(parseInt(amount))} (${formatDiamonds(nairaTodiamonds(parseInt(amount)))})` : 
                 'Enter amount to proceed'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Payment Methods</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center space-x-3 p-3 border border-border rounded-lg">
              <CreditCard size={24} className="text-blue-500" />
              <div>
                <p className="font-medium">Debit/Credit Card</p>
                <p className="text-sm text-muted-foreground">Visa, Mastercard, Verve</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 border border-border rounded-lg">
              <Bank size={24} className="text-green-500" />
              <div>
                <p className="font-medium">Bank Transfer</p>
                <p className="text-sm text-muted-foreground">Direct bank transfer</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 border border-border rounded-lg">
              <Phone size={24} className="text-orange-500" />
              <div>
                <p className="font-medium">USSD</p>
                <p className="text-sm text-muted-foreground">*737# and other codes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start space-x-3">
              <ShieldCheck size={20} className="text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-green-800 dark:text-green-200 mb-1">🔒 Secure Payment</p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  All transactions are secured with 256-bit SSL encryption and verified server-side. Payments processed by Paystack with webhook confirmation.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Clock size={20} className="text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-green-800 dark:text-green-200 mb-1">Instant Verification</p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Your payment is automatically verified and your balance updated within seconds of successful payment.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Payment Details</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p className="text-base font-semibold text-foreground">
                Please use the following details when making payment:
              </p>
              <div className="bg-muted p-3 rounded-lg space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">Deposit ID:</p>
                  <p className="font-mono font-bold text-primary">{depositId}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Amount:</p>
                  <p className="font-bold text-lg">{formatNaira(parseInt(amount || '0'))}</p>
                </div>
              </div>
              <p className="text-sm text-orange-600 font-medium">
                ⚠️ Use the exact amount and deposit ID during payment
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmAndRedirect}>
              OK, Proceed to Payment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}