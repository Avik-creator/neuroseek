import { NextResponse } from 'next/server'
import Exa from 'exa-js'

import { Redis } from '@upstash/redis'
import { createClient } from 'redis'

import {
  SearchResultItem,
  SearchResults
} from '@/lib/types'

/**
 * Maximum number of results to fetch from EXA.
 * Increasing this value can improve result quality but may impact performance.
 */
const EXA_MAX_RESULTS = Math.max(
  10,
  Math.min(100, parseInt(process.env.EXA_MAX_RESULTS || '50', 10))
)

const CACHE_TTL = 3600 // Cache time-to-live in seconds (1 hour)
const CACHE_EXPIRATION_CHECK_INTERVAL = 3600000 // 1 hour in milliseconds

let redisClient: Redis | ReturnType<typeof createClient> | null = null

// Initialize Redis client based on environment variables
async function initializeRedisClient() {
  if (redisClient) return redisClient

  const useLocalRedis = process.env.USE_LOCAL_REDIS === 'true'

  if (useLocalRedis) {
    const localRedisUrl =
      process.env.LOCAL_REDIS_URL || 'redis://localhost:6379'
    redisClient = createClient({ url: localRedisUrl })
    await redisClient.connect()
  } else {
    const upstashRedisRestUrl = process.env.UPSTASH_REDIS_REST_URL
    const upstashRedisRestToken = process.env.UPSTASH_REDIS_REST_TOKEN

    if (upstashRedisRestUrl && upstashRedisRestToken) {
      redisClient = new Redis({
        url: upstashRedisRestUrl,
        token: upstashRedisRestToken
      })
    }
  }

  return redisClient
}

// Function to get cached results
async function getCachedResults(
  cacheKey: string
): Promise<SearchResults | null> {
  try {
    const client = await initializeRedisClient()
    if (!client) return null

    let cachedData: string | null
    if (client instanceof Redis) {
      cachedData = await client.get(cacheKey)
    } else {
      cachedData = await client.get(cacheKey)
    }

    if (cachedData) {
      console.log(`Cache hit for key: ${cacheKey}`)
      return JSON.parse(cachedData)
    } else {
      console.log(`Cache miss for key: ${cacheKey}`)
      return null
    }
  } catch (error) {
    console.error('Redis cache error:', error)
    return null
  }
}

// Function to set cached results with error handling and logging
async function setCachedResults(
  cacheKey: string,
  results: SearchResults
): Promise<void> {
  try {
    const client = await initializeRedisClient()
    if (!client) return

    const serializedResults = JSON.stringify(results)
    if (client instanceof Redis) {
      await client.set(cacheKey, serializedResults, { ex: CACHE_TTL })
    } else {
      await client.set(cacheKey, serializedResults, { EX: CACHE_TTL })
    }
    console.log(`Cached results for key: ${cacheKey}`)
  } catch (error) {
    console.error('Redis cache error:', error)
  }
}

// Function to periodically clean up expired cache entries
async function cleanupExpiredCache() {
  try {
    const client = await initializeRedisClient()
    if (!client) return

    const keys = await client.keys('search:*')
    for (const key of keys) {
      const ttl = await client.ttl(key)
      if (ttl <= 0) {
        await client.del(key)
        console.log(`Removed expired cache entry: ${key}`)
      }
    }
  } catch (error) {
    console.error('Cache cleanup error:', error)
  }
}

// Set up periodic cache cleanup
setInterval(cleanupExpiredCache, CACHE_EXPIRATION_CHECK_INTERVAL)

export async function POST(request: Request) {
  const { query, maxResults, searchDepth, includeDomains, excludeDomains } =
    await request.json()

  const EXA_DEFAULT_DEPTH = process.env.EXA_DEFAULT_DEPTH || 'advanced'

  try {
    const cacheKey = `exa-search:${query}:${maxResults}:${searchDepth}:${
      Array.isArray(includeDomains) ? includeDomains.join(',') : ''
    }:${Array.isArray(excludeDomains) ? excludeDomains.join(',') : ''}`

    // Try to get cached results
    const cachedResults = await getCachedResults(cacheKey)
    if (cachedResults) {
      return NextResponse.json(cachedResults)
    }

    // If not cached, perform the search
    const results = await advancedExaSearch(
      query,
      Math.min(maxResults, EXA_MAX_RESULTS),
      searchDepth || EXA_DEFAULT_DEPTH,
      Array.isArray(includeDomains) ? includeDomains : [],
      Array.isArray(excludeDomains) ? excludeDomains : []
    )

    // Cache the results
    await setCachedResults(cacheKey, results)

    return NextResponse.json(results)
  } catch (error) {
    console.error('Advanced EXA search error:', error)
    return NextResponse.json(
      {
        message: 'Internal Server Error',
        error: error instanceof Error ? error.message : String(error),
        query: query,
        results: [],
        images: [],
        number_of_results: 0
      },
      { status: 500 }
    )
  }
}

async function advancedExaSearch(
  query: string,
  maxResults: number = 10,
  searchDepth: 'basic' | 'advanced' = 'advanced',
  includeDomains: string[] = [],
  excludeDomains: string[] = []
): Promise<SearchResults> {
  const apiKey = process.env.EXA_API_KEY
  if (!apiKey) {
    throw new Error('EXA_API_KEY is not set in the environment variables')
  }

  try {
    const exa = new Exa(apiKey)
    
    // Configure EXA search options based on depth
    const searchOptions: any = {
      numResults: maxResults,
      includeDomains,
      excludeDomains,
      useAutoprompt: true, // Let EXA optimize the query
      type: 'auto' // Auto-detect content type
    }

    if (searchDepth === 'advanced') {
      // For advanced search, get full contents and highlights
      searchOptions.contents = {
        text: true,
        highlights: {
          numSentences: 3,
          highlightsPerUrl: 3
        }
      }
      searchOptions.summary = {
        query: `Summarize the key information about: ${query}`
      }
    } else {
      // For basic search, just get highlights
      searchOptions.contents = {
        highlights: {
          numSentences: 2,
          highlightsPerUrl: 2
        }
      }
    }

    console.log(`EXA Search - Query: ${query}, Depth: ${searchDepth}, Results: ${maxResults}`)
    
    const searchResult = await exa.searchAndContents(query, searchOptions)

    console.log(`EXA returned ${searchResult.results.length} results`)

    // Transform EXA results to our SearchResults format
    const results: SearchResultItem[] = searchResult.results.map((result: any) => {
      let content = ''
      
      // Use highlights if available, otherwise fall back to text or summary
      if (result.highlights && result.highlights.length > 0) {
        content = result.highlights.join(' ... ')
      } else if (result.text) {
        // For advanced search, use full text but limit it
        content = result.text.substring(0, 2000)
      } else if (result.summary) {
        content = result.summary
      }

      return {
        title: result.title || '',
        url: result.url || '',
        content: content || 'No content available'
      }
    })

    // For advanced search, apply additional relevance scoring and filtering
    let finalResults = results
    if (searchDepth === 'advanced') {
      finalResults = results
        .map(result => ({
          ...result,
          score: calculateRelevanceScore(result, query)
        }))
        .filter((result: any) => result.score >= 5) // Minimum relevance threshold
        .sort((a: any, b: any) => b.score - a.score)
        .slice(0, maxResults)
        .map(({ score, ...result }) => result) // Remove score from final results
    }

    return {
      results: finalResults,
      query: query,
      images: [], // EXA doesn't provide images in the same format, could be extended
      number_of_results: finalResults.length
    }
  } catch (error) {
    console.error('EXA API error:', error)
    return {
      results: [],
      query: query,
      images: [],
      number_of_results: 0
    }
  }
}

function calculateRelevanceScore(result: SearchResultItem, query: string): number {
  try {
    const lowercaseContent = result.content.toLowerCase()
    const lowercaseQuery = query.toLowerCase()
    const queryWords = lowercaseQuery
      .split(/\s+/)
      .filter(word => word.length > 2)
      .map(word => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) // Escape special characters

    let score = 0

    // Check for exact phrase match
    if (lowercaseContent.includes(lowercaseQuery)) {
      score += 30
    }

    // Check for individual word matches
    queryWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'g')
      const wordCount = (lowercaseContent.match(regex) || []).length
      score += wordCount * 3
    })

    // Boost score for matches in the title
    const lowercaseTitle = result.title.toLowerCase()
    if (lowercaseTitle.includes(lowercaseQuery)) {
      score += 20
    }

    queryWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'g')
      if (lowercaseTitle.match(regex)) {
        score += 10
      }
    })

    // Penalize very short content
    if (result.content.length < 100) {
      score -= 10
    } else if (result.content.length > 500) {
      score += 5
    }

    return score
  } catch (error) {
    console.error('Error in calculateRelevanceScore:', error)
    return 0 // Return 0 if scoring fails
  }
}
