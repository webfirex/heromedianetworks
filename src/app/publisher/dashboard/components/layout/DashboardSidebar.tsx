'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { signOut } from 'next-auth/react';
import {
  Home,
  Tag,
  Webhook,
  Ticket,
  GraduationCap,
  Database,
  Compass,
  Settings,
  LogOut,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface DashboardSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

const navigationItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'top-offers', label: 'My Offers', icon: Tag },
  { id: 'postback', label: 'Postback', icon: Webhook },
  { id: 'coupons', label: 'Coupons', icon: Ticket },
  { id: 'product-feed', label: 'Product Feed', icon: Database },
  { id: 'search-browse', label: 'Browse', icon: Compass },
];

export default function DashboardSidebar({
  activeTab,
  onTabChange,
  collapsed = false,
  onToggleCollapse,
}: DashboardSidebarProps) {
  return (
    <TooltipProvider delayDuration={0}>
      <motion.aside
        initial={false}
        animate={{
          width: collapsed ? 70 : 260,
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className={cn(
          'fixed left-0 top-0 z-50 h-screen bg-background border-r border-sidebar-border',
          'flex flex-col transition-all duration-300'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="cursor-pointer flex-shrink-0"
              onClick={onToggleCollapse}
            >
              <Image
                src="/assests/logo.png"
                alt="Logo"
                width={40}
                height={40}
                className="rounded-lg"
              />
            </div>
            {!collapsed && (
              <motion.h2
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-base font-semibold text-sidebar-foreground whitespace-nowrap cursor-pointer"
                onClick={onToggleCollapse}
              >
                Hero Media Network
              </motion.h2>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-2 overflow-y-auto">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <Tooltip key={item.id}>
                <TooltipTrigger asChild>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onTabChange(item.id)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200',
                      'group relative',
                      'text-sidebar-foreground/70',
                      collapsed && 'justify-center px-2'
                    )}
                  >
                    {/* Icon container with rounded background on hover/active */}
                    <div
                      className={cn(
                        'flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200',
                        isActive && 'bg-white/10',
                        !isActive && 'group-hover:bg-white/5'
                      )}
                    >
                      <Icon
                        size={18}
                        className={cn(
                          'flex-shrink-0 transition-colors duration-200 stroke-[1.5]',
                          isActive && 'text-white',
                          !isActive && 'text-sidebar-foreground/60 group-hover:text-sidebar-foreground/90'
                        )}
                      />
                    </div>
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={cn(
                          'text-sm font-medium whitespace-nowrap transition-colors duration-200',
                          isActive && 'text-white',
                          !isActive && 'text-sidebar-foreground/60 group-hover:text-sidebar-foreground/90'
                        )}
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </motion.button>
                </TooltipTrigger>
                {collapsed && (
                  <TooltipContent side="right" className="bg-sidebar border border-sidebar-border text-sidebar-foreground">
                    <p>{item.label}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            );
          })}
        </nav>

        {/* Footer - Logout */}
        <div className="p-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => signOut()}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200',
                  'group text-sidebar-foreground/60',
                  collapsed && 'justify-center px-2'
                )}
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 group-hover:bg-white/5">
                  <LogOut size={18} className="flex-shrink-0 text-sidebar-foreground/60 group-hover:text-sidebar-foreground/90 transition-colors duration-200 stroke-[1.5]" />
                </div>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-sm font-medium whitespace-nowrap text-sidebar-foreground/60 group-hover:text-sidebar-foreground/90 transition-colors duration-200"
                  >
                    Logout
                  </motion.span>
                )}
              </motion.button>
            </TooltipTrigger>
            {collapsed && (
              <TooltipContent side="right" className="bg-sidebar border border-sidebar-border text-sidebar-foreground">
                <p>Logout</p>
              </TooltipContent>
            )}
          </Tooltip>
        </div>
      </motion.aside>
    </TooltipProvider>
  );
}

