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
    // Search keywords/terms - backend expects List[str]
    keywords?: string[] | null;
    
    // Date filters - backend expects datetime objects
    start_date_duration?: string | null;  // Changed to match backend
    end_date_duration?: string | null;    // Changed to match backend
    
    // Category filter
    category?: Category | null;
    // Source filter
    source?: Source | null;
}

// Example usage:
// const query: SearchQuery = {
//     keywords: ["apartment", "house"],
//     start_date_duration: "2024-03-20",
//     end_date_duration: "2024-03-21",
//     category: "information"
// } 