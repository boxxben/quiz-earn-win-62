import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTransactions } from '@/contexts/TransactionContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { formatDiamonds, diamondsToNaira } from '@/lib/currency';
import { MAX_WALLET_BALANCE } from '@/lib/constants';
import { 
  Plus, 
  ArrowDown, 
  ArrowUp, 
  Clock, 
  CheckCircle, 
  XCircle,
  CreditCard,
  Bank,
  Coins,
  List,
  Gear
} from '@phosphor-icons/react';

export default function Wallet() {
  const { user } = useAuth();
  const { getTransactionsByUserId } = useTransactions();
  const currentBalance = user?.balance || 0;
  const maxBalance = MAX_WALLET_BALANCE;
  const balancePercentage = (currentBalance / maxBalance) * 100;
  const isNearLimit = balancePercentage >= 90;
  const isAtLimit = currentBalance >= maxBalance;

  const formatWalletCurrency = (amount: number) => formatDiamonds(Math.abs(amount));
  const formatNaira = (amount: number) => `₦${amount.toLocaleString()}`;

  const getTransactionIcon = (type: string, amount: number) => {
    if (type === 'deposit') return <ArrowDown className="text-accent" size={20} />;
    if (type === 'withdrawal') return <ArrowUp className="text-orange-500" size={20} />;
    if (type === 'quiz_fee') return <ArrowUp className="text-destructive" size={20} />;
    if (type === 'quiz_reward') return <ArrowDown className="text-accent" size={20} />;
    return <ArrowDown className="text-primary" size={20} />;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-accent text-accent-foreground"><CheckCircle size={12} className="mr-1" />Completed</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock size={12} className="mr-1" />Pending</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle size={12} className="mr-1" />Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatTransactionDescription = (transaction: any) => {
    switch (transaction.type) {
      case 'deposit':
        return 'Wallet Top-up';
      case 'withdrawal':
        return 'Withdrawal Request';
      case 'quiz_fee':
        return 'Quiz Entry Fee';
      case 'quiz_reward':
        return 'Quiz Reward';
      default:
        return transaction.description;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-6 pb-8">
        <h1 className="text-2xl font-bold mb-2">My Wallet</h1>
        <p className="text-primary-foreground/80">Manage your funds and transactions</p>
      </div>

      <div className="px-6 -mt-4">
        <Tabs defaultValue="balance" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="balance">Balance</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="methods">Payment</TabsTrigger>
          </TabsList>

          <TabsContent value="balance" className="space-y-6">
            {/* Wallet Limit Warning */}
            {isNearLimit && (
              <Card className={`border-2 ${isAtLimit ? 'border-red-500 bg-red-50' : 'border-orange-500 bg-orange-50'}`}>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Clock size={20} className={isAtLimit ? 'text-red-600' : 'text-orange-600'} />
                    <div>
                      <p className={`font-semibold ${isAtLimit ? 'text-red-800' : 'text-orange-800'}`}>
                        {isAtLimit ? 'Wallet Limit Reached!' : 'Approaching Wallet Limit'}
                      </p>
                      <p className={`text-sm ${isAtLimit ? 'text-red-600' : 'text-orange-600'}`}>
                        {isAtLimit 
                          ? `You cannot hold more than ${formatDiamonds(maxBalance)} diamonds. Consider withdrawing some funds.`
                          : `You can only hold up to ${formatDiamonds(maxBalance)}. Current: ${formatDiamonds(currentBalance)}`
                        }
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Balance Card */}
            <Card className="bg-card border-border shadow-lg">
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <p className="text-muted-foreground mb-2">Available Balance</p>
                  <p className="text-4xl font-bold text-primary">
                    {formatWalletCurrency(currentBalance)}
                  </p>
                  <p className="text-lg text-muted-foreground">
                    {formatNaira(diamondsToNaira(currentBalance))}
                  </p>
                  
                  {/* Wallet Limit Progress */}
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Wallet Capacity</span>
                      <span>{formatDiamonds(currentBalance)} / {formatDiamonds(maxBalance)}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          isAtLimit ? 'bg-red-500' : 
                          isNearLimit ? 'bg-orange-500' : 
                          'bg-accent'
                        }`}
                        style={{ width: `${Math.min(balancePercentage, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <Button 
                    asChild 
                    size="lg" 
                    className="flex items-center space-x-2"
                    disabled={isAtLimit}
                  >
                    <Link to="/wallet/deposit">
                      <Plus size={20} />
                      <span>{isAtLimit ? 'Limit Reached' : 'Add Money'}</span>
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="flex items-center space-x-2">
                    <Link to="/wallet/withdraw">
                      <ArrowDown size={20} />
                      <span>Withdraw</span>
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <Coins size={24} className="mx-auto mb-2 text-accent" />
                  <p className="text-2xl font-bold text-accent">{formatWalletCurrency(user?.totalEarnings || 0)}</p>
                  <p className="text-xs text-muted-foreground">{formatNaira(diamondsToNaira(user?.totalEarnings || 0))}</p>
                  <p className="text-sm text-muted-foreground">Total Earned</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <ArrowUp size={24} className="mx-auto mb-2 text-primary" />
                  <p className="text-2xl font-bold text-primary">#{user?.rank || 999}</p>
                  <p className="text-sm text-muted-foreground">Your Rank</p>
                </CardContent>
              </Card>
            </div>

            {/* Wallet Limits Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Wallet Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium">Maximum Wallet Capacity</p>
                      <p className="text-sm text-muted-foreground">You can hold up to this amount</p>
                    </div>
                    <p className="text-lg font-bold text-primary">{formatDiamonds(maxBalance)}</p>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium">Available Space</p>
                      <p className="text-sm text-muted-foreground">Remaining capacity for deposits</p>
                    </div>
                    <p className="text-lg font-bold text-accent">{formatDiamonds(maxBalance - currentBalance)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-accent/5 rounded-lg">
                    <p className="text-lg font-bold text-accent">{formatWalletCurrency(250)}</p>
                    <p className="text-xs text-muted-foreground">{formatNaira(diamondsToNaira(250))}</p>
                    <p className="text-sm text-muted-foreground">This Month</p>
                  </div>
                  <div className="text-center p-3 bg-primary/5 rounded-lg">
                    <p className="text-lg font-bold text-primary">{formatWalletCurrency(904)}</p>
                    <p className="text-xs text-muted-foreground">{formatNaira(diamondsToNaira(904))}</p>
                    <p className="text-sm text-muted-foreground">All Time</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg flex items-center">
                  <List size={20} className="mr-2" />
                  Transaction History
                </CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/wallet/history">View All</Link>
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {getTransactionsByUserId(user?.id || '').length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No transactions yet</p>
                      <p className="text-sm text-muted-foreground">Start playing quizzes to see your transaction history!</p>
                    </div>
                  ) : (
                    getTransactionsByUserId(user?.id || '').map(transaction => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="bg-muted p-2 rounded-full">
                          {getTransactionIcon(transaction.type, transaction.amount)}
                        </div>
                        <div>
                          <p className="font-medium">{formatTransactionDescription(transaction)}</p>
                          <p className="text-sm text-muted-foreground">
                            {transaction.date.toLocaleDateString()} at {transaction.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${
                          transaction.amount > 0 ? 'text-accent' : 'text-destructive'
                        }`}>
                          {transaction.amount > 0 ? '+' : ''}{formatWalletCurrency(transaction.amount)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatNaira(diamondsToNaira(Math.abs(transaction.amount)))}
                        </p>
                        {getStatusBadge(transaction.status)}
                      </div>
                    </div>
                  ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="methods" className="space-y-6">
            {/* Payment Methods */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <CreditCard size={20} className="mr-2" />
                  Payment Methods
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="bg-green-100 text-green-600 p-2 rounded-full">
                      <Bank size={16} />
                    </div>
                    <div>
                      <p className="font-medium">Paystack</p>
                      <p className="text-sm text-muted-foreground">Cards, Bank Transfer, USSD</p>
                    </div>
                  </div>
                  <Badge variant="default" className="bg-accent text-accent-foreground">Active</Badge>
                </div>
                
                <Button variant="outline" className="w-full justify-start">
                  <Plus size={16} className="mr-2" />
                  Add Payment Method
                </Button>
              </CardContent>
            </Card>

            {/* Security Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Gear size={20} className="mr-2" />
                  Wallet Security
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Transaction PIN</p>
                    <p className="text-sm text-muted-foreground">Secure your transactions with a PIN</p>
                  </div>
                  <Badge variant="default" className="bg-accent text-accent-foreground">Enabled</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Two-Factor Authentication</p>
                    <p className="text-sm text-muted-foreground">Extra security for withdrawals</p>
                  </div>
                  <Badge variant="outline">Disabled</Badge>
                </div>
                
                <Button variant="outline" className="w-full">
                  Manage Security Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <div className="pb-6"></div>
    </div>
  );
}