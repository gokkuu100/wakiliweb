'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth, useDashboardStats } from '@/hooks/useDatabase';
import { supabase } from '@/lib/supabase';
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

const getNavigation = (
  totalContracts: number = 0,
  pendingSignatureContracts: number = 0,
  unreadNotifications: number = 0
): NavigationItem[] => [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: Home,
  },
  {
    name: 'My Contracts',
    href: '/dashboard/contracts',
    icon: FileText,
    badge: totalContracts > 0 ? String(totalContracts) : undefined,
    children: [
      { name: 'Create New Contract', href: '/dashboard/contracts/create', icon: Plus },
      { name: 'View All Contracts', href: '/dashboard/contracts', icon: Eye },
      { name: 'Pending Signatures', href: '/dashboard/contracts/pending', icon: Clock, 
        badge: pendingSignatureContracts > 0 ? String(pendingSignatureContracts) : undefined },
      { name: 'Sent for Signing', href: '/dashboard/contracts/sent', icon: Send },
      { name: 'Signed Contracts', href: '/dashboard/contracts/signed', icon: CheckCircle },
      { name: 'Upload My Own Contract', href: '/dashboard/contracts/upload', icon: Upload },
    ],
  },
  {
    name: 'Contract AI Assistant',
    href: '/dashboard/contract-ai',
    icon: Bot,
    children: [
      { name: 'Start Contract from Description', href: '/dashboard/contract-ai/create', icon: MessageCircle },
    ],
  },
  {
    name: 'Legal Vault',
    href: '/dashboard/vault',
    icon: FolderOpen,
    children: [
      { name: 'Uploaded Documents', href: '/dashboard/vault/documents', icon: Upload },
      { name: 'Document Summaries', href: '/dashboard/vault/summaries', icon: Eye },
    ],
  },
  {
    name: 'Legal Chat Assistant',
    href: '/dashboard/chat',
    icon: MessageSquare,
    children: [
      { name: 'Ask About Kenyan Law', href: '/dashboard/chat/ask', icon: MessageCircle },
      { name: 'Past Conversations', href: '/dashboard/chat/history', icon: History },
      { name: 'Upload + Ask a Question', href: '/dashboard/chat/upload', icon: Paperclip },
    ],
  },
  {
    name: 'Find a Lawyer',
    href: '/dashboard/lawyers',
    icon: Scale,
    children: [
      { name: 'Lawyers Near Me', href: '/dashboard/lawyers/nearby', icon: MapPin },
      { name: 'Suggested Lawyers by Need', href: '/dashboard/lawyers/suggested', icon: Brain },
    ],
  },
  {
    name: 'Notifications',
    href: '/dashboard/notifications',
    icon: Bell,
    badge: unreadNotifications > 0 ? String(unreadNotifications) : undefined,
    children: [
      { name: 'Pending Signatures', href: '/dashboard/notifications/signatures', icon: Key },
      { name: 'AI Replies', href: '/dashboard/notifications/ai-replies', icon: Sparkles },
      { name: 'System Updates', href: '/dashboard/notifications/system', icon: Settings },
    ],
  },
  {
    name: 'My Account',
    href: '/dashboard/account',
    icon: User,
    children: [
      { name: 'View Profile', href: '/dashboard/account/profile', icon: User },
      { name: 'Edit Info', href: '/dashboard/account/edit', icon: Edit },
      { name: 'Change Password', href: '/dashboard/account/password', icon: Lock },
      { name: 'Billing & Plan', href: '/dashboard/account/billing', icon: CreditCard },
    ],
  },
];

export function Sidebar({ open, setOpen }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [expandedItems, setExpandedItems] = useState<string[]>(['My Contracts']);
  const { userProfile } = useAuth();
  const { 
    totalContracts, 
    pendingSignatureContracts, 
    unreadNotifications 
  } = useDashboardStats();

  const toggleExpanded = (itemName: string) => {
    setExpandedItems(prev => 
      prev.includes(itemName) 
        ? prev.filter(name => name !== itemName)
        : [...prev, itemName]
    );
  };
  
  // Navigate to the main section when a parent item is clicked
  const handleItemClick = (item: NavigationItem) => {
    if (item.href) {
      router.push(item.href);
      setOpen(false);
    }
  };

  const isActive = (href: string) => {
    if (href === '/dashboard') {
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
        "fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 lg:z-auto",
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
              {getNavigation(totalContracts, pendingSignatureContracts, unreadNotifications).map((item: NavigationItem) => (
                <li key={item.name}>
                  <div>
                    {item.children ? (
                      <div className="flex items-center justify-between">
                        <Link 
                          href={item.href}
                          className={cn(
                            "flex-grow flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                            isParentActive(item)
                              ? "bg-blue-50 text-blue-700"
                              : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                          )}
                          onClick={() => {
                            router.push(item.href);
                            setOpen(false); // Close mobile sidebar after clicking
                          }}
                        >
                          <item.icon className="mr-3 h-5 w-5" />
                          {item.name}
                          {item.badge && (
                            <Badge className="ml-2 bg-blue-100 text-blue-800 text-xs">
                              {item.badge}
                            </Badge>
                          )}
                        </Link>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleExpanded(item.name);
                          }}
                          className="px-2 ml-1"
                          aria-label={expandedItems.includes(item.name) ? "Collapse" : "Expand"}
                        >
                          {expandedItems.includes(item.name) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
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
                        {item.children.map((child: NavigationItem) => (
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
              <Avatar className="h-8 w-8">
                {userProfile?.avatar_url ? (
                  <AvatarImage src={userProfile.avatar_url} />
                ) : (
                  <AvatarFallback className="bg-blue-100 text-blue-600">
                    {userProfile?.full_name ? userProfile.full_name.charAt(0).toUpperCase() : <User className="h-4 w-4" />}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {userProfile?.full_name || 'User'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {userProfile?.user_type === 'lawyer' ? 'Lawyer' : 'Citizen'} Account
                </p>
              </div>
            </div>
            <Link href="/auth/login">
              <Button
                variant="ghost"
                className="w-full justify-start text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                onClick={async () => {
                  await supabase.auth.signOut();
                  window.location.href = '/auth/login';
                }}
              >
                <LogOut className="mr-3 h-4 w-4" />
                Logout
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}