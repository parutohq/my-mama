'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ArrowRight, BookOpen, Box, CalendarDays, Heart, House, MessageCircle, Pill, Sparkles } from 'lucide-react';
import type { CareItem, Checkin, Profile } from '@/lib/care-model';
import type { Medication, Investigation } from '@/lib/care-details-model';
import type { JourneyTask } from '@/lib/engagement-model';
import { pregnancyJourney, pregnancyWeek } from '@/lib/journey-engine';
import styles from './immersive-mama-home.module.css';
import { SpatialSanctuary } from './spatial-sanctuary';

type View = 'My care' | 'Learn' | 'My journal' | 'Journey' | 'Ask MAMA';
type Scene = 'world' | 'pregnancy' | 'care';
type Props = {
  profile: Profile;
  checkins: Checkin[];
  tasks: JourneyTask[];
  appointments: CareItem[];
  medications: Medication[];
  investigations: Investigation[];
  onNavigate: (view: View) => void;
};

const today = () => new Date().toISOString().slice(0, 10);
const destinations = [
  { id: 'home', label: 'My world', icon: House },
  { id: 'pregnancy', label: 'Pregnancy Journey', icon: Sparkles },
  { id: 'care', label: 'Care', icon: Heart },
  { id: 'clinic', label: 'Clinic', icon: CalendarDays },
  { id: 'wellness', label: 'Wellness', icon: Heart },
  { id: 'learning', label: 'Learning', icon: BookOpen },
  { id: 'mama', label: 'Ask MAMA', icon: MessageCircle },
] as const;
type Destination = (typeof destinations)[number]['id'];

export function ImmersiveMamaHome({ profile, checkins, tasks, appointments, medications, investigations, onNavigate }: Props) {
  const [scene, setScene] = useState<Scene>('world');
  const [spatial, setSpatial] = useState(false);
  const [failedArtwork, setFailedArtwork] = useState<string | null>(null);
  const [shift, setShift] = useState({ x: 0, y: 0 });
  const reducedMotion = useReducedMotion();
  const isPregnancy = profile.stage === 'pregnancy';
  const week = isPregnancy ? pregnancyWeek(profile) : null;
  const timelineMarker = week == null ? null : pregnancyJourney.milestones.filter((item) => item.week != null && item.week <= week).at(-1);
  const upcoming = useMemo(() => appointments.filter((item) => item.type === 'appointment' && !item.done && item.date >= today()).sort((a, b) => a.date.localeCompare(b.date))[0], [appointments]);
  const activeMedications = medications.filter((item) => item.active);
  const openTasks = tasks.filter((item) => item.status !== 'completed');
  const completedTasks = tasks.filter((item) => item.status === 'completed').length;
  const latestCheckin = checkins.slice().sort((a, b) => b.date.localeCompare(a.date))[0];
  const plannedInvestigations = investigations.filter((item) => item.status === 'planned');

  if (spatial) return <SpatialSanctuary pregnancy={isPregnancy} week={week} upcoming={upcoming ? `${upcoming.title} · ${upcoming.date}` : null} lastCheckin={latestCheckin?.date ?? null} onNavigate={onNavigate} onClose={() => setSpatial(false)} />;

  const navigate = (id: Destination) => {
    if (id === 'home') setScene('world');
    if (id === 'pregnancy') {
      if (isPregnancy) setScene('pregnancy');
      else onNavigate('Journey');
    }
    if (id === 'care') setScene('care');
    if (id === 'clinic') onNavigate('My care');
    if (id === 'wellness') onNavigate('My journal');
    if (id === 'learning') onNavigate('Learn');
    if (id === 'mama') onNavigate('Ask MAMA');
  };
  const artwork = scene === 'world' ? '/world/sanctuary.jpg' : scene === 'pregnancy' ? '/world/pregnancy.jpg' : '/world/care.jpg';
  const title = scene === 'world' ? 'A place to return to yourself.' : scene === 'pregnancy' ? 'Your pregnancy journey.' : 'Your care, close at hand.';
  const subtitle = scene === 'world' ? 'Choose a place. Everything here connects to your private care space.' : scene === 'pregnancy' ? 'The moments you record make this journey yours.' : 'Your plans and records, gathered in one calm place.';

  return <section className={styles.root} aria-label="My MAMA world">
    <div className={styles.stage} onPointerMove={(event) => {
      if (reducedMotion || event.pointerType === 'touch') return;
      const bounds = event.currentTarget.getBoundingClientRect();
      setShift({ x: (event.clientX - bounds.left) / bounds.width - .5, y: (event.clientY - bounds.top) / bounds.height - .5 });
    }} onPointerLeave={() => setShift({ x: 0, y: 0 })}>
      <AnimatePresence mode="wait">
        <motion.div key={scene} className={styles.art} initial={reducedMotion ? false : { opacity: 0, scale: 1.035 }} animate={{ opacity: 1, scale: 1 }} exit={reducedMotion ? undefined : { opacity: 0 }} transition={{ duration: reducedMotion ? 0 : .42 }}>
          {failedArtwork !== artwork && <Image src={artwork} alt="" fill priority={scene === 'world'} sizes="(max-width: 768px) 100vw, 85vw" className={styles.image} style={{ transform: reducedMotion ? undefined : `scale(1.04) translate(${shift.x * -7}px, ${shift.y * -7}px)` }} onError={() => setFailedArtwork(artwork)} />}
          <div className={styles.tint} />
        </motion.div>
      </AnimatePresence>
      <div className={styles.topline}><span className={styles.brand}>MAMA<span>·</span> WORLD</span><span className={styles.chapter}>{scene === 'world' ? '01 / Sanctuary' : scene === 'pregnancy' ? '02 / Journey' : '03 / Care'}</span></div>
      {scene === 'world' && <button type="button" className={styles.explore3d} onClick={() => setSpatial(true)}><Box size={18} /> Explore in 3D <ArrowRight size={16} /></button>}
      {scene !== 'world' && <button className={styles.back} type="button" onClick={() => setScene('world')}><ArrowLeft size={17} /> Back to world</button>}
      <div className={styles.intro}>
        <span className={styles.eyebrow}>{scene === 'world' ? 'WELCOME HOME' : scene === 'pregnancy' ? 'PREGNANCY JOURNEY' : 'PERSONAL CARE'}</span>
        <h2>{title}</h2><p>{subtitle}</p>
      </div>
      {scene === 'world' && <div className={styles.hotspots} aria-label="Places in My MAMA world">
        <button type="button" className={`${styles.hotspot} ${styles.journeySpot}`} onClick={() => navigate('pregnancy')}><span className={styles.dot} /><span>{isPregnancy ? 'Pregnancy Journey' : 'My Journey'}</span><ArrowRight size={15} /></button>
        <button type="button" className={`${styles.hotspot} ${styles.careSpot}`} onClick={() => navigate('care')}><span className={styles.dot} /><span>Care</span><ArrowRight size={15} /></button>
        <button type="button" className={`${styles.hotspot} ${styles.clinicSpot}`} onClick={() => navigate('clinic')}><span className={styles.dot} /><span>Clinic</span><ArrowRight size={15} /></button>
      </div>}
      {scene === 'pregnancy' && <div className={styles.sceneCard}>
        <span className={styles.cardLabel}>YOUR RECORDED JOURNEY</span>
        <strong>{week == null ? 'Start with your dates' : `Week ${week}`}</strong>
        <p>{week == null ? 'Add a pregnancy date in your profile to see your recorded week here.' : 'Based on the date saved in your profile.'}</p>
        {timelineMarker && <small>Timeline marker · {timelineMarker.title}</small>}
        {completedTasks > 0 && <small>{completedTasks} {completedTasks === 1 ? 'step' : 'steps'} completed</small>}
        <button type="button" onClick={() => onNavigate('Journey')}>Open journey <ArrowRight size={16} /></button>
      </div>}
      {scene === 'care' && <div className={styles.sceneCard}>
        <span className={styles.cardLabel}>YOUR CARE SPACE</span>
        <strong>{upcoming ? upcoming.title : 'A place for your plans'}</strong>
        <p>{upcoming ? `Next appointment · ${new Date(`${upcoming.date}T12:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'long' })}` : 'No upcoming appointment recorded.'}</p>
        <small>{activeMedications.length ? `${activeMedications.length} active medicines or supplements recorded` : 'No medicines or supplements recorded'}</small>
        <button type="button" onClick={() => onNavigate('My care')}>Open my care <ArrowRight size={16} /></button>
      </div>}
      <div className={styles.bottomFade} aria-hidden="true" />
    </div>
    <div className={styles.below}>
      <div><span className={styles.sectionEyebrow}>EXPLORE YOUR WORLD</span><h3>{scene === 'world' ? 'Where would you like to go?' : 'Move through your space'}</h3></div>
      <nav className={styles.destinationNav} aria-label="World destinations">{destinations.map(({ id, label, icon: Icon }) => <button key={id} type="button" className={(scene === 'world' && id === 'home') || scene === id ? styles.selected : ''} onClick={() => navigate(id)} aria-current={(scene === 'world' && id === 'home') || scene === id ? 'page' : undefined}><Icon size={18} /><span>{id === 'pregnancy' && !isPregnancy ? 'My Journey' : label}</span><ArrowRight size={14} /></button>)}</nav>
      <div className={styles.recordGrid} aria-label="Your recorded information">
        {isPregnancy && <article><span><Sparkles size={16} /> JOURNEY</span><strong>{week == null ? 'Your dates, your pace' : `Week ${week} recorded`}</strong><p>{openTasks.length ? `${openTasks.length} chosen ${openTasks.length === 1 ? 'step' : 'steps'} to revisit.` : 'No open journey steps recorded.'}</p><button onClick={() => navigate('pregnancy')}>Visit journey <ArrowRight size={15} /></button></article>}
        <article><span><CalendarDays size={16} /> CARE</span><strong>{upcoming ? upcoming.title : 'Make space for care'}</strong><p>{upcoming ? `Appointment on ${new Date(`${upcoming.date}T12:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'long' })}.` : 'No upcoming appointment recorded.'}</p><button onClick={() => navigate('care')}>Visit care <ArrowRight size={15} /></button></article>
        <article><span><Pill size={16} /> YOUR RECORDS</span><strong>{activeMedications.length || plannedInvestigations.length ? 'What you chose to track' : 'Your private organiser'}</strong><p>{activeMedications.length || plannedInvestigations.length ? `${activeMedications.length} active medicine or supplement ${activeMedications.length === 1 ? 'entry' : 'entries'} · ${plannedInvestigations.length} planned investigation ${plannedInvestigations.length === 1 ? 'entry' : 'entries'}.` : 'No medicines or investigations recorded yet.'}</p><button onClick={() => onNavigate('My care')}>Open records <ArrowRight size={15} /></button></article>
        <article><span><Heart size={16} /> JOURNAL</span><strong>{latestCheckin ? 'Your latest check-in' : 'A moment to check in'}</strong><p>{latestCheckin ? `Recorded ${new Date(`${latestCheckin.date}T12:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'long' })}.` : 'No check-ins recorded yet.'}</p><button onClick={() => onNavigate('My journal')}>Open journal <ArrowRight size={15} /></button></article>
      </div>
      <p className={styles.note}>Your records are private. This space does not replace a clinician or provide emergency care.</p>
    </div>
  </section>;
}
