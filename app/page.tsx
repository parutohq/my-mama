import MamaApp from './mama-app';
import { PublicLanding } from '@/components/mama/public-landing';
import { createClient } from '@/lib/supabase/server';
export default async function Home() { const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); return user ? <MamaApp /> : <PublicLanding />; }
