import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next');
  const destination = next?.startsWith('/') ? next : '/';
  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }
  // Confirmation links may be opened from an older Vercel alias. Redirect the
  // authenticated user to the configured canonical application URL instead.
  const appUrl = process.env.APP_URL || url.origin;
  return NextResponse.redirect(new URL(destination, appUrl));
}
