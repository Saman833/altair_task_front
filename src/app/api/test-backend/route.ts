import { NextResponse } from 'next/server';

export async function GET() {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL;
  
  if (!backendUrl) {
    return NextResponse.json({
      status: 'error',
      error: 'NEXT_PUBLIC_API_URL environment variable is not set',
      message: 'Please set NEXT_PUBLIC_API_URL in your Railway environment variables.',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }

  const fullUrl = `${backendUrl}/contents/`;
  
  try {
    console.log('🧪 Testing backend connection to:', fullUrl);
    
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(5000),
    });

    console.log('📥 Backend response status:', response.status);

    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    return NextResponse.json({
      status: 'success',
      backendUrl: fullUrl,
      responseStatus: response.status,
      dataLength: Array.isArray(data) ? data.length : 'Not an array',
      timestamp: new Date().toISOString(),
      message: 'Backend connection successful!'
    });
  } catch (error) {
    console.error('❌ Backend test failed:', error);
    
    return NextResponse.json({
      status: 'error',
      backendUrl: fullUrl,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      message: 'Backend connection failed!'
    }, { status: 500 });
  }
} 