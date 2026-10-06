import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import styles from './profile.module.css';
export const dynamic = 'force-dynamic';
type PublicProfile = { username: string; displayName: string; bio: string | null; avatarRef: string | null };
export default async function PublicProfilePage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  if (!/^@[a-z0-9_]{3,20}$/i.test(handle)) notFound();
  const client = await createClient();
  const { data, error } = await client.rpc('mama_public_profile', { handle: handle.slice(1) });
  if (error || !data || typeof data !== 'object' || Array.isArray(data)) notFound();
  const profile = data as PublicProfile;
  return <main id="main-content" className={styles.page}><div className={styles.art}><Link href="/">♥ mama.</Link><span>MAMA WORLD · IDENTITY</span></div><section className={styles.card}><div className={styles.avatar} aria-hidden="true">{(profile.displayName || profile.username).slice(0,1).toUpperCase()}</div><span>OFFICIAL MAMA PROFILE</span><h1>{profile.displayName || `@${profile.username}`}</h1><p className={styles.handle}>@{profile.username}</p>{profile.bio && <p>{profile.bio}</p>}<div className={styles.rule} /><p className={styles.note}>A person&apos;s MAMA profile shares only the identity details she has chosen to make public. Her health and care space remain private.</p><Link className={styles.cta} href="/">Enter MAMA World →</Link></section></main>;
}
