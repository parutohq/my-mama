'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, BookOpen, CalendarDays, Check, CircleHelp, Heart, MessageCircle, Pill, Route, Sparkles } from 'lucide-react';
import type { CareItem, Checkin, Profile } from '@/lib/care-model';
import type { JourneyTask } from '@/lib/engagement-model';
import { pregnancyExperienceState } from '@/lib/pregnancy-experience-state';
import { PregnancySharing } from './pregnancy-sharing';
import styles from './pregnancy-journey-home.module.css';

type Props = {
  profile: Profile;
  checkins: Checkin[];
  tasks: JourneyTask[];
  appointments: CareItem[];
  onCare: () => void;
  onJournal: () => void;
  onLearn: () => void;
  onMama: () => void;
};

export function PregnancyJourneyHome({ profile, checkins, tasks, appointments, onCare, onJournal, onLearn, onMama }: Props) {
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const reducedMotion = useReducedMotion();
  const experience = useMemo(() => pregnancyExperienceState(profile, checkins, tasks, appointments), [profile, checkins, tasks, appointments]);
  const chosenWeek = selectedWeek ?? experience.week;
  const chosenMilestone = experience.sections.flatMap((section) => section.weeks).find((item) => item.number === chosenWeek)?.milestones[0];
  const goalActions = { wellbeing: onJournal, medication: onCare, learning: onLearn, questions: onMama };

  return <div className={styles.root}>
    <section className={styles.scene} aria-labelledby="pregnancy-world-title" onPointerMove={(event) => {
      if (reducedMotion || event.pointerType === 'touch') return;
      const bounds = event.currentTarget.getBoundingClientRect();
      event.currentTarget.style.setProperty('--scene-x', `${((event.clientX - bounds.left) / bounds.width - .5) * -12}px`);
      event.currentTarget.style.setProperty('--scene-y', `${((event.clientY - bounds.top) / bounds.height - .5) * -8}px`);
    }} onPointerLeave={(event) => { event.currentTarget.style.setProperty('--scene-x', '0px'); event.currentTarget.style.setProperty('--scene-y', '0px'); }}>
      <Image src="/world/pregnancy.jpg" alt="" fill priority sizes="(max-width: 767px) 100vw, 80vw" className={styles.art} />
      <div className={styles.tint} />
      <div className={styles.chapter}><span>MAMA <b>·</b> PREGNANCY WORLD</span><span>YOUR JOURNEY</span></div>
      <motion.div className={styles.intro} initial={reducedMotion ? false : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .55 }}>
        <span className={styles.eyebrow}><Sparkles size={15} /> A SPACE FOR THIS CHAPTER</span>
        <h1 id="pregnancy-world-title">{experience.week == null ? 'Your journey begins with you.' : `Week ${experience.week}, held with care.`}</h1>
        <p>{experience.week == null ? 'Add a pregnancy date in your profile when you are ready. Your space is here either way.' : `${experience.trimester?.label ?? 'Your pregnancy journey'} · ${experience.measures.journeyProgress}% of a 40-week reference timeline.`}</p>
        {experience.currentMilestone && <div className={styles.marker}><span>YOUR LATEST JOURNEY MARKER</span><strong>{experience.currentMilestone.title}</strong></div>}
      </motion.div>
      <div className={styles.orb} style={{ '--journey-angle': `${experience.measures.journeyProgress * 3.6}deg` } as React.CSSProperties} aria-hidden="true">
        <div className={styles.orbInner}><span>YOUR WEEK</span><strong>{experience.week ?? '—'}</strong><small>{experience.week == null ? 'When you’re ready' : experience.trimester?.label ?? 'Your journey'}</small></div>
      </div>
      <nav className={styles.objects} aria-label="Explore your pregnancy space">
        <button type="button" onClick={() => document.getElementById('pregnancy-journey-map')?.scrollIntoView({ behavior: reducedMotion ? 'instant' : 'smooth' })}><Route size={19} /><span>Journey path</span></button>
        <button type="button" onClick={onCare}><CalendarDays size={19} /><span>Appointments</span></button>
        <button type="button" onClick={onJournal}><Heart size={19} /><span>Check in</span></button>
        <button type="button" onClick={onLearn}><BookOpen size={19} /><span>Learn</span></button>
        <button type="button" onClick={onMama}><MessageCircle size={19} /><span>Ask MAMA</span></button>
      </nav>
    </section>

    <section className={styles.nextMoment} aria-label="Your next helpful step"><div className={styles.nextIcon}><CalendarDays size={22} /></div><div><span>YOUR NEXT CONVERSATION</span><h2>{experience.nextAppointment ? experience.nextAppointment.title : 'Keep a question close.'}</h2><p>{experience.nextAppointment ? `Recorded for ${new Date(`${experience.nextAppointment.date}T12:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}.` : 'No upcoming appointment recorded. Add one whenever it is useful.'}</p></div><button type="button" onClick={onCare}>Open my care <ArrowRight size={17} /></button></section>

    <section id="pregnancy-journey-map" className={styles.map} aria-labelledby="pregnancy-map-title"><div className={styles.sectionHeading}><div><span>THE PATH YOU CAN SEE</span><h2 id="pregnancy-map-title">Forty weeks, one step at a time.</h2></div><p>Weeks are a reference from the date you saved. Past moments stay visible; what comes next is yours to explore.</p></div>
      <div className={styles.mapGroups}>{experience.sections.map((section) => <div className={styles.mapGroup} key={section.id}><div className={styles.groupTitle}><span>{section.label}</span><h3>{section.title}</h3><small>Weeks {section.start}–{section.end}</small></div><div className={styles.weekRail}>{section.weeks.map((item) => <button type="button" key={item.number} className={`${styles.week} ${styles[item.state]} ${chosenWeek === item.number ? styles.selected : ''}`} aria-label={`Week ${item.number}${item.number === experience.week ? ', your current week' : ''}${item.milestones.length ? `, ${item.milestones.map((milestone) => milestone.title).join(', ')}` : ''}`} aria-pressed={chosenWeek === item.number} onClick={() => setSelectedWeek(item.number)}><span>{item.number}</span>{item.milestones.length > 0 && <i aria-hidden="true" />}</button>)}</div></div>)}</div>
      <div className={styles.weekDetail}><div><span>{chosenWeek == null ? 'YOUR JOURNEY MAP' : `WEEK ${chosenWeek}`}</span><h3>{chosenMilestone?.title ?? (chosenWeek == null ? 'Add your date to find your place.' : 'A week on your path.')}</h3><p>{chosenMilestone?.description ?? (chosenWeek == null ? 'You can still explore the whole path.' : 'Keep any questions or memories that feel useful this week.')}</p></div><button type="button" onClick={onCare}>Prepare with My care <ArrowRight size={17} /></button></div>
      <p className={styles.mapNote}>The map describes an estimated timeline from your saved date. It does not predict outcomes or assess your baby’s health.</p>
    </section>

    <section className={styles.rituals} aria-labelledby="daily-care-title"><div className={styles.sectionHeading}><div><span>TODAY, AT YOUR PACE</span><h2 id="daily-care-title">Small acts of care.</h2></div><p>These are gentle entry points from your existing care goals. Nothing here measures your health.</p></div><div className={styles.ritualList}>{experience.goals.map((goal) => <button className={styles.ritual} type="button" key={goal.id} onClick={goalActions[goal.id as keyof typeof goalActions] ?? onCare}><span className={`${styles.ritualIcon} ${goal.status === 'completed' ? styles.done : ''}`}>{goal.status === 'completed' ? <Check size={22} /> : goal.id === 'medication' ? <Pill size={22} /> : goal.id === 'learning' ? <BookOpen size={22} /> : goal.id === 'questions' ? <MessageCircle size={22} /> : <Heart size={22} />}</span><span className={styles.ritualCopy}><strong>{goal.title}</strong><small>{goal.description}</small></span><span className={styles.ritualState}>{goal.status === 'completed' ? 'Recorded' : 'Explore'} <ArrowRight size={15} /></span></button>)}</div></section>

    <section className={styles.growth} aria-labelledby="growth-title"><div className={styles.sectionHeading}><div><span>WHAT YOU HAVE CHOSEN TO RECORD</span><h2 id="growth-title">Your preparation, in view.</h2></div><p>These informational measures reflect entries and chosen actions. They are never medical scores.</p></div><div className={styles.rings}><Measure label="Care consistency" value={experience.measures.careConsistency} /><Measure label="Health knowledge" value={experience.measures.healthKnowledge} /><Measure label="Preparedness" value={experience.measures.preparedness} /></div></section>

    <section className={styles.guide}><div className={styles.guideSymbol}><CircleHelp size={27} /></div><div><span>MAMA IS HERE</span><h2>A kinder way to prepare a question.</h2><p>Bring what is on your mind to your next care conversation. MAMA helps you organise it; it does not diagnose.</p></div><button type="button" onClick={onMama}>Ask MAMA <ArrowRight size={17} /></button></section>
    <PregnancySharing enabled={experience.week != null} />
    <p className={styles.clinicalNote}>For urgent symptoms, use “When to get help” above. Your journey map is a personal organiser, not a medical assessment.</p>
  </div>;
}

function Measure({ label, value }: { label: string; value: number }) {
  return <div className={styles.measure}><div className={styles.measureRing} style={{ '--measure-angle': `${value * 3.6}deg` } as React.CSSProperties} aria-hidden="true"><div><strong>{value}%</strong></div></div><span>{label}: {value}% of recorded actions</span></div>;
}
