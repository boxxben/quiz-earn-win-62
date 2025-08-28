import React from 'react';
import { useNotifications } from '@/contexts/NotificationContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  BellSimple, 
  Megaphone, 
  Brain, 
  Coins, 
  Info,
  CheckCircle
} from '@phosphor-icons/react';

interface NotificationModalProps {
  children: React.ReactNode;
}

export default function NotificationModal({ children }: NotificationModalProps) {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'announcement':
        return <Megaphone size={16} className="text-blue-500" />;
      case 'quiz':
        return <Brain size={16} className="text-purple-500" />;
      case 'earnings':
        return <Coins size={16} className="text-green-500" />;
      case 'system':
        return <Info size={16} className="text-gray-500" />;
      default:
        return <BellSimple size={16} className="text-blue-500" />;
    }
  };

  const formatTimeAgo = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - dateObj.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center">
              <BellSimple size={20} className="mr-2" />
              Notifications
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unreadCount}
                </Badge>
              )}
            </DialogTitle>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                <CheckCircle size={16} className="mr-1" />
                Mark all read
              </Button>
            )}
          </div>
        </DialogHeader>
        
        <ScrollArea className="max-h-96">
          <div className="space-y-3 pr-4">
            {notifications.length === 0 ? (
              <div className="text-center py-8">
                <BellSimple size={48} className="mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No notifications yet</p>
                <p className="text-sm text-muted-foreground">We'll notify you when something happens</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                    notification.isRead 
                      ? 'border-border bg-background' 
                      : 'border-primary/20 bg-primary/5'
                  }`}
                  onClick={() => !notification.isRead && markAsRead(notification.id)}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-sm font-medium truncate">
                          {notification.title}
                        </h4>
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 ml-2" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatTimeAgo(notification.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}