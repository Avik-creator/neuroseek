'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'

import { MessageCircle, AlertTriangle, XCircle, User } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'

interface GuestLimitDialogProps {
  isOpen: boolean
  onClose: () => void
  remainingMessages: number
  maxMessages: number
  canSendMessage: boolean
  type: 'welcome' | 'warning' | 'limit-reached'
}

export function GuestLimitDialog({
  isOpen,
  onClose,
  remainingMessages,
  maxMessages,
  canSendMessage,
  type
}: GuestLimitDialogProps) {
  const getDialogContent = () => {
    switch (type) {
      case 'welcome':
        return {
          icon: <MessageCircle className="h-12 w-12 text-blue-500" />,
          title: 'Welcome to Guest Mode',
          description: `You can send up to ${maxMessages} messages as a guest. You currently have ${remainingMessages} messages remaining.`,
          actionText: 'Start Chatting',
          secondaryAction: (
            <Button variant="outline" asChild>
              <Link href="/auth/login">Sign In</Link>
            </Button>
          )
        }

      case 'warning':
        return {
          icon: <AlertTriangle className="h-12 w-12 text-amber-500" />,
          title: 'Running Low on Messages',
          description: `You have ${remainingMessages} message${remainingMessages === 1 ? '' : 's'} remaining in guest mode. Sign up to continue chatting without limits.`,
          actionText: 'Continue',
          secondaryAction: (
            <Button variant="default" asChild>
              <Link href="/auth/sign-up">Sign Up Free</Link>
            </Button>
          )
        }

      case 'limit-reached':
        return {
          icon: <XCircle className="h-12 w-12 text-red-500" />,
          title: 'Message Limit Reached',
          description: `You've used all ${maxMessages} guest messages. Sign up to continue chatting with unlimited messages.`,
          actionText: null,
          secondaryAction: (
            <div className="flex gap-2 w-full">
              <Button variant="outline" asChild className="flex-1">
                <Link href="/auth/login">Sign In</Link>
              </Button>
              <Button variant="default" asChild className="flex-1">
                <Link href="/auth/sign-up">Sign Up Free</Link>
              </Button>
            </div>
          )
        }
    }
  }

  const content = getDialogContent()

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-4">{content.icon}</div>
          <DialogTitle>{content.title}</DialogTitle>
          <DialogDescription className="text-center">
            {content.description}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex-col sm:flex-col gap-2">
          {content.secondaryAction}
          {content.actionText && (
            <Button variant="ghost" onClick={onClose}>
              {content.actionText}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
