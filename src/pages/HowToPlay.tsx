import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, CheckCircle } from '@phosphor-icons/react';

export default function HowToPlay() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-6">
        <div className="flex items-center mb-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="text-primary-foreground hover:bg-white/20">
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-xl font-bold ml-4">How to Play</h1>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Getting Started */}
        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="font-bold text-primary text-xl">1.</div>
                <div>
                  <h3 className="font-semibold mb-1">Create Your Account</h3>
                  <p className="text-sm text-muted-foreground">
                    Sign up with your email and verify your account. You'll receive a starting balance to get you going.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="font-bold text-primary text-xl">2.</div>
                <div>
                  <h3 className="font-semibold mb-1">Browse Available Quizzes</h3>
                  <p className="text-sm text-muted-foreground">
                    Navigate to the Quizzes page to see all available competitions. Each quiz shows the entry fee, prize pool, and schedule.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="font-bold text-primary text-xl">3.</div>
                <div>
                  <h3 className="font-semibold mb-1">Join a Quiz</h3>
                  <p className="text-sm text-muted-foreground">
                    Pay the entry fee to join a quiz. Entry fees are deducted from your diamond balance.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Playing the Quiz */}
        <Card>
          <CardHeader>
            <CardTitle>During the Quiz</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-accent/10 border border-accent/20 rounded-lg p-4 mb-4">
              <p className="text-sm font-medium text-accent flex items-center gap-2">
                <CheckCircle size={20} weight="fill" />
                Each question has a time limit - answer quickly!
              </p>
            </div>
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="text-2xl">⏱️</div>
                <div>
                  <h3 className="font-semibold mb-1">Time Limits</h3>
                  <p className="text-sm text-muted-foreground">
                    Each question has a countdown timer. If time runs out, the quiz ends immediately.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="text-2xl">✅</div>
                <div>
                  <h3 className="font-semibold mb-1">Answer Correctly</h3>
                  <p className="text-sm text-muted-foreground">
                    Select the correct option from four choices. You must answer ALL questions correctly to win the prize.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="text-2xl">❌</div>
                <div>
                  <h3 className="font-semibold mb-1">Three Strikes Rule</h3>
                  <p className="text-sm text-muted-foreground">
                    If you fail the first 3 questions OR fail more than 3 questions total, the quiz ends automatically.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="text-2xl">💎</div>
                <div>
                  <h3 className="font-semibold mb-1">Wrong Answers Reduce Earnings</h3>
                  <p className="text-sm text-muted-foreground">
                    Each wrong answer reduces your potential earnings for that quiz. Only perfect scores win the full prize.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Winning & Rewards */}
        <Card>
          <CardHeader>
            <CardTitle>Winning & Rewards</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-4">
              <p className="text-sm font-medium text-green-800 dark:text-green-200 flex items-center gap-2">
                <CheckCircle size={20} weight="fill" />
                Win by answering ALL questions correctly!
              </p>
            </div>
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="text-2xl">🏆</div>
                <div>
                  <h3 className="font-semibold mb-1">Perfect Score = Win</h3>
                  <p className="text-sm text-muted-foreground">
                    You must answer ALL questions correctly to win the prize pool. Any wrong answer means no reward.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="text-2xl">💰</div>
                <div>
                  <h3 className="font-semibold mb-1">Instant Credit</h3>
                  <p className="text-sm text-muted-foreground">
                    Winning diamonds are instantly credited to your wallet after completing the quiz.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="text-2xl">📤</div>
                <div>
                  <h3 className="font-semibold mb-1">Withdraw Anytime</h3>
                  <p className="text-sm text-muted-foreground">
                    Once you have at least 100 diamonds (₦5,000), you can withdraw to your bank account or mobile money.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tips */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle>Pro Tips 💡</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle size={16} className="text-primary mt-0.5 flex-shrink-0" weight="fill" />
                <span>Read questions carefully before selecting an answer</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle size={16} className="text-primary mt-0.5 flex-shrink-0" weight="fill" />
                <span>Manage your time - don't rush but don't overthink</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle size={16} className="text-primary mt-0.5 flex-shrink-0" weight="fill" />
                <span>Start with lower entry fee quizzes to practice</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle size={16} className="text-primary mt-0.5 flex-shrink-0" weight="fill" />
                <span>Check the leaderboard to see top performers and learn from them</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle size={16} className="text-primary mt-0.5 flex-shrink-0" weight="fill" />
                <span>Stay calm and focused - accuracy is more important than speed</span>
              </li>
            </ul>
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
