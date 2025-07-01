'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useUserData } from '@/hooks/useUserData';
import { useAuth } from '@/hooks/useAuthContext';
import { getNotificationCountsByType } from '@/lib/database/notifications';
import { 
  Home,
  FileText,
  Bot,
  FolderOpen,
  MessageSquare,
  Scale,
  Bell,
  User,
  LogOut,
  ChevronDown,
  ChevronRight,
  Plus,
  Eye,
  Clock,
  Send,
  CheckCircle,
  Upload,
  MessageCircle,
  History,
  Paperclip,
  MapPin,
  Brain,
  Key,
  Sparkles,
  Settings,
  Edit,
  Lock,
  CreditCard,
  X
} from 'lucide-react';

interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: any;
  badge?: string;
  children?: NavigationItem[];
}

const getNavigation = (stats: any, notificationCounts: any): NavigationItem[] => [
  {
    name: 'Dashboard',
    href: '/citizen',
    icon: Home,
  },
  {
    name: 'My Contracts',
    href: '/citizen/contracts',
    icon: FileText,
    badge: stats?.totalContracts?.toString() || '0',
    children: [
      { name: 'Create New Contract', href: '/citizen/contracts/create', icon: Plus },
      { name: 'View All Contracts', href: '/citizen/contracts#all', icon: Eye },
      { name: 'Pending Signatures', href: '/citizen/contracts/pending', icon: Clock, badge: notificationCounts?.signatures?.toString() || '0' },
      { name: 'Sent for Signing', href: '/citizen/contracts/sent', icon: Send },
      { name: 'Signed Contracts', href: '/citizen/contracts/signed', icon: CheckCircle },
      { name: 'Upload My Own Contract', href: '/citizen/contracts/upload', icon: Upload },
    ],
  },
  {
    name: 'Contract AI Assistant',
    href: '/citizen/contract-ai',
    icon: Bot,
    children: [
      { name: 'Start Contract from Description', href: '/citizen/contract-ai', icon: MessageCircle },
    ],
  },
  {
    name: 'Legal Document Summary',
    href: '/citizen/documents-ai',
    icon: FolderOpen,
    children: [
      { name: 'Upload Documents', href: '/citizen/documents-ai#upload', icon: Upload },
      { name: 'Document Analysis', href: '/citizen/documents-ai#analysis', icon: Eye },
    ],
  },
  {
    name: 'Legal Chat Assistant',
    href: '/citizen/aichat',
    icon: MessageSquare,
    badge: stats?.aiConversations?.toString() || '0',
    children: [
      { name: 'Ask About Kenyan Law', href: '/citizen/chat#askai', icon: MessageCircle },
      { name: 'Past Conversations', href: '/citizen/chat#history', icon: History },
      { name: 'Upload + Ask a Question', href: '/citizen/chat#upload', icon: Paperclip },
    ],
  },
  {
    name: 'Find a Lawyer',
    href: '/citizen/lawyers',
    icon: Scale,
    children: [
      { name: 'Lawyers Near Me', href: '/citizen/lawyers/nearby', icon: MapPin },
      { name: 'Suggested Lawyers by Need', href: '/citizen/lawyers/suggested', icon: Brain },
    ],
  },
  {
    name: 'Notifications',
    href: '/citizen/notifications',
    icon: Bell,
    badge: stats?.notifications?.unread?.toString() || '0',
    children: [
      { name: 'Pending Signatures', href: '/citizen/notifications#signature_request', icon: Key, badge: notificationCounts?.signatures?.toString() || '0' },
      { name: 'AI Replies', href: '/citizen/notifications#ai_response', icon: Sparkles, badge: notificationCounts?.aiReplies?.toString() || '0' },
      { name: 'System Updates', href: '/citizen/notifications#system', icon: Settings, badge: notificationCounts?.system?.toString() || '0' },
    ],
  },
  {
    name: 'My Account',
    href: '/citizen/account',
    icon: User,
    children: [
      { name: 'View Profile', href: '/citizen/account#profile', icon: User },
      { name: 'Edit Info', href: '/citizen/account#profile', icon: Edit },
      { name: 'Change Password', href: '/citizen/account#security', icon: Lock },
      { name: 'Billing & Plan', href: '/citizen/account#usage', icon: CreditCard },
    ],
  },
];

export function Sidebar({ open, setOpen }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut, user } = useAuth();
  const { profile, stats, notifications, isLoading } = useUserData();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [notificationCounts, setNotificationCounts] = useState<any>(null);

  useEffect(() => {
    if (user?.id) {
      getNotificationCountsByType(user.id).then(setNotificationCounts);
    }
  }, [user?.id]); // Only depend on user.id, not stats which changes frequently

  const navigation = getNavigation({ ...stats, notifications }, notificationCounts);

  const toggleExpanded = (itemName: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setExpandedItems(prev => 
      prev.includes(itemName) 
        ? prev.filter(name => name !== itemName)
        : [...prev, itemName]
    );
  };

  const handleParentClick = (item: NavigationItem) => {
    // Navigate to parent route
    router.push(item.href);
    setOpen(false);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/auth/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const isActive = (href: string) => {
    if (href === '/citizen') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const isParentActive = (item: NavigationItem) => {
    if (isActive(item.href)) return true;
    if (item.children) {
      return item.children.some(child => isActive(child.href));
    }
    return false;
  };

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
        open ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 shrink-0 items-center justify-between px-6 border-b">
            <div className="flex items-center space-x-2">
              <Scale className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                LegalAI
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-4 py-6">
            <ul className="space-y-2">
              {navigation.map((item) => (
                <li key={item.name}>
                  <div>
                    {item.children ? (
                      <div className="relative">
                        <button
                          onClick={() => handleParentClick(item)}
                          className={cn(
                            "w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors pr-10",
                            isParentActive(item)
                              ? "bg-blue-50 text-blue-700"
                              : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                          )}
                        >
                          <item.icon className="mr-3 h-5 w-5" />
                          {item.name}
                          {item.badge && (
                            <Badge className="ml-2 bg-blue-100 text-blue-800 text-xs">
                              {item.badge}
                            </Badge>
                          )}
                        </button>
                        <button
                          onClick={(e) => toggleExpanded(item.name, e)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
                        >
                          {expandedItems.includes(item.name) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    ) : (
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                          isActive(item.href)
                            ? "bg-blue-50 text-blue-700"
                            : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                        )}
                        onClick={() => setOpen(false)}
                      >
                        <item.icon className="mr-3 h-5 w-5" />
                        {item.name}
                        {item.badge && (
                          <Badge className="ml-auto bg-blue-100 text-blue-800 text-xs">
                            {item.badge}
                          </Badge>
                        )}
                      </Link>
                    )}

                    {/* Submenu */}
                    {item.children && expandedItems.includes(item.name) && (
                      <ul className="mt-2 ml-6 space-y-1">
                        {item.children.map((child) => (
                          <li key={child.name}>
                            <Link
                              href={child.href}
                              className={cn(
                                "flex items-center px-3 py-2 text-sm rounded-lg transition-colors",
                                isActive(child.href)
                                  ? "bg-blue-50 text-blue-700 font-medium"
                                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                              )}
                              onClick={() => setOpen(false)}
                            >
                              <child.icon className="mr-3 h-4 w-4" />
                              {child.name}
                              {child.badge && (
                                <Badge className="ml-auto bg-red-100 text-red-800 text-xs">
                                  {child.badge}
                                </Badge>
                              )}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </nav>

          {/* User section */}
          <div className="border-t px-4 py-4">
            <div className="flex items-center space-x-3 mb-3">
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                <User className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {isLoading ? 'Loading...' : profile?.name || 'User'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {isLoading ? '...' : profile?.plan || 'No Plan'}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-700 hover:text-gray-900 hover:bg-gray-50"
              onClick={handleLogout}
            >
              <LogOut className="mr-3 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}