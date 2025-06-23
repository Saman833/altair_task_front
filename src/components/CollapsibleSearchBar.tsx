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
        keywords: '',
        startDate: '',
        endDate: '',
        Date_Mentiond: '',
        category: undefined,
        source: undefined
    });

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        
        try {
            onLoading(true);
            console.log('Search Query:', searchQuery);
            
            // For now, just get all public summary
            // Later you can implement the search with filters
            const results = await contentApi.getPublicSummary();
            onSearchResults(results);
            
        } catch (error) {
            console.error('Search failed:', error);
            // You might want to show an error message to the user
        } finally {
            onLoading(false);
        }
    };

    const handleInputChange = (field: keyof SearchQuery, value: string) => {
        setSearchQuery(prev => ({
            ...prev,
            [field]: value
        }));
    };

    return (
        <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 shadow-lg">
            {/* Pull Handle */}
            <div 
                className="flex items-center justify-center py-2 cursor-pointer hover:bg-black/10 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center space-x-2 text-white">
                    <svg 
                        className={`w-5 h-5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                    <span className="text-sm font-medium">Search Filters</span>
                </div>
            </div>

            {/* Collapsible Content */}
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                isExpanded ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
            }`}>
                <div className="bg-white/95 backdrop-blur-sm border-t border-white/20">
                    <div className="max-w-4xl mx-auto p-6">
                        <form onSubmit={handleSearch} className="space-y-6">
                            {/* Keywords Section */}
                            <div className="space-y-3">
                                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                                    <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                    Search Keywords
                                </h3>
                                <input
                                    type="text"
                                    placeholder="Enter search keywords..."
                                    value={searchQuery.keywords || ''}
                                    onChange={(e) => handleInputChange('keywords', e.target.value)}
                                    className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/80 backdrop-blur-sm"
                                />
                            </div>

                            {/* Date Filters */}
                            <div className="space-y-3">
                                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                                    <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    Date Filters
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-600">Start Date</label>
                                        <input
                                            type="date"
                                            value={searchQuery.startDate?.toString() || ''}
                                            onChange={(e) => handleInputChange('startDate', e.target.value)}
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-600">End Date</label>
                                        <input
                                            type="date"
                                            value={searchQuery.endDate?.toString() || ''}
                                            onChange={(e) => handleInputChange('endDate', e.target.value)}
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-600">Date Mentioned</label>
                                        <input
                                            type="date"
                                            value={searchQuery.Date_Mentiond?.toString() || ''}
                                            onChange={(e) => handleInputChange('Date_Mentiond', e.target.value)}
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Filter Dropdowns */}
                            <div className="space-y-3">
                                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                                    <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                    </svg>
                                    Filters
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-600">Category</label>
                                        <select
                                            value={searchQuery.category || ''}
                                            onChange={(e) => handleInputChange('category', e.target.value)}
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white/80"
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

                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-600">Source</label>
                                        <select
                                            value={searchQuery.source || ''}
                                            onChange={(e) => handleInputChange('source', e.target.value)}
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white/80"
                                        >
                                            <option value="">Select Source</option>
                                            <option value="email">Email</option>
                                            <option value="telegram">Telegram</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Search Button */}
                            <div className="flex justify-center pt-4">
                                <button
                                    type="submit"
                                    className="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-medium rounded-lg hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-105 shadow-lg"
                                >
                                    <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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