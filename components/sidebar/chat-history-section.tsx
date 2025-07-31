import { getCurrentUser } from '@/lib/auth/get-current-user'

import { ChatHistoryClient } from './chat-history-client'

export async function ChatHistorySection() {
  const enableSaveChatHistory = process.env.ENABLE_SAVE_CHAT_HISTORY === 'true'
  if (!enableSaveChatHistory) {
    return null
  }

  const user = await getCurrentUser()
  return <ChatHistoryClient user={user} />
}
