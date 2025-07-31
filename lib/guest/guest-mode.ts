import { headers } from 'next/headers'

import { getRedisClient } from '@/lib/redis/config'

const MAX_GUEST_MESSAGES = 10
const RATE_LIMIT_WINDOW = 60 * 60 * 24 // 24 hours in seconds

// Helper function to get client IP
export async function getClientIP(): Promise<string> {
  const headersList = await headers()

  // Try to get IP from various headers (in order of preference)
  const forwardedFor = headersList.get('x-forwarded-for')
  const realIP = headersList.get('x-real-ip')
  const remoteAddr = headersList.get('x-forwarded-host')

  console.log('Headers debug:', {
    'x-forwarded-for': forwardedFor,
    'x-real-ip': realIP,
    'x-forwarded-host': remoteAddr
  })

  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    const ip = forwardedFor.split(',')[0].trim()
    console.log('Using x-forwarded-for IP:', ip)
    return ip
  }

  if (realIP) {
    console.log('Using x-real-ip IP:', realIP.trim())
    return realIP.trim()
  }

  if (remoteAddr) {
    console.log('Using x-forwarded-host IP:', remoteAddr.trim())
    return remoteAddr.trim()
  }

  // Fallback - this might not be the real client IP in production
  console.log('Using fallback IP: localhost')
  return 'localhost'
}

// Helper function to create Redis key for IP
function getIPRateLimitKey(ip: string): string {
  return `guest_rate_limit:${ip}`
}

export async function getGuestMessageCount(ip?: string): Promise<number> {
  try {
    const clientIP = ip || (await getClientIP())
    console.log('Getting count for IP:', clientIP)
    
    const redis = await getRedisClient()
    const key = getIPRateLimitKey(clientIP)

    console.log('Redis key:', key)
    const count = await redis.get(key)
    console.log('Redis returned count:', count, 'type:', typeof count)
    
    const result = count ? parseInt(count.toString(), 10) : 0
    console.log('Final parsed count:', result)
    return result
  } catch (error) {
    console.error('Error getting guest message count:', error)
    console.error('Error details:', error)
    return 0
  }
}

export async function incrementGuestMessageCount(ip?: string): Promise<number> {
  try {
    const clientIP = ip || (await getClientIP())
    const redis = await getRedisClient()
    const key = getIPRateLimitKey(clientIP)

    console.log('Incrementing count for IP:', clientIP, 'key:', key)
    
    // Use Redis pipeline for atomic operations
    const pipeline = redis.pipeline()
    pipeline.incr(key)
    pipeline.expire(key, RATE_LIMIT_WINDOW)

    const results = await pipeline.exec()
    console.log('Pipeline results:', results)
    const newCount = results?.[0] ? parseInt(results[0].toString(), 10) : 1

    console.log('New count after increment:', newCount)
    return newCount
  } catch (error) {
    console.error('Error incrementing guest message count:', error)
    throw error
  }
}

export async function canSendGuestMessage(ip?: string): Promise<boolean> {
  const count = await getGuestMessageCount(ip)
  return count < MAX_GUEST_MESSAGES
}

export async function getRemainingGuestMessages(ip?: string): Promise<number> {
  const count = await getGuestMessageCount(ip)
  return Math.max(0, MAX_GUEST_MESSAGES - count)
}

export async function getGuestRateLimitStatus(ip?: string) {
  const count = await getGuestMessageCount(ip)
  const remaining = await getRemainingGuestMessages(ip)
  const canSend = await canSendGuestMessage(ip)

  return {
    count,
    remaining,
    canSend,
    maxMessages: MAX_GUEST_MESSAGES,
    windowHours: RATE_LIMIT_WINDOW / 3600
  }
}
