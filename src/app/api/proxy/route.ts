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
    // Get the path from the request URL
    const url = new URL(request.url);
    const path = url.pathname.replace('/api/proxy', '');
    
    // Construct the full backend URL
    const fullBackendUrl = `${backendUrl}${path}`;
    
    console.log('🔄 Proxy request to:', fullBackendUrl);
    
    const response = await fetch(fullBackendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(15000),
    });

    console.log('📥 Proxy response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Proxy error:', errorText);
      return NextResponse.json({
        error: 'Backend request failed',
        status: response.status,
        statusText: response.statusText,
        url: fullBackendUrl,
        errorText: errorText
      }, { status: response.status });
    }

    const data = await response.json();
    
    // Return the data with CORS headers
    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    });

  } catch (error) {
    console.error('❌ Proxy error:', error);
    
    return NextResponse.json({
      error: 'Proxy request failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      backendUrl: backendUrl
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL;
  
  if (!backendUrl) {
    return NextResponse.json({
      error: 'NEXT_PUBLIC_API_URL not set',
      message: 'Please set NEXT_PUBLIC_API_URL in Railway environment variables'
    }, { status: 500 });
  }

  try {
    // Get the path from the request URL
    const url = new URL(request.url);
    const path = url.pathname.replace('/api/proxy', '');
    
    // Construct the full backend URL
    const fullBackendUrl = `${backendUrl}${path}`;
    
    // Get the request body
    const body = await request.json();
    
    console.log('🔄 Proxy POST request to:', fullBackendUrl);
    console.log('📤 Request body:', body);
    
    const response = await fetch(fullBackendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    });

    console.log('📥 Proxy response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Proxy error:', errorText);
      return NextResponse.json({
        error: 'Backend request failed',
        status: response.status,
        statusText: response.statusText,
        url: fullBackendUrl,
        errorText: errorText
      }, { status: response.status });
    }

    const data = await response.json();
    
    // Return the data with CORS headers
    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    });

  } catch (error) {
    console.error('❌ Proxy error:', error);
    
    return NextResponse.json({
      error: 'Proxy request failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      backendUrl: backendUrl
    }, { status: 500 });
  }
}

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
} 