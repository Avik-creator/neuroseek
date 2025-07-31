import { useEffect, useState } from 'react'

const GUEST_MESSAGE_COUNT_KEY = 'guest_message_count'
const MAX_GUEST_MESSAGES = 3

export function useGuestMode() {
  const [guestMessageCount, setGuestMessageCount] = useState(0)
  const [isGuestMode, setIsGuestMode] = useState(false)

  useEffect(() => {
    // Check if we're in guest mode (no user authentication)
    const checkGuestMode = () => {
      // This will be true if no user is logged in
      setIsGuestMode(true) // We'll update this based on user prop later
    }

    // Get guest message count from cookie
    const getGuestMessageCount = () => {
      if (typeof document !== 'undefined') {
        const cookies = document.cookie.split(';')
        const countCookie = cookies.find(cookie => 
          cookie.trim().startsWith(`${GUEST_MESSAGE_COUNT_KEY}=`)
        )
        if (countCookie) {
          const count = parseInt(countCookie.split('=')[1], 10)
          setGuestMessageCount(count || 0)
        }
      }
    }

    checkGuestMode()
    getGuestMessageCount()
  }, [])

  const remainingMessages = MAX_GUEST_MESSAGES - guestMessageCount
  const canSendMessage = remainingMessages > 0

  return {
    isGuestMode,
    guestMessageCount,
    remainingMessages,
    canSendMessage,
    maxMessages: MAX_GUEST_MESSAGES
  }
}