import { NextResponse } from 'next/server';

// For static export, we need to explicitly set this route as static
export const dynamic = 'force-static';
// No revalidation for static export
export const revalidate = false;

// For static export, we can't use dynamic server-side code
// Instead, return a static JSON response with instructions
export async function GET(request: Request) {
  return NextResponse.json({
    message: "Schema debug endpoint is not available in production/export mode",
    note: "This endpoint requires server-side execution which is not supported in static exports",
    alternative: "For schema debugging, please use the local development environment"
  }, { status: 200 });
} 