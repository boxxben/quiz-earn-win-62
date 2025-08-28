import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, 
  Megaphone, 
  Plus,
  Info,
  Warning,
  CheckCircle
} from '@phosphor-icons/react';

export default function AdminAnnouncements() {
  const { user, hydrated } = useAuth();
  const { announcements, createAnnouncement } = useNotifications();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Redirect if not admin (after hydration)
  React.useEffect(() => {
    if (hydrated && !user?.isAdmin) {
      navigate('/home');
    }
  }, [hydrated, user?.isAdmin, navigate]);

  if (!hydrated) return null;
  if (!user?.isAdmin) return null;

  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info' as 'info' | 'warning' | 'success'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.message.trim()) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        variant: 'destructive'
      });
      return;
    }

    createAnnouncement(formData);
    
    toast({
      title: 'Announcement Sent!',
      description: 'Your announcement has been sent to all users',
    });

    // Reset form
    setFormData({
      title: '',
      message: '',
      type: 'info'
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'info':
        return <Info size={16} className="text-blue-500" />;
      case 'warning':
        return <Warning size={16} className="text-yellow-500" />;
      case 'success':
        return <CheckCircle size={16} className="text-green-500" />;
      default:
        return <Info size={16} className="text-blue-500" />;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'info':
        return <Badge className="bg-blue-100 text-blue-800">Info</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800">Warning</Badge>;
      case 'success':
        return <Badge className="bg-green-100 text-green-800">Success</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-6">
        <div className="flex items-center mb-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/admin')} className="text-primary-foreground hover:bg-white/20">
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-xl font-bold ml-4">Announcements</h1>
        </div>
        <p className="text-primary-foreground/80">Send announcements to all users</p>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Create Announcement */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Plus size={20} className="mr-2" />
              Create New Announcement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter announcement title"
                  maxLength={100}
                />
              </div>

              <div>
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Enter announcement message"
                  rows={4}
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.message.length}/500 characters
                </p>
              </div>

              <div>
                <Label htmlFor="type">Type</Label>
                <Select value={formData.type} onValueChange={(value: 'info' | 'warning' | 'success') => setFormData(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">
                      <div className="flex items-center">
                        <Info size={16} className="text-blue-500 mr-2" />
                        Information
                      </div>
                    </SelectItem>
                    <SelectItem value="warning">
                      <div className="flex items-center">
                        <Warning size={16} className="text-yellow-500 mr-2" />
                        Warning
                      </div>
                    </SelectItem>
                    <SelectItem value="success">
                      <div className="flex items-center">
                        <CheckCircle size={16} className="text-green-500 mr-2" />
                        Success
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" className="w-full">
                <Megaphone size={16} className="mr-2" />
                Send Announcement
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Announcement History */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Announcements ({announcements.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {announcements.map((announcement) => (
                <div key={announcement.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getTypeIcon(announcement.type)}
                      <h3 className="font-semibold">{announcement.title}</h3>
                      {getTypeBadge(announcement.type)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {announcement.createdAt.toLocaleDateString()} at {announcement.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">{announcement.message}</p>
                </div>
              ))}
              
              {announcements.length === 0 && (
                <div className="text-center py-8">
                  <Megaphone size={48} className="mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No announcements yet</p>
                  <p className="text-sm text-muted-foreground">Create your first announcement above</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="pb-6"></div>
    </div>
  );
}