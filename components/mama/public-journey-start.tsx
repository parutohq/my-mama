'use client';

import Link from 'next/link';
import { ArrowRight, Flower2, Heart, LockKeyhole } from 'lucide-react';
import { useEffect, useState } from 'react';
import { normalizeUsername } from '@/lib/mama-identity';
import { publicJourneyChoices, publicStartIntentKey, type PublicStartIntent } from '@/lib/public-start-intent';
import type { Stage } from '@/lib/care-model';
import styles from './public-journey-start.module.css';

export function PublicJourneyStart() {
  const [stage, setStage] = useState<Stage>('cycle');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [availability, setAvailability] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    if (!username) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetch(`/api/identity/availability?username=${encodeURIComponent(username)}`, { signal: controller.signal })
        .then((response) => response.json()).then((result) => { setAvailability(result.status || 'unavailable'); setSuggestions(result.suggestions || []); })
        .catch(() => setAvailability('unavailable'));
    }, 350);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [username]);

  function continueToAccount() {
    const intent: PublicStartIntent = { stage, name: name.trim().slice(0, 60), username: availability === 'available' ? username : undefined };
    // Temporary browser hand-off only. This is never used as a care-record store.
    window.sessionStorage.setItem(publicStartIntentKey, JSON.stringify(intent));
    window.location.assign('/sign-in?mode=sign-up&from=start');
  }

  return <main id="main-content" className={styles.page}>
    <header className={styles.nav}>
      <Link href="/" className="landing-brand"><Heart fill="currentColor" size={20} />mama.</Link>
      <Link href="/sign-in" className={styles.signIn}>Sign in <ArrowRight size={16} /></Link>
    </header>
    <section className={styles.intro}>
      <span className={styles.kicker}>YOUR LIFE. YOUR PACE.</span>
      <h1>Your health.<br />Your world.<br /><i>Your journey.</i></h1>
      <p>A living digital world for your body, your care and every chapter of womanhood. Step inside and make it yours.</p>
    </section>
    <section className={styles.claim} aria-labelledby="claim-title">
      <div><span>YOUR PLACE IN MAMA</span><h2 id="claim-title">Claim your @username.</h2><p>Every MAMA name is unique. Once someone claims it, that exact name is gone. Checking does not reserve it.</p></div>
      <div className={styles.claimForm}><label htmlFor="homepage-username">Find your name</label><div className={styles.claimInput}><b>@</b><input id="homepage-username" maxLength={20} autoCapitalize="none" autoComplete="off" value={username} placeholder="yourname" onChange={(event) => { setUsername(normalizeUsername(event.target.value)); setAvailability(''); setSuggestions([]); }} /></div><p aria-live="polite">{availability === 'available' ? `@${username} is available.` : availability === 'unavailable' ? `@${username} has already been claimed.` : availability === 'reserved' ? 'This name is reserved.' : availability === 'invalid' ? 'Use 3–20 letters, numbers or underscores.' : 'Your @username becomes your MAMA identity.'}</p>{suggestions.length > 0 && <div className={styles.suggestions}>{suggestions.map((option) => <button key={option} type="button" onClick={() => { setUsername(option); setAvailability(''); }}>@{option}</button>)}</div>}<button type="button" className={styles.claimButton} disabled={availability !== 'available'} onClick={continueToAccount}>Claim @{username || 'yourname'} <ArrowRight size={17} /></button></div>
    </section>
    <section className={`first-data-flow ${styles.flow}`} aria-label="Choose your MAMA journey before creating an account">
      <div className={styles.sanctuaryVisual}>
        <Flower2 size={25} /><span>WELCOME TO MAMA</span>
        <h2>A space that moves with you.</h2>
        <p>Find your place in MAMA. Begin with your own chapter, then make room for what matters to you.</p>
        <small><LockKeyhole size={14} /> This glimpse contains no health records. Your care space stays private.</small>
        <div className={styles.worldPlaces} aria-label="Places in MAMA World"><span>My Home</span><span>Pregnancy Journey</span><span>Care</span><span>Wellness Garden</span><span>Learning</span><span>Mama</span></div>
      </div>
      <div className="first-data-form">
        <span className="first-data-step">01 · YOUR JOURNEY</span>
        <h2>Where are you in your journey?</h2>
        <fieldset className="journey-choice-grid" aria-label="Journey options">
          {publicJourneyChoices.map((item) => <button type="button" key={item.stage} aria-pressed={item.stage === stage} className={item.stage === stage ? 'selected' : ''} onClick={() => setStage(item.stage)}><b>{item.title}</b><span>{item.copy}</span></button>)}
        </fieldset>
        <label className="field"><span>What should MAMA call you? <em>Optional</em></span><input value={name} maxLength={60} autoComplete="name" onChange={(event) => setName(event.target.value)} placeholder="Your first name" /></label>
        <p className="first-data-note">No dates, symptoms or medical history are requested here. You can add only what you choose once you are signed in.</p>
        <div className="first-data-actions"><button type="button" className="button" onClick={continueToAccount}>Continue to create account <ArrowRight size={17} /></button><Link href="/sign-in">I already have an account</Link></div>
      </div>
    </section>
    <footer className={styles.footer}>MAMA is educational support and not an emergency service.</footer>
  </main>;
}
