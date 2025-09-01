import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, CheckCircle, XCircle, CircleNotch } from '@phosphor-icons/react';
import { supabase } from '@/integrations/supabase/client';

export default function EmailVerify() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'expired'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      const token = searchParams.get('token');
      const type = searchParams.get('type');

      if (!token || type !== 'signup') {
        setStatus('error');
        setMessage('Invalid verification link');
        return;
      }

      try {
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: 'signup'
        });

        if (error) {
          setStatus('error');
          setMessage(error.message);
          return;
        }

        if (data.user) {
          // Create profile after successful verification
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              user_id: data.user.id,
              name: data.user.user_metadata?.name || '',
              email: data.user.email || '',
              country: data.user.user_metadata?.country || '',
              balance: 1000,
              total_earnings: 0,
              quizzes_played: 0,
              quizzes_won: 0,
              rank: 999
            });

          if (profileError) {
            console.error('Profile creation error:', profileError);
          }

          setStatus('success');
          setMessage('Your email has been verified successfully!');
          
          // Redirect to home after 3 seconds
          setTimeout(() => {
            navigate('/home');
          }, 3000);
        }
      } catch (err) {
        setStatus('error');
        setMessage('An error occurred during verification');
      }
    };

    handleEmailConfirmation();
  }, [searchParams, navigate]);

  // If user is already logged in, redirect to home
  useEffect(() => {
    if (user) {
      navigate('/home');
    }
  }, [user, navigate]);

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return <CircleNotch size={48} className="text-primary animate-spin" />;
      case 'success':
        return <CheckCircle size={48} className="text-green-600" />;
      case 'error':
      case 'expired':
        return <XCircle size={48} className="text-red-600" />;
      default:
        return <CircleNotch size={48} className="text-primary animate-spin" />;
    }
  };

  const getStatusTitle = () => {
    switch (status) {
      case 'loading':
        return 'Verifying your email...';
      case 'success':
        return 'Email Verified!';
      case 'error':
        return 'Verification Failed';
      case 'expired':
        return 'Link Expired';
      default:
        return 'Verifying...';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex flex-col">
      {/* Header */}
      <div className="flex items-center p-4">
        <div className="flex items-center">
          <Brain size={24} className="text-primary mr-2" />
          <span className="font-bold text-lg">Learn2Earn</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-6">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="flex justify-center mb-4">
              {getStatusIcon()}
            </div>
            <CardTitle className="text-2xl">{getStatusTitle()}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              {message || 'Please wait while we verify your email address...'}
            </p>
            
            {status === 'success' && (
              <p className="text-sm text-green-600">
                Redirecting you to the app in a few seconds...
              </p>
            )}
            
            {(status === 'error' || status === 'expired') && (
              <div className="space-y-3">
                <Button onClick={() => navigate('/register')} className="w-full">
                  Try Registration Again
                </Button>
                <Button variant="outline" onClick={() => navigate('/login')} className="w-full">
                  Back to Login
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}