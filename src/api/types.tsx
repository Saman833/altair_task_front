// API types and interfaces 

// Backend enum mapping
export type Source = 'email' | 'telegram';
export type Category = 'spam' | 'meeting' | 'task' | 'information' | 'idea' | 'other';
export type ContentType = 'text' | 'voice';

// Entity types
export interface Entity {
    id: number;
    content_id: string;
    entity_type: 'CONTACT' | 'DATE' |  'KEYWORD' | 'PROJECT';
    entity_value: string;
    created_at: string;
}

// Content item type
export interface ContentItem {
    id: string;
    source_id: string;
    content_type: ContentType;
    content_data: string;
    content_html: string | null;
    source: Source;
    category: Category;
    subject: string | null;
    timestamp: string;
    created_at: string;
    updated_at: string;
    entities: Entity[];
}

// API response type
export type ContentSearchResponse = ContentItem[];

export interface SearchQuery {
    // Search keywords/terms
    keywords?: string;
    
    // Date filters
    startDate?: Date | string;
    endDate?: Date | string;
    Date_Mentiond?: Date | string;
    
    // Category filter
    category?: Category;
    // Source filter
    source?: Source;
}

// Example usage:
// const query: SearchQuery = {
//     keywords: "apartment",
//     startDate: "2024-03-20",
//     endDate: "2024-03-21",
//     category: "residential"
// } 