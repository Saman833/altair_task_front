'use client';

import { Category, Source } from '../api/types';

interface FilterDropdownsProps {
    category?: Category;
    source?: Source;
    onFilterChange: (field: 'category' | 'source', value: string) => void;
}

export default function FilterDropdowns({ category, source, onFilterChange }: FilterDropdownsProps) {
    return (
        <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-700">Filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-600">Category</label>
                    <select
                        value={category || ''}
                        onChange={(e) => onFilterChange('category', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
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
                        value={source || ''}
                        onChange={(e) => onFilterChange('source', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    >
                        <option value="">Select Source</option>
                        <option value="email">Email</option>
                        <option value="telegram">Telegram</option>
                    </select>
                </div>
            </div>
        </div>
    );
} 