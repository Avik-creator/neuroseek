import { cookies } from 'next/headers'

const GUEST_MESSAGE_COUNT_KEY = 'guest_message_count'
const MAX_GUEST_MESSAGES = 3

export async function getGuestMessageCount(): Promise<number> {
  const cookieStore = await cookies()
  const count = cookieStore.get(GUEST_MESSAGE_COUNT_KEY)
  return count ? parseInt(count.value, 10) : 0
}

export async function incrementGuestMessageCount(): Promise<number> {
  const cookieStore = await cookies()
  const currentCount = await getGuestMessageCount()
  const newCount = currentCount + 1
  
  // Set cookie with a 24-hour expiry
  cookieStore.set(GUEST_MESSAGE_COUNT_KEY, newCount.toString(), {
    maxAge: 60 * 60 * 24,
    path: '/'
  })
  
  return newCount
}

export async function canSendGuestMessage(): Promise<boolean> {
  const count = await getGuestMessageCount()
  return count < MAX_GUEST_MESSAGES
}

export async function getRemainingGuestMessages(): Promise<number> {
  const count = await getGuestMessageCount()
  return MAX_GUEST_MESSAGES - count
}