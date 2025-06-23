'use client';

import { useState, useEffect } from 'react';
import { ContentSearchResponse, ContentItem } from '../api/types';
import { contentApi } from '../api/routes';

export default function Dashboard() {
  const [contentItems, setContentItems] = useState<ContentSearchResponse>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAllContent();
  }, []);

  const fetchAllContent = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const results = await contentApi.getPublicSummary();
      setContentItems(results);
    } catch (err) {
      console.error('Failed to fetch content:', err);
      setError('Failed to load content. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      spam: 'bg-red-100 text-red-800 border-red-200',
      meeting: 'bg-blue-100 text-blue-800 border-blue-200',
      task: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      information: 'bg-green-100 text-green-800 border-green-200',
      idea: 'bg-purple-100 text-purple-800 border-purple-200',
      other: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[category as keyof typeof colors] || colors.other;
  };

  const getSourceIcon = (source: string) => {
    if (source === 'email') {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      );
    }
    return (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    );
  };

  const getEntityColor = (entityType: string) => {
    const colors = {
      CONTACT: 'bg-blue-50 text-blue-700 border-blue-200',
      DATE: 'bg-green-50 text-green-700 border-green-200',
      KEYWORD: 'bg-purple-50 text-purple-700 border-purple-200',
      PROJECT: 'bg-orange-50 text-orange-700 border-orange-200'
    };
    return colors[entityType as keyof typeof colors] || 'bg-gray-50 text-gray-700 border-gray-200';
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-gray-600 text-lg mb-4">{error}</p>
          <button 
            onClick={fetchAllContent}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Content Dashboard</h1>
              <p className="text-gray-600 mt-1">All your content in one place</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-purple-600">{contentItems.length}</div>
              <div className="text-sm text-gray-500">Total Items</div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {contentItems.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-lg font-medium text-gray-500">No content available</p>
            <p className="text-sm text-gray-400">Content will appear here when available</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {contentItems.map((item: ContentItem) => (
              <div key={item.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getCategoryColor(item.category)}`}>
                        {item.category}
                      </span>
                      <div className="flex items-center space-x-1 text-gray-500">
                        {getSourceIcon(item.source)}
                        <span className="text-xs capitalize">{item.source}</span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatDate(item.timestamp)}
                    </div>
                  </div>
                  
                  {item.subject && (
                    <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2">
                      {item.subject}
                    </h3>
                  )}
                </div>

                {/* Content */}
                <div className="p-6">
                  <p className="text-gray-700 text-sm line-clamp-3 mb-4">
                    {item.content_data}
                  </p>
                  
                  {/* Entity Tags */}
                  {item.entities.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {item.entities.map((entity) => (
                        <span 
                          key={entity.id}
                          className={`px-2 py-1 rounded-full text-xs font-medium border ${getEntityColor(entity.entity_type)}`}
                        >
                          {entity.entity_value}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 