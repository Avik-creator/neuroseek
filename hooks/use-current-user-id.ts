import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export const useCurrentUserId = () => {
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const { data, error } = await createClient().auth.getSession()
        if (error) {
          console.error('Error fetching user session:', error)
          setUserId(null)
          return
        }

        setUserId(data.session?.user.id ?? null)
      } catch (error) {
        console.error('Error in fetchUserId:', error)
        setUserId(null)
      }
    }

    fetchUserId()
  }, [])

  return userId
}