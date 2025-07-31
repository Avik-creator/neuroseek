import { tool } from 'ai'
import Exa from 'exa-js';

import { getSearchSchemaForModel } from '@/lib/schema/search'

interface VideoResult {
  videoId: string
  url: string
  publishedDate?: string
  details?: any
  captions?: string
  timestamps?: string[]
  summary?: string
  title?: string
  text?: string
  image?: string
  author?: string
}

/**
 * Creates a video search tool with the appropriate schema for the model.
 */
export function createVideoSearchTool(fullModel: string) {
  return tool({
    description: 'Search for videos from YouTube',
    parameters: getSearchSchemaForModel(fullModel),
    execute: async ({ 
      query,
      max_results = 8,
      search_depth = 'basic',
      include_domains = [],
      exclude_domains = []
    }) => {
      try {
        const exa = new Exa(process.env.EXA_API_KEY as string);
  

  
        // Merge YouTube domains with any additional include domains
        const youtubeDomains = ['youtube.com', 'youtu.be', 'm.youtube.com'];
        const finalIncludeDomains = include_domains.length > 0 
          ? [...youtubeDomains, ...include_domains]
          : youtubeDomains;

        const searchResult = await exa.searchAndContents(query, {
          type: 'auto',
          numResults: max_results,
          includeDomains: finalIncludeDomains,
          excludeDomains: exclude_domains,
        });
  
  
        // Deduplicate videos by ID to avoid redundant API calls
        const uniqueResults = searchResult.results.reduce((acc, result) => {
          const videoIdMatch = result.url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?/]+)/);
          const videoId = videoIdMatch?.[1];
  
          if (videoId && !acc.has(videoId)) {
            acc.set(videoId, result);
          }
          return acc;
        }, new Map());
  
       
  
        // Process videos in smaller batches to avoid overwhelming the API
        const batchSize = 5;
       
  
        const uniqueResultsArray = Array.from(uniqueResults.values());
       
  
        const batches = uniqueResultsArray.reduce(
          (acc: Array<Array<(typeof searchResult.results)[0]>>, result, index) => {
            const batchIndex = Math.floor(index / batchSize);
            if (!acc[batchIndex]) {
              acc[batchIndex] = [];
            }
            acc[batchIndex].push(result);
            
            return acc;
          },
          [] as Array<Array<(typeof searchResult.results)[0]>>,
        );
  
        
        batches.forEach((batch, index) => {
          
          batch.forEach((video, videoIndex) => {
            const videoId = video.url.match(
              /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?/]+)/,
            )?.[1];
            
          });
        });
  
        const processedResults: VideoResult[] = [];
  
        
  
        for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
          const batch = batches[batchIndex];
          
  
          try {
            const batchResults = await Promise.allSettled(
              batch.map(async (result: (typeof searchResult.results)[0]): Promise<VideoResult | null> => {
                const videoIdMatch = result.url.match(
                  /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?/]+)/,
                );
                const videoId = videoIdMatch?.[1];
  
                if (!videoId) {
                  console.warn(`⚠️  No video ID found for URL: ${result.url}`);
                  return null;
                }
  
                const baseResult: VideoResult = {
                  videoId,
                  url: result.url,
                  publishedDate: result.publishedDate,
                  title: result.title || undefined,
                  text: result.text || undefined,
                  image: result.image || undefined,
                  author: result.author || undefined,
                };
  
                try {
                  
  
                  // Use Promise.allSettled to handle partial failures gracefully
                  const [detailsResult, captionsResult, timestampsResult] = await Promise.allSettled([
                    fetch(`${process.env.YT_ENDPOINT}/video-data`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        url: result.url,
                      }),
                    }).then((res) => (res.ok ? res.json() : null)),
  
                    fetch(`${process.env.YT_ENDPOINT}/video-captions`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        url: result.url,
                      }),
                    })
                      .then((res) => {
                        
                        if (!res.ok) {
                          
                          return null;
                        }
                        return res
                          .json()
                          .then((data) => {
                            try {
                              
                              
                              
  
                              // Handle JSON object with captions key
                              if (data && data.captions && typeof data.captions === 'string') {
                                
                                return data.captions;
                              } else {
                                
                                return null;
                              }
                            } catch (error) {
                              
                              return null;
                            }
                          })
                          .catch((jsonError) => {
                            
                            return null;
                          });
                      })
                      .catch((fetchError) => {
                        
                        return null;
                      }),
  
                    fetch(`${process.env.YT_ENDPOINT}/video-timestamps`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        url: result.url,
                      }),
                    })
                      .then((res) => {
                        
                        if (!res.ok) {
                          
                          return null;
                        }
                        return res
                          .json()
                          .then((data) => {
                            try {
                              
                              
                              
  
                              // Handle both direct array and JSON object with timestamps key
                              if (Array.isArray(data)) {
                                return data;
                              } else if (data && data.timestamps && Array.isArray(data.timestamps)) {
                                return data.timestamps;
                              } else {
                                return null;
                              }
                            } catch (error) {
                              return null;
                            }
                          })
                          .catch((jsonError) => {
                            return null;
                          });
                      })
                      .catch((fetchError) => {
                        return null;
                      }),
                  ]);
  
                  // Debug raw Promise.allSettled results
  
                  const processedVideo = {
                    ...baseResult,
                    details: detailsResult.status === 'fulfilled' ? detailsResult.value : undefined,
                    captions: captionsResult.status === 'fulfilled' ? captionsResult.value || undefined : undefined,
                    timestamps: timestampsResult.status === 'fulfilled' ? timestampsResult.value : undefined,
                  };
  

  
               
  
                 
  
                
                  return processedVideo;
                } catch (error) {
                  console.warn(`⚠️  Error processing video ${videoId}:`, error);
                  return baseResult;
                }
              }),
            );
  
            // Process batch results - even failed promises return a result
            const validBatchResults = batchResults
              .filter((result) => result.status === 'fulfilled' && result.value !== null)
              .map((result) => (result as PromiseFulfilledResult<VideoResult>).value);
  
            const failedBatchResults = batchResults.filter((result) => result.status === 'rejected');
  
            
            
  
           
  
            processedResults.push(...validBatchResults);
            
  
            // Small delay between batches to be respectful to the API
            if (batchIndex < batches.length - 1) {
              
              await new Promise((resolve) => setTimeout(resolve, 100));
            }
          } catch (batchError) {
            
            if (batchError instanceof Error) {
              
            }
            
            // Continue with next batch even if this one fails
            continue;
          }
  
          
        }
  
        
        
  
        
  
       
  
        
  
        
  
        return {
          results: processedResults,
        };
      } catch (error) {
        console.error('YouTube search error:', error);
        throw error;
      }
    }
  })
}

// Default export for backward compatibility, using a default model
export const videoSearchTool = createVideoSearchTool('github-models:openai/gpt-4.1-nano')
