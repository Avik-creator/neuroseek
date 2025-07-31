import { NextRequest, NextResponse } from 'next/server'

import { getChatsPage } from '@/lib/actions/chat'
import { getCurrentUserId } from '@/lib/auth/get-current-user'
import { getClientIP } from '@/lib/guest/guest-mode'
import { type Chat } from '@/lib/types'

interface ChatPageResponse {
  chats: Chat[]
  nextOffset: number | null
}

export async function GET(request: NextRequest) {
  const enableSaveChatHistory = process.env.ENABLE_SAVE_CHAT_HISTORY === 'true'
  if (!enableSaveChatHistory) {
    return NextResponse.json<ChatPageResponse>({ chats: [], nextOffset: null })
  }

  const { searchParams } = new URL(request.url)
  const offset = parseInt(searchParams.get('offset') || '0', 10)
  const limit = parseInt(searchParams.get('limit') || '20', 10)

  const userId = await getCurrentUserId()

  // For guest users, create a unique ID based on their IP
  let effectiveUserId = userId
  if (userId === 'anonymous') {
    const clientIP = await getClientIP()
    effectiveUserId = `guest_${clientIP}`
    console.log('Guest user detected, using effective userId:', effectiveUserId)
  }

  try {
    const result = await getChatsPage(effectiveUserId, limit, offset)
    return NextResponse.json<ChatPageResponse>(result)
  } catch (error) {
    console.error('API route error fetching chats:', error)
    return NextResponse.json<ChatPageResponse>(
      { chats: [], nextOffset: null },
      { status: 500 }
    )
  }
}
