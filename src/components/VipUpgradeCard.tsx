import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { formatDiamonds, diamondsToNaira } from '@/lib/currency';
import { VIP_COST_DIAMONDS, VIP_DURATION_DAYS } from '@/lib/constants';
import { Crown, CheckCircle, Sparkle } from '@phosphor-icons/react';

export default function VipUpgradeCard() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [isUpgrading, setIsUpgrading] = useState(false);

  const handleUpgradeToVip = async () => {
    if (!user) return;

    if (user.balance < VIP_COST_DIAMONDS) {
      toast({
        title: 'Insufficient Balance',
        description: `You need ${formatDiamonds(VIP_COST_DIAMONDS)} to upgrade to VIP. Please add more to your wallet.`,
        variant: 'destructive'
      });
      return;
    }

    setIsUpgrading(true);

    try {
      const newBalance = user.balance - VIP_COST_DIAMONDS;
      const vipExpiresAt = new Date();
      vipExpiresAt.setDate(vipExpiresAt.getDate() + VIP_DURATION_DAYS);

      // Update profile with VIP status
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          balance: newBalance,
          is_vip: true,
          vip_expires_at: vipExpiresAt.toISOString()
        })
        .eq('user_id', user.id);

      if (profileError) throw profileError;

      // Record transaction
      await supabase.from('transactions').insert({
        user_id: user.id,
        type: 'quiz_fee',
        amount: -VIP_COST_DIAMONDS,
        status: 'completed',
        description: `VIP Membership - ${VIP_DURATION_DAYS} days`
      });

      // Update local state
      await updateUser({
        balance: newBalance,
        isVip: true,
        vipExpiresAt: vipExpiresAt
      });

      toast({
        title: '👑 VIP Activated!',
        description: `You are now a VIP member for ${VIP_DURATION_DAYS} days!`,
      });
    } catch (error) {
      console.error('VIP upgrade error:', error);
      toast({
        title: 'Error',
        description: 'Failed to upgrade to VIP. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsUpgrading(false);
    }
  };

  const formatExpiryDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  const isVipActive = user?.isVip && user?.vipExpiresAt && new Date(user.vipExpiresAt) > new Date();

  if (isVipActive) {
    return (
      <Card className="border-2 border-yellow-500/50 bg-gradient-to-br from-yellow-500/10 to-orange-500/10">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Crown size={24} className="text-yellow-500" weight="fill" />
            VIP Member
            <Badge className="bg-yellow-500 text-yellow-950">ACTIVE</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Expires on: <span className="font-semibold text-foreground">{formatExpiryDate(new Date(user.vipExpiresAt!))}</span>
          </p>
          <div className="mt-3 space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle size={16} className="text-yellow-500" />
              Access to VIP-only quizzes
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle size={16} className="text-yellow-500" />
              Set custom entry fees on VIP quizzes
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle size={16} className="text-yellow-500" />
              2x prize pool multiplier
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-yellow-500/30 bg-gradient-to-br from-yellow-500/5 to-orange-500/5">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Crown size={24} className="text-yellow-500" />
          Upgrade to VIP
          <Sparkle size={16} className="text-yellow-500" weight="fill" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center p-4 bg-yellow-500/10 rounded-lg">
          <p className="text-2xl font-bold text-yellow-600">{formatDiamonds(VIP_COST_DIAMONDS)}</p>
          <p className="text-xs text-muted-foreground">₦{diamondsToNaira(VIP_COST_DIAMONDS).toLocaleString()} / month</p>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle size={16} className="text-yellow-500" />
            Access exclusive VIP-only quizzes
          </div>
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle size={16} className="text-yellow-500" />
            Set your own entry fees on VIP quizzes
          </div>
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle size={16} className="text-yellow-500" />
            Prize pool is 2x your entry fee
          </div>
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle size={16} className="text-yellow-500" />
            {VIP_DURATION_DAYS} days of VIP benefits
          </div>
        </div>

        <Button
          onClick={handleUpgradeToVip}
          disabled={isUpgrading || (user?.balance || 0) < VIP_COST_DIAMONDS}
          className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white"
        >
          {isUpgrading ? 'Upgrading...' : `Upgrade Now - ${formatDiamonds(VIP_COST_DIAMONDS)}`}
        </Button>
        
        {(user?.balance || 0) < VIP_COST_DIAMONDS && (
          <p className="text-xs text-center text-destructive">
            You need {formatDiamonds(VIP_COST_DIAMONDS - (user?.balance || 0))} more diamonds
          </p>
        )}
      </CardContent>
    </Card>
  );
}
