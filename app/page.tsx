import MamaApp from './mama-app';
import { PublicJourneyStart } from '@/components/mama/public-journey-start';
import { createClient } from '@/lib/supabase/server';

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user ? <MamaApp /> : <PublicJourneyStart />;
}
