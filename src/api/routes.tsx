// API routes configuration and handlers

import { ContentSearchResponse, ContentItem } from './types';

// Use Railway's environment variable or fallback to localhost
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export class ContentApiService {
    private baseUrl: string;

    constructor(baseUrl: string = API_BASE_URL) {
        this.baseUrl = baseUrl;
    }

    /**
     * Get all public content summary
     */
    async getPublicSummary(): Promise<ContentSearchResponse> {
        try {
            const response = await fetch(`${this.baseUrl}/contents/`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                // Add timeout for Railway
                signal: AbortSignal.timeout(10000), // 10 second timeout
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data: ContentSearchResponse = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching public summary:', error);
            throw error;
        }
    }

    /**
     * Get content by ID
     */
    async getContentById(contentId: string): Promise<ContentItem> {
        try {
            const response = await fetch(`${this.baseUrl}/contents/${contentId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                signal: AbortSignal.timeout(10000),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data: ContentItem = await response.json();
            return data;
        } catch (error) {
            console.error(`Error fetching content with ID ${contentId}:`, error);
            throw error;
        }
    }

    /**
     * Search content with filters
     */
    async searchContent(searchQuery: any): Promise<ContentSearchResponse> {
        try {
            const queryParams = new URLSearchParams();
            
            // Add search parameters
            if (searchQuery.keywords) {
                queryParams.append('keywords', searchQuery.keywords);
            }
            if (searchQuery.startDate) {
                queryParams.append('start_date', searchQuery.startDate);
            }
            if (searchQuery.endDate) {
                queryParams.append('end_date', searchQuery.endDate);
            }
            if (searchQuery.category) {
                queryParams.append('category', searchQuery.category);
            }
            if (searchQuery.source) {
                queryParams.append('source', searchQuery.source);
            }

            const url = `${this.baseUrl}/contents/?${queryParams.toString()}`;
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                signal: AbortSignal.timeout(10000),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data: ContentSearchResponse = await response.json();
            return data;
        } catch (error) {
            console.error('Error searching content:', error);
            throw error;
        }
    }
}

// Export a default instance
export const contentApi = new ContentApiService(); 