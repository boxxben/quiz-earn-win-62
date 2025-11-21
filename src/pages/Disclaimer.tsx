import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Warning } from '@phosphor-icons/react';

export default function Disclaimer() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-6">
        <div className="flex items-center mb-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="text-primary-foreground hover:bg-white/20">
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-xl font-bold ml-4">Disclaimer</h1>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Important Notice */}
        <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
          <CardContent className="p-6">
            <div className="flex gap-3 items-start">
              <Warning size={24} className="text-orange-600 flex-shrink-0 mt-1" weight="fill" />
              <div>
                <h3 className="font-semibold text-orange-800 dark:text-orange-200 mb-2">
                  Please Read Carefully
                </h3>
                <p className="text-sm text-orange-700 dark:text-orange-300">
                  By using Quiz2cash, you acknowledge that you have read, understood, and agree to the following terms and conditions.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* General Disclaimer */}
        <Card>
          <CardHeader>
            <CardTitle>General Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>
              Quiz2cash is a skill-based gaming platform where users compete in quiz competitions for monetary rewards. This platform is intended for entertainment and educational purposes.
            </p>
            <p>
              All information provided on this platform is accurate to the best of our knowledge at the time of publication. However, we make no representations or warranties of any kind, express or implied, about the completeness, accuracy, reliability, or availability of the platform.
            </p>
          </CardContent>
        </Card>

        {/* No Guarantee of Winnings */}
        <Card>
          <CardHeader>
            <CardTitle>No Guarantee of Winnings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>
              Quiz2cash does NOT guarantee that you will win any prizes or earn any money. Winning depends entirely on your knowledge, skills, and performance in quizzes. Past performance does not guarantee future results.
            </p>
            <p>
              Entry fees are non-refundable once a quiz has started. You are responsible for managing your participation and understanding the risks involved.
            </p>
          </CardContent>
        </Card>

        {/* Age Restriction */}
        <Card>
          <CardHeader>
            <CardTitle>Age Restriction</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>
              You must be at least 18 years old to participate in Quiz2cash. By registering and using this platform, you confirm that you meet this age requirement.
            </p>
          </CardContent>
        </Card>

        {/* Fair Play */}
        <Card>
          <CardHeader>
            <CardTitle>Fair Play & Anti-Cheating</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>
              Cheating, use of automated tools, or any form of manipulation is strictly prohibited. Any user found engaging in such activities will have their account suspended and forfeit all winnings.
            </p>
            <p>
              We reserve the right to investigate suspicious activities and take appropriate action, including but not limited to account suspension and legal proceedings.
            </p>
          </CardContent>
        </Card>

        {/* Financial Risk */}
        <Card>
          <CardHeader>
            <CardTitle>Financial Risk</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>
              Participating in quizzes requires payment of entry fees. You should only participate with money you can afford to lose. Quiz2cash is not responsible for any financial losses incurred through participation.
            </p>
            <p>
              Please play responsibly and be aware of your spending limits. If you feel you are developing a problem with excessive participation, please seek help and discontinue use immediately.
            </p>
          </CardContent>
        </Card>

        {/* Payment & Withdrawal */}
        <Card>
          <CardHeader>
            <CardTitle>Payment & Withdrawal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>
              All payments and withdrawals are subject to verification and processing times. We reserve the right to delay or reject any withdrawal request that does not meet our terms and conditions.
            </p>
            <p>
              Withdrawal limits and fees may apply. Please refer to our withdrawal policy for detailed information.
            </p>
          </CardContent>
        </Card>

        {/* Limitation of Liability */}
        <Card>
          <CardHeader>
            <CardTitle>Limitation of Liability</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>
              Quiz2cash shall not be liable for any direct, indirect, incidental, consequential, or punitive damages arising from your use of the platform, including but not limited to:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Loss of winnings or earnings</li>
              <li>Technical issues or service interruptions</li>
              <li>Errors in quiz questions or answers</li>
              <li>Unauthorized access to your account</li>
              <li>Any other losses or damages</li>
            </ul>
          </CardContent>
        </Card>

        {/* Changes to Service */}
        <Card>
          <CardHeader>
            <CardTitle>Changes to Service</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>
              We reserve the right to modify, suspend, or discontinue any part of the service at any time without prior notice. We may also change these terms and conditions at our discretion.
            </p>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-6 text-center">
            <p className="text-sm text-muted-foreground mb-4">
              If you have any questions or concerns about this disclaimer, please contact us.
            </p>
            <Button onClick={() => navigate('/contact')} variant="outline">
              Contact Us
            </Button>
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
