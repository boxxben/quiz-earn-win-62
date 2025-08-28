import React, { useState } from 'react';
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
import { ArrowLeft, CreditCard, Bank, Phone, Clock } from '@phosphor-icons/react';

const quickAmounts = [1000, 2000, 5000, 10000, 20000, 50000];

export default function Deposit() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const { addTransaction } = useTransactions();
  const { toast } = useToast();
  
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const currentBalance = user?.balance || 0;
  const maxBalance = MAX_WALLET_BALANCE;
  const availableSpace = maxBalance - currentBalance;
  const maxDepositDiamonds = Math.min(availableSpace, MAX_WALLET_BALANCE);
  const maxDepositNaira = maxDepositDiamonds * 50; // Convert diamonds to naira

  const formatNaira = (amount: number) => `₦${amount.toLocaleString()}`;

  const handleQuickAmount = (value: number) => {
    setAmount(value.toString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const depositAmount = parseInt(amount);
    const diamondsToAdd = nairaTodiamonds(depositAmount);
    
    if (depositAmount < 100) {
      toast({
        title: 'Invalid Amount',
        description: 'Minimum deposit is ₦100',
        variant: 'destructive'
      });
      return;
    }

    if (currentBalance >= maxBalance) {
      toast({
        title: 'Wallet Limit Reached',
        description: `You cannot hold more than ${MAX_WALLET_BALANCE} diamonds`,
        variant: 'destructive'
      });
      return;
    }

    if (currentBalance + diamondsToAdd > maxBalance) {
      toast({
        title: 'Deposit Too Large',
        description: `You can only add ${formatDiamonds(availableSpace)} more (₦${(availableSpace * 50).toLocaleString()})`,
        variant: 'destructive'
      });
      return;
    }

    if (depositAmount > maxDepositNaira) {
      toast({
        title: 'Amount Too Large',
        description: `Maximum you can deposit: ₦${maxDepositNaira.toLocaleString()}`,
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    
    // Mock payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Update user balance (convert naira to diamonds)
    const newBalance = Math.min(currentBalance + diamondsToAdd, MAX_WALLET_BALANCE);
    updateUser({ 
      balance: newBalance
    });
    
    // Record transaction
    addTransaction({
      type: 'deposit',
      amount: diamondsToAdd,
      status: 'completed',
      description: `Wallet deposit via Paystack - ₦${depositAmount.toLocaleString()}`
    });
    
    toast({
      title: 'Deposit Successful!',
      description: `${formatNaira(depositAmount)} (${formatDiamonds(nairaTodiamonds(depositAmount))}) has been added to your wallet`,
    });
    
    setIsLoading(false);
    navigate('/wallet');
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
                  max={maxDepositNaira}
                  disabled={availableSpace === 0}
                  required
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Min: ₦100 (2💎) | Max: ₦{maxDepositNaira.toLocaleString()} ({formatDiamonds(maxDepositDiamonds)})
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
                disabled={isLoading || !amount || availableSpace === 0}
              >
                {isLoading ? 'Processing...' : 
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
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <p className="text-sm text-primary font-medium mb-2">🔒 Secure Payment</p>
            <p className="text-sm text-muted-foreground">
              All transactions are secured with 256-bit SSL encryption and processed by Paystack.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}