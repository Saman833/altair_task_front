'use client';

import { useState, useEffect } from 'react';
import CollapsibleSearchBar from '../components/CollapsibleSearchBar';
import Dashboard from '../components/Dashboard';
import Assistant from '../components/Assistant';
import { ContentSearchResponse, ContentItem } from '../api/types';
import { contentApi } from '../api/routes';

export default function Home() {
  const [searchResults, setSearchResults] = useState<ContentSearchResponse>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState<string>('Testing...');
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'search' | 'assistant' | 'settings' | 'profile'>('dashboard');

  // Add debugging logs and API test
  useEffect(() => {
    console.log('🚀 Home page loaded');
    console.log('📍 Current URL:', window.location.href);
    console.log('🌍 Environment:', process.env.NODE_ENV);
    console.log('🔗 NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL);
    
    // Test API connection
    testApiConnection();
  }, []);

  const testApiConnection = async () => {
    try {
      console.log('🧪 Testing API connection...');
      setApiStatus('Testing API...');
      
      const results = await contentApi.getPublicSummary();
      console.log('✅ API test successful:', results.length, 'items received');
      setApiStatus(`✅ API Connected (${results.length} items)`);
    } catch (error) {
      console.error('❌ API test failed:', error);
      setApiStatus('❌ API Connection Failed');
      setError(`API Connection Error: ${error}`);
    }
  };

  const handleSearchResults = (results: ContentSearchResponse) => {
    console.log('🔍 Search results received:', results.length, 'items');
    setSearchResults(results);
    setShowSearchResults(true);
  };

  const handleLoading = (loading: boolean) => {
    console.log('⏳ Loading state:', loading);
    setIsLoading(loading);
  };

  const handleBackToDashboard = () => {
    console.log('⬅️ Going back to dashboard');
    setShowSearchResults(false);
    setSearchResults([]);
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

  // Show error if there's one
  if (error) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <h1 className="text-2xl font-bold text-red-800 mb-4">Error</h1>
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => setError(null)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Main Layout with Sidebar */}
      <div className="flex h-screen">
        {/* Left Navigation Sidebar */}
        <div className="w-64 bg-white shadow-lg border-r border-gray-200 flex flex-col">
          {/* Navigation Header */}
          <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-4">
            <h1 className="text-white text-lg font-semibold">Message Assistant</h1>
            <p className="text-white/80 text-sm">Navigation Menu</p>
          </div>
          
          {/* Navigation Menu */}
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              <li>
                <button 
                  onClick={() => setCurrentPage('dashboard')}
                  className={`flex items-center space-x-3 px-3 py-2 w-full text-left rounded-lg transition-colors ${
                    currentPage === 'dashboard' 
                      ? 'bg-purple-50 text-purple-700 border-l-4 border-purple-500' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <svg className={`w-5 h-5 ${currentPage === 'dashboard' ? 'text-purple-500' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
                  </svg>
                  <span className="font-medium">Dashboard</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setCurrentPage('search')}
                  className={`flex items-center space-x-3 px-3 py-2 w-full text-left rounded-lg transition-colors ${
                    currentPage === 'search' 
                      ? 'bg-purple-50 text-purple-700 border-l-4 border-purple-500' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <svg className={`w-5 h-5 ${currentPage === 'search' ? 'text-purple-500' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <span className="font-medium">Search</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setCurrentPage('assistant')}
                  className={`flex items-center space-x-3 px-3 py-2 w-full text-left rounded-lg transition-colors ${
                    currentPage === 'assistant' 
                      ? 'bg-purple-50 text-purple-700 border-l-4 border-purple-500' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <svg className={`w-5 h-5 ${currentPage === 'assistant' ? 'text-purple-500' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <span className="font-medium">Assistant</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setCurrentPage('settings')}
                  className={`flex items-center space-x-3 px-3 py-2 w-full text-left rounded-lg transition-colors ${
                    currentPage === 'settings' 
                      ? 'bg-purple-50 text-purple-700 border-l-4 border-purple-500' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <svg className={`w-5 h-5 ${currentPage === 'settings' ? 'text-purple-500' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                  <span className="font-medium">Settings</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setCurrentPage('profile')}
                  className={`flex items-center space-x-3 px-3 py-2 w-full text-left rounded-lg transition-colors ${
                    currentPage === 'profile' 
                      ? 'bg-purple-50 text-purple-700 border-l-4 border-purple-500' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <svg className={`w-5 h-5 ${currentPage === 'profile' ? 'text-purple-500' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="font-medium">Profile</span>
                </button>
              </li>
            </ul>
          </nav>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto">
          {currentPage === 'assistant' ? (
            <Assistant />
          ) : currentPage === 'search' ? (
            showSearchResults ? (
              // Search Results View
              <div className="p-4">
                <div className="container mx-auto">
                  {/* Back to Dashboard Button */}
                  <div className="mb-4">
                    <button
                      onClick={handleBackToDashboard}
                      className="flex items-center space-x-2 text-purple-600 hover:text-purple-700 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                      </svg>
                      <span>Back to Dashboard</span>
                    </button>
                  </div>

                  {/* Loading State */}
                  {isLoading && (
                    <div className="flex justify-center items-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                      <span className="ml-3 text-gray-600">Loading results...</span>
                    </div>
                  )}

                  {/* Search Results */}
                  {!isLoading && searchResults.length > 0 && (
                    <div className="space-y-4">
                      <h2 className="text-xl font-semibold text-gray-800 mb-4">
                        Search Results ({searchResults.length} items)
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {searchResults.map((item: ContentItem) => (
                          <div key={item.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center space-x-3">
                                <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getCategoryColor(item.category)}`}>
                                  {item.category}
                                </div>
                                <div className="flex items-center space-x-1 text-gray-500">
                                  {getSourceIcon(item.source)}
                                  <span className="text-sm capitalize">{item.source}</span>
                                </div>
                              </div>
                              <div className="text-sm text-gray-500">
                                {formatDate(item.timestamp)}
                              </div>
                            </div>
                            
                            {item.subject && (
                              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                                {item.subject}
                              </h3>
                            )}
                            
                            <p className="text-gray-700 mb-4 line-clamp-3">
                              {item.content_data}
                            </p>
                            
                            {/* Entity Tags - showing only values */}
                            {item.entities.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {item.entities.map((entity, index) => (
                                  <span
                                    key={index}
                                    className={`px-2 py-1 text-xs rounded-md border ${getEntityColor(entity.entity_type)}`}
                                  >
                                    {entity.entity_value}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* No Results */}
                  {!isLoading && searchResults.length === 0 && showSearchResults && (
                    <div className="text-center py-12">
                      <div className="text-gray-400 mb-4">
                        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-gray-600 mb-2">No results found</h3>
                      <p className="text-gray-500">Try adjusting your search criteria</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-8 text-center">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Search Content</h2>
                <p className="text-gray-600">Use the search filters on the right to find content</p>
              </div>
            )
          ) : currentPage === 'settings' ? (
            <div className="p-8 text-center">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Settings</h2>
              <p className="text-gray-600">Settings page coming soon...</p>
            </div>
          ) : currentPage === 'profile' ? (
            <div className="p-8 text-center">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Profile</h2>
              <p className="text-gray-600">Profile page coming soon...</p>
            </div>
          ) : (
            // Dashboard View (default)
            <Dashboard />
          )}
        </div>

        {/* Right Sidebar with Search */}
        <div className="w-80 bg-white shadow-lg border-l border-gray-200 flex flex-col">
          {/* Sidebar Header */}
          <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 p-4">
            <h1 className="text-white text-lg font-semibold">Content Search</h1>
            <p className="text-white/80 text-sm">Filter and search your content</p>
          </div>
          
          {/* Search Bar in Sidebar */}
          <div className="flex-1 overflow-y-auto">
            <CollapsibleSearchBar 
              onSearchResults={handleSearchResults}
              onLoading={handleLoading}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
