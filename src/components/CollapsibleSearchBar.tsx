'use client';

import { useState } from 'react';
import { SearchQuery, ContentSearchResponse } from '../api/types';
import { contentApi } from '../api/routes';

interface CollapsibleSearchBarProps {
    onSearchResults: (results: ContentSearchResponse) => void;
    onLoading: (loading: boolean) => void;
}

export default function CollapsibleSearchBar({ onSearchResults, onLoading }: CollapsibleSearchBarProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [searchQuery, setSearchQuery] = useState<SearchQuery>({
        keywords: [],
        start_date_duration: null,
        end_date_duration: null,
        category: null,
        source: null
    });

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        
        try {
            onLoading(true);
            console.log('🔍 Search Query:', searchQuery);
            
            // Use the searchContent method with the actual search query
            const results = await contentApi.searchContent(searchQuery);
            onSearchResults(results);
            
        } catch (error) {
            console.error('❌ Search failed:', error);
            // You might want to show an error message to the user
        } finally {
            onLoading(false);
        }
    };

    const handleInputChange = (field: keyof SearchQuery, value: string) => {
        setSearchQuery(prev => {
            if (field === 'keywords') {
                // Convert comma-separated string to array
                const keywordsArray = value.split(',').map(k => k.trim()).filter(k => k.length > 0);
                return {
                    ...prev,
                    keywords: keywordsArray.length > 0 ? keywordsArray : null
                };
            } else {
                return {
                    ...prev,
                    [field]: value || null
                };
            }
        });
    };

    return (
        <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 shadow-lg">
            {/* Pull Handle */}
            <div 
                className="flex items-center justify-center py-1 cursor-pointer hover:bg-black/10 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center space-x-2 text-white">
                    <svg 
                        className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                    <span className="text-xs font-medium">Search Filters</span>
                </div>
            </div>

            {/* Collapsible Content */}
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
            }`}>
                <div className="bg-white/95 backdrop-blur-sm border-t border-white/20">
                    <div className="max-w-4xl mx-auto p-3">
                        <form onSubmit={handleSearch} className="space-y-3">
                            {/* Keywords Section */}
                            <div className="space-y-2">
                                <h3 className="text-sm font-semibold text-gray-800 flex items-center">
                                    <svg className="w-4 h-4 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                    Search Keywords
                                </h3>
                                <input
                                    type="text"
                                    placeholder="Enter search keywords..."
                                    value={searchQuery.keywords?.join(', ') || ''}
                                    onChange={(e) => handleInputChange('keywords', e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/80 backdrop-blur-sm"
                                />
                            </div>

                            {/* Date Filters */}
                            <div className="space-y-2">
                                <h3 className="text-sm font-semibold text-gray-800 flex items-center">
                                    <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    Date Filters
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="block text-xs font-medium text-gray-600">Start Date</label>
                                        <input
                                            type="date"
                                            value={searchQuery.start_date_duration?.toString() || ''}
                                            onChange={(e) => handleInputChange('start_date_duration', e.target.value)}
                                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="block text-xs font-medium text-gray-600">End Date</label>
                                        <input
                                            type="date"
                                            value={searchQuery.end_date_duration?.toString() || ''}
                                            onChange={(e) => handleInputChange('end_date_duration', e.target.value)}
                                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Filter Dropdowns */}
                            <div className="space-y-2">
                                <h3 className="text-sm font-semibold text-gray-800 flex items-center">
                                    <svg className="w-4 h-4 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                    </svg>
                                    Filters
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="block text-xs font-medium text-gray-600">Category</label>
                                        <select
                                            value={searchQuery.category || ''}
                                            onChange={(e) => handleInputChange('category', e.target.value)}
                                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white/80"
                                        >
                                            <option value="">Select Category</option>
                                            <option value="spam">Spam</option>
                                            <option value="meeting">Meeting</option>
                                            <option value="task">Task</option>
                                            <option value="information">Information</option>
                                            <option value="idea">Idea</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="block text-xs font-medium text-gray-600">Source</label>
                                        <select
                                            value={searchQuery.source || ''}
                                            onChange={(e) => handleInputChange('source', e.target.value)}
                                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white/80"
                                        >
                                            <option value="">Select Source</option>
                                            <option value="email">Email</option>
                                            <option value="telegram">Telegram</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Search Button */}
                            <div className="flex justify-center pt-2">
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-medium rounded-md hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-105 shadow-lg"
                                >
                                    <svg className="w-3 h-3 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                    Search
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
} 