import { NextRequest, NextResponse } from 'next/server';

// Mark this route as static for Next.js static export
export const dynamic = 'force-static';

// Staticize the API endpoints to make it compatible with static export
export async function GET() {
  return NextResponse.json({ message: 'Static export placeholder' });
}

export async function POST() {
  return NextResponse.json({ success: true, id: 'static-export-placeholder' });
}

export async function PUT() {
  return NextResponse.json({ success: true });
}

export async function DELETE() {
  return NextResponse.json({ success: true });
}
