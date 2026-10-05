'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ArrowRight, BookOpen, ClipboardList, Heart, MessageCircle, Route, Settings2, Sparkles } from 'lucide-react';
import type { MamaView } from '@/components/mama/navigation';
import type { Profile } from '@/lib/care-model';
import styles from './world-destination-header.module.css';

type Destination = Exclude<MamaView, 'Today'>;
type Props = { view: Destination; profile: Profile; onNavigate: (view: MamaView) => void; primaryAction?: { label: string; onClick: () => void } };
const rooms = [
  { view: 'Journey', label: 'Journey', Icon: Route },
  { view: 'My journal', label: 'Journal', Icon: BookOpen },
  { view: 'My care', label: 'Care', Icon: Heart },
  { view: 'Learn', label: 'Learning', Icon: Sparkles },
  { view: 'Care summary', label: 'Summary', Icon: ClipboardList },
  { view: 'Ask MAMA', label: 'Ask MAMA', Icon: MessageCircle },
  { view: 'Settings', label: 'My space', Icon: Settings2 },
] as const;
const descriptions: Record<Destination, { eyebrow: string; title: string; body: string; chapter: string }> = {
  Journey: { eyebrow: 'THE JOURNEY ROOM', title: 'Your path, at your pace.', body: 'Return to the steps and moments you chose to keep.', chapter: '02' },
  'My journal': { eyebrow: 'THE JOURNAL DESK', title: 'Make room for your story.', body: 'A private place for the details you want to remember.', chapter: '03' },
  'My care': { eyebrow: 'THE CARE ROOM', title: 'Care, close at hand.', body: 'Your appointments, plans and personal records live here.', chapter: '04' },
  Learn: { eyebrow: 'THE LEARNING STUDIO', title: 'Find space to understand.', body: 'Explore information and keep your own questions close.', chapter: '05' },
  'Care summary': { eyebrow: 'YOUR CARE FOLDER', title: 'The details, together.', body: 'Bring the records you chose to save into one view.', chapter: '06' },
  'Ask MAMA': { eyebrow: 'THE CONVERSATION GARDEN', title: 'What is on your mind?', body: 'Shape a question for your next care conversation.', chapter: '07' },
  Settings: { eyebrow: 'YOUR PRIVATE SPACE', title: 'A space that stays yours.', body: 'Choose how MAMA works for you and your records.', chapter: '08' },
};
const artwork: Record<Destination, string> = {
  Journey: '/world/sanctuary.jpg',
  'My journal': '/world/journal.jpg',
  'My care': '/world/care.jpg',
  Learn: '/world/learning.jpg',
  'Care summary': '/world/care.jpg',
  'Ask MAMA': '/world/ask-mama.jpg',
  Settings: '/world/sanctuary.jpg',
};

export function WorldDestinationHeader({ view, profile, onNavigate, primaryAction }: Props) {
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const reducedMotion = useReducedMotion();
  const image = view === 'Journey' && profile.stage === 'pregnancy' ? '/world/pregnancy.jpg' : artwork[view];
  const copy = descriptions[view];
  return <section className={styles.room} aria-label={`${view} in MAMA World`} onTouchStart={(event) => {
    if ((event.target as HTMLElement).closest('button, a, input, textarea, select')) return;
    touchStart.current = { x: event.touches[0].clientX, y: event.touches[0].clientY };
  }} onTouchEnd={(event) => {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start) return;
    const dx = event.changedTouches[0].clientX - start.x;
    const dy = event.changedTouches[0].clientY - start.y;
    if (Math.abs(dx) < 85 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    const index = rooms.findIndex((room) => room.view === view);
    const next = rooms[index + (dx < 0 ? 1 : -1)];
    onNavigate(next?.view ?? 'Today');
  }} onPointerMove={(event) => {
    if (reducedMotion || event.pointerType === 'touch') return;
    const bounds = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty('--look-x', `${((event.clientX - bounds.left) / bounds.width - .5) * -18}px`);
    event.currentTarget.style.setProperty('--look-y', `${((event.clientY - bounds.top) / bounds.height - .5) * -12}px`);
  }} onPointerLeave={(event) => {
    event.currentTarget.style.setProperty('--look-x', '0px');
    event.currentTarget.style.setProperty('--look-y', '0px');
  }}>
    <motion.div className={styles.art} initial={reducedMotion ? false : { opacity: .4, scale: 1.14, x: 32 }} animate={{ opacity: 1, scale: 1, x: 0 }} transition={{ duration: reducedMotion ? 0 : .65, ease: [0.2, 0.7, 0.1, 1] }}>
      {failedImage !== image && <Image src={image} alt="" fill sizes="(max-width: 767px) 100vw, 80vw" className={styles.image} onError={() => setFailedImage(image)} />}
      <div className={styles.scrim} />
    </motion.div>
    <div className={styles.depth} aria-hidden="true" />
    <div className={styles.topline}><span>MAMA <b>·</b> WORLD</span><span>{copy.chapter} / 08</span></div>
    <button className={styles.back} type="button" onClick={() => onNavigate('Today')}><ArrowLeft size={17} /> Return to world</button>
    <div className={styles.copy}><span className={styles.eyebrow}>{copy.eyebrow}</span><h1 data-world-room-title tabIndex={-1}>{copy.title}</h1><p>{copy.body}</p>{primaryAction && <button type="button" className={styles.action} onClick={primaryAction.onClick}>{primaryAction.label} <ArrowRight size={17} /></button>}</div>
    <nav className={styles.wayfinding} aria-label="Move between MAMA World places">{rooms.map(({ view: destination, label, Icon }) => <button key={destination} type="button" aria-current={view === destination ? 'page' : undefined} className={view === destination ? styles.current : ''} onClick={() => onNavigate(destination)}><Icon size={16} /><span>{label}</span></button>)}</nav>
  </section>;
}
