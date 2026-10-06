import MamaApp from './mama-app';
import { PublicJourneyStart } from '@/components/mama/public-journey-start';
import { IdentityOnboarding } from '@/components/mama/identity-onboarding';
import { createClient } from '@/lib/supabase/server';

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <PublicJourneyStart />;
  const { data: identity, error } = await supabase.from('profiles').select('username, age_13_plus_confirmed').eq('id', user.id).maybeSingle();
  if (error) return <main id="main-content" style={{ maxWidth: 620, margin: '12vh auto', padding: 24 }}><h1>MAMA is preparing your space.</h1><p>We could not load your identity securely. Please try again in a moment.</p></main>;
  if (!identity?.username || !identity.age_13_plus_confirmed) {
    return <IdentityOnboarding suggestedUsername={String(user.user_metadata?.mama_requested_username ?? '')} suggestedName={String(user.user_metadata?.mama_start_intent?.name ?? '')} ageConfirmed={Boolean(identity?.age_13_plus_confirmed)} />;
  }
  return <MamaApp />;
}
