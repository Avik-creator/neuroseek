import { NextResponse } from 'next/server'
import { getCurrentUserId } from '@/lib/auth/get-current-user'
import { getGuestRateLimitStatus } from '@/lib/guest/guest-mode'

export async function GET() {
  try {
    const userId = await getCurrentUserId()
    
    // If user is authenticated, they don't have guest limitations
    if (userId !== 'anonymous') {
      return NextResponse.json({
        isGuestMode: false,
        guestMessageCount: 0,
        remainingMessages: Infinity,
        canSendMessage: true,
        maxMessages: Infinity
      })
    }
    
    // Get guest rate limit status for unauthenticated users
    const status = await getGuestRateLimitStatus()

    console.log('status', status)
    
    return NextResponse.json({
      isGuestMode: true,
      guestMessageCount: status.count,
      remainingMessages: status.remaining,
      canSendMessage: status.canSend,
      maxMessages: status.maxMessages,
      windowHours: status.windowHours
    })
  } catch (error) {
    console.error('Error getting guest status:', error)
    return NextResponse.json(
      { error: 'Failed to get guest status' },
      { status: 500 }
    )
  }
}