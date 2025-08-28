import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { mockLeaderboard } from '@/data/mockData';
import { Trophy, Crown, Medal } from '@phosphor-icons/react';

export default function Leaderboard() {
  const [period, setPeriod] = useState('All Time');
  
  const formatCurrency = (amount: number) => `₦${amount.toLocaleString()}`;

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown size={20} className="text-yellow-500" />;
    if (rank === 2) return <Medal size={20} className="text-gray-400" />;
    if (rank === 3) return <Medal size={20} className="text-orange-600" />;
    return <span className="font-bold text-muted-foreground">#{rank}</span>;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-6">
        <h1 className="text-2xl font-bold mb-2">Leaderboard</h1>
        <p className="text-primary-foreground/80">Top players and their earnings</p>
      </div>

      <div className="px-6 py-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Trophy size={20} className="mr-2" />
              Top Players
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {mockLeaderboard.map(player => (
              <div key={player.userId} className="flex items-center space-x-4 p-3 rounded-lg border">
                <div className="flex items-center justify-center w-10">
                  {getRankIcon(player.rank)}
                </div>
                <img
                  src={player.avatar}
                  alt={player.userName}
                  className="w-10 h-10 rounded-full"
                />
                <div className="flex-1">
                  <p className="font-semibold">{player.userName}</p>
                  <p className="text-sm text-muted-foreground">{player.points.toLocaleString()} points</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-accent">{formatCurrency(player.totalEarnings)}</p>
                  <p className="text-xs text-muted-foreground">Total Earned</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}