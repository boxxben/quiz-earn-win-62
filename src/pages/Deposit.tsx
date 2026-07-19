import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { formatDiamonds, nairaTodiamonds, diamondsToNaira } from '@/lib/currency';
import { MAX_WALLET_BALANCE } from '@/lib/constants';
import { ArrowLeft, CreditCard, ShieldCheck, Clock } from '@phosphor-icons/react';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

const depositSchema = z.object({
  amount: z.string().transform(Number).pipe(
    z.number().min(100, 'Minimum deposit is ₦100').positive()
  ),
});

const quickAmounts = [1000, 2000, 5000, 10000, 20000, 50000];

export default function Deposit() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, updateUser } = useAuth();
  const { toast } = useToast();

  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const currentBalance = user?.balance || 0;
  const maxBalance = MAX_WALLET_BALANCE;
  const availableSpace = maxBalance - currentBalance;
  const formatNaira = (a: number) => `₦${a.toLocaleString()}`;

  // Verify after Paystack redirect
  useEffect(() => {
    const reference = searchParams.get('reference') || searchParams.get('trxref');
    if (!reference) return;
    (async () => {
      setIsVerifying(true);
      try {
        const { data, error } = await supabase.functions.invoke('paystack-verify', {
          body: { reference },
        });
        if (error) throw error;
        if (data?.credited) {
          toast({
            title: '✅ Payment Successful',
            description: data.already
              ? 'This payment was already credited.'
              : `${data.diamonds}💎 added to your wallet.`,
          });
          if (typeof data.newBalance === 'number') {
            await updateUser({ balance: data.newBalance });
          }
        } else {
          toast({
            title: 'Payment Not Completed',
            description: `Status: ${data?.status || 'unknown'}`,
            variant: 'destructive',
          });
        }
      } catch (e: any) {
        toast({ title: 'Verification Failed', description: e.message, variant: 'destructive' });
      } finally {
        setIsVerifying(false);
        setSearchParams({});
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = depositSchema.safeParse({ amount });
    if (!validation.success) {
      toast({ title: 'Invalid Amount', description: validation.error.issues[0].message, variant: 'destructive' });
      return;
    }
    const naira = validation.data.amount;
    if (currentBalance >= maxBalance) {
      toast({ title: 'Wallet Full', description: `Max ${MAX_WALLET_BALANCE}💎`, variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('paystack-initialize', {
        body: { amount: naira, origin: window.location.origin },
      });
      if (error) throw error;
      if (!data?.url) throw new Error('No checkout URL returned');
      window.location.href = data.url;
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Failed to start payment', variant: 'destructive' });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-6">
        <div className="flex items-center mb-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/wallet')} className="text-primary-foreground hover:bg-white/20">
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-xl font-bold ml-4">Add Money</h1>
        </div>
        <p className="text-primary-foreground/80">Top up your wallet instantly with Stripe</p>
      </div>

      <div className="px-6 py-6 space-y-6">
        {isVerifying && (
          <Card className="border-primary bg-primary/5">
            <CardContent className="p-4 text-center">
              <p className="font-semibold">Verifying your payment...</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-muted-foreground mb-1">Available Balance</p>
            <p className="text-2xl font-bold text-primary">{formatDiamonds(currentBalance)}</p>
            <p className="text-sm text-muted-foreground">{formatNaira(diamondsToNaira(currentBalance))}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Deposit Amount</CardTitle></CardHeader>
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
                <p className="text-sm text-muted-foreground mt-1">Minimum: ₦100 (2💎)</p>
                {amount && (
                  <p className="text-sm text-primary font-medium mt-1">
                    = {formatDiamonds(nairaTodiamonds(parseInt(amount) || 0))}
                  </p>
                )}
              </div>

              <div>
                <Label>Quick Select</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {quickAmounts.map(v => (
                    <Button
                      key={v}
                      type="button"
                      variant={amount === v.toString() ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setAmount(v.toString())}
                      className="flex flex-col h-auto py-2"
                    >
                      <span className="text-xs">{formatNaira(v)}</span>
                      <span className="font-semibold">{formatDiamonds(nairaTodiamonds(v))}</span>
                    </Button>
                  ))}
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading || !amount || availableSpace === 0}>
                {isLoading ? 'Redirecting to Stripe...' :
                  amount ? `Pay ${formatNaira(parseInt(amount))} with Stripe` : 'Enter amount to proceed'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Payment Methods</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center space-x-3 p-3 border border-border rounded-lg">
              <CreditCard size={24} className="text-primary" />
              <div>
                <p className="font-medium">Debit/Credit Card via Stripe</p>
                <p className="text-sm text-muted-foreground">Visa, Mastercard, Verve — instant credit</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start space-x-3">
              <ShieldCheck size={20} className="text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-green-800 dark:text-green-200 mb-1">🔒 Secure Payment</p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Payments are processed securely by Stripe. Your card details never touch our servers.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Clock size={20} className="text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-green-800 dark:text-green-200 mb-1">Instant Credit</p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Your wallet is credited automatically the moment the payment completes.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
