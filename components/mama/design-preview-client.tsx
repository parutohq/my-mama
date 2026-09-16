'use client';

import Link from 'next/link';
import { useState } from 'react';
import { AlertTriangle, ArrowLeft, Heart, LoaderCircle, ShieldCheck } from 'lucide-react';
import { HomeVisualPrototype, type HomeDesignState } from '@/components/mama/home-visual-prototype';
import styles from '@/app/design-preview/design-preview.module.css';

export function DesignPreviewClient() {
  const [state, setState] = useState<HomeDesignState>('cycle');
  const [labPanel, setLabPanel] = useState<'home' | 'states'>('home');
  const [focus, setFocus] = useState(false);
  const signIn = () => { window.location.assign('/sign-in'); };

  return (
    <main id="main-content" className={`${styles.page} ${focus ? styles.focus : ''}`} tabIndex={-1}>
      <header className={styles.header}>
        <Link href="/sign-in" className={styles.brand}><Heart size={19} fill="currentColor" /> mama.</Link>
        <div className={styles.headerActions}>
          <nav aria-label="Public previews"><Link href="/">Landing</Link><Link href="/sign-in?mode=sign-up">Register</Link><Link href="/sign-in?mode=recovery">Reset</Link></nav><Link href="/sign-in" className={styles.signIn}><ArrowLeft size={15} /> Sign in</Link>
        </div>
      </header>
      {!focus && <div className={styles.notice} role="note">
        <strong>Explore the MAMA Design Lab.</strong> This page contains illustrative content only. No account, health record or clinical data is being shown.
      </div>}
      {!focus && <div className={styles.labTabs} role="tablist" aria-label="Design Lab panels">
        <button type="button" role="tab" aria-selected={labPanel === 'home'} onClick={() => setLabPanel('home')}>Home states</button>
        <button type="button" role="tab" aria-selected={labPanel === 'states'} onClick={() => setLabPanel('states')}>System states</button>
      </div>}
      {!focus && <button type="button" className={styles.focusToggle} onClick={() => setFocus(true)}>Open Focus Preview</button>}
      {focus && <button type="button" className={styles.focusExit} onClick={() => setFocus(false)}>Exit Focus Preview</button>}
      {labPanel === 'home' ? <HomeVisualPrototype
        state={state}
        displayName=""
        metric={null}
        cycleDay={null}
        hasCheckin={false}
        appointment={null}
        preview
        publicDemo
        showDevelopmentSwitcher={!focus}
        onDevelopmentStateChange={setState}
        onLogCheckin={signIn}
        onLogPeriod={signIn}
        onUpdateJourney={signIn}
        onOpenCare={signIn}
        onOpenJournal={signIn}
        onOpenLearn={signIn}
      /> : <section className={styles.stateLab} aria-label="Illustrative interface states">
        <header><span>COMPONENT STATES</span><h1>Designed for the moments around care.</h1><p>These preview-only examples test empty, loading, long-content and safety treatment without using health data.</p></header>
        <div className={styles.stateGrid}>
          <article><span className={styles.stateLabel}>EMPTY</span><h2>Your story starts with one record.</h2><p>When you are ready, a small note can help you notice your own pattern over time.</p><button type="button" onClick={signIn}>Create a private space</button></article>
          <article aria-busy="true"><span className={styles.stateLabel}>LOADING</span><div className={styles.skeletonTitle} /><div className={styles.skeletonLine} /><div className={styles.skeletonLine} /><div className={styles.skeletonChart}><LoaderCircle size={18} /></div></article>
          <article><span className={styles.stateLabel}>LONG CONTENT</span><h2>A longer appointment title still has room to breathe.</h2><p>Discuss questions about changing energy, rest and any observations that feel important at your next care conversation.</p><span className={styles.meta}>Tomorrow · Your private care plan</span></article>
          <article className={styles.safety}><span className={styles.stateLabel}><AlertTriangle size={14} /> SAFETY</span><h2>When to get help</h2><p>Urgent guidance uses clear labels and actions. It does not rely on colour alone.</p><button type="button" onClick={signIn}><ShieldCheck size={15} /> View care guidance</button></article>
        </div>
      </section>}
    </main>
  );
}
