// ProviderIQ — Data Source Identifiers

export const DATA_SOURCES = {
  // Government Registries
  ABDM: 'ABDM',
  NABH: 'NABH',
  NMC: 'NMC',
  CGHS: 'CGHS',
  ECHS: 'ECHS',

  // Review Platforms
  GOOGLE_MAPS: 'GOOGLE_MAPS',
  PRACTO: 'PRACTO',
  JUSTDIAL: 'JUSTDIAL',
  LYBRATE: 'LYBRATE',

  // Consumer Complaints
  NCH: 'NCH',
  CONSUMER_FORUM: 'CONSUMER_FORUM',

  // Social & News
  TWITTER: 'TWITTER',
  NEWS: 'NEWS',

  // Enrichment
  WEBSITE: 'WEBSITE',
  JOBS: 'JOBS',

  // Claims
  NHCX: 'NHCX',
  INSURER_API: 'INSURER_API',
  MANUAL: 'MANUAL',
} as const;

export type DataSourceKey = keyof typeof DATA_SOURCES;

/** Source → Agent assignment */
export const SOURCE_AGENT_MAP: Record<string, string> = {
  ABDM: 'RegistryAgent',
  NABH: 'RegistryAgent',
  NMC: 'RegistryAgent',
  CGHS: 'RegistryAgent',
  GOOGLE_MAPS: 'WebResearchAgent',
  PRACTO: 'WebResearchAgent',
  NCH: 'WebResearchAgent',
  NEWS: 'WebResearchAgent',
  WEBSITE: 'WebResearchAgent',
  JOBS: 'WebResearchAgent',
  TWITTER: 'SentimentAgent',
  NHCX: 'BillingAnalystAgent',
  INSURER_API: 'BillingAnalystAgent',
} as const;

/** Search API configuration */
export const SEARCH_APIS = {
  TAVILY: { name: 'Tavily', maxResults: 10, rateLimit: 1000 },
  SERPAPI: { name: 'SerpAPI', maxResults: 10, rateLimit: 100 },
  EXA: { name: 'Exa', maxResults: 10, rateLimit: 1000 },
  FIRECRAWL: { name: 'Firecrawl', maxPages: 500, rateLimit: 500 },
} as const;
