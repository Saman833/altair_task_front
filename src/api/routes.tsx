// API routes configuration and handlers

import { ContentSearchResponse, ContentItem } from './types';

// Use Railway's environment variable or fallback to localhost
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost';  

const API_PORT = process.env.NEXT_PUBLIC_API_PORT || '8000';
const API_URL = `${API_BASE_URL}:${API_PORT}`;
console.log('🔗 API Base URL:', API_URL);
console.log('🌍 Environment:', process.env.NODE_ENV);

export class ContentApiService {
    private baseUrl: string;

    constructor(baseUrl: string = API_URL) {
        this.baseUrl = baseUrl;
        console.log('🚀 ContentApiService initialized with URL:', this.baseUrl);
    }

    /**
     * Get all public content summary
     */
    async getPublicSummary(): Promise<ContentSearchResponse> {
        const url = `${this.baseUrl}/contents/`;
        console.log('📡 Making request to:', url);
        
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                // Add timeout for Railway
                signal: AbortSignal.timeout(10000), // 10 second timeout
            });

            console.log('📥 Response status:', response.status);
            console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data: ContentSearchResponse = await response.json();
            console.log('✅ Received data:', data.length, 'items');
            return data;
        } catch (error) {
            console.error('❌ Error fetching public summary:', error);
            console.error('❌ Request URL was:', url);
            throw error;
        }
    }

    /**     
     * Get content by ID
     */
    async getContentById(contentId: string): Promise<ContentItem> {
        const url = `${this.baseUrl}/contents/${contentId}`;
        console.log('📡 Making request to:', url);
        
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                signal: AbortSignal.timeout(10000),
            });

            console.log('📥 Response status:', response.status);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
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
                },
                signal: AbortSignal.timeout(10000),
            });

            console.log('📥 Search response status:', response.status);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
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