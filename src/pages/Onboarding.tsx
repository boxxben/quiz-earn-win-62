import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Brain, Coins, Trophy } from '@phosphor-icons/react';

const features = [
  {
    icon: Brain,
    title: 'Test Your Knowledge',
    description: 'Challenge yourself with quizzes across various categories and difficulty levels.'
  },
  {
    icon: Coins,
    title: 'Earn Real Money',
    description: 'Win cash prizes by performing well in quizzes. The better you do, the more you earn!'
  },
  {
    icon: Trophy,
    title: 'Compete & Win',
    description: 'Climb the leaderboards and compete with other quiz enthusiasts for top prizes.'
  }
];

export default function Onboarding() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex flex-col">
      {/* Header */}
      <div className="text-center pt-16 pb-8">
        <div className="flex items-center justify-center mb-4">
          <div className="bg-primary text-primary-foreground p-3 rounded-full">
            <Brain size={32} weight="fill" />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-foreground mb-2">Quiz2cash</h1>
        <p className="text-xl text-muted-foreground">Turn Knowledge Into Cash</p>
      </div>

      {/* Features */}
      <div className="flex-1 px-6 pb-8">
        <div className="space-y-6 max-w-md mx-auto">
          {features.map((feature, index) => (
            <Card key={index} className="bg-card/80 backdrop-blur-sm border-border/50">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="bg-primary/10 text-primary p-2 rounded-full">
                    <feature.icon size={24} weight="fill" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Call to Action */}
      <div className="px-6 pb-8 space-y-4">
        <Button asChild size="lg" className="w-full">
          <Link to="/register">Get Started</Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="w-full">
          <Link to="/login">Already have an account? Sign In</Link>
        </Button>
      </div>
    </div>
  );
}