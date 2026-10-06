'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Heart, Route, RotateCcw } from 'lucide-react';
import { useReducedMotion } from 'framer-motion';
import type { WorldPlace } from './mama-world-canvas';
import styles from './spatial-sanctuary.module.css';

const WorldCanvas = dynamic(() => import('./mama-world-canvas').then((module) => module.MamaWorldCanvas), { ssr: false, loading: () => <output className={styles.loading}>Preparing your sanctuary…</output> });
const places = [
  { id: 'journey', label: 'Journey', Icon: Route, view: 'Journey' },
  { id: 'care', label: 'Care', Icon: Heart, view: 'My care' },
  { id: 'journal', label: 'Journal', Icon: BookOpen, view: 'My journal' },
] as const;
type Props = { pregnancy: boolean; week: number | null; upcoming: string | null; lastCheckin: string | null; onNavigate: (view: 'Journey' | 'My care' | 'My journal') => void; onClose: () => void };

export function SpatialSanctuary({ pregnancy, week, upcoming, lastCheckin, onNavigate, onClose }: Props) {
  const [place, setPlace] = useState<WorldPlace>('sanctuary');
  const [available, setAvailable] = useState<boolean | null>(null);
  const reducedMotion = useReducedMotion();
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      try {
        const canvas = document.createElement('canvas');
        setAvailable(Boolean(canvas.getContext('webgl2')));
      } catch { setAvailable(false); }
    });
    return () => cancelAnimationFrame(frame);
  }, []);
  const selected = places.find((item) => item.id === place);
  const details = place === 'journey' ? (pregnancy && week != null ? `Week ${week}, based on your saved date.` : 'Your journey, shaped by what you choose to record.') : place === 'care' ? (upcoming ? `Your next appointment: ${upcoming}.` : 'No upcoming appointment recorded.') : place === 'journal' ? (lastCheckin ? `Last check-in: ${lastCheckin}.` : 'No check-in recorded yet.') : '';

  return <section className={styles.root} aria-label="Explore MAMA World in 3D">
    <div className={styles.viewport}>
      {available === false ? <div className={styles.unavailable}><h2>Your sanctuary is here</h2><p>This device cannot display the 3D view. You can continue in the illustrated world.</p><button onClick={onClose}>Open illustrated world</button></div> : available === null ? <output className={styles.loading}>Preparing your sanctuary…</output> : <WorldCanvas place={place} onSelect={setPlace} reducedMotion={Boolean(reducedMotion)} />}
      <div className={styles.topline}><span>MAMA <b>·</b> WORLD</span><span>EXPLORE IN 3D</span></div>
      <button className={styles.back} type="button" onClick={onClose}><ArrowLeft size={17} /> Illustrated view</button>
      <div className={styles.story}><span>YOUR PRIVATE SANCTUARY</span><h2>{selected ? selected.label : 'Find your place.'}</h2><p>{selected ? details : 'Drag to look around. Tap a room to move closer.'}</p></div>
      {place !== 'sanctuary' && <button className={styles.reset} type="button" onClick={() => setPlace('sanctuary')}><RotateCcw size={16} /> World view</button>}
      {selected && <div className={styles.enter}><span>{selected.label.toUpperCase()}</span><p>{details}</p><button type="button" onClick={() => onNavigate(selected.view)}>Enter {selected.label.toLowerCase()} <ArrowRight size={18} /></button></div>}
      <nav className={styles.dock} aria-label="3D sanctuary destinations"><button type="button" className={place === 'sanctuary' ? styles.active : ''} onClick={() => setPlace('sanctuary')} aria-current={place === 'sanctuary' ? 'page' : undefined}>World</button>{places.map(({ id, label, Icon }) => <button key={id} type="button" className={place === id ? styles.active : ''} onClick={() => setPlace(id)} aria-current={place === id ? 'page' : undefined}><Icon size={17} /> {label}</button>)}</nav>
    </div>
    <p className={styles.note}>The places are visual navigation. Your saved information stays in your private care space.</p>
  </section>;
}
