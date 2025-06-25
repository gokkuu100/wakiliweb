'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bell, 
  Check, 
  Trash2, 
  Eye, 
  EyeOff,
  MoreHorizontal,
  Key,
  Sparkles,
  Settings,
  FileText,
  MessageSquare,
  AlertTriangle,
  Info,
  CheckCircle,
  Clock,
  Loader2
} from 'lucide-react';
import { 
  getUserNotifications, 
  getUnreadNotifications, 
  getNotificationsByType,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getNotificationStats,
  type Notification 
} from '@/lib/database/notifications';
import { useAuth } from '@/hooks/useAuthContext';
import { formatDistanceToNow } from 'date-fns';

function NotificationsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');

  // Handle hash navigation
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.substring(1);
      if (['all', 'unread', 'signature_request', 'ai_response', 'system', 'contract_update'].includes(hash)) {
        setActiveTab(hash);
      }
    };

    // Set initial tab from hash
    handleHashChange();
    
    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // Update URL hash to match active tab
    window.history.replaceState(null, '', `#${value}`);
  };

  const loadNotifications = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      const [allNotifications, unread, notificationStats] = await Promise.all([
        getUserNotifications(user.id),
        getUnreadNotifications(user.id),
        getNotificationStats(user.id)
      ]);

      setNotifications(allNotifications);
      setUnreadNotifications(unread);
      setStats(notificationStats);
    } catch (err) {
      console.error('Error loading notifications:', err);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      loadNotifications();
    }
  }, [user, authLoading]);

  const handleMarkAsRead = async (notificationId: string) => {
    if (!user) return;
    
    try {
      await markNotificationAsRead(user.id, notificationId);
      await loadNotifications(); // Refresh data
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user) return;
    
    try {
      await markAllNotificationsAsRead(user.id);
      await loadNotifications(); // Refresh data
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  const handleDelete = async (notificationId: string) => {
    if (!user) return;
    
    try {
      await deleteNotification(user.id, notificationId);
      await loadNotifications(); // Refresh data
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'signature_request':
        return <Key className="h-5 w-5 text-blue-600" />;
      case 'ai_response':
        return <Sparkles className="h-5 w-5 text-purple-600" />;
      case 'system':
        return <Settings className="h-5 w-5 text-gray-600" />;
      case 'contract_update':
        return <FileText className="h-5 w-5 text-green-600" />;
      case 'chat_message':
        return <MessageSquare className="h-5 w-5 text-indigo-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-600" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      default:
        return <Bell className="h-5 w-5 text-gray-600" />;
    }
  };

  const getNotificationsByCategory = (type: string) => {
    return notifications.filter(notification => notification.type === type);
  };

  const formatTime = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  };

  const NotificationItem = ({ notification }: { notification: Notification }) => (
    <div className={`p-4 border rounded-lg ${notification.is_read ? 'bg-white' : 'bg-blue-50 border-blue-200'}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <div className="flex-shrink-0 mt-1">
            {getNotificationIcon(notification.type)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h4 className="text-sm font-medium text-gray-900 truncate">
                {notification.title}
              </h4>
              {!notification.is_read && (
                <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
              )}
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {notification.message}
            </p>
            <p className="text-xs text-gray-400 mt-2">
              {formatTime(notification.created_at)}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-1 ml-4">
          {!notification.is_read && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleMarkAsRead(notification.id)}
              className="h-8 w-8 p-0"
            >
              <Check className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(notification.id)}
            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  if (authLoading || loading) {
    return (
      
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Loading notifications...</p>
          </div>
        </div>
      
    );
  }

  if (error) {
    return (
      
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Notifications</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={loadNotifications}>Try Again</Button>
        </div>
      
    );
  }

  return (
    
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
            <p className="text-gray-600">Stay updated with your legal activities</p>
          </div>
          <div className="flex items-center space-x-3">
            {stats && stats.unread > 0 && (
              <Button onClick={handleMarkAllAsRead} variant="outline">
                Mark All as Read
              </Button>
            )}
            <Button onClick={loadNotifications} variant="outline">
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Bell className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Notifications</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <EyeOff className="h-8 w-8 text-red-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Unread</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.unread}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Clock className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Recent</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {notifications.filter(n => 
                        new Date(n.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
                      ).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Notifications Tabs */}
        <Card>
          <CardHeader>
            <CardTitle>Your Notifications</CardTitle>
            <CardDescription>
              View and manage all your notifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={handleTabChange}>
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="unread">Unread</TabsTrigger>
                <TabsTrigger value="signature_request">Signatures</TabsTrigger>
                <TabsTrigger value="ai_response">AI Replies</TabsTrigger>
                <TabsTrigger value="system">System</TabsTrigger>
                <TabsTrigger value="contract_update">Contracts</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all" className="space-y-4 mt-6">
                {notifications.length === 0 ? (
                  <div className="text-center py-8">
                    <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
                    <p className="text-gray-600">You're all caught up!</p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <NotificationItem key={notification.id} notification={notification} />
                  ))
                )}
              </TabsContent>
              
              <TabsContent value="unread" className="space-y-4 mt-6">
                {unreadNotifications.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">All caught up!</h3>
                    <p className="text-gray-600">No unread notifications</p>
                  </div>
                ) : (
                  unreadNotifications.map((notification) => (
                    <NotificationItem key={notification.id} notification={notification} />
                  ))
                )}
              </TabsContent>
              
              {['signature_request', 'ai_response', 'system', 'contract_update'].map((type) => (
                <TabsContent key={type} value={type} className="space-y-4 mt-6">
                  {getNotificationsByCategory(type).length === 0 ? (
                    <div className="text-center py-8">
                      <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No {type.replace('_', ' ')} notifications
                      </h3>
                      <p className="text-gray-600">
                        You have no notifications in this category
                      </p>
                    </div>
                  ) : (
                    getNotificationsByCategory(type).map((notification) => (
                      <NotificationItem key={notification.id} notification={notification} />
                    ))
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </div>
  );
}

export default NotificationsPage;