'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Menu,
  Bell,
  Search,
  User,
  Settings,
  LogOut,
  UserCog
} from 'lucide-react';
import { useAuth, useDashboardStats } from '@/hooks/useDatabase';
import { supabase } from '@/lib/supabase';

interface HeaderProps {
  setSidebarOpen: (open: boolean) => void;
}

export function Header({ setSidebarOpen }: HeaderProps) {
  const [isSearching, setIsSearching] = useState(false);
  const { userProfile, signOut } = useAuth();
  const { unreadNotifications } = useDashboardStats();
  const router = useRouter();
  
  const handleSignOut = async () => {
    await signOut();
    router.push('/auth/login');
  };
  
  const getInitials = (name: string) => {
    return name.split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  return (
    <div className="sticky top-0 z-40 bg-white shadow-sm border-b">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="sm"
          className="lg:hidden"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Search */}
        <div className="flex-1 max-w-lg mx-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search contracts, documents, or ask a legal question..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onFocus={() => setIsSearching(true)}
              onBlur={() => setIsSearching(false)}
            />
            {isSearching && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border p-2 z-50 text-sm">
                <p className="text-gray-500 px-2 py-1">Start typing to search...</p>
              </div>
            )}
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <Link href="/dashboard/notifications">
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="h-5 w-5" />
              {unreadNotifications > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center p-0">
                  {unreadNotifications > 9 ? '9+' : unreadNotifications}
                </Badge>
              )}
            </Button>
          </Link>

          {/* Settings */}
          <Link href="/dashboard/account">
            <Button variant="ghost" size="sm">
              <Settings className="h-5 w-5" />
            </Button>
          </Link>

          {/* Profile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                <Avatar className="h-8 w-8">
                  {userProfile?.avatar_url ? (
                    <AvatarImage src={userProfile.avatar_url} alt={userProfile.full_name} />
                  ) : (
                    <AvatarFallback className="bg-blue-100 text-blue-600">
                      {userProfile?.full_name ? getInitials(userProfile.full_name) : <User className="h-4 w-4" />}
                    </AvatarFallback>
                  )}
                </Avatar>
                <span className="hidden sm:block text-sm font-medium">
                  {userProfile?.full_name || 'User'}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => router.push('/dashboard/account')}>
                <UserCog className="mr-2 h-4 w-4" />
                <span>Account Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}