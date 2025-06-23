'use client';

import { useState } from 'react';
import { SearchQuery } from '../api/types';
import DateFilters from './DateFilters';
import FilterDropdowns from './FilterDropdowns';

export default function SearchBar() {
    const [searchQuery, setSearchQuery] = useState<SearchQuery>({
        keywords: '',
        startDate: '',
        endDate: '',
        Date_Mentiond: '',
        category: undefined,
        source: undefined
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Search Query:', searchQuery);
    };

    const handleInputChange = (field: keyof SearchQuery, value: string) => {
        setSearchQuery(prev => ({
            ...prev,
            [field]: value
        }));
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
                        value={searchQuery.keywords || ''}
                        onChange={(e) => handleInputChange('keywords', e.target.value)}
                        className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                {/* Date Filters */}
                <DateFilters
                    startDate={searchQuery.startDate?.toString()}
                    endDate={searchQuery.endDate?.toString()}
                    dateMentioned={searchQuery.Date_Mentiond?.toString()}
                    onDateChange={handleInputChange}
                />

                {/* Filter Dropdowns */}
                <FilterDropdowns
                    category={searchQuery.category}
                    source={searchQuery.source}
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