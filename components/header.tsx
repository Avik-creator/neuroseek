'use client'

// import Link from 'next/link' // No longer needed directly here for Sign In button
import React from 'react'

import { User } from '@supabase/supabase-js'

import { cn } from '@/lib/utils'

import { useGuestMode } from '@/hooks/use-guest-mode'

import { useSidebar } from '@/components/ui/sidebar'

// import { Button } from './ui/button' // No longer needed directly here for Sign In button
import GuestMenu from './guest-menu' // Import the new GuestMenu component
import UserMenu from './user-menu'

interface HeaderProps {
  user: User | null
  showGuestStatus?: boolean
}

export const Header: React.FC<HeaderProps> = ({
  user,
  showGuestStatus = false
}) => {
  const { open } = useSidebar()
  const { isGuestMode, remainingMessages, maxMessages, canSendMessage } =
    useGuestMode()

  return (
    <header
      className={cn(
        'absolute top-0 right-0 p-2 flex justify-between items-center z-10 backdrop-blur lg:backdrop-blur-none bg-background/80 lg:bg-transparent transition-[width] duration-200 ease-linear',
        open ? 'md:w-[calc(100%-var(--sidebar-width))]' : 'md:w-full',
        'w-full'
      )}
    >
      {/* Guest status indicator when showing guest status */}
      <div className="flex items-center">
        {isGuestMode && showGuestStatus && (
          <div className="text-sm text-muted-foreground bg-muted/50 rounded-full px-3 py-1">
            {canSendMessage ? (
              <span>
                Guest: {remainingMessages}/{maxMessages} messages left
              </span>
            ) : (
              <span className="text-amber-600 dark:text-amber-400">
                Guest limit reached
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {user ? <UserMenu user={user} /> : <GuestMenu />}
      </div>
    </header>
  )
}

export default Header
