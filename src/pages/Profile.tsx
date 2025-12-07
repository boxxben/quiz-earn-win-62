import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Gear, SignOut, Trophy, Coins, ChartBar, Clock } from '@phosphor-icons/react';
import VipUpgradeCard from '@/components/VipUpgradeCard';

export default function Profile() {
  const { user, logout } = useAuth();
  
  const formatCurrency = (amount: number) => `₦${amount.toLocaleString()}`;

  const mockActivities = [
    { id: 1, type: 'quiz', description: 'Completed "Science Quiz"', time: '2 hours ago', reward: 500 },
    { id: 2, type: 'deposit', description: 'Added ₦2,000 to wallet', time: '1 day ago', reward: null },
    { id: 3, type: 'quiz', description: 'Completed "History Quiz"', time: '2 days ago', reward: 750 },
    { id: 4, type: 'withdraw', description: 'Withdrew ₦1,500', time: '3 days ago', reward: null },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-6">
        <h1 className="text-2xl font-bold mb-2">My Profile</h1>
        <p className="text-primary-foreground/80">Manage your account and settings</p>
      </div>

      <div className="px-6 py-6">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="stats">Statistics</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Profile Info */}
            <Card>
              <CardContent className="p-6 text-center">
                <img
                  src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name}`}
                  alt={user?.name}
                  className="w-20 h-20 rounded-full mx-auto mb-4"
                />
                <h2 className="text-xl font-bold mb-1">{user?.name}</h2>
                <p className="text-muted-foreground mb-2">{user?.email}</p>
                <p className="text-sm text-muted-foreground">{user?.country}</p>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <Trophy size={24} className="mx-auto mb-2 text-primary" />
                  <p className="text-2xl font-bold">{user?.quizzesWon || 0}</p>
                  <p className="text-sm text-muted-foreground">Quizzes Won</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Coins size={24} className="mx-auto mb-2 text-accent" />
                  <p className="text-2xl font-bold">{formatCurrency(user?.totalEarnings || 0)}</p>
                  <p className="text-sm text-muted-foreground">Total Earned</p>
                </CardContent>
              </Card>
            </div>

            {/* VIP Upgrade Card */}
            <VipUpgradeCard />
            <div className="space-y-3">
              <Button asChild variant="outline" className="w-full justify-start h-12">
                <Link to="/settings">
                  <Gear size={20} className="mr-3" />
                  Settings
                </Link>
              </Button>
              
              {user?.isAdmin && (
                <Button asChild variant="outline" className="w-full justify-start h-12">
                  <Link to="/admin">
                    <User size={20} className="mr-3" />
                    Admin Dashboard
                  </Link>
                </Button>
              )}
              
              <Button 
                variant="destructive" 
                className="w-full justify-start h-12"
                onClick={logout}
              >
                <SignOut size={20} className="mr-3" />
                Sign Out
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="stats" className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <ChartBar size={20} className="mr-2" />
                    Performance Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-primary/5 rounded-lg">
                      <p className="text-2xl font-bold text-primary">{user?.quizzesWon || 0}</p>
                      <p className="text-sm text-muted-foreground">Quizzes Won</p>
                    </div>
                    <div className="text-center p-4 bg-accent/5 rounded-lg">
                      <p className="text-2xl font-bold text-accent">85%</p>
                      <p className="text-sm text-muted-foreground">Win Rate</p>
                    </div>
                    <div className="text-center p-4 bg-blue-500/5 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">24</p>
                      <p className="text-sm text-muted-foreground">Total Quizzes</p>
                    </div>
                    <div className="text-center p-4 bg-orange-500/5 rounded-lg">
                      <p className="text-2xl font-bold text-orange-600">#{user?.rank || 999}</p>
                      <p className="text-sm text-muted-foreground">Current Rank</p>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <h4 className="font-medium mb-3">Earnings Breakdown</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Quiz Rewards:</span>
                        <span className="font-medium">{formatCurrency(user?.totalEarnings * 0.8 || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Bonus Earnings:</span>
                        <span className="font-medium">{formatCurrency(user?.totalEarnings * 0.2 || 0)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock size={20} className="mr-2" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockActivities.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="bg-muted p-2 rounded-full">
                          {activity.type === 'quiz' ? (
                            <Trophy size={16} className="text-primary" />
                          ) : activity.type === 'deposit' ? (
                            <Coins size={16} className="text-accent" />
                          ) : (
                            <SignOut size={16} className="text-orange-500" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{activity.description}</p>
                          <p className="text-sm text-muted-foreground">{activity.time}</p>
                        </div>
                      </div>
                      {activity.reward && (
                        <div className="text-right">
                          <p className="font-semibold text-accent">+{formatCurrency(activity.reward)}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}