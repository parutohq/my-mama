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

type Metric = {
  value: string;
  label: string;
  detail: string;
} | null;

type Appointment = {
  title: string;
  date: string;
  time: string;
  location: string;
} | null;

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

const content = {
  cycle: {
    label: 'Cycle tracking',
    icon: CircleDot,
    title: 'Make space for your rhythm.',
    intro:
      'A private place to notice the patterns that matter to you, one day at a time.',
    previewValue: 'Day 14',
    previewLabel: 'of your cycle',
    previewDetail: 'Illustrative cycle view — not a fertility prediction.',
    dataLabel: 'Recorded dates',
    primary: 'Log a period',
    progress: '56%',
    progressLabel: 'cycle view',
    visualTitle: 'Your cycle view',
    visualDescription: 'Dates you record can form a clearer personal history over time.',
    visualFootnote: 'Only logged dates are shown. MAMA does not predict fertility.',
    bars: [32, 48, 37, 66, 53, 70, 58],
    barLabels: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
    careTitle: 'A small check-in can help.',
    careDescription: 'Notice your mood, symptoms or anything you want to remember.',
    weeklyTitle: 'For your next conversation',
    weeklyDescription: 'Keep a question or observation ready for your care team.',
  },
  pregnancy: {
    label: 'Pregnancy',
    icon: Baby,
    title: 'A steadier way to feel prepared.',
    intro:
      'Your dates, appointments and questions, brought together with care.',
    previewValue: 'Week 24',
    previewLabel: 'of pregnancy',
    previewDetail: 'Illustrative timing — clinical care remains with your care team.',
    dataLabel: 'Estimated timing',
    primary: 'Update my journey',
    progress: '60%',
    progressLabel: 'your timeline',
    visualTitle: 'Your pregnancy path',
    visualDescription: 'A calm view of the stage you are in, based on dates you choose to enter.',
    visualFootnote: 'Timing can be estimated. Confirm your clinical dates with your care team.',
    bars: [18, 26, 40, 54, 62, 72, 82],
    barLabels: ['8', '12', '16', '20', '24', '28', '32'],
    careTitle: 'How are you feeling today?',
    careDescription: 'A short check-in can help you prepare for your next appointment.',
    weeklyTitle: 'Make room for your questions',
    weeklyDescription: 'Save what you want to discuss so it is there when you need it.',
  },
  postpartum: {
    label: 'Postpartum',
    icon: Waves,
    title: 'Rest, recover, reconnect.',
    intro:
      'Your recovery belongs to you. Keep only the moments and support that feel useful.',
    previewValue: '6 weeks',
    previewLabel: 'at your pace',
    previewDetail: 'Illustrative recovery view — not a health score or clinical assessment.',
    dataLabel: 'Your reflection',
    primary: 'Update my journey',
    progress: '48%',
    progressLabel: 'your rhythm',
    visualTitle: 'Your recovery rhythm',
    visualDescription: 'A gentle reflection space for what support, rest and follow-up look like for you.',
    visualFootnote: 'This is not a medical assessment. Contact your care team for clinical concerns.',
    bars: [52, 43, 60, 38, 55, 64, 51],
    barLabels: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
    careTitle: 'A moment for you, too.',
    careDescription: 'Check in with yourself in a way that feels manageable today.',
    weeklyTitle: 'Your support matters',
    weeklyDescription: 'Keep a care contact or question close for when you need it.',
  },
} as const;

function MiniBars({ bars, labels }: { bars: readonly number[]; labels: readonly string[] }) {
  return (
    <div className="home-v2-bars" aria-label="Illustrative progress visual">
      {bars.map((height, index) => (
        <div className="home-v2-bar" key={`${labels[index]}-${index}`}>
          <span style={{ height: `${height}%` }} />
          <small>{labels[index]}</small>
        </div>
      ))}
    </div>
  );
}

export function HomeVisualPrototype({
  state,
  displayName,
  metric,
  cycleDay,
  hasCheckin,
  appointment,
  preview,
  publicDemo = false,
  showDevelopmentSwitcher,
  onDevelopmentStateChange,
  onLogCheckin,
  onLogPeriod,
  onUpdateJourney,
  onOpenCare,
  onOpenJournal,
  onOpenLearn,
}: HomeVisualPrototypeProps) {
  const design = content[state];
  const Icon = design.icon;
  const actualMetric =
    state === 'cycle' && cycleDay
      ? {
          value: `Day ${cycleDay}`,
          label: 'of your recorded cycle',
          detail: 'Based on your logged period start. Not a fertility prediction.',
        }
      : state !== 'cycle'
        ? metric
        : null;
  const shownMetric = preview ? {
    value: design.previewValue,
    label: design.previewLabel,
    detail: design.previewDetail,
  } : actualMetric;
  const primaryAction = state === 'cycle' ? onLogPeriod : onUpdateJourney;
  const action = publicDemo ? onUpdateJourney : primaryAction;

  return (
    <section className={`home-v2 home-v2-${state}`} aria-label={`${design.label} home`}>
      {showDevelopmentSwitcher && (
        <aside className="home-v2-switcher" aria-label="Development design state switcher">
          <div>
            <span>Development preview</span>
            <p>Illustrative content only. Your saved records are unchanged.</p>
          </div>
          <div className="home-v2-switcher-buttons" role="group" aria-label="Choose a design state">
            {(['cycle', 'pregnancy', 'postpartum'] as HomeDesignState[]).map((option) => (
              <button
                type="button"
                key={option}
                aria-pressed={state === option}
                onClick={() => onDevelopmentStateChange(option)}
              >
                {content[option].label}
              </button>
            ))}
          </div>
        </aside>
      )}

      <section className="home-v2-hero">
        <div className="home-v2-hero-copy">
          <span className="home-v2-eyebrow"><Icon size={15} /> {design.label}</span>
          <p className="home-v2-greeting">{displayName ? `Hello, ${displayName.split(' ')[0]}.` : 'Your MAMA space.'}</p>
          <h2>{design.title}</h2>
          <p className="home-v2-intro">{design.intro}</p>
          <div className="home-v2-hero-actions">
            <Button className="home-v2-primary" onClick={action}>
              {publicDemo ? 'Create a private care space' : design.primary} <ChevronRight size={17} />
            </Button>
            <button type="button" className="home-v2-secondary" onClick={publicDemo ? onUpdateJourney : onOpenCare}>
              {publicDemo ? 'Sign in' : 'My care'} <ArrowUpRight size={15} />
            </button>
          </div>
        </div>
        <div className="home-v2-orbit" aria-label={shownMetric ? `${shownMetric.value} ${shownMetric.label}` : 'Your personal timeline'}>
          <div className="home-v2-orbit-ring" style={{ '--progress': design.progress } as React.CSSProperties}>
            <Icon size={24} strokeWidth={1.5} />
            <strong>{shownMetric?.value || 'Your'}</strong>
            <span>{shownMetric?.label || 'timeline'}</span>
          </div>
          <span className="home-v2-orbit-note">{shownMetric?.detail || 'Add a date to begin your private timeline.'}</span>
        </div>
      </section>

      <section className="home-v2-overview" aria-label="Your day at a glance">
        <article className="home-v2-overview-item">
          <span className="home-v2-icon soft"><Heart size={19} /></span>
          <div>
            <small>Check-in</small>
            <strong>{hasCheckin && !preview ? 'Today is captured' : 'Make space for you'}</strong>
          </div>
          <button type="button" aria-label="Open daily check-in" onClick={onLogCheckin}><Plus size={18} /></button>
        </article>
        <article className="home-v2-overview-item">
          <span className="home-v2-icon warm"><CalendarDays size={19} /></span>
          <div>
            <small>Care plan</small>
            <strong>{appointment && !preview ? appointment.title : 'Keep your next step close'}</strong>
          </div>
          <button type="button" aria-label="Open my care" onClick={onOpenCare}><ChevronRight size={18} /></button>
        </article>
        <article className="home-v2-overview-item">
          <span className="home-v2-icon cool"><BookOpen size={19} /></span>
          <div>
            <small>Learn</small>
            <strong>Guidance at your pace</strong>
          </div>
          <button type="button" aria-label="Open learning library" onClick={onOpenLearn}><ChevronRight size={18} /></button>
        </article>
      </section>

      <div className="home-v2-content-grid">
        <article className="home-v2-card home-v2-visual-card">
          <div className="home-v2-card-heading">
            <div>
              <span className="home-v2-eyebrow muted"><Sparkles size={14} /> Your view</span>
              <h3>{design.visualTitle}</h3>
            </div>
            <span className={`home-v2-data-label ${state === 'pregnancy' ? 'estimated' : ''}`}>
              {preview ? 'Illustrative preview' : design.dataLabel}
            </span>
          </div>
          <p>{design.visualDescription}</p>
          <MiniBars bars={design.bars} labels={design.barLabels} />
          <footer>{design.visualFootnote}</footer>
        </article>

        <article className="home-v2-card home-v2-checkin-card">
          <span className="home-v2-icon primary"><Heart size={21} /></span>
          <h3>{hasCheckin && !preview ? 'You made time for yourself.' : design.careTitle}</h3>
          <p>{hasCheckin && !preview ? 'Your check-in is saved. You can add more context whenever you need to.' : design.careDescription}</p>
          <Button variant="outline" className="home-v2-outline" onClick={onLogCheckin}>
            {hasCheckin && !preview ? 'View today’s check-in' : 'Start a check-in'} <ChevronRight size={16} />
          </Button>
        </article>

        <article className="home-v2-card home-v2-week-card">
          <span className="home-v2-icon neutral"><Moon size={20} /></span>
          <h3>{design.weeklyTitle}</h3>
          <p>{design.weeklyDescription}</p>
          <button type="button" className="home-v2-link" onClick={onOpenJournal}>
            Open my journal <ArrowUpRight size={16} />
          </button>
        </article>
      </div>

      <section className="home-v2-milestone">
        <CheckCircle2 size={22} />
        <div>
          <span>One thoughtful step</span>
          <p>Tracking, preparing and following up all count. MAMA does not score health outcomes.</p>
        </div>
        <button type="button" onClick={onOpenLearn}>Explore guidance <ChevronRight size={16} /></button>
      </section>
    </section>
  );
}
