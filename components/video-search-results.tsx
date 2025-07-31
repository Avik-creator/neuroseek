/* eslint-disable @next/next/no-img-element */
'use client'

import { SerperSearchResultItem, SerperSearchResults } from '@/lib/types'

import { VideoResultGrid } from './video-result-grid'

interface VideoResult {
  videoId: string
  url: string
  publishedDate?: string
  details?: any
  timestamps?: string[]
  captions?: string
  title?: string
  text?: string
  image?: string
  author?: string
}

export interface VideoSearchResultsProps {
  results: VideoResult[]
}

export function VideoSearchResults({ results }: VideoSearchResultsProps) {
  console.log('results', results)
  if (!results || !Array.isArray(results)) {
    return <div className="text-muted-foreground">No videos found</div>
  }

  const videos = results.filter((video) => {
    try {
      const url = new URL(video.url)
      return url.hostname.includes('youtube.com') && url.pathname === '/watch'
    } catch (e) {
      console.error('Invalid video URL:', video.url)
      return false
    }
  }).map(video => ({
    title: video.title || video.videoId,
    link: video.url,
    snippet: video.text?.split('|')[0].trim() || '',
    imageUrl: video.image || `https://i.ytimg.com/vi/${video.videoId}/maxresdefault.jpg`,
    duration: '',
    source: 'YouTube',
    channel: video.author || '',
    date: video.publishedDate || '',
    position: 0
  }))

  const query = ''

  if (!videos || videos.length === 0) {
    return <div className="text-muted-foreground">No videos found</div>
  }

  return <VideoResultGrid videos={videos} query={query} displayMode="chat" />
}
