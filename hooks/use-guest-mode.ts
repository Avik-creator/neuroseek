import { useCallback, useEffect, useState } from 'react'

interface GuestStatus {
  isGuestMode: boolean
  guestMessageCount: number
  remainingMessages: number
  canSendMessage: boolean
  maxMessages: number
  windowHours?: number
}

export type DialogType = 'welcome' | 'warning' | 'limit-reached'

export function useGuestMode() {
  const [status, setStatus] = useState<GuestStatus>({
    isGuestMode: false,
    guestMessageCount: 0,
    remainingMessages: 10,
    canSendMessage: true,
    maxMessages: 10
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogType, setDialogType] = useState<DialogType>('welcome')
  const [hasShownWelcome, setHasShownWelcome] = useState(false)

  const showDialog = useCallback((type: DialogType) => {
    setDialogType(type)
    setDialogOpen(true)
  }, [])

  const closeDialog = useCallback(() => {
    setDialogOpen(false)
  }, [])

  const fetchGuestStatus = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/guest-status', {
        method: 'GET',
        cache: 'no-store' // Ensure we get fresh data
      })

      if (!response.ok) {
        throw new Error('Failed to fetch guest status')
      }

      const data = await response.json()
      const previousStatus = status
      setStatus(data)

      // Show dialogs based on status changes
      if (data.isGuestMode) {
        // Show welcome dialog on first visit
        if (!hasShownWelcome && data.remainingMessages === data.maxMessages) {
          setHasShownWelcome(true)
          showDialog('welcome')
        }
        // Show warning when approaching limit
        else if (
          data.remainingMessages <= 3 &&
          data.remainingMessages > 0 &&
          data.canSendMessage
        ) {
          // Only show if we just hit this threshold
          if (
            previousStatus.remainingMessages > 3 ||
            previousStatus.remainingMessages === 0
          ) {
            showDialog('warning')
          }
        }
        // Show limit reached dialog
        else if (!data.canSendMessage && previousStatus.canSendMessage) {
          showDialog('limit-reached')
        }
      }
    } catch (err) {
      console.error('Error fetching guest status:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      // Fallback to guest mode with default values
      setStatus({
        isGuestMode: true,
        guestMessageCount: 0,
        remainingMessages: 10,
        canSendMessage: true,
        maxMessages: 10
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchGuestStatus()
    
    // Listen for guest status updates from other components
    const handleGuestStatusUpdate = () => {
      console.log('Guest status update event received, refreshing...')
      fetchGuestStatus()
    }
    
    if (typeof window !== 'undefined') {
      window.addEventListener('guest-status-updated', handleGuestStatusUpdate)
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('guest-status-updated', handleGuestStatusUpdate)
      }
    }
  }, [])

  // Refresh status after a chat message is sent
  const refreshStatus = () => {
    console.log('Refreshing guest status and notifying other components...')
    fetchGuestStatus()
    // Notify other components to refresh their status
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('guest-status-updated'))
    }
  }

  return {
    ...status,
    isLoading,
    error,
    refreshStatus,
    dialogOpen,
    dialogType,
    showDialog,
    closeDialog
  }
}
