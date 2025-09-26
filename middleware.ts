// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Temporarily disabled - return next() for all requests
  return NextResponse.next();
}

export const config = {
  matcher: [] // Empty matcher means middleware won't run
}