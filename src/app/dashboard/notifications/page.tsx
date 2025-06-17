'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useAuth, useNotifications } from '@/hooks/useDatabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, Key, Sparkles, Settings, CheckCircle, Clock, MessageSquare, FileText, X, AreaChart as MarkAsUnread } from 'lucide-react';

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState('all');
  const { user } = useAuth();
  const { notifications, loading, error } = useNotifications();

  const allNotifications = [
    ...notifications.signatures.map(n => ({ ...n, category: 'signature' })),
    ...notifications.aiReplies.map(n => ({ ...n, category: 'ai' })),
    ...notifications.system.map(n => ({ ...n, category: 'system' }))
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  const getNotificationIcon = (category: string, urgent?: boolean) => {
    switch (category) {
      case 'signature':
        return <Key className={`h-5 w-5 ${urgent ? 'text-red-600' : 'text-blue-600'}`} />;
      case 'ai':
        return <Sparkles className="h-5 w-5 text-purple-600" />;
      case 'system':
        return <Settings className="h-5 w-5 text-gray-600" />;
      default:
        return <Bell className="h-5 w-5 text-gray-600" />;
    }
  };

  const getUrgencyBadge = (urgent?: boolean) => {
    if (urgent) {
      return <Badge className="bg-red-100 text-red-800">Urgent</Badge>;
    }
    return null;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
            <p className="text-gray-600">Stay updated with your legal activities</p>
          </div>
          <Button variant="outline">
            <CheckCircle className="mr-2 h-4 w-4" />
            Mark All as Read
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Unread</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">5</div>
              <p className="text-xs text-muted-foreground">
                Notifications pending
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Signatures</CardTitle>
              <Key className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2</div>
              <p className="text-xs text-muted-foreground">
                Require action
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">AI Replies</CardTitle>
              <Sparkles className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1</div>
              <p className="text-xs text-muted-foreground">
                New responses
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Updates</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2</div>
              <p className="text-xs text-muted-foreground">
                New updates
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Notifications */}
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">
              All ({allNotifications.length})
            </TabsTrigger>
            <TabsTrigger value="signatures">
              Signatures ({notifications.signatures.length})
            </TabsTrigger>
            <TabsTrigger value="ai">
              AI Replies ({notifications.aiReplies.length})
            </TabsTrigger>
            <TabsTrigger value="system">
              System ({notifications.system.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {allNotifications.map((notification) => (
              <Card key={`${notification.category}-${notification.id}`} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      {getNotificationIcon(notification.category, notification.urgent)}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                          {getUrgencyBadge(notification.urgent)}
                        </div>
                        <p className="text-gray-600 text-sm mb-2">{notification.description}</p>
                        <div className="flex items-center text-xs text-gray-500">
                          <Clock className="h-3 w-3 mr-1" />
                          {notification.time}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="signatures" className="space-y-4">
            {notifications.signatures.map((notification) => (
              <Card key={notification.id} className="hover:shadow-md transition-shadow border-orange-200">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <Key className={`h-5 w-5 ${notification.urgent ? 'text-red-600' : 'text-blue-600'}`} />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                          {getUrgencyBadge(notification.urgent)}
                        </div>
                        <p className="text-gray-600 text-sm mb-2">{notification.description}</p>
                        <p className="text-sm font-medium text-blue-600 mb-2">{notification.contractName}</p>
                        <div className="flex items-center text-xs text-gray-500">
                          <Clock className="h-3 w-3 mr-1" />
                          {notification.time}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                        <FileText className="mr-2 h-4 w-4" />
                        Sign Now
                      </Button>
                      <Button variant="outline" size="sm">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="ai" className="space-y-4">
            {notifications.aiReplies.map((notification) => (
              <Card key={notification.id} className="hover:shadow-md transition-shadow border-purple-200">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <Sparkles className="h-5 w-5 text-purple-600" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">{notification.title}</h3>
                        <p className="text-gray-600 text-sm mb-2">{notification.description}</p>
                        <p className="text-sm font-medium text-purple-600 mb-2">"{notification.question}"</p>
                        <div className="flex items-center text-xs text-gray-500">
                          <Clock className="h-3 w-3 mr-1" />
                          {notification.time}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                        <MessageSquare className="mr-2 h-4 w-4" />
                        View Answer
                      </Button>
                      <Button variant="outline" size="sm">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="system" className="space-y-4">
            {notifications.system.map((notification) => (
              <Card key={notification.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <Settings className="h-5 w-5 text-gray-600" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">{notification.title}</h3>
                        <p className="text-gray-600 text-sm mb-2">{notification.description}</p>
                        <div className="flex items-center text-xs text-gray-500">
                          <Clock className="h-3 w-3 mr-1" />
                          {notification.time}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}