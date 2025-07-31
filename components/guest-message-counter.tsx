import { useGuestMode } from '@/hooks/use-guest-mode'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

interface GuestMessageCounterProps {
  user?: any
  messages: any[]
}

export function GuestMessageCounter({ user, messages }: GuestMessageCounterProps) {
  const router = useRouter()
  const { remainingMessages, canSendMessage } = useGuestMode()

  // Only show for guest users (no user logged in)
  if (user) return null

  // Count user messages to get actual usage
  const userMessageCount = messages.filter(msg => msg.role === 'user').length
  const actualRemaining = Math.max(0, 3 - userMessageCount)

  if (userMessageCount === 0) return null

  return (
    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border mb-4">
      <div className="flex items-center gap-2">
        <Badge variant={actualRemaining > 0 ? "default" : "destructive"}>
          {actualRemaining > 0 ? `${actualRemaining} messages remaining` : 'Limit reached'}
        </Badge>
        <span className="text-sm text-muted-foreground">Guest Mode</span>
      </div>
      {actualRemaining === 0 && (
        <Button
          onClick={() => router.push('/auth/login')}
          size="sm"
          variant="outline"
        >
          Sign in to continue
        </Button>
      )}
    </div>
  )
}