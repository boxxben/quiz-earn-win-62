import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { formatDiamonds, diamondsToNaira, nairaTodiamonds } from '@/lib/currency';
import { ArrowLeft, Bank, Clock, ShieldCheck } from '@phosphor-icons/react';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

const withdrawalSchema = z.object({
  amount: z.string().transform(Number).pipe(z.number().positive("Amount must be positive")),
  bankName: z.string().min(1, "Bank is required"),
  accountNumber: z.string().length(10, "Account number must be 10 digits"),
  accountName: z.string().min(1, "Account name is required")
});


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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate with Zod
    const validation = withdrawalSchema.safeParse(formData);
    if (!validation.success) {
      const firstError = validation.error.issues[0];
      toast({
        title: 'Validation Error',
        description: firstError.message,
        variant: 'destructive'
      });
      return;
    }

    const withdrawAmountNaira = parseInt(formData.amount);
    const withdrawDiamonds = nairaTodiamonds(withdrawAmountNaira);

    setIsLoading(true);
    
    try {
      // Call secure edge function
      const { data, error } = await supabase.functions.invoke('process-withdrawal', {
        body: {
          amount: withdrawDiamonds,
          bankName: formData.bankName,
          accountNumber: formData.accountNumber,
          accountName: formData.accountName
        }
      });

      if (error) throw error;

      if (data.status === 'error') {
        throw new Error(data.message);
      }

      // Update local state with new balance
      await updateUser({ balance: data.newBalance });

      toast({
        title: 'Withdrawal Request Submitted!',
        description: `Your withdrawal of ${formatCurrency(withdrawAmountNaira)} (${formatDiamonds(withdrawDiamonds)}) is being processed.`,
      });
      
      navigate('/wallet');
    } catch (error: any) {
      toast({ 
        title: 'Withdrawal Failed', 
        description: error.message || 'Failed to process withdrawal',
        variant: 'destructive' 
      });
    } finally {
      setIsLoading(false);
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
                  Available: {formatCurrency(diamondsToNaira(currentBalance))} ({formatDiamonds(currentBalance)})
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
                  onChange={(e) => setFormData(prev => ({ ...prev, accountNumber: e.target.value }))}
                  maxLength={10}
                  required
                />
              </div>

              <div>
                <Label htmlFor="accountName">Account Name</Label>
                <Input
                  id="accountName"
                  type="text"
                  placeholder="Enter account name"
                  value={formData.accountName}
                  onChange={(e) => setFormData(prev => ({ ...prev, accountName: e.target.value }))}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading || !formData.amount || !formData.bankName || !formData.accountNumber || !formData.accountName}>
                {isLoading ? 'Processing Withdrawal...' : `Withdraw ${formData.amount ? formatCurrency(parseInt(formData.amount)) : '₦0'}`}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Security & Processing Info */}
        <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start space-x-3">
              <ShieldCheck size={20} className="text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-green-800 dark:text-green-200 mb-1">Secure Processing</p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  All withdrawals are validated server-side with bank verification before processing.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Clock size={20} className="text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-green-800 dark:text-green-200 mb-1">Processing Time</p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Withdrawals are reviewed and processed within 24 hours on business days.
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