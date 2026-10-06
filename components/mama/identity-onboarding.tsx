'use client';
import { useEffect, useState } from 'react';
import { ArrowRight, Check, LockKeyhole } from 'lucide-react';
import { normalizeUsername } from '@/lib/mama-identity';
import styles from './identity-onboarding.module.css';

type Props = { suggestedUsername: string; suggestedName: string; ageConfirmed: boolean };
export function IdentityOnboarding({ suggestedUsername, suggestedName, ageConfirmed }: Props) {
  const [username, setUsername] = useState(normalizeUsername(suggestedUsername));
  const [displayName, setDisplayName] = useState(suggestedName);
  const [age13Plus, setAge13Plus] = useState(ageConfirmed);
  const [publicProfile, setPublicProfile] = useState(false);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [claimed, setClaimed] = useState('');
  useEffect(() => {
    if (!username) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetch(`/api/identity/availability?username=${encodeURIComponent(username)}`, { signal: controller.signal })
        .then((response) => response.json()).then((result) => setStatus(result.status || 'unavailable'))
        .catch(() => setStatus('unavailable'));
    }, 350);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [username]);
  async function claim() {
    setError(''); setBusy(true);
    try {
      const response = await fetch('/api/identity/claim', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, displayName, age13Plus, publicProfile }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not claim your identity.');
      setClaimed(result.username);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Try again.'); }
    finally { setBusy(false); }
  }
  return <main id="main-content" className={styles.page}>
    <section className={styles.art} aria-hidden="true"><span>MAMA · WORLD</span></section>
    <section className={styles.form}>
      {claimed ? <div className={styles.welcome} aria-live="polite"><Check size={32} /><span>YOUR PLACE IS YOURS</span><h1>Welcome, @{claimed}.</h1><p>Your MAMA World is ready to become your own.</p><button onClick={() => location.assign('/')}>Enter MAMA World <ArrowRight size={18} /></button></div> : <>
        <span className={styles.kicker}>WELCOME TO YOUR WORLD</span>
        <h1>First, make it yours.</h1>
        <p>Your @username is your place in MAMA. It is claimed when you finish this step, and your care records stay private.</p>
        <label className={styles.field}>Choose your @username <span className={styles.handle}><b>@</b><input value={username} maxLength={20} autoCapitalize="none" autoComplete="off" onChange={(event) => { setUsername(normalizeUsername(event.target.value)); setStatus(''); }} placeholder="yourname" /></span></label>
        <p className={styles.status} aria-live="polite">{status === 'available' ? `@${username} is available — claim it below.` : status === 'unavailable' ? 'That name has already been claimed.' : status === 'reserved' ? 'That name is reserved for MAMA.' : status === 'invalid' ? 'Use 3–20 letters, numbers or underscores.' : 'A name is yours only after you complete this step.'}</p>
        <label className={styles.field}>Display name <input value={displayName} maxLength={60} autoComplete="name" onChange={(event) => setDisplayName(event.target.value)} placeholder="What should MAMA call you?" /></label>
        {!ageConfirmed && <label className={styles.check}><input type="checkbox" checked={age13Plus} onChange={(event) => setAge13Plus(event.target.checked)} /> I confirm that I am at least 13 years old.</label>}
        <label className={styles.check}><input type="checkbox" checked={publicProfile} onChange={(event) => setPublicProfile(event.target.checked)} /> Make my basic MAMA profile public. My health information always stays private.</label>
        <p className={styles.privacy}><LockKeyhole size={16} /> Your profile is private by default. You can change its visibility later.</p>
        {error && <p role="alert" className={styles.error}>{error}</p>}
        <button className={styles.submit} disabled={busy || !age13Plus || status !== 'available'} onClick={() => void claim()}>{busy ? 'Claiming…' : `Claim @${username || 'yourname'}`} <ArrowRight size={18} /></button>
      </>}
    </section>
  </main>;
}
