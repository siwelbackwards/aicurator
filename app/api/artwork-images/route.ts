import { NextRequest, NextResponse } from 'next/server';

// Mark this route as static for Next.js static export
export const dynamic = 'force-static';

// Static placeholder responses for export
export async function GET() {
  return NextResponse.json({ message: 'Static export placeholder' });
}

export async function POST() {
  return NextResponse.json({ success: true });
} 