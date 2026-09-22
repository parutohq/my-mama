'use client';

import Link from 'next/link';
import { ArrowRight, Flower2, Heart, LockKeyhole } from 'lucide-react';
import { useState } from 'react';
import { publicJourneyChoices, publicStartIntentKey, type PublicStartIntent } from '@/lib/public-start-intent';
import type { Stage } from '@/lib/care-model';
import styles from './public-journey-start.module.css';

export function PublicJourneyStart() {
  const [stage, setStage] = useState<Stage>('cycle');
  const [name, setName] = useState('');

  function continueToAccount() {
    const intent: PublicStartIntent = { stage, name: name.trim().slice(0, 60) };
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
      <h1>Start with the chapter<br />that feels like <i>you.</i></h1>
      <p>Choose your journey first. Your private MAMA account comes next.</p>
    </section>
    <section className={`first-data-flow ${styles.flow}`} aria-label="Choose your MAMA journey before creating an account">
      <div className="first-data-visual">
        <Flower2 size={25} /><span>WELCOME TO MAMA</span>
        <h2>Let&apos;s make this yours.</h2>
        <p>Tell MAMA where you are in your journey. We only ask for the small amount of information needed to personalise your space.</p>
        <small><LockKeyhole size={14} /> This step does not collect health details. You decide what to add after your account is private and secure.</small>
      </div>
      <div className="first-data-form">
        <span className="first-data-step">01 · YOUR JOURNEY</span>
        <h2>Where are you in your journey?</h2>
        <div className="journey-choice-grid" role="group" aria-label="Journey options">
          {publicJourneyChoices.map((item) => <button type="button" key={item.stage} aria-pressed={item.stage === stage} className={item.stage === stage ? 'selected' : ''} onClick={() => setStage(item.stage)}><b>{item.title}</b><span>{item.copy}</span></button>)}
        </div>
        <label className="field"><span>What should MAMA call you? <em>Optional</em></span><input value={name} maxLength={60} autoComplete="given-name" onChange={(event) => setName(event.target.value)} placeholder="Your first name" /></label>
        <p className="first-data-note">No dates, symptoms or medical history are requested here. You can add only what you choose once you are signed in.</p>
        <div className="first-data-actions"><button type="button" className="button" onClick={continueToAccount}>Continue to create account <ArrowRight size={17} /></button><Link href="/sign-in">I already have an account</Link></div>
      </div>
    </section>
    <footer className={styles.footer}>MAMA is educational support and not an emergency service.</footer>
  </main>;
}
