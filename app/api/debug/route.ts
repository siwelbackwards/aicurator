import { NextResponse } from 'next/server';

// Required for static export
export const dynamic = 'force-static';
export const revalidate = 0;

export async function POST(request: Request) {
  try {
    const { imageUrl } = await request.json();
    
    if (!imageUrl) {
      return NextResponse.json({ error: 'No imageUrl provided' }, { status: 400 });
    }

    // Test image URL accessibility
    try {
      const response = await fetch(imageUrl, {
        method: 'HEAD', // Just check headers, don't download the image
        cache: 'no-cache',
        headers: {
          'Accept': 'image/*',
        },
      });

      const headers = Object.fromEntries(response.headers.entries());
      
      return NextResponse.json({
        url: imageUrl,
        status: response.status,
        ok: response.ok,
        contentType: headers['content-type'],
        contentLength: headers['content-length'],
        exists: response.ok,
        headers: headers,
      });
    } catch (error) {
      return NextResponse.json({
        url: imageUrl,
        exists: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

// GET handler to check API health
export async function GET() {
  return NextResponse.json({
    message: 'Debug API placeholder for static export',
    environment: 'static'
  });
} 