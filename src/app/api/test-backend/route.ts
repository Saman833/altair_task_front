import { NextResponse } from 'next/server';

export async function GET() {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL;
  
  console.log('🔍 Test Backend - Environment Variables:');
  console.log('NEXT_PUBLIC_API_URL:', backendUrl);
  console.log('NODE_ENV:', process.env.NODE_ENV);
  
  if (!backendUrl) {
    return NextResponse.json({
      error: 'NEXT_PUBLIC_API_URL not set',
      message: 'Please set NEXT_PUBLIC_API_URL in Railway environment variables',
      availableEnvVars: Object.keys(process.env).filter(key => key.includes('API') || key.includes('URL'))
    }, { status: 500 });
  }

  try {
    // Test the backend URL
    const testUrl = backendUrl.endsWith('/contents/') 
      ? backendUrl 
      : `${backendUrl}/contents/`;
    
    console.log('🧪 Testing backend URL:', testUrl);
    
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(10000),
    });

    console.log('📥 Backend response status:', response.status);
    
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
      backendUrl: backendUrl,
      testUrl: testUrl,
      responseStatus: response.status,
      dataLength: Array.isArray(data) ? data.length : 'Not an array',
      sampleData: Array.isArray(data) && data.length > 0 ? data[0] : null
    });

  } catch (error) {
    console.error('❌ Backend test failed:', error);
    
    return NextResponse.json({
      error: 'Backend connection failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      backendUrl: backendUrl,
      testUrl: backendUrl.endsWith('/contents/') 
        ? backendUrl 
        : `${backendUrl}/contents/`
    }, { status: 500 });
  }
} 