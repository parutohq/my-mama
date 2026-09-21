'use client';

import {
  ArrowUpRight,
  Baby,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Heart,
  Moon,
  Plus,
  Sparkles,
  Waves,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export type HomeDesignState = 'cycle' | 'pregnancy' | 'postpartum';

type Metric = { value: string; label: string; detail: string } | null;
type Appointment = { title: string; date: string; time: string; location: string } | null;

type HomeVisualPrototypeProps = {
  state: HomeDesignState;
  displayName: string;
  metric: Metric;
  cycleDay: number | null;
  hasCheckin: boolean;
  appointment: Appointment;
  preview: boolean;
  publicDemo?: boolean;
  showDevelopmentSwitcher: boolean;
  onDevelopmentStateChange: (state: HomeDesignState) => void;
  onLogCheckin: () => void;
  onLogPeriod: () => void;
  onUpdateJourney: () => void;
  onOpenCare: () => void;
  onOpenJournal: () => void;
  onOpenLearn: () => void;
};

type StateContent = {
  label: string;
  icon: typeof CircleDot;
  eyebrow: string;
  title: string;
  introduction: string;
  primary: string;
  previewMetric: Metric;
  focusLabel: string;
  focusTitle: string;
  focusBody: string;
  insightTitle: string;
  insightBody: string;
  footnote: string;
  points: readonly number[];
  pointLabels: readonly string[];
  nextTitle: string;
  nextBody: string;
};

const content: Record<HomeDesignState, StateContent> = {
  cycle: {
    label: 'Cycle tracking', icon: CircleDot, eyebrow: 'Your personal rhythm',
    title: 'Notice what your body is telling you.',
    introduction: 'A private space for the patterns, questions and moments you choose to keep.',
    primary: 'Log a period',
    previewMetric: { value: 'Day 14', label: 'of your cycle', detail: 'Illustrative timing only — not a fertility prediction.' },
    focusLabel: 'Today’s focus', focusTitle: 'Make room for a small check-in.',
    focusBody: 'A few words about your mood, energy or symptoms can make your history more useful to you.',
    insightTitle: 'Your recorded rhythm', insightBody: 'A view built from dates you choose to log.',
    footnote: 'Recorded dates only. MAMA does not predict fertility.',
    points: [30, 48, 37, 67, 54, 72, 58], pointLabels: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
    nextTitle: 'Keep a question close', nextBody: 'Save anything you want to remember for your next care conversation.',
  },
  pregnancy: {
    label: 'Pregnancy', icon: Baby, eyebrow: 'Your pregnancy, held with care',
    title: 'Prepare in ways that feel right for you.',
    introduction: 'Your chosen dates, care plans and questions stay together in one quiet place.',
    primary: 'Update my journey',
    previewMetric: { value: 'Week 24', label: 'of pregnancy', detail: 'Illustrative timing — confirm clinical dates with your care team.' },
    focusLabel: 'Your body, today', focusTitle: 'How are you feeling right now?',
    focusBody: 'Keep a private note for yourself, or a question to bring to your next appointment.',
    insightTitle: 'Your pregnancy path', insightBody: 'A gentle progression based on dates you choose to enter.',
    footnote: 'Timing may be estimated. Your care team confirms clinical dates.',
    points: [14, 24, 38, 53, 64, 76, 86], pointLabels: ['8', '12', '16', '20', '24', '28', '32'],
    nextTitle: 'Your care, within reach', nextBody: 'Appointments, preparation and questions are ready when you are.',
  },
  postpartum: {
    label: 'Postpartum', icon: Waves, eyebrow: 'Care for you, too',
    title: 'There is no right pace for this chapter.',
    introduction: 'A personal place for rest, recovery, support and the things that matter to you today.',
    primary: 'Update my journey',
    previewMetric: { value: '6 weeks', label: 'since birth', detail: 'Illustrative timing only — not a recovery score or assessment.' },
    focusLabel: 'A moment for you', focusTitle: 'How are YOU doing today?',
    focusBody: 'Capture a thought, choose a small support step, or simply make space for what is true today.',
    insightTitle: 'Your own timeline', insightBody: 'A gentle record of the support and moments you choose to notice.',
    footnote: 'This is not a medical assessment. Contact your care team with clinical concerns.',
    points: [48, 42, 60, 39, 55, 64, 52], pointLabels: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
    nextTitle: 'Support can stay close', nextBody: 'Keep a trusted contact or care question nearby for when you need it.',
  },
};

function InsightVisual({ state, points, labels }: { state: HomeDesignState; points: readonly number[]; labels: readonly string[] }) {
  if (state === 'pregnancy') {
    return <div className="home-premium-arc" aria-label="Illustrative pregnancy progression"><div className="home-premium-arc-line" />{points.map((_, index) => <i key={labels[index]} style={{ '--point': index } as React.CSSProperties}><span>{labels[index]}</span></i>)}</div>;
  }
  if (state === 'postpartum') {
    return <div className="home-premium-timeline" aria-label="Illustrative postpartum reflection timeline">{['Birth', 'Rest', 'Support', 'Today'].map((item, index) => <div key={item} className={index === 3 ? 'is-now' : ''}><i /><span>{item}</span></div>)}</div>;
  }
  return <div className="home-premium-bars" aria-label="Illustrative recorded date visual">{points.map((height, index) => <div key={`${labels[index]}-${index}`}><i style={{ height: `${height}%` }} /><span>{labels[index]}</span></div>)}</div>;
}

export function HomeVisualPrototype({
  state, displayName, metric, cycleDay, hasCheckin, appointment, preview, publicDemo = false,
  showDevelopmentSwitcher, onDevelopmentStateChange, onLogCheckin, onLogPeriod, onUpdateJourney,
  onOpenCare, onOpenJournal, onOpenLearn,
}: HomeVisualPrototypeProps) {
  const design = content[state];
  const Icon = design.icon;
  const actualMetric: Metric = state === 'cycle' && cycleDay
    ? { value: `Day ${cycleDay}`, label: 'of your recorded cycle', detail: 'Based on your logged period start. Not a fertility prediction.' }
    : state === 'cycle' ? null : metric;
  const shownMetric = preview ? design.previewMetric : actualMetric;
  const journeyAction = state === 'cycle' ? onLogPeriod : onUpdateJourney;
  const primaryAction = publicDemo ? onUpdateJourney : journeyAction;
  const name = displayName ? displayName.split(' ')[0] : 'there';

  return (
    <section className={`home-premium home-premium-${state}`} aria-label={`${design.label} home`}>
      {showDevelopmentSwitcher && <aside className="home-premium-switcher" aria-label="Development design state switcher">
        <div><span>Design comparison</span><p>Illustrative content only. Saved records are unchanged.</p></div>
        <fieldset><legend className="sr-only">Choose a Home state</legend>{(['cycle', 'pregnancy', 'postpartum'] as HomeDesignState[]).map((option) => <button type="button" key={option} aria-pressed={state === option} onClick={() => onDevelopmentStateChange(option)}>{content[option].label}</button>)}</fieldset>
      </aside>}

      <header className="home-premium-intro">
        <div><span className="home-premium-kicker"><Icon size={15} /> {design.eyebrow}</span><h2>Hello, {name}.</h2><p>{design.introduction}</p></div>
        <Button className="home-premium-log" onClick={onLogCheckin}><Plus size={17} /> Log a check-in</Button>
      </header>

      <section className="home-premium-hero">
        <div className="home-premium-hero-copy">
          <span className="home-premium-kicker"><Icon size={15} /> {design.label}</span>
          <h3>{design.title}</h3>
          <p>{state === 'postpartum' ? 'Your experience is yours. MAMA keeps space for what helps, without measuring your recovery.' : 'Choose what to record, return when it helps, and keep your care story in your hands.'}</p>
          <div className="home-premium-hero-actions"><Button onClick={primaryAction}>{publicDemo ? 'Create a private care space' : design.primary} <ChevronRight size={17} /></Button><button type="button" onClick={publicDemo ? onUpdateJourney : onOpenCare}>{publicDemo ? 'Sign in' : 'Open my care'} <ArrowUpRight size={15} /></button></div>
        </div>
        <div className="home-premium-journey-mark" aria-label={shownMetric ? `${shownMetric.value} ${shownMetric.label}` : 'Your personal journey'}>
          <span>{state === 'pregnancy' ? 'Your baby' : state === 'postpartum' ? 'Your time' : 'Your cycle'}</span>
          <strong>{shownMetric?.value || 'Your space'}</strong><b>{shownMetric?.label || 'starts when you are ready'}</b>
          {state === 'cycle' ? <div className="home-premium-ring" /> : state === 'pregnancy' ? <div className="home-premium-journey-arc"><i /><i /><i /><i /><i /></div> : <div className="home-premium-journey-line"><i /><i /><i /><i /></div>}
          <small>{shownMetric?.detail || 'Add only what feels useful to you.'}</small>
        </div>
      </section>

      <section className="home-premium-priority" aria-label="Today in My MAMA">
        <article><span className="home-premium-icon"><Heart size={18} /></span><div><small>{design.focusLabel}</small><h3>{hasCheckin && !preview ? 'You made time for yourself today.' : design.focusTitle}</h3><p>{hasCheckin && !preview ? 'Your check-in is safely saved in your private care space.' : design.focusBody}</p></div><Button variant="outline" onClick={onLogCheckin}>{hasCheckin && !preview ? 'View check-in' : 'Start check-in'} <ChevronRight size={16} /></Button></article>
        <article className="home-premium-next"><span className="home-premium-icon"><CalendarDays size={18} /></span><div><small>{appointment && !preview ? 'Coming up' : 'Your next step'}</small><h3>{appointment && !preview ? appointment.title : design.nextTitle}</h3><p>{appointment && !preview ? `${appointment.date}${appointment.time ? ` · ${appointment.time}` : ''}` : design.nextBody}</p></div><button type="button" aria-label="Open my care" onClick={onOpenCare}><ChevronRight size={19} /></button></article>
      </section>

      <section className="home-premium-lower">
        <article className="home-premium-insight"><header><div><span className="home-premium-kicker muted"><Sparkles size={14} /> Your view</span><h3>{design.insightTitle}</h3><p>{design.insightBody}</p></div><span className="home-premium-chip">{preview ? 'Illustrative view' : state === 'pregnancy' ? 'Estimated timing' : state === 'postpartum' ? 'Your reflection' : 'Recorded dates'}</span></header><InsightVisual state={state} points={design.points} labels={design.pointLabels} /><footer>{design.footnote}</footer></article>
        <article className="home-premium-prompt"><span className="home-premium-icon"><BookOpen size={19} /></span><small>At your pace</small><h3>{state === 'pregnancy' ? 'A question is worth keeping.' : state === 'postpartum' ? 'Your care deserves gentleness.' : 'Keep what feels useful.'}</h3><p>{state === 'pregnancy' ? 'Save a thought for your next appointment.' : state === 'postpartum' ? 'A quiet note can help you notice what support feels right.' : 'Your journal is ready for the details only you can know.'}</p><button type="button" onClick={onOpenJournal}>Open my journal <ArrowUpRight size={15} /></button></article>
        <article className="home-premium-action"><span className="home-premium-icon"><CheckCircle2 size={19} /></span><small>A thoughtful next step</small><h3>Tracking, preparing and following up all count.</h3><p>MAMA never scores health outcomes or asks you to keep a streak.</p><button type="button" onClick={onOpenLearn}>Explore guidance <ChevronRight size={16} /></button></article>
      </section>
    </section>
  );
}
