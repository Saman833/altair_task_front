'use client';

interface DateFiltersProps {
    startDate?: string;
    endDate?: string;
    dateMentioned?: string;
    onDateChange: (field: 'startDate' | 'endDate' | 'Date_Mentiond', value: string) => void;
}

export default function DateFilters({ startDate, endDate, dateMentioned, onDateChange }: DateFiltersProps) {
    return (
        <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-700">Date Filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-600">Start Date</label>
                    <input
                        type="date"
                        value={startDate || ''}
                        onChange={(e) => onDateChange('startDate', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-600">End Date</label>
                    <input
                        type="date"
                        value={endDate || ''}
                        onChange={(e) => onDateChange('endDate', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-600">Date Mentioned</label>
                    <input
                        type="date"
                        value={dateMentioned || ''}
                        onChange={(e) => onDateChange('Date_Mentiond', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
            </div>
        </div>
    );
} 