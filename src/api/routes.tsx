// API routes configuration and handlers

import { ContentSearchResponse, ContentItem } from './types';

// Use environment variable for API URL - no hardcoded fallback
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// Debug all environment variables that might be relevant
console.log('🔍 Environment Variables Debug:');
console.log('NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL);
console.log('API_URL:', process.env.API_URL);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('All env vars with API:', Object.keys(process.env).filter(key => key.includes('API')));

if (!API_BASE_URL) {
  console.error('❌ NEXT_PUBLIC_API_URL environment variable is not set!');
  console.error('Please set NEXT_PUBLIC_API_URL in your Railway environment variables.');
  console.error('Current environment variables:', Object.keys(process.env));
}

console.log('🔗 API Base URL:', API_BASE_URL);
console.log('🌍 Environment:', process.env.NODE_ENV);

export class ContentApiService {
    private baseUrl: string;

    constructor(baseUrl?: string) {
        this.baseUrl = baseUrl || API_BASE_URL || '';
        console.log('🚀 ContentApiService initialized with URL:', this.baseUrl);
        
        if (!this.baseUrl) {
            console.error('❌ No API URL provided! Please set NEXT_PUBLIC_API_URL environment variable.');
            console.error('Available env vars:', Object.keys(process.env).filter(key => key.includes('API') || key.includes('URL')));
        }
    }

    /**
     * Get all public content summary
     */
    async getPublicSummary(): Promise<ContentSearchResponse> {
        if (!this.baseUrl) {
            throw new Error('API URL not configured. Please set NEXT_PUBLIC_API_URL environment variable.');
        }

        // Ensure the URL ends with the correct path and includes port 8000 if needed
        let url = this.baseUrl;
        
        // If the URL doesn't end with /contents/, add it
        if (!url.endsWith('/contents/')) {
            url = url.endsWith('/') ? `${url}contents/` : `${url}/contents/`;
        }
            
        console.log('📡 Making request to:', url);
        
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                // Add timeout for Railway
                signal: AbortSignal.timeout(15000), // 15 second timeout
            });

            console.log('📥 Response status:', response.status);
            console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Response error text:', errorText);
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
            }

            const data: ContentSearchResponse = await response.json();
            console.log('✅ Received data:', data.length, 'items');
            return data;
        } catch (error) {
            console.error('❌ Error fetching public summary:', error);
            console.error('❌ Request URL was:', url);
            console.error('❌ Base URL was:', this.baseUrl);
            throw error;
        }
    }

    /**
     * Get content by ID
     */
    async getContentById(contentId: string): Promise<ContentItem> {
        if (!this.baseUrl) {
            throw new Error('API URL not configured. Please set NEXT_PUBLIC_API_URL environment variable.');
        }

        const url = `${this.baseUrl}/contents/${contentId}`;
        console.log('📡 Making request to:', url);
        
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                signal: AbortSignal.timeout(15000),
            });

            console.log('📥 Response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Response error text:', errorText);
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
            }

            const data: ContentItem = await response.json();
            console.log('✅ Received content item:', data.id);
            return data;
        } catch (error) {
            console.error(`❌ Error fetching content with ID ${contentId}:`, error);
            console.error('❌ Request URL was:', url);
            throw error;
        }
    }

    /**
     * Search content with filters
     */
    async searchContent(searchQuery: any): Promise<ContentSearchResponse> {
        if (!this.baseUrl) {
            throw new Error('API URL not configured. Please set NEXT_PUBLIC_API_URL environment variable.');
        }

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
            console.log('📡 Making search request to:', url);
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                signal: AbortSignal.timeout(15000),
            });

            console.log('📥 Search response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Response error text:', errorText);
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
            }

            const data: ContentSearchResponse = await response.json();
            console.log('✅ Search results:', data.length, 'items');
            return data;
        } catch (error) {
            console.error('❌ Error searching content:', error);
            throw error;
        }
    }
}

// Export a default instance
export const contentApi = new ContentApiService(); 