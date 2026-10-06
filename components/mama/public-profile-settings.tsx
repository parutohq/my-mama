'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';

type Identity = { username: string | null; bio: string | null; profile_visibility: 'private' | 'public' };
export function PublicProfileSettings() {
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  useEffect(() => { fetch('/api/identity/profile', { cache: 'no-store' }).then((r) => r.json()).then((data) => setIdentity(data.profile ?? null)).catch(() => setMessage('Identity settings could not be loaded.')); }, []);
  async function save() {
    if (!identity) return;
    setBusy(true); setMessage('');
    try {
      const response = await fetch('/api/identity/profile', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ visibility: identity.profile_visibility, bio: identity.bio }) });
      setMessage(response.ok ? 'Profile settings saved.' : 'Profile settings could not be saved.');
    } catch { setMessage('Profile settings could not be saved.'); }
    finally { setBusy(false); }
  }
  return <section className="card settings-v2-identity"><span className="ask-v2-label">YOUR MAMA IDENTITY</span><h2 className="spaced">Your @username</h2>{identity?.username ? <><p><strong>@{identity.username}</strong> is yours. Your health records never appear on this page.</p>{identity.profile_visibility === 'public' && <p><Link href={`/@${identity.username}`}>View your public profile</Link></p>}<label className="identity-visibility"><input type="checkbox" checked={identity.profile_visibility === 'public'} onChange={(event) => setIdentity({ ...identity, profile_visibility: event.target.checked ? 'public' : 'private' })} /> Make my basic profile public</label><label className="identity-bio">A short introduction, if your profile is public<textarea maxLength={280} value={identity.bio ?? ''} onChange={(event) => setIdentity({ ...identity, bio: event.target.value })} placeholder="A little about you, without private health details" /></label><button type="button" className="outline-btn spaced" disabled={busy} onClick={() => void save()}>{busy ? 'Saving…' : 'Save identity settings'}</button></> : <p>Loading your identity…</p>}{message && <output>{message}</output>}</section>;
}
