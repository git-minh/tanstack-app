/**
 * Types for website crawling functionality
 */

/**
 * Single crawled page from Firecrawl
 * Matches Firecrawl's Document type from crawl response
 */
export interface CrawledPage {
  markdown?: string;
  html?: string;
  metadata?: {
    title?: string;
    description?: string;
    url?: string;
    statusCode?: number;
  };
  url?: string; // Sometimes at top level, sometimes in metadata
}

/**
 * Filtered and processed crawled page
 */
export interface ProcessedPage {
  url: string;
  markdown: string;
  html: string;
  title: string;
  priority: number; // Higher = more important
}

/**
 * Success response from crawlWebsite action
 */
export interface CrawlWebsiteSuccessResponse {
  success: true;
  url: string;
  pages: ProcessedPage[];
  totalPages: number;
  crawlTime: number; // milliseconds
}

/**
 * Error response from crawlWebsite action
 */
export interface CrawlWebsiteErrorResponse {
  success: false;
  error: string;
  code?: 'RATE_LIMIT_EXCEEDED' | 'INVALID_URL' | 'TIMEOUT' | 'FIRECRAWL_ERROR' | 'AUTH_REQUIRED';
}

/**
 * Combined response type
 */
export type CrawlWebsiteResponse = CrawlWebsiteSuccessResponse | CrawlWebsiteErrorResponse;
