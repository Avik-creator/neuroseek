import { SearchProvider } from './base'
import { ExaSearchProvider } from './exa'

export type SearchProviderType = 'exa'
export const DEFAULT_PROVIDER: SearchProviderType = 'exa'

export function createSearchProvider(
  type?: SearchProviderType
): SearchProvider {
  const providerType =
    type || (process.env.SEARCH_API as SearchProviderType) || DEFAULT_PROVIDER

  switch (providerType) {
    case 'exa':
      return new ExaSearchProvider()
    default:
      // Default to ExaSearchProvider if an unknown provider is specified
      return new ExaSearchProvider()
  }
}

export type { ExaSearchProvider } from './exa'
export type { SearchProvider }
