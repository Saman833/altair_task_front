import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL;
  
  if (!backendUrl) {
    return NextResponse.json({
      error: 'NEXT_PUBLIC_API_URL not set',
      message: 'Please set NEXT_PUBLIC_API_URL in Railway environment variables'
    }, { status: 500 });
  }

  try {
    // Clean up backend URL (remove trailing slash if present)
    const cleanBackendUrl = backendUrl.endsWith('/') ? backendUrl.slice(0, -1) : backendUrl;
    
    // Test the backend directly
    const testUrl = `${cleanBackendUrl}/contents/`;
    
    console.log('🧪 Testing backend directly:', testUrl);
    
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(10000),
    });

    console.log('📥 Direct backend response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({
        error: 'Backend request failed',
        status: response.status,
        statusText: response.statusText,
        url: testUrl,
        errorText: errorText,
        headers: Object.fromEntries(response.headers.entries())
      }, { status: 500 });
    }

    const data = await response.json();
    
    return NextResponse.json({
      success: true,
      backendUrl: cleanBackendUrl,
      testUrl: testUrl,
      responseStatus: response.status,
      dataLength: Array.isArray(data) ? data.length : 'Not an array',
      message: '✅ Backend is accessible directly'
    });

  } catch (error) {
    console.error('❌ Direct backend test failed:', error);
    
    const cleanBackendUrl = backendUrl.endsWith('/') ? backendUrl.slice(0, -1) : backendUrl;
    
    return NextResponse.json({
      error: 'Backend connection failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      backendUrl: cleanBackendUrl,
      testUrl: `${cleanBackendUrl}/contents/`,
      note: 'If this fails, the proxy will also fail. Check your backend service.'
    }, { status: 500 });
  }
} 