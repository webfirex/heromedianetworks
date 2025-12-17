'use client';

import React, { useState, useEffect } from 'react';
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
  Lock,
  CalendarDays,
  X,
  Menu,
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { showNotification } from '@/app/utils/notificationManager';

interface DashboardTopbarProps {
  activeTab: string;
  dateRange: [Date | null, Date | null];
  onDateRangeChange: (range: [Date | null, Date | null]) => void;
  sidebarCollapsed: boolean;
  onMobileMenuOpen?: () => void;
}

export default function DashboardTopbar({
  activeTab,
  dateRange,
  onDateRangeChange,
  sidebarCollapsed,
  onMobileMenuOpen,
}: DashboardTopbarProps) {
  const { data: session, status } = useSession();
  const [notificationCount] = useState(3); // Mock notification count
  const [searchQuery, setSearchQuery] = useState('');
  
  // Profile & Settings Sheet states
  const [profileOpen, setProfileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  
  // Settings form states
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [registeredAt, setRegisteredAt] = useState<string | null>(null);
  
  // Fetch user registration date when settings opens
  useEffect(() => {
    const fetchRegistrationDate = async () => {
      if (status === 'authenticated' && session?.user?.email && (profileOpen || settingsOpen)) {
        try {
          const response = await fetch(`/api/user-info?email=${session.user.email}`);
          const data = await response.json();

          if (response.ok) {
            if (data.registeredAt) {
              setRegisteredAt(new Date(data.registeredAt).toLocaleDateString());
            } else if (data.createdAt) {
              setRegisteredAt(new Date(data.createdAt).toLocaleDateString());
            } else {
              setRegisteredAt('N/A');
            }
          }
        } catch (error) {
          console.error('Error fetching registration date:', error);
        }
      }
    };

    fetchRegistrationDate();
  }, [status, session?.user?.email, profileOpen, settingsOpen]);
  
  const handlePasswordResetSubmit = async () => {
    if (newPassword !== confirmNewPassword) {
      showNotification({
        title: 'Password Mismatch',
        message: 'New password and confirm password do not match.',
        color: 'red',
        withClose: false
      });
      return;
    }

    if (newPassword.length < 6) {
      showNotification({
        title: 'Password Too Short',
        message: 'Password must be at least 6 characters long.',
        color: 'red',
        withClose: false
      });
      return;
    }

    setIsResettingPassword(true);
    try {
      const response = await fetch('/api/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: session?.user?.email, newPassword }),
      });

      if (response.ok) {
        showNotification({
          title: 'Success!',
          message: 'Your password has been reset successfully. Please log in again.',
          color: 'green',
          withClose: false
        });
        setNewPassword('');
        setConfirmNewPassword('');
        setSettingsOpen(false);
        signOut();
      } else {
        const errorData = await response.json();
        showNotification({
          title: 'Password Reset Failed',
          message: errorData.error || 'Something went wrong. Please try again.',
          color: 'red',
          withClose: false
        });
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      showNotification({
        title: 'Network Error',
        message: 'Could not connect to the server. Please try again.',
        color: 'red',
        withClose: false
      });
    } finally {
      setIsResettingPassword(false);
    }
  };

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
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        {/* Left Section - Hamburger Menu (mobile) + Dashboard Title */}
        <div className="flex items-center gap-3">
          {/* Mobile Hamburger Menu */}
          <button
            onClick={onMobileMenuOpen}
            className="md:hidden p-2 -ml-2 rounded-lg hover:bg-card text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>
          <span className="text-lg font-semibold text-foreground">
            {getTabTitle()}
          </span>
        </div>

        {/* Right Section - Date, User */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Date Picker - responsive */}
          {activeTab === 'dashboard' && (
            <div className="hidden sm:flex items-center gap-1 h-auto py-1 pl-2 pr-1 bg-card border border-border rounded-full relative z-[60] dark-date-picker-wrapper max-w-xs lg:max-w-sm">
              <DatePickerInput
                type="range"
                placeholder="Pick dates range"
                value={dateRange}
                onChange={(value) => onDateRangeChange(value as unknown as [Date | null, Date | null])}
                clearable={false}
                numberOfColumns={2}
                popoverProps={{
                  styles: {
                    dropdown: {
                      backgroundColor: '#020617',
                      border: '1px solid #27272a',
                      boxShadow: '0 20px 45px rgba(0,0,0,0.6)',
                      padding: 8,
                    },
                  },
                }}
                styles={{
                  input: {
                    background: 'transparent',
                    border: 'none',
                    color: '#e4e4e7',
                    height: '34px',
                    paddingLeft: '28px',
                    paddingRight: '12px',
                    width: '100%',
                    fontSize: '13px',
                    fontWeight: 500,
                  },
                  placeholder: {
                    color: '#a1a1aa',
                  },
                }}
                leftSection={<Calendar size={16} className="text-muted-foreground ml-1" />}
                leftSectionPointerEvents="none"
              />
            </div>
          )}
          
          {/* Mobile Date Picker - Icon only that opens popover */}
          {activeTab === 'dashboard' && (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="sm:hidden h-9 w-9 p-0 rounded-full border border-border bg-card"
                >
                  <Calendar size={18} className="text-muted-foreground" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-3 bg-card border-border" align="end">
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground font-medium">Select Date Range</p>
                  <DatePickerInput
                    type="range"
                    placeholder="Pick dates"
                    value={dateRange}
                    onChange={(value) => onDateRangeChange(value as unknown as [Date | null, Date | null])}
                    clearable={false}
                    numberOfColumns={1}
                    popoverProps={{
                      styles: {
                        dropdown: {
                          backgroundColor: '#020617',
                          border: '1px solid #27272a',
                          boxShadow: '0 20px 45px rgba(0,0,0,0.6)',
                          padding: 8,
                        },
                      },
                    }}
                    styles={{
                      input: {
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid #27272a',
                        borderRadius: '8px',
                        color: '#e4e4e7',
                        height: '38px',
                        paddingLeft: '12px',
                        paddingRight: '12px',
                        width: '200px',
                        fontSize: '13px',
                        fontWeight: 500,
                      },
                      placeholder: {
                        color: '#a1a1aa',
                      },
                    }}
                  />
                </div>
              </PopoverContent>
            </Popover>
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
              <DropdownMenuItem 
                className="hover:bg-secondary cursor-pointer"
                onClick={() => setProfileOpen(true)}
              >
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="hover:bg-secondary cursor-pointer"
                onClick={() => setSettingsOpen(true)}
              >
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
      
      {/* Profile Sheet */}
      <Sheet open={profileOpen} onOpenChange={setProfileOpen}>
        <SheetContent className="bg-background border-l border-border">
          <SheetHeader>
            <SheetTitle className="text-foreground">Profile</SheetTitle>
            <SheetDescription className="text-muted-foreground">
              View your account information
            </SheetDescription>
          </SheetHeader>
          
          <div className="mt-6 space-y-6">
            {/* Profile Avatar */}
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                  {userInitial}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  {session?.user?.name || 'User'}
                </h3>
                <p className="text-sm text-muted-foreground">Publisher</p>
              </div>
            </div>
            
            {/* Account Info */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-foreground">Account Information</h4>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-sm text-foreground">{session?.user?.email || 'N/A'}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Name</p>
                    <p className="text-sm text-foreground">{session?.user?.name || 'Not set'}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Member Since</p>
                    <p className="text-sm text-foreground">{registeredAt || 'Loading...'}</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Quick Actions */}
            <div className="space-y-3 pt-4 border-t border-border">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => {
                  setProfileOpen(false);
                  setSettingsOpen(true);
                }}
              >
                <Settings className="mr-2 h-4 w-4" />
                Go to Settings
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
      
      {/* Settings Sheet */}
      <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
        <SheetContent className="bg-background border-l border-border">
          <SheetHeader>
            <SheetTitle className="text-foreground">Settings</SheetTitle>
            <SheetDescription className="text-muted-foreground">
              Manage your account settings
            </SheetDescription>
          </SheetHeader>
          
          <div className="mt-6 space-y-6">
            {/* Account Info Section */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-foreground">Account Info</h4>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-sm text-foreground">{session?.user?.email || 'N/A'}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Registered</p>
                    <p className="text-sm text-foreground">{registeredAt || 'Loading...'}</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Reset Password Section */}
            <div className="space-y-4 pt-4 border-t border-border">
              <h4 className="text-sm font-medium text-foreground">Reset Password</h4>
              
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="new-password" className="text-foreground">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="new-password"
                      type="password"
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="pl-10 bg-card border-border"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="text-foreground">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="Confirm new password"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      className="pl-10 bg-card border-border"
                    />
                  </div>
                </div>
                
                {newPassword && confirmNewPassword && newPassword !== confirmNewPassword && (
                  <p className="text-xs text-red-500">Passwords do not match</p>
                )}
                
                <Button
                  className="w-full"
                  onClick={handlePasswordResetSubmit}
                  disabled={!newPassword || !confirmNewPassword || newPassword !== confirmNewPassword || isResettingPassword}
                >
                  {isResettingPassword ? 'Resetting...' : 'Reset Password'}
                </Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </motion.header>
  );
}

