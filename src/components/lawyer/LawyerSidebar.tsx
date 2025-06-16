'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Home,
  FolderOpen,
  FileText,
  Search,
  Bot,
  Users,
  Database,
  Bell,
  BarChart3,
  User,
  LogOut,
  ChevronDown,
  ChevronRight,
  Plus,
  Eye,
  Upload,
  History,
  Scale,
  BookOpen,
  Edit,
  Save,
  MessageSquare,
  Mail,
  Clock,
  Settings,
  CreditCard,
  Shield,
  X
} from 'lucide-react';

interface LawyerSidebarProps {
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

const navigation: NavigationItem[] = [
  {
    name: 'Dashboard',
    href: '/lawyer',
    icon: Home,
  },
  {
    name: 'My Cases / Matters',
    href: '/lawyer/cases',
    icon: FolderOpen,
    badge: '12',
    children: [
      { name: 'Add New Case File', href: '/lawyer/cases/create', icon: Plus },
      { name: 'View All Matters', href: '/lawyer/cases', icon: Eye },
    ],
  },
  {
    name: 'Document Analysis',
    href: '/lawyer/analysis',
    icon: FileText,
    children: [
      { name: 'Upload for Analysis', href: '/lawyer/analysis/upload', icon: Upload },
      { name: 'Recent Summaries', href: '/lawyer/analysis/summaries', icon: Eye },
    ],
  },
  {
    name: 'Legal Research',
    href: '/lawyer/research',
    icon: Search,
    children: [
      { name: 'Search Case Law', href: '/lawyer/research/search', icon: Search },
      { name: 'Upload & Compare', href: '/lawyer/research/compare', icon: Upload },
      { name: 'Research History', href: '/lawyer/research/history', icon: History },
    ],
  },
  {
    name: 'AI Legal Drafting',
    href: '/lawyer/drafting',
    icon: Bot,
    children: [
      { name: 'Generate from Prompt', href: '/lawyer/drafting/generate', icon: Edit },
      { name: 'Saved Drafts', href: '/lawyer/drafting/drafts', icon: Save },
      { name: 'Document Templates', href: '/lawyer/drafting/templates', icon: FileText },
    ],
  },
  {
    name: 'Client Collaboration',
    href: '/lawyer/clients',
    icon: Users,
    badge: '3',
    children: [
      { name: 'Received Contracts', href: '/lawyer/clients/contracts', icon: Mail },
      { name: 'Pending Reviews', href: '/lawyer/clients/pending', icon: Clock, badge: '2' },
      { name: 'Audit Trails', href: '/lawyer/clients/audit', icon: Eye },
      { name: 'Client Chat History', href: '/lawyer/clients/chat', icon: MessageSquare },
    ],
  },
  {
    name: 'Legal Tools & Resources',
    href: '/lawyer/resources',
    icon: Database,
    children: [
      { name: 'Kenyan Statutes', href: '/lawyer/resources/statutes', icon: Scale },
      { name: 'Judicial Precedents', href: '/lawyer/resources/precedents', icon: BookOpen },
      { name: 'Templates Library', href: '/lawyer/resources/templates', icon: FileText },
    ],
  },
  {
    name: 'Notifications',
    href: '/lawyer/notifications',
    icon: Bell,
    badge: '4',
    children: [
      { name: 'Document Updates', href: '/lawyer/notifications/documents', icon: FileText },
      { name: 'Client Submissions', href: '/lawyer/notifications/submissions', icon: Upload, badge: '2' },
      { name: 'Research Results', href: '/lawyer/notifications/research', icon: Search },
    ],
  },
  {
    name: 'Insights & Analytics',
    href: '/lawyer/insights',
    icon: BarChart3,
    children: [
      { name: 'AI Usage Analytics', href: '/lawyer/insights/usage', icon: BarChart3 },
      { name: 'Client Interactions', href: '/lawyer/insights/interactions', icon: Users },
    ],
  },
  {
    name: 'My Account',
    href: '/lawyer/account',
    icon: User,
    children: [
      { name: 'View Profile', href: '/lawyer/account/profile', icon: User },
      { name: 'Practice Details', href: '/lawyer/account/practice', icon: Scale },
      { name: 'Billing & Plan', href: '/lawyer/account/billing', icon: CreditCard },
      { name: 'Security Settings', href: '/lawyer/account/security', icon: Shield },
    ],
  },
];

export function LawyerSidebar({ open, setOpen }: LawyerSidebarProps) {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>(['My Cases / Matters']);

  const toggleExpanded = (itemName: string) => {
    setExpandedItems(prev => 
      prev.includes(itemName) 
        ? prev.filter(name => name !== itemName)
        : [...prev, itemName]
    );
  };

  const isActive = (href: string) => {
    if (href === '/lawyer') {
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
              <Scale className="h-8 w-8 text-indigo-600" />
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                LegalAI Pro
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
                      <button
                        onClick={() => toggleExpanded(item.name)}
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                          isParentActive(item)
                            ? "bg-indigo-50 text-indigo-700"
                            : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                        )}
                      >
                        <div className="flex items-center">
                          <item.icon className="mr-3 h-5 w-5" />
                          {item.name}
                          {item.badge && (
                            <Badge className="ml-2 bg-indigo-100 text-indigo-800 text-xs">
                              {item.badge}
                            </Badge>
                          )}
                        </div>
                        {expandedItems.includes(item.name) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                    ) : (
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                          isActive(item.href)
                            ? "bg-indigo-50 text-indigo-700"
                            : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                        )}
                        onClick={() => setOpen(false)}
                      >
                        <item.icon className="mr-3 h-5 w-5" />
                        {item.name}
                        {item.badge && (
                          <Badge className="ml-auto bg-indigo-100 text-indigo-800 text-xs">
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
                                  ? "bg-indigo-50 text-indigo-700 font-medium"
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
              <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                <User className="h-4 w-4 text-indigo-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">Sarah Mwangi</p>
                <p className="text-xs text-gray-500 truncate">Legal Professional</p>
              </div>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-700 hover:text-gray-900 hover:bg-gray-50"
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