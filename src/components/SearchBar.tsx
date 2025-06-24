'use client';

import { useState } from 'react';
import { SearchQuery } from '../api/types';
import DateFilters from './DateFilters';
import FilterDropdowns from './FilterDropdowns';

export default function SearchBar() {
    const [searchQuery, setSearchQuery] = useState<SearchQuery>({
        keywords: [],
        start_date_duration: null,
        end_date_duration: null,
        category: null,
        source: null
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Search Query:', searchQuery);
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
        <div className="w-full max-w-4xl mx-auto">
            <form onSubmit={handleSearch} className="space-y-8">
                {/* Keywords Section */}
                <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-gray-700">Search Keywords</h3>
                    <input
                        type="text"
                        placeholder="Enter search keywords..."
                        value={searchQuery.keywords ? searchQuery.keywords.join(', ') : ''}
                        onChange={(e) => handleInputChange('keywords', e.target.value)}
                        className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                {/* Date Filters */}
                <DateFilters
                    startDate={searchQuery.start_date_duration?.toString()}
                    endDate={searchQuery.end_date_duration?.toString()}
                    onDateChange={handleInputChange}
                />

                {/* Filter Dropdowns */}
                <FilterDropdowns
                    category={searchQuery.category || undefined}
                    source={searchQuery.source || undefined}
                    onFilterChange={handleInputChange}
                />

                {/* Search Button */}
                <div className="flex justify-center pt-4">
                    <button
                        type="submit"
                        className="px-8 py-3 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
                    >
                        Search
                    </button>
                </div>
            </form>
        </div>
    );
} 