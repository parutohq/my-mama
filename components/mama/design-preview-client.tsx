'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AlertTriangle, ArrowLeft, Heart, LoaderCircle, ShieldCheck } from 'lucide-react';
import { HomeVisualPrototype, type HomeDesignState } from '@/components/mama/home-visual-prototype';
import styles from '@/app/design-preview/design-preview.module.css';

export function DesignPreviewClient() {
  const [state, setState] = useState<HomeDesignState>('cycle');
  const [labPanel, setLabPanel] = useState<'home' | 'states'>('home');
  const [focus, setFocus] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('light');
  const [dataState, setDataState] = useState<'no-data' | 'first-data' | 'partial' | 'established'>('established');
  const [consultState, setConsultState] = useState<'no-availability' | 'availability'>('no-availability');
  useEffect(() => { const resolved = theme === 'system' ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : theme; document.documentElement.dataset.theme = resolved; return () => { document.documentElement.dataset.theme = 'light'; }; }, [theme]);
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
      {!focus && <section className={styles.labControls} aria-label="Design Lab controls"><label>Theme<select value={theme} onChange={(event) => setTheme(event.target.value as typeof theme)}><option value="light">Light</option><option value="dark">Dark</option><option value="system">System</option></select></label><label>Data state<select value={dataState} onChange={(event) => setDataState(event.target.value as typeof dataState)}><option value="no-data">No data</option><option value="first-data">First data required</option><option value="partial">Partial history</option><option value="established">Established history</option></select></label><label>Consultation<select value={consultState} onChange={(event) => setConsultState(event.target.value as typeof consultState)}><option value="no-availability">Dr Peace · no availability</option><option value="availability">Dr Peace · fixture availability</option></select></label></section>}
      {!focus && <button type="button" className={styles.focusToggle} onClick={() => setFocus(true)}>Open Focus Preview</button>}
      {focus && <button type="button" className={styles.focusExit} onClick={() => setFocus(false)}>Exit Focus Preview</button>}
      {labPanel === 'home' ? <>{dataState !== 'established' && <section className={styles.labStateBanner}><b>{dataState === 'no-data' ? 'New user / no journey' : dataState === 'first-data' ? 'Journey selected / first data needed' : 'Partial history'}</b><span>{dataState === 'no-data' ? 'Choose a journey before MAMA personalises this space.' : dataState === 'first-data' ? 'Add a first record to replace illustrative content.' : 'Keep tracking and MAMA will show more of your recorded patterns here.'}</span></section>}<HomeVisualPrototype
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
      /><section className={styles.consultFixture}><span>CONSULT DR PEACE</span><h2>{consultState === 'availability' ? 'Development fixture availability' : 'New consultation times will appear here when available.'}</h2><p>{consultState === 'availability' ? 'Fixture only: a 30-minute and a 60-minute consultation are shown solely for Design Lab review.' : 'No appointment times are being invented in this preview.'}</p></section></> : <section className={styles.stateLab} aria-label="Illustrative interface states">
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
