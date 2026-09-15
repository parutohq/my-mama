'use client';

import { useState } from 'react';
import { ArrowLeft, Heart } from 'lucide-react';
import { HomeVisualPrototype, type HomeDesignState } from '@/components/mama/home-visual-prototype';
import styles from './design-preview.module.css';

export default function DesignPreviewPage() {
  const [state, setState] = useState<HomeDesignState>('cycle');
  const signIn = () => { window.location.assign('/sign-in'); };

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <a href="/sign-in" className={styles.brand}><Heart size={19} fill="currentColor" /> mama.</a>
        <div className={styles.headerActions}>
          <span>Public design preview</span>
          <a href="/sign-in" className={styles.signIn}><ArrowLeft size={15} /> Sign in</a>
        </div>
      </header>
      <div className={styles.notice} role="note">
        <strong>Explore the new MAMA Home design.</strong> This page contains illustrative content only. No account, health record or clinical data is being shown.
      </div>
      <HomeVisualPrototype
        state={state}
        displayName=""
        metric={null}
        cycleDay={null}
        hasCheckin={false}
        appointment={null}
        preview
        publicDemo
        showDevelopmentSwitcher
        onDevelopmentStateChange={setState}
        onLogCheckin={signIn}
        onLogPeriod={signIn}
        onUpdateJourney={signIn}
        onOpenCare={signIn}
        onOpenJournal={signIn}
        onOpenLearn={signIn}
      />
    </main>
  );
}
