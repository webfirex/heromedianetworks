'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Bell,
  ChevronDown,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Settings,
  LogOut,
  Mail,
  User,
  ArrowUp,
} from 'lucide-react';
import { format, addDays, subDays, startOfToday } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { signOut, useSession } from 'next-auth/react';
import Image from 'next/image';
import { DatePickerInput } from '@mantine/dates';

interface DashboardTopbarProps {
  activeTab: string;
  dateRange: [Date | null, Date | null];
  onDateRangeChange: (range: [Date | null, Date | null]) => void;
  sidebarCollapsed: boolean;
}

export default function DashboardTopbar({
  activeTab,
  dateRange,
  onDateRangeChange,
  sidebarCollapsed,
}: DashboardTopbarProps) {
  const { data: session } = useSession();
  const [notificationCount] = useState(3); // Mock notification count
  const [searchQuery, setSearchQuery] = useState('');

  const getTabTitle = () => {
    const titles: Record<string, string> = {
      dashboard: 'Dashboard',
      'top-offers': 'My Offers',
      postback: 'Postback',
      coupons: 'Coupons',
      'product-feed': 'Product Feed',
      'search-browse': 'Search/Browse',
    };
    return titles[activeTab] || 'Dashboard';
  };

  const handleDateNavigation = (direction: 'prev' | 'next') => {
    if (!dateRange[0] || !dateRange[1]) return;

    const daysDiff = Math.ceil(
      (dateRange[1].getTime() - dateRange[0].getTime()) / (1000 * 60 * 60 * 24)
    );

    if (direction === 'prev') {
      onDateRangeChange([
        subDays(dateRange[0], daysDiff + 1),
        subDays(dateRange[1], 1),
      ]);
    } else {
      onDateRangeChange([
        addDays(dateRange[0], 1),
        addDays(dateRange[1], daysDiff + 1),
      ]);
    }
  };

  const userInitial = session?.user?.name
    ? session.user.name.charAt(0).toUpperCase()
    : session?.user?.email
      ? session.user.email.charAt(0).toUpperCase()
      : 'U';

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={cn(
        'sticky top-0 z-40 w-full border-b border-sidebar-border',
        'bg-background backdrop-blur-sm'
      )}
    >
      <div className="flex h-16 items-center justify-between px-6">
        {/* Left Section - Logo & Title with Dropdown */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <Image
              src="/assests/logo.png"
              alt="Logo"
              width={32}
              height={32}
              className="rounded-lg"
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-auto p-0 text-lg font-semibold text-foreground hover:bg-transparent hover:text-foreground"
                >
                  {getTabTitle()}
                  <ChevronDown className="ml-1 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className={cn(
                  'w-48 bg-card border-border',
                  'text-foreground'
                )}
              >
                <DropdownMenuItem className="hover:bg-muted cursor-pointer">
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem className="hover:bg-muted cursor-pointer">
                  My Offers
                </DropdownMenuItem>
                <DropdownMenuItem className="hover:bg-muted cursor-pointer">
                  Postback
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Center Section - Rounded Search with Arrow */}
        <div className="flex-1 max-w-md mx-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
            <Input
              type="search"
              placeholder="STOMina campaign"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                'pl-10 pr-10 rounded-full bg-card border-border',
                'text-foreground placeholder:text-muted-foreground',
                'focus-visible:ring-primary focus-visible:border-primary',
                'h-10'
              )}
            />
            <ArrowUp className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground cursor-pointer hover:text-foreground" />
          </div>
        </div>

        {/* Right Section - Notifications, Date, User */}
        <div className="flex items-center gap-3">
          {/* Notifications with "X new" badge - BEFORE date picker */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  'relative h-9 w-9 rounded-full text-foreground hover:bg-card',
                  'border border-border'
                )}
              >
                <Bell className="h-4 w-4" />
                {notificationCount > 0 && (
                  <>
                    {/* Red dot indicator */}
                    <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full" />
                    {/* "X new" badge */}
                    <Badge
                      className={cn(
                        'absolute -top-2 -right-2 h-5 px-1.5 flex items-center justify-center rounded-full',
                        'bg-card text-foreground text-[10px] border border-border',
                        'font-normal'
                      )}
                    >
                      {notificationCount} new
                    </Badge>
                  </>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className={cn(
                'w-80 bg-card border-border',
                'text-foreground'
              )}
            >
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-border" />
              <div className="p-4 text-center text-sm text-muted-foreground">
                No new notifications
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Date Picker - AFTER notifications */}
          {activeTab === 'dashboard' && (
            <div className="flex items-center gap-1 h-9 bg-card border border-border rounded-lg relative z-[60]">
              <DatePickerInput
                type="range"
                placeholder="Pick dates range"
                value={dateRange}
                onChange={(value) => onDateRangeChange(value as unknown as [Date | null, Date | null])}
                clearable={false}
                numberOfColumns={2}
                styles={{
                  input: {
                    background: 'transparent',
                    border: 'none',
                    color: '#e4e4e7', // zinc-200
                    height: '100%',
                    paddingLeft: '40px',
                    paddingRight: '12px',
                    width: '240px',
                    fontSize: '13px',
                    fontWeight: 500,
                  },
                  placeholder: {
                    color: '#a1a1aa' // zinc-400
                  }
                }}
                leftSection={<Calendar size={14} />}
                leftSectionPointerEvents="none"
              />
            </div>
          )}

          {/* User Menu with Username */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  'h-auto px-2 py-1.5 gap-2 rounded-full text-foreground hover:bg-card',
                  'border border-border'
                )}
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {userInitial}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start hidden sm:flex">
                  <span className="text-sm font-medium leading-none">
                    {session?.user?.name || session?.user?.email?.split('@')[0] || 'User'}
                  </span>
                  <span className="text-xs text-muted-foreground leading-none mt-0.5">
                    @{session?.user?.email?.split('@')[0] || 'user'}
                  </span>
                </div>
                <ChevronDown className="h-4 w-4 hidden sm:inline-block" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className={cn(
                'w-56 bg-card border-border',
                'text-foreground'
              )}
            >
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {session?.user?.name || 'User'}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {session?.user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuItem className="hover:bg-secondary cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="hover:bg-secondary cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuItem
                className="hover:bg-secondary cursor-pointer text-red-400 focus:text-red-400"
                onClick={() => signOut()}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </motion.header>
  );
}

