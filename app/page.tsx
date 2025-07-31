import { generateId } from 'ai'

import { getCurrentUser } from '@/lib/auth/get-current-user'
import { getModels } from '@/lib/config/models'

import { Chat } from '@/components/chat'

export default async function Page() {
  const user = await getCurrentUser()
  const id = generateId()
  const models = await getModels()
  return <Chat id={id} models={models} user={user} />
}
