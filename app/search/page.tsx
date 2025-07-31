import { redirect } from 'next/navigation'

import { generateId } from 'ai'

import { getCurrentUser } from '@/lib/auth/get-current-user'
import { getModels } from '@/lib/config/models'

import { Chat } from '@/components/chat'

export const maxDuration = 60

export default async function SearchPage(props: {
  searchParams: Promise<{ q: string }>
}) {
  const { q } = await props.searchParams
  if (!q) {
    redirect('/')
  }

  const user = await getCurrentUser()
  const id = generateId()
  const models = await getModels()
  return <Chat id={id} query={q} models={models} user={user} />
}
