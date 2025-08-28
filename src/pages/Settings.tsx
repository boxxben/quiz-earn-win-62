import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, User, Bell, Shield, Eye, EyeSlash } from '@phosphor-icons/react';

export default function Settings() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [notifications, setNotifications] = useState({
    quizReminders: true,
    earnings: true,
    marketing: false
  });
  
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    
    updateUser({
      name: formData.name,
      email: formData.email
    });
    
    toast({
      title: 'Profile Updated',
      description: 'Your profile information has been saved successfully.',
    });
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.newPassword !== formData.confirmPassword) {
      toast({
        title: 'Password Mismatch',
        description: 'New passwords do not match.',
        variant: 'destructive'
      });
      return;
    }
    
    if (formData.newPassword.length < 6) {
      toast({
        title: 'Password Too Short',
        description: 'Password must be at least 6 characters long.',
        variant: 'destructive'
      });
      return;
    }
    
    // Mock password change
    toast({
      title: 'Password Changed',
      description: 'Your password has been updated successfully.',
    });
    
    setFormData(prev => ({
      ...prev,
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }));
  };

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-6">
        <div className="flex items-center mb-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/profile')} className="text-primary-foreground hover:bg-white/20">
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-xl font-bold ml-4">Settings</h1>
        </div>
        <p className="text-primary-foreground/80">Manage your account preferences</p>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User size={20} className="mr-2" />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>
              
              <Button type="submit" className="w-full">
                Update Profile
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Password Change */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield size={20} className="mr-2" />
              Change Password
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <Label htmlFor="currentPassword">Current Password</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showPasswords.current ? 'text' : 'password'}
                    value={formData.currentPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, currentPassword: e.target.value }))}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => togglePasswordVisibility('current')}
                  >
                    {showPasswords.current ? <EyeSlash size={16} /> : <Eye size={16} />}
                  </Button>
                </div>
              </div>
              
              <div>
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPasswords.new ? 'text' : 'password'}
                    value={formData.newPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => togglePasswordVisibility('new')}
                  >
                    {showPasswords.new ? <EyeSlash size={16} /> : <Eye size={16} />}
                  </Button>
                </div>
              </div>
              
              <div>
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showPasswords.confirm ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => togglePasswordVisibility('confirm')}
                  >
                    {showPasswords.confirm ? <EyeSlash size={16} /> : <Eye size={16} />}
                  </Button>
                </div>
              </div>
              
              <Button type="submit" variant="outline" className="w-full">
                Change Password
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bell size={20} className="mr-2" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Quiz Reminders</p>
                <p className="text-sm text-muted-foreground">Get notified about upcoming quizzes</p>
              </div>
              <Switch
                checked={notifications.quizReminders}
                onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, quizReminders: checked }))}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Earnings Updates</p>
                <p className="text-sm text-muted-foreground">Notifications about your quiz earnings</p>
              </div>
              <Switch
                checked={notifications.earnings}
                onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, earnings: checked }))}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Marketing & Promotions</p>
                <p className="text-sm text-muted-foreground">Special offers and promotions</p>
              </div>
              <Switch
                checked={notifications.marketing}
                onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, marketing: checked }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Country</span>
              <span className="font-medium">{user?.country}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Member Since</span>
              <span className="font-medium">January 2024</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Account Status</span>
              <span className="font-medium text-accent">Active</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="pb-6"></div>
    </div>
  );
}