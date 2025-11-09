import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const envCheck = {
    supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabase_anon: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    supabase_service: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    openai: !!process.env.OPENAI_API_KEY,
    tripadvisor: !!process.env.TRIPADVISOR_API_KEY,
  };

  const allLoaded = Object.values(envCheck).every(v => v === true);

  return NextResponse.json({
    status: allLoaded ? '✅ All environment variables loaded!' : '❌ Some variables missing',
    details: envCheck,
    preview: {
      supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',
      has_openai: !!process.env.OPENAI_API_KEY,
      has_tripadvisor: !!process.env.TRIPADVISOR_API_KEY,
    }
  }, {
    headers: {
      'Cache-Control': 'no-store',
    }
  });
}
