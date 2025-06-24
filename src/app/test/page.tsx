'use client';

import { useState, useEffect } from 'react';

export default function TestPage() {
  const [testResult, setTestResult] = useState<any>(null);
  const [proxyTestResult, setProxyTestResult] = useState<any>(null);
  const [searchTestResult, setSearchTestResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [proxyLoading, setProxyLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [proxyError, setProxyError] = useState<string | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  const runTest = async () => {
    setLoading(true);
    setError(null);
    setTestResult(null);

    try {
      console.log('🧪 Running backend test...');
      const response = await fetch('/api/test-backend');
      const data = await response.json();
      
      console.log('📥 Test result:', data);
      setTestResult(data);
    } catch (err) {
      console.error('❌ Test failed:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const runProxyTest = async () => {
    setProxyLoading(true);
    setProxyError(null);
    setProxyTestResult(null);

    try {
      console.log('🔄 Testing proxy...');
      const response = await fetch('/api/proxy/contents/');
      const data = await response.json();
      
      console.log('📥 Proxy test result:', data);
      setProxyTestResult(data);
    } catch (err) {
      console.error('❌ Proxy test failed:', err);
      setProxyError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setProxyLoading(false);
    }
  };

  const runSearchTest = async () => {
    setSearchLoading(true);
    setSearchError(null);
    setSearchTestResult(null);

    try {
      console.log('🔍 Testing search functionality...');
      const searchQuery = {
        keywords: ['test'],
        category: 'information' as const
      };
      
      const response = await fetch('/api/proxy/search_query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(searchQuery)
      });
      
      const data = await response.json();
      console.log('📥 Search test result:', data);
      setSearchTestResult(data);
    } catch (err) {
      console.error('❌ Search test failed:', err);
      setSearchError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSearchLoading(false);
    }
  };

  useEffect(() => {
    runTest();
    runProxyTest();
    runSearchTest();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">API Connection Test</h1>
        
        {/* Environment Info */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Environment Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-600">NODE_ENV:</span>
              <span className="ml-2 text-gray-800">{process.env.NODE_ENV}</span>
            </div>
            <div>
              <span className="font-medium text-gray-600">NEXT_PUBLIC_API_URL:</span>
              <span className="ml-2 text-gray-800">
                {process.env.NEXT_PUBLIC_API_URL ? 'Set' : 'Not Set'}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-600">Current URL:</span>
              <span className="ml-2 text-gray-800">{typeof window !== 'undefined' ? window.location.href : 'Server-side'}</span>
            </div>
            <div>
              <span className="font-medium text-gray-600">Timestamp:</span>
              <span className="ml-2 text-gray-800">{new Date().toISOString()}</span>
            </div>
          </div>
        </div>

        {/* Server-Side Backend Test */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Server-Side Backend Test</h2>
            <button
              onClick={runTest}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Testing...' : 'Run Test'}
            </button>
          </div>

          {loading && (
            <div className="flex items-center space-x-2 text-blue-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span>Testing backend connection...</span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <h3 className="text-red-800 font-medium mb-2">Test Error</h3>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {testResult && (
            <div className="space-y-4">
              {testResult.success ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="text-green-800 font-medium mb-2">✅ Server-Side Test Successful</h3>
                  <div className="text-sm text-green-700 space-y-1">
                    <p><strong>Backend URL:</strong> {testResult.backendUrl}</p>
                    <p><strong>Test URL:</strong> {testResult.testUrl}</p>
                    <p><strong>Response Status:</strong> {testResult.responseStatus}</p>
                    <p><strong>Data Length:</strong> {testResult.dataLength}</p>
                    <p><strong>Message:</strong> {testResult.message}</p>
                  </div>
                </div>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="text-red-800 font-medium mb-2">❌ Server-Side Test Failed</h3>
                  <div className="text-sm text-red-700 space-y-1">
                    <p><strong>Error:</strong> {testResult.error}</p>
                    <p><strong>Message:</strong> {testResult.message}</p>
                    {testResult.url && <p><strong>URL:</strong> {testResult.url}</p>}
                    {testResult.status && <p><strong>Status:</strong> {testResult.status}</p>}
                    {testResult.errorText && <p><strong>Error Text:</strong> {testResult.errorText}</p>}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Proxy Test */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Proxy Test (Client-Side)</h2>
            <button
              onClick={runProxyTest}
              disabled={proxyLoading}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {proxyLoading ? 'Testing...' : 'Run Proxy Test'}
            </button>
          </div>

          {proxyLoading && (
            <div className="flex items-center space-x-2 text-purple-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
              <span>Testing proxy connection...</span>
            </div>
          )}

          {proxyError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <h3 className="text-red-800 font-medium mb-2">Proxy Test Error</h3>
              <p className="text-red-600 text-sm">{proxyError}</p>
            </div>
          )}

          {proxyTestResult && (
            <div className="space-y-4">
              {Array.isArray(proxyTestResult) ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="text-green-800 font-medium mb-2">✅ Proxy Test Successful</h3>
                  <div className="text-sm text-green-700 space-y-1">
                    <p><strong>Data Length:</strong> {proxyTestResult.length} items</p>
                    <p><strong>Proxy URL:</strong> /api/proxy/contents/</p>
                    <p><strong>Message:</strong> Proxy is working correctly!</p>
                  </div>
                </div>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="text-red-800 font-medium mb-2">❌ Proxy Test Failed</h3>
                  <div className="text-sm text-red-700 space-y-1">
                    <p><strong>Error:</strong> {proxyTestResult.error || 'Unknown error'}</p>
                    <p><strong>Message:</strong> {proxyTestResult.message || 'Proxy failed'}</p>
                  </div>
                </div>
              )}

              {/* Raw Proxy Result */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-gray-800 font-medium mb-2">Raw Proxy Result</h3>
                <pre className="text-xs text-gray-600 overflow-auto">
                  {JSON.stringify(proxyTestResult, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Search Test */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Search Test (POST /search_query)</h2>
            <button
              onClick={runSearchTest}
              disabled={searchLoading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {searchLoading ? 'Testing...' : 'Run Search Test'}
            </button>
          </div>

          {searchLoading && (
            <div className="flex items-center space-x-2 text-green-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
              <span>Testing search functionality...</span>
            </div>
          )}

          {searchError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <h3 className="text-red-800 font-medium mb-2">Search Test Error</h3>
              <p className="text-red-600 text-sm">{searchError}</p>
            </div>
          )}

          {searchTestResult && (
            <div className="space-y-4">
              {Array.isArray(searchTestResult) ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="text-green-800 font-medium mb-2">✅ Search Test Successful</h3>
                  <div className="text-sm text-green-700 space-y-1">
                    <p><strong>Data Length:</strong> {searchTestResult.length} items</p>
                    <p><strong>Search URL:</strong> /api/proxy/search_query</p>
                    <p><strong>Method:</strong> POST</p>
                    <p><strong>Message:</strong> Search functionality is working correctly!</p>
                  </div>
                </div>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="text-red-800 font-medium mb-2">❌ Search Test Failed</h3>
                  <div className="text-sm text-red-700 space-y-1">
                    <p><strong>Error:</strong> {searchTestResult.error || 'Unknown error'}</p>
                    <p><strong>Message:</strong> {searchTestResult.message || 'Search failed'}</p>
                  </div>
                </div>
              )}

              {/* Raw Search Result */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-gray-800 font-medium mb-2">Raw Search Result</h3>
                <pre className="text-xs text-gray-600 overflow-auto">
                  {JSON.stringify(searchTestResult, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-blue-800 mb-4">Troubleshooting Guide</h2>
          <div className="text-sm text-blue-700 space-y-2">
            <p><strong>1. Environment Variables:</strong> Make sure NEXT_PUBLIC_API_URL is set in Railway environment variables.</p>
            <p><strong>2. Backend URL Format:</strong> Should be something like <code>https://your-backend-name.up.railway.app</code></p>
            <p><strong>3. CORS Issues:</strong> The proxy bypasses CORS by making server-side requests.</p>
            <p><strong>4. Port Issues:</strong> Railway automatically handles ports, don't include port numbers in the URL.</p>
            <p><strong>5. Check Logs:</strong> Look at Railway logs for both frontend and backend services.</p>
            <p><strong>6. Proxy vs Direct:</strong> If server-side test works but proxy fails, there's an issue with the proxy route.</p>
          </div>
        </div>
      </div>
    </div>
  );
} 