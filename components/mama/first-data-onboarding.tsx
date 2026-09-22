'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { parsePublicStartIntent } from '@/lib/public-start-intent';
import { ArrowRight, CheckCircle2, Flower2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { type Profile, type Stage } from '@/lib/care-model';

const choices: Array<{ stage: Stage; title: string; copy: string; kind: 'cycle' | 'pregnancy' | 'postpartum' | 'minimal' }> = [
  { stage: 'first_period', title: 'Growing up', copy: 'A quiet place to understand your first period and questions.', kind: 'cycle' },
  { stage: 'cycle', title: 'My cycle', copy: 'Keep dates and observations that matter to you.', kind: 'cycle' },
  { stage: 'preconception', title: 'Planning ahead', copy: 'Prepare for future care conversations at your own pace.', kind: 'minimal' },
  { stage: 'trying_to_conceive', title: 'Trying for a baby', copy: 'Keep your questions, dates and care preparations together.', kind: 'cycle' },
  { stage: 'pregnancy', title: 'Pregnancy', copy: 'Keep your chosen dates and care conversations close.', kind: 'pregnancy' },
  { stage: 'postpartum', title: 'After birth', copy: 'A personal space for support, recovery and what helps.', kind: 'postpartum' },
  { stage: 'perimenopause', title: 'Midlife', copy: 'Record only the changes and questions that feel useful.', kind: 'minimal' },
];

type Props = { profile: Profile; onComplete: (profile: Profile, period?: { start: string; end: string }) => Promise<void>; onDefer: () => void };

export function FirstDataOnboarding({ profile, onComplete, onDefer }: Props) {
  const [selected, setSelected] = useState<Stage>(profile.stage === 'none' ? 'cycle' : profile.stage);
  const [date, setDate] = useState(profile.date);
  const [dateKind, setDateKind] = useState<'due_date' | 'last_period'>((profile.anchorKind === 'last_period' ? 'last_period' : 'due_date'));
  const [periodEnd, setPeriodEnd] = useState('');
  const [pattern, setPattern] = useState<NonNullable<Profile['cyclePattern']>>(profile.cyclePattern || 'not_sure');
  const [name, setName] = useState(profile.name);
  const [saving, setSaving] = useState(false);
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState('');
  const choice = useMemo(() => choices.find((item) => item.stage === selected) || choices[1], [selected]);

  useEffect(() => {
    void createClient().auth.getUser().then(({ data: { user } }) => {
      const intent = parsePublicStartIntent(user?.user_metadata?.mama_start_intent);
      if (!intent || profile.stage !== 'none') return;
      setSelected(intent.stage);
      if (intent.name && !profile.name) setName(intent.name);
    });
  }, [profile.name, profile.stage]);

  async function submit() {
    setError('');
    if ((choice.kind === 'cycle' || choice.kind === 'pregnancy' || choice.kind === 'postpartum') && !date) {
      setError('Choose a date to start your MAMA space.'); return;
    }
    setSaving(true);
    try {
      await onComplete({ ...profile, name, stage: selected, date, dateSource: profile.dateSource || 'estimate', anchorKind: choice.kind === 'cycle' ? 'period_start' : choice.kind === 'pregnancy' ? dateKind : choice.kind === 'postpartum' ? 'birth_date' : 'none', cyclePattern: pattern }, choice.kind === 'cycle' ? { start: date, end: periodEnd } : undefined);
      setComplete(true);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'We could not save your journey.'); }
    finally { setSaving(false); }
  }

  if (complete) return <section className="first-data-ready" aria-live="polite"><CheckCircle2 size={34} /><span>YOUR MAMA SPACE</span><h2>Your MAMA space is ready.</h2><p>Your information is now private to your account. You can correct it any time in My MAMA Profile.</p><Button onClick={onDefer}>Continue to Home <ArrowRight size={17} /></Button></section>;

  return <section className="first-data-flow" aria-label="Set up your MAMA journey">
    <div className="first-data-visual"><Flower2 size={25} /><span>WELCOME TO MAMA</span><h2>Let&apos;s make this yours.</h2><p>Tell MAMA where you are in your journey. We only ask for the small amount of information needed to personalise your space.</p><small>Every detail is editable later. MAMA does not invent health information for you.</small></div>
    <div className="first-data-form">
      <span className="first-data-step">01 · YOUR JOURNEY</span><h2>Where are you in your journey?</h2>
      <div className="journey-choice-grid">{choices.map((item) => <button type="button" key={item.stage} className={item.stage === selected ? 'selected' : ''} onClick={() => { setSelected(item.stage); setDate(''); }}><b>{item.title}</b><span>{item.copy}</span></button>)}</div>
      <label className="field"><span>What should MAMA call you? <em>Optional</em></span><input value={name} maxLength={60} autoComplete="name" onChange={(event) => setName(event.target.value)} placeholder="Your first name" /></label>
      {choice.kind === 'cycle' && <div className="first-data-fields"><label className="field"><span>When did your most recent period start?</span><input required type="date" max={new Date().toISOString().slice(0, 10)} value={date} onChange={(event) => setDate(event.target.value)} /></label><label className="field"><span>Do you know when it ended? <em>Optional</em></span><input type="date" min={date || undefined} max={new Date().toISOString().slice(0, 10)} value={periodEnd} onChange={(event) => setPeriodEnd(event.target.value)} /></label><fieldset className="first-data-pattern"><legend>How would you describe your usual cycle?</legend>{([['regular', 'Regular'], ['varies', 'It varies'], ['not_sure', 'Not sure']] as const).map(([value, label]) => <label key={value}><input type="radio" checked={pattern === value} onChange={() => setPattern(value)} name="cycle-pattern" /> {label}</label>)}</fieldset></div>}
      {choice.kind === 'pregnancy' && <div className="first-data-fields"><fieldset className="first-data-pattern"><legend>What date do you know?</legend><label><input type="radio" checked={dateKind === 'due_date'} onChange={() => setDateKind('due_date')} name="pregnancy-date" /> Estimated due date</label><label><input type="radio" checked={dateKind === 'last_period'} onChange={() => setDateKind('last_period')} name="pregnancy-date" /> First day of last period</label></fieldset><label className="field"><span>{dateKind === 'due_date' ? 'Estimated due date' : 'First day of last period'}</span><input required type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label><p className="first-data-note">Dates entered here may be estimates. Your care team confirms clinical dates.</p></div>}
      {choice.kind === 'postpartum' && <div className="first-data-fields"><label className="field"><span>When did you give birth?</span><input required type="date" max={new Date().toISOString().slice(0, 10)} value={date} onChange={(event) => setDate(event.target.value)} /></label><p className="first-data-note">MAMA uses this only to describe time since birth. It is not a recovery score.</p></div>}
      {choice.kind === 'minimal' && <p className="first-data-note">This journey does not require a health date to begin. You can add personal notes, care tasks and questions whenever you choose.</p>}
      {error && <p className="first-data-error" role="alert">{error}</p>}
      <div className="first-data-actions"><Button disabled={saving} onClick={() => void submit()}>{saving ? 'Saving your space…' : 'Create my MAMA space'} <ArrowRight size={17} /></Button><button type="button" onClick={onDefer}>I&apos;ll do this later</button></div>
    </div>
  </section>;
}
