import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Target, Users, Trophy, Shield } from '@phosphor-icons/react';

export default function About() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-6">
        <div className="flex items-center mb-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="text-primary-foreground hover:bg-white/20">
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-xl font-bold ml-4">About Quiz2cash</h1>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Mission */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target size={24} className="text-primary" />
              Our Mission
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Quiz2cash is designed to make learning fun and rewarding. We believe that knowledge should be celebrated and compensated. Our platform allows you to test your skills, compete with others, and earn real money while doing what you love - answering questions and learning new things.
            </p>
            <p className="text-muted-foreground">
              Whether you're a trivia enthusiast, a student looking to test your knowledge, or someone who simply enjoys the thrill of competition, Quiz2cash offers an exciting opportunity to turn your expertise into earnings.
            </p>
          </CardContent>
        </Card>

        {/* What We Offer */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy size={24} className="text-accent" />
              What We Offer
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="text-2xl">💎</div>
                <div>
                  <h3 className="font-semibold mb-1">Diamond Rewards</h3>
                  <p className="text-sm text-muted-foreground">
                    Earn diamonds for every correct answer. Diamonds can be converted to real money and withdrawn to your account.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="text-2xl">🏆</div>
                <div>
                  <h3 className="font-semibold mb-1">Live Competitions</h3>
                  <p className="text-sm text-muted-foreground">
                    Participate in scheduled quiz competitions with varying difficulty levels and prize pools.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="text-2xl">📊</div>
                <div>
                  <h3 className="font-semibold mb-1">Leaderboards</h3>
                  <p className="text-sm text-muted-foreground">
                    Climb the ranks and compete with top players from around the world.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="text-2xl">💰</div>
                <div>
                  <h3 className="font-semibold mb-1">Easy Withdrawals</h3>
                  <p className="text-sm text-muted-foreground">
                    Convert your diamonds to cash and withdraw directly to your bank account or mobile money.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Our Community */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users size={24} className="text-secondary" />
              Our Community
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Join thousands of quiz enthusiasts who are turning their knowledge into cash. Share your achievements, challenge friends, and connect with like-minded individuals in our vibrant community feed.
            </p>
          </CardContent>
        </Card>

        {/* Fair Play */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield size={24} className="text-green-600" />
              Fair Play Commitment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              We are committed to providing a fair and transparent platform. All quizzes are carefully curated, questions are fact-checked, and our reward system is designed to be equitable. We have zero tolerance for cheating and maintain strict policies to ensure everyone has an equal opportunity to succeed.
            </p>
          </CardContent>
        </Card>

        {/* Back Button */}
        <Button onClick={() => navigate('/')} size="lg" className="w-full">
          Back to Home
        </Button>
      </div>

      <div className="pb-6"></div>
    </div>
  );
}
