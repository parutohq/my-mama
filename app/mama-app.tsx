'use client';
import { useCallback, useEffect, useRef, useState, useId } from 'react';
import {
  Heart,
  House,
  CalendarDays,
  BookOpen,
  ClipboardList,
  ShieldCheck,
  ArrowUpRight,
  Plus,
  Flower2,
  Sparkles,
  ChevronRight,
  Settings2,
  CircleHelp,
  LockKeyhole,
  Check,
  Trash2,
  Pencil,
  Printer,
  Download,
  Phone,
  Search,
  AlertTriangle,
  RefreshCw,
  LogOut,
} from 'lucide-react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import {
  stages,
  emptyProfile,
  today,
  prettyDate,
  journeyMetric,
  cycleStats,
  validateRecord,
  moodOptions,
  symptomOptions,
  type CareRecord,
  type Profile,
  type Checkin,
  type Period,
  type CareItem,
  type Stage,
} from '@/lib/care-model';
import { articles, starterTasks, type Article } from '@/lib/education';
const nav = [
  ['Today', House],
  ['My journal', BookOpen],
  ['My care', CalendarDays],
  ['Learn', Sparkles],
  ['Care summary', ClipboardList],
] as const;
type View = (typeof nav)[number][0] | 'Settings';
type Modal = 'profile' | 'checkin' | 'period' | 'care' | 'help' | null;
const faces = ['😊', '🙂', '😐', '😔', '😣'];
function Choice({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[] | Record<string, string>;
  onChange: (v: string) => void;
}) {
  const controlId = useId();
  const opts = Array.isArray(options)
    ? Object.fromEntries(options.map((v) => [v, v]))
    : options;
  return (
    <label className="field" htmlFor={controlId}>
      <span>{label}</span>
      <Select value={value} onValueChange={(v) => v !== null && onChange(v)}>
        <SelectTrigger id={controlId} className="choice">
          <SelectValue>{opts[value] || 'Choose an option'}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {Object.entries(opts).map(([v, l]) => (
            <SelectItem key={v} value={v}>
              {l}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
  );
}
function Blank({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <Empty className="empty-state">
      <EmptyHeader>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      {action}
    </Empty>
  );
}
function Navigation({ view, go }: { view: View; go: (v: View) => void }) {
  const { setOpenMobile } = useSidebar();
  return (
    <>
      <SidebarHeader className="brand">
        <Heart fill="currentColor" />
        <span>
          mama<span className="brand-dot">.</span>
        </span>
      </SidebarHeader>
      <SidebarContent className="nav-content">
        <p className="eyebrow">YOUR SPACE</p>
        <SidebarMenu>
          {nav.map(([title, Icon]) => (
            <SidebarMenuItem key={title}>
              <SidebarMenuButton
                isActive={view === title}
                className="nav-item"
                onClick={() => {
                  go(title);
                  setOpenMobile(false);
                }}
              >
                <Icon />
                <span>{title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
        <div className="sidebar-note">
          <Flower2 size={28} />
          <p>
            Care that moves
            <br />
            with you.
          </p>
          <span>Every stage. At your pace.</span>
        </div>
      </SidebarContent>
      <SidebarFooter className="nav-content">
        <button
          className={'nav-item ' + (view === 'Settings' ? 'selected' : '')}
          onClick={() => {
            go('Settings');
            setOpenMobile(false);
          }}
        >
          <Settings2 size={18} /> My journey & privacy
        </button>
        <div className="privacy-note">
          <LockKeyhole size={14} /> Your personal care space
        </div>
      </SidebarFooter>
    </>
  );
}
export default function MamaApp() {
  const [view, setView] = useState<View>('Today'),
    [records, setRecords] = useState<CareRecord[]>([]),
    [loading, setLoading] = useState(true),
    [loadError, setLoadError] = useState(''),
    [saving, setSaving] = useState(false),
    [error, setError] = useState(''),
    [notice, setNotice] = useState('');
  const [modal, setModal] = useState<Modal>(null),
    [article, setArticle] = useState<Article | null>(null),
    [deletion, setDeletion] = useState<string | null>(null),
    [query, setQuery] = useState(''),
    [learnFilter, setLearnFilter] = useState('All'),
    [journalTab, setJournalTab] = useState('checkins');
  const [profileDraft, setProfileDraft] = useState<Profile>(emptyProfile),
    [checkinDraft, setCheckinDraft] = useState<Checkin | null>(null),
    [periodDraft, setPeriodDraft] = useState<Period | null>(null),
    [careDraft, setCareDraft] = useState<CareItem | null>(null);
  const [includeNotes, setIncludeNotes] = useState(false),
    [currentDay, setCurrentDay] = useState(today());
  const heading = useRef<HTMLHeadingElement>(null),
    busy = useRef(false);
  const profile =
    records.find((r): r is Profile => r.kind === 'profile') || emptyProfile;
  const checkins = records
    .filter((r): r is Checkin => r.kind === 'checkin')
    .sort((a, b) => b.date.localeCompare(a.date));
  const periods = records
    .filter((r): r is Period => r.kind === 'period')
    .sort((a, b) => b.start.localeCompare(a.start));
  const care = records.filter((r): r is CareItem => r.kind === 'care');
  const appointments = care
    .filter((c) => c.type === 'appointment')
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const pending = appointments.filter((c) => !c.done && c.date >= currentDay);
  const tasks = care.filter((c) => c.type === 'task');
  const todayCheck = checkins.find((c) => c.date === currentDay);
  const metric = journeyMetric(profile, currentDay),
    stats = cycleStats(periods, currentDay);
  const cycleMode =
    profile.stage === 'cycle' || profile.stage === 'preconception';
  const relevant = articles
    .filter((a) => a.stages.includes(profile.stage))
    .slice(0, 3);
  const go = useCallback((v: View) => {
    setView(v);
    setArticle(null);
    setTimeout(() => heading.current?.focus(), 0);
  }, []);
  const load = useCallback(() => {
    return fetch('/api/records', { cache: 'no-store' })
      .then(async (res) => {
        const data = (await res.json()) as {
          records: CareRecord[];
          error?: string;
        };
        if (!res.ok) throw new Error(data.error);
        return data.records;
      })
      .then((data) => {
        setRecords(data);
        setLoading(false);
      })
      .catch((e: unknown) => {
        setLoadError(
          e instanceof Error ? e.message : 'Could not load your records.',
        );
        setLoading(false);
      });
  }, []);
  useEffect(() => {
    void load();
    const timer = setInterval(() => setCurrentDay(today()), 60000);
    return () => clearInterval(timer);
  }, [load]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(''), 4500);
    return () => clearTimeout(timer);
  }, [notice]);
  async function save(record: CareRecord, close = true) {
    if (busy.current) return false;
    busy.current = true;
    setSaving(true);
    setError('');
    try {
      const clean = validateRecord(record);
      const res = await fetch('/api/records', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clean),
      });
      const data = (await res.json()) as { record: CareRecord; error?: string };
      if (!res.ok) throw new Error(data.error);
      setRecords((prev) => [
        data.record,
        ...prev.filter((r) => r.id !== data.record.id),
      ]);
      if (close) setModal(null);
      setNotice('Saved to your care space.');
      return true;
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Your entry could not be saved.',
      );
      return false;
    } finally {
      busy.current = false;
      setSaving(false);
    }
  }
  function openProfile() {
    setProfileDraft({ ...profile });
    setError('');
    setModal('profile');
  }
  function openCheckin(mood = 'Okay', existing?: Checkin) {
    setCheckinDraft(
      existing
        ? { ...existing }
        : {
            kind: 'checkin',
            id: crypto.randomUUID(),
            date: today(),
            mood,
            symptoms: [],
            bleeding: 'Not recorded',
            pain: 'Not recorded',
            notes: '',
          },
    );
    setError('');
    setModal('checkin');
  }
  function openPeriod(existing?: Period) {
    setPeriodDraft(
      existing
        ? { ...existing }
        : {
            kind: 'period',
            id: crypto.randomUUID(),
            start: today(),
            end: '',
            notes: '',
          },
    );
    setError('');
    setModal('period');
  }
  function openCare(
    type: 'appointment' | 'task' = 'appointment',
    existing?: CareItem,
    title = '',
  ) {
    setCareDraft(
      existing
        ? { ...existing }
        : {
            kind: 'care',
            id: crypto.randomUUID(),
            type,
            title,
            date: type === 'appointment' ? today() : '',
            time: '',
            location: '',
            notes: '',
            done: false,
          },
    );
    setError('');
    setModal('care');
  }
  async function remove() {
    if (!deletion || busy.current) return;
    busy.current = true;
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/records', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          deletion === 'all' ? { all: true } : { id: deletion },
        ),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error);
      setRecords((prev) =>
        deletion === 'all' ? [] : prev.filter((r) => r.id !== deletion),
      );
      setDeletion(null);
      setNotice('Deleted from your care space.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not delete.');
    } finally {
      busy.current = false;
      setSaving(false);
    }
  }
  function exportRecords() {
    const blob = new Blob(
      [
        JSON.stringify(
          { app: 'MAMA', exportedAt: new Date().toISOString(), records },
          null,
          2,
        ),
      ],
      { type: 'application/json' },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mama-records-${currentDay}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const actions = useRef({ go, openCare });
  useEffect(() => {
    actions.current = { go, openCare };
  });
  useEffect(() => {
    const context = (
      document as Document & {
        modelContext?: {
          registerTool: (
            tool: unknown,
            options: { signal: AbortSignal },
          ) => void | Promise<void>;
        };
      }
    ).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const register = (tool: unknown) => {
      try {
        void Promise.resolve(
          context.registerTool(tool, { signal: lifecycle.signal }),
        ).catch(() => {});
      } catch {}
    };
    register({
      name: 'navigate_care_space',
      description:
        'Open Today, My journal, My care, Learn or Care summary. Does not disclose or modify saved health records.',
      inputSchema: {
        type: 'object',
        properties: { view: { type: 'string', enum: nav.map((x) => x[0]) } },
        required: ['view'],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false },
      execute: async (input: unknown) => {
        const v = (input as { view?: unknown })?.view;
        if (typeof v !== 'string' || !nav.some((x) => x[0] === v))
          throw new Error('Unknown care view');
        actions.current.go(v as View);
        await new Promise((r) => setTimeout(r, 0));
        return { view: v };
      },
    });
    register({
      name: 'start_appointment_entry',
      description:
        'Open a new appointment form for the user to review and save. Does not create a saved appointment.',
      inputSchema: {
        type: 'object',
        properties: {},
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false },
      execute: async (input: unknown) => {
        if (!input || typeof input !== 'object' || Object.keys(input).length)
          throw new Error('No arguments expected');
        actions.current.openCare('appointment');
        await new Promise((r) => setTimeout(r, 0));
        return { form: 'appointment', saved: false };
      },
    });
    return () => lifecycle.abort();
  }, []);
  function careRow(item: CareItem) {
    return (
      <div
        className={'record-row ' + (item.done ? 'completed' : '')}
        key={item.id}
      >
        <Checkbox
          checked={item.done}
          disabled={saving}
          onCheckedChange={(v) => void save({ ...item, done: !!v }, false)}
          aria-label={`Mark ${item.title} ${item.done ? 'incomplete' : 'complete'}`}
        />
        <div className="record-body">
          <h3>{item.title}</h3>
          <p>
            {item.date ? prettyDate(item.date) : 'No date set'}
            {item.time ? ` · ${item.time}` : ''}
            {item.location ? ` · ${item.location}` : ''}
            {!item.done && item.date && item.date < currentDay
              ? ' · Past date — review'
              : ''}
          </p>
          {item.notes && <p className="record-note">{item.notes}</p>}
        </div>
        <button
          className="icon-button"
          aria-label={`Edit ${item.title}`}
          onClick={() => openCare(item.type, item)}
        >
          <Pencil size={16} />
        </button>
        <button
          className="icon-button"
          aria-label={`Delete ${item.title}`}
          onClick={() => {
            setError('');
            setDeletion(item.id);
          }}
        >
          <Trash2 size={16} />
        </button>
      </div>
    );
  }
  return (
    <SidebarProvider
      style={{ '--sidebar-width': '15.5rem' } as React.CSSProperties}
    >
      <Sidebar>
        <Navigation view={view} go={go} />
      </Sidebar>
      <main className="app-main">
        <header className="topbar">
          <div className="topbar-title">
            <SidebarTrigger />
            <span>Your daily companion</span>
          </div>
          <button
            className="help-link"
            onClick={() => {
              setError('');
              setModal('help');
            }}
          >
            <CircleHelp size={17} /> When to get help <ArrowUpRight size={15} />
          </button>
        </header>
        <div className="page">
          <div className="page-heading">
            <div>
              <p className="eyebrow">
                {view === 'Today'
                  ? 'A MOMENT FOR YOU'
                  : view === 'Settings'
                    ? 'ON YOUR TERMS'
                    : 'YOUR PERSONAL CARE SPACE'}
              </p>
              <h1 tabIndex={-1} ref={heading}>
                {view === 'Today'
                  ? profile.name
                    ? `Hello, ${profile.name}`
                    : 'Welcome to your space'
                  : view === 'Settings'
                    ? 'My journey & privacy'
                    : view}
                <span>.</span>
              </h1>
              <p>
                {view === 'Today'
                  ? 'Your body, your questions, your journey.'
                  : view === 'My journal'
                    ? 'Notice the changes. Keep the context.'
                    : view === 'My care'
                      ? 'A little preparation, one thing at a time.'
                      : view === 'Learn'
                        ? 'Understand more, with sources you can explore.'
                        : view === 'Care summary'
                          ? 'The important details, ready for your next conversation.'
                          : 'Your stage can change. Your history stays yours.'}
              </p>
            </div>
            {!loading &&
              !loadError &&
              (view === 'Today' || view === 'My journal') && (
                <Button className="primary-btn" onClick={() => openCheckin()}>
                  <Plus size={18} /> Log a check-in
                </Button>
              )}
            {view === 'My care' && !loadError && (
              <Button className="primary-btn" onClick={() => openCare()}>
                <Plus size={18} /> Add appointment
              </Button>
            )}
          </div>
          {notice && (
            <output className="save-notice" aria-live="polite">
              <Check size={16} />
              {notice}
            </output>
          )}
          {error && !modal && !deletion && (
            <div className="error-banner" role="alert">
              {error}
            </div>
          )}
          {loading ? (
            <div
              className="loading-grid"
              aria-label="Loading your care records"
            >
              <Skeleton className="h-72 rounded-2xl" />
              <Skeleton className="h-72 rounded-2xl" />
            </div>
          ) : loadError ? (
            <div className="card">
              <h2>Your care space is temporarily unavailable</h2>
              <p className="spaced">{loadError}</p>
              <button
                className="outline-btn"
                onClick={() => {
                  setLoading(true);
                  setLoadError('');
                  void load();
                }}
              >
                <RefreshCw size={16} /> Try again
              </button>
              <p className="spaced">
                Warning-sign guidance is still available above. Do not wait for
                this app if you need urgent care.
              </p>
            </div>
          ) : (
            <>
              {view === 'Today' && (
                <>
                  <div className="dashboard-grid">
                    <section className="journey-card">
                      <div>
                        <span className="pill light">
                          <Flower2 size={15} />{' '}
                          {profile.stage === 'none'
                            ? 'YOUR JOURNEY'
                            : stages[profile.stage].toUpperCase()}
                        </span>
                        <h2>
                          {metric ? (
                            <>
                              {metric.value}{' '}
                              <span className="metric-unit">
                                {metric.label}
                              </span>
                            </>
                          ) : cycleMode && stats.day ? (
                            <>
                              {stats.day}
                              <span className="metric-unit">
                                {' '}
                                days into your recorded cycle
                              </span>
                            </>
                          ) : profile.stage === 'recovery' ? (
                            <>
                              A little space.
                              <br />
                              At your pace.
                            </>
                          ) : profile.stage === 'preconception' ? (
                            <>
                              Preparing for
                              <br />
                              what’s next.
                            </>
                          ) : (
                            <>
                              A little care,
                              <br />
                              every day.
                            </>
                          )}
                        </h2>
                        <p>
                          {metric ? (
                            metric.detail
                          ) : cycleMode && stats.day ? (
                            'Based on your logged period start. Not a fertility prediction.'
                          ) : profile.stage === 'recovery' ? (
                            'Your history is here. Pregnancy prompts are paused.'
                          ) : profile.stage === 'none' ? (
                            <>
                              Choose where you are today.
                              <br />
                              Keep the important things together.
                            </>
                          ) : (
                            'Your care, questions and next steps, together.'
                          )}
                        </p>
                        <Button
                          className="white-btn"
                          onClick={cycleMode ? () => openPeriod() : openProfile}
                        >
                          {cycleMode
                            ? 'Log a period'
                            : profile.stage === 'none'
                              ? 'Set up my journey'
                              : 'Update my journey'}{' '}
                          <ChevronRight size={17} />
                        </Button>
                      </div>
                      <div className="journey-ring">
                        <Heart size={42} strokeWidth={1.2} />
                        <span>
                          {profile.stage === 'recovery'
                            ? 'Here for you'
                            : 'At your pace'}
                        </span>
                      </div>
                      <div className="journey-bottom">
                        <span>Cycle</span>
                        <span>Prepare</span>
                        <span>Pregnancy</span>
                        <span>Postpartum</span>
                      </div>
                    </section>
                    <section className="card checkin-card">
                      <span className="icon-box">
                        <Heart size={23} />
                      </span>
                      <h2>
                        {todayCheck
                          ? 'You made time for yourself.'
                          : 'How are you feeling?'}
                      </h2>
                      <p>
                        {todayCheck
                          ? `Today’s check-in: ${todayCheck.mood.toLowerCase()}. You can add more context anytime.`
                          : 'A moment to notice what’s changed, and how you’re doing.'}
                      </p>
                      <div className="moods">
                        {moodOptions.map((m, i) => (
                          <button
                            key={m}
                            title={m}
                            aria-label={`Log feeling ${m.toLowerCase()}`}
                            onClick={() => openCheckin(m)}
                          >
                            {faces[i]}
                          </button>
                        ))}
                      </div>
                      <button
                        className="text-btn"
                        onClick={() => openCheckin('Okay', todayCheck)}
                      >
                        {todayCheck
                          ? 'Edit today’s check-in'
                          : 'Add your first check-in'}{' '}
                        <Plus size={16} />
                      </button>
                    </section>
                    <section className="card">
                      <div className="section-title">
                        <h2>Next on your care list</h2>
                        <CalendarDays size={20} />
                      </div>
                      {pending.length ? (
                        <div className="next-appointment">
                          <span className="date-tile">
                            <b>
                              {new Date(
                                pending[0].date + 'T12:00:00',
                              ).getDate()}
                            </b>
                            {new Date(
                              pending[0].date + 'T12:00:00',
                            ).toLocaleDateString('en-GB', { month: 'short' })}
                          </span>
                          <div>
                            <h3>{pending[0].title}</h3>
                            <p>
                              {prettyDate(pending[0].date)}{' '}
                              {pending[0].time && `· ${pending[0].time}`}
                            </p>
                            <p>{pending[0].location || 'Location not set'}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="empty-care">
                          <span className="icon-box neutral">
                            <CalendarDays />
                          </span>
                          <div>
                            <h3>A little preparation helps.</h3>
                            <p>Keep appointments and questions in one place.</p>
                          </div>
                        </div>
                      )}
                      <button
                        className="outline-btn"
                        onClick={
                          pending.length
                            ? () => go('My care')
                            : () => openCare()
                        }
                      >
                        {pending.length ? (
                          'View my care plan'
                        ) : (
                          <>
                            <Plus size={16} /> Add an appointment
                          </>
                        )}
                      </button>
                    </section>
                    <section className="card help-card">
                      <ShieldCheck size={25} />
                      <h2>Know when to get help.</h2>
                      <p>
                        Clear warning signs and trusted sources for those
                        uncertain moments.
                      </p>
                      <button
                        className="text-btn"
                        onClick={() => setModal('help')}
                      >
                        Explore care guidance <ArrowUpRight size={17} />
                      </button>
                    </section>
                  </div>
                  <div className="section-title learn-heading">
                    <div>
                      <p className="eyebrow">
                        A LITTLE KNOWLEDGE, MORE CONFIDENCE
                      </p>
                      <h2>Good to know</h2>
                    </div>
                    <button className="text-btn" onClick={() => go('Learn')}>
                      Explore library <ChevronRight size={16} />
                    </button>
                  </div>
                  <div className="article-grid">
                    {relevant.map((a, i) => (
                      <button
                        className={'article-card tone-' + i}
                        key={a.id}
                        onClick={() => setArticle(a)}
                      >
                        <span className="article-category">{a.category}</span>
                        <h3>{a.title}</h3>
                        <div>
                          <span>Read the guide</span>
                          <ArrowUpRight size={19} />
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}
              {view === 'My journal' && (
                <>
                  <Tabs
                    value={journalTab}
                    onValueChange={(v) => setJournalTab(String(v))}
                  >
                    <TabsList className="large-tabs">
                      <TabsTrigger value="checkins">
                        Daily check-ins
                      </TabsTrigger>
                      <TabsTrigger value="periods">Period history</TabsTrigger>
                    </TabsList>
                    <TabsContent value="checkins">
                      <div className="card list-card">
                        {checkins.length ? (
                          checkins.map((c) => (
                            <div className="record-row" key={c.id}>
                              <span className="mood-small">
                                {faces[moodOptions.indexOf(c.mood)]}
                              </span>
                              <div className="record-body">
                                <h3>
                                  {c.mood}{' '}
                                  <span className="muted">
                                    · {prettyDate(c.date)}
                                  </span>
                                </h3>
                                <div className="tags">
                                  {c.symptoms.map((s) => (
                                    <span key={s}>{s}</span>
                                  ))}
                                  {c.bleeding !== 'Not recorded' && (
                                    <span>
                                      Bleeding: {c.bleeding.toLowerCase()}
                                    </span>
                                  )}
                                  {c.pain !== 'Not recorded' && (
                                    <span>Pain: {c.pain.toLowerCase()}</span>
                                  )}
                                </div>
                                {c.notes && (
                                  <p className="record-note">{c.notes}</p>
                                )}
                              </div>
                              <button
                                className="icon-button"
                                aria-label={`Edit check-in from ${c.date}`}
                                onClick={() => openCheckin(c.mood, c)}
                              >
                                <Pencil size={16} />
                              </button>
                              <button
                                className="icon-button"
                                aria-label={`Delete check-in from ${c.date}`}
                                onClick={() => {
                                  setError('');
                                  setDeletion(c.id);
                                }}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          ))
                        ) : (
                          <Blank
                            title="Your story starts with a check-in"
                            description="Record your mood, symptoms and notes. Only log what feels useful to you."
                            action={
                              <button
                                className="outline-btn"
                                onClick={() => openCheckin()}
                              >
                                <Plus size={16} /> Add a check-in
                              </button>
                            }
                          />
                        )}
                      </div>
                    </TabsContent>
                    <TabsContent value="periods">
                      <div className="metric-grid">
                        {[
                          ['Recorded periods', stats.count],
                          [
                            'Average cycle',
                            stats.average ? `${stats.average} days` : '—',
                          ],
                          [
                            'Cycle range',
                            stats.range ? `${stats.range} days` : '—',
                          ],
                          [
                            'Average bleeding',
                            stats.duration ? `${stats.duration} days` : '—',
                          ],
                        ].map(([label, value]) => (
                          <div className="card metric-card" key={label}>
                            <span>{label}</span>
                            <b>{value}</b>
                          </div>
                        ))}
                      </div>
                      <p className="helper spaced">
                        Summaries describe your entries, not a diagnosis or a
                        fertility prediction. Missing periods can distort
                        averages. Postpartum bleeding should be recorded in
                        check-ins, separately from periods.
                      </p>
                      <div className="section-title spaced">
                        <h2>Period records</h2>
                        <button
                          className="outline-btn"
                          onClick={() => openPeriod()}
                        >
                          <Plus size={16} /> Log a period
                        </button>
                      </div>
                      <div className="card list-card">
                        {periods.length ? (
                          periods.map((p) => (
                            <div className="record-row" key={p.id}>
                              <span className="period-dot" />
                              <div className="record-body">
                                <h3>
                                  {prettyDate(p.start)} —{' '}
                                  {p.end
                                    ? prettyDate(p.end)
                                    : 'End not recorded'}
                                </h3>
                                {p.notes && (
                                  <p className="record-note">{p.notes}</p>
                                )}
                              </div>
                              <button
                                className="icon-button"
                                aria-label={`Edit period starting ${p.start}`}
                                onClick={() => openPeriod(p)}
                              >
                                <Pencil size={16} />
                              </button>
                              <button
                                className="icon-button"
                                aria-label={`Delete period starting ${p.start}`}
                                onClick={() => {
                                  setError('');
                                  setDeletion(p.id);
                                }}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          ))
                        ) : (
                          <Blank
                            title="See your pattern over time"
                            description="Add your period dates when you know them. You can leave the end date blank and update it later."
                          />
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </>
              )}
              {view === 'My care' && (
                <>
                  <div className="care-columns">
                    <section className="card">
                      <div className="section-title">
                        <h2>Appointments</h2>
                        <CalendarDays size={20} />
                      </div>
                      <p className="helper spaced">
                        Dates are a personal organiser. MAMA does not book
                        visits or send push reminders.
                      </p>
                      {appointments.length ? (
                        appointments.map(careRow)
                      ) : (
                        <Blank
                          title="Your next conversation starts here"
                          description="Add a visit and the questions you want to ask."
                          action={
                            <button
                              className="outline-btn"
                              onClick={() => openCare()}
                            >
                              <Plus size={16} /> Add appointment
                            </button>
                          }
                        />
                      )}
                    </section>
                    <section className="card">
                      <div className="section-title">
                        <h2>My checklist</h2>
                        <button
                          className="text-btn"
                          onClick={() => openCare('task')}
                        >
                          <Plus size={16} /> Add
                        </button>
                      </div>
                      {tasks.length ? (
                        tasks.map(careRow)
                      ) : (
                        <p className="spaced">
                          Add your own tasks or choose a starting point below.
                        </p>
                      )}
                      <div className="suggestions">
                        <p className="eyebrow">SUGGESTED STARTING POINTS</p>
                        {starterTasks[profile.stage].map((title) => (
                          <button
                            key={title}
                            onClick={() =>
                              title === 'Choose my current journey' ||
                              title === 'Save my healthcare contact'
                                ? openProfile()
                                : openCare('task', undefined, title)
                            }
                          >
                            <Plus size={15} />
                            {title}
                          </button>
                        ))}
                      </div>
                    </section>
                  </div>
                  <section className="card contact-card">
                    <Phone size={22} />
                    <div>
                      <h2>
                        {profile.contactName || 'Your healthcare contact'}
                      </h2>
                      <p>
                        {profile.phone ||
                          'Save a verified number for your own clinician or maternity unit.'}
                      </p>
                    </div>
                    {profile.phone && (
                      <a
                        className="outline-btn"
                        href={'tel:' + profile.phone.replace(/[^+\d]/g, '')}
                      >
                        Call contact
                      </a>
                    )}
                    <button className="text-btn" onClick={openProfile}>
                      Edit contact <Pencil size={15} />
                    </button>
                  </section>
                </>
              )}
              {view === 'Learn' && (
                <>
                  <div className="library-tools">
                    <label htmlFor="mama-control-1" className="search-field">
                      <Search size={18} />
                      <input
                        id="mama-control-1"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search the library"
                        aria-label="Search the library"
                      />
                    </label>
                    <Choice
                      label="Show topics"
                      value={learnFilter}
                      options={['All', 'For my journey']}
                      onChange={setLearnFilter}
                    />
                  </div>
                  <div className="info-banner">
                    <BookOpen size={18} />
                    <p>
                      Evidence-linked reading. These summaries await local
                      clinical approval; they do not assess your symptoms.
                    </p>
                  </div>
                  <div className="article-grid library-grid">
                    {articles
                      .filter(
                        (a) =>
                          (learnFilter === 'All' ||
                            a.stages.includes(profile.stage)) &&
                          (a.title + ' ' + a.category + ' ' + a.intro)
                            .toLowerCase()
                            .includes(query.toLowerCase()),
                      )
                      .map((a, i) => (
                        <button
                          className={'article-card tone-' + (i % 3)}
                          key={a.id}
                          onClick={() => setArticle(a)}
                        >
                          <span className="article-category">{a.category}</span>
                          <h3>{a.title}</h3>
                          <p>{a.intro}</p>
                          <div>
                            <span>Read the guide</span>
                            <ArrowUpRight size={19} />
                          </div>
                        </button>
                      ))}
                  </div>
                  {!articles.some(
                    (a) =>
                      (learnFilter === 'All' ||
                        a.stages.includes(profile.stage)) &&
                      (a.title + ' ' + a.category + ' ' + a.intro)
                        .toLowerCase()
                        .includes(query.toLowerCase()),
                  ) && (
                    <Blank
                      title="No matching guides"
                      description="Try a different word or show all topics."
                    />
                  )}
                </>
              )}
              {view === 'Care summary' && (
                <>
                  <div className="summary-tools">
                    <label htmlFor="mama-control-2" className="check-label">
                      <Checkbox
                        id="mama-control-2"
                        checked={includeNotes}
                        onCheckedChange={(v) => setIncludeNotes(!!v)}
                      />{' '}
                      Include my free-text notes
                    </label>
                    <button
                      className="outline-btn"
                      onClick={() => window.print()}
                    >
                      <Printer size={16} /> Print / save PDF
                    </button>
                  </div>
                  <p className="helper spaced no-print">
                    Review before sharing. The summary includes recorded
                    symptoms and dates. Notes are hidden until you choose to
                    include them.
                  </p>
                  <article className="card print-summary">
                    <div className="summary-brand">mama.</div>
                    <h2>Personal care summary</h2>
                    <p>
                      Prepared {prettyDate(currentDay)} · User-entered
                      information, not a verified medical record.
                    </p>
                    <dl>
                      <div>
                        <dt>Name</dt>
                        <dd>{profile.name || 'Not recorded'}</dd>
                      </div>
                      <div>
                        <dt>Current journey</dt>
                        <dd>{stages[profile.stage]}</dd>
                      </div>
                      {profile.date && (
                        <div>
                          <dt>
                            {profile.stage === 'pregnancy'
                              ? 'Due date'
                              : profile.stage === 'postpartum'
                                ? 'Birth date'
                                : 'Saved journey date'}
                          </dt>
                          <dd>
                            {prettyDate(profile.date)}
                            {profile.stage === 'pregnancy'
                              ? ` (${profile.dateSource === 'clinician' ? 'clinician-established, entered by user' : 'estimate'})`
                              : ''}
                          </dd>
                        </div>
                      )}
                    </dl>
                    <h3>Cycle history</h3>
                    {periods.length ? (
                      periods.map((p) => (
                        <p key={p.id}>
                          {prettyDate(p.start)} —{' '}
                          {p.end ? prettyDate(p.end) : 'End not recorded'}
                          {includeNotes && p.notes ? ` · ${p.notes}` : ''}
                        </p>
                      ))
                    ) : (
                      <p>No periods recorded.</p>
                    )}
                    <h3>Check-ins</h3>
                    {checkins.length ? (
                      checkins.map((c) => (
                        <div className="summary-entry" key={c.id}>
                          <b>
                            {prettyDate(c.date)} · {c.mood}
                          </b>
                          <p>
                            {c.symptoms.join(', ') || 'No symptoms selected'} ·
                            Bleeding: {c.bleeding} · Pain: {c.pain}
                          </p>
                          {includeNotes && c.notes && (
                            <p className="record-note">{c.notes}</p>
                          )}
                        </div>
                      ))
                    ) : (
                      <p>No check-ins recorded.</p>
                    )}
                    <h3>Appointments & questions</h3>
                    {appointments.length ? (
                      appointments.map((c) => (
                        <div className="summary-entry" key={c.id}>
                          <b>
                            {c.title} · {prettyDate(c.date)} {c.time}
                          </b>
                          <p>
                            {c.location}
                            {c.done ? ' · Marked complete' : ''}
                          </p>
                          {includeNotes && c.notes && (
                            <p className="record-note">{c.notes}</p>
                          )}
                        </div>
                      ))
                    ) : (
                      <p>No appointments recorded.</p>
                    )}
                    <p className="helper spaced">
                      Blank fields and missing entries do not mean a symptom was
                      absent. This summary does not assess health or replace
                      consultation.
                    </p>
                  </article>
                </>
              )}
              {view === 'Settings' && (
                <div className="settings-grid">
                  <section className="card">
                    <span className="icon-box">
                      <Flower2 />
                    </span>
                    <h2 className="spaced">Your journey, at your pace</h2>
                    <p>{stages[profile.stage]}</p>
                    {profile.date && <p>{prettyDate(profile.date)}</p>}
                    <button
                      className="outline-btn spaced"
                      onClick={openProfile}
                    >
                      <Pencil size={16} /> Edit journey & contact
                    </button>
                    <p className="helper">
                      Choose Recovery & a pause to stop pregnancy prompts. Your
                      earlier records remain available.
                    </p>
                  </section>
                  <section className="card">
                    <LockKeyhole size={23} />
                    <h2 className="spaced">Your records & privacy</h2>
                    <p>
                      Saved records belong to your signed-in account. This
                      version has no partner sharing. Avoid entering identifying
                      medical information while the prototype is under review.
                    </p>
                    <div className="stack-actions">
                      <button className="outline-btn" onClick={exportRecords}>
                        <Download size={16} /> Download my records
                      </button>
                      <button
                        className="outline-btn danger-text"
                        onClick={() => {
                          setError('');
                          setDeletion('all');
                        }}
                      >
                        <Trash2 size={16} /> Delete all my records
                      </button>
                      {/* Dispatcher-owned auth requires a full top-level navigation. */}
                      {/* oxlint-disable-next-line next/no-html-link-for-pages */}
                      <a
                        className="text-btn"
                        href="/signout-with-chatgpt?return_to=%2F"
                        target="_top"
                      >
                        <LogOut size={16} /> Sign out
                      </a>
                    </div>
                    <p className="helper">
                      Downloaded files may contain sensitive information. Keep
                      them somewhere private.
                    </p>
                  </section>
                  <section className="card wide">
                    <h2>About this first version</h2>
                    <p className="spaced">
                      MAMA helps you keep records, prepare for care and explore
                      evidence-linked information. It does not diagnose,
                      prescribe, monitor emergencies or provide clinical
                      messaging. No clinician has approved this prototype for
                      patient use.
                    </p>
                    <p>
                      Clinical content and Nigerian referral pathways still need
                      local professional review. Your clinician’s individual
                      plan should guide your care.
                    </p>
                  </section>
                </div>
              )}
            </>
          )}
          <footer className="page-footer">
            <ShieldCheck size={15} />
            <span>
              Clinical-review prototype · Educational support, not a diagnosis
              or emergency service.
            </span>
          </footer>
        </div>
      </main>
      <Dialog
        open={modal !== null}
        onOpenChange={(open) => {
          if (!open && !saving) {
            setModal(null);
            setError('');
          }
        }}
      >
        <DialogContent
          className={'mama-dialog ' + (modal === 'help' ? 'help-dialog' : '')}
        >
          <DialogTitle>
            {modal === 'profile'
              ? 'Your journey, your way'
              : modal === 'checkin'
                ? 'A moment to check in'
                : modal === 'period'
                  ? 'Record a period'
                  : modal === 'care'
                    ? careDraft?.type === 'task'
                      ? 'Add to your checklist'
                      : 'Your appointment'
                    : 'When to get help'}
          </DialogTitle>
          <DialogDescription>
            {modal === 'profile'
              ? 'Choose what is relevant today. You can change this whenever you need.'
              : modal === 'checkin'
                ? 'Only record what feels useful. This is a journal, not a symptom assessment.'
                : modal === 'period'
                  ? 'Record menstruation here. Use a check-in for spotting or postpartum bleeding.'
                  : modal === 'care'
                    ? 'A personal reminder in your care space. This does not book a visit.'
                    : 'If something feels seriously wrong, seek care now. Do not wait for an app response.'}
          </DialogDescription>
          {error && (
            <div className="error-banner" role="alert">
              {error}
            </div>
          )}
          {modal === 'profile' && (
            <form
              className="mama-form"
              onSubmit={(e) => {
                e.preventDefault();
                void save(profileDraft);
              }}
            >
              <label htmlFor="mama-control-3" className="field">
                <span>
                  What would you like us to call you? <small>Optional</small>
                </span>
                <Input
                  id="mama-control-3"
                  value={profileDraft.name}
                  maxLength={60}
                  onChange={(e) =>
                    setProfileDraft({ ...profileDraft, name: e.target.value })
                  }
                  autoComplete="given-name"
                />
              </label>
              <Choice
                label="My current journey"
                value={profileDraft.stage}
                options={stages}
                onChange={(v) =>
                  setProfileDraft({
                    ...profileDraft,
                    stage: v as Stage,
                    date: v === profileDraft.stage ? profileDraft.date : '',
                    dateSource: 'estimate',
                  })
                }
              />
              {profileDraft.stage === 'recovery' && (
                <div className="info-banner">
                  <Heart size={18} />
                  <p>
                    Pregnancy countdowns and baby prompts will stop. Your
                    earlier records stay in your journal.
                  </p>
                </div>
              )}
              {(profileDraft.stage === 'pregnancy' ||
                profileDraft.stage === 'postpartum') && (
                <>
                  <label htmlFor="mama-control-4" className="field">
                    <span>
                      {profileDraft.stage === 'pregnancy'
                        ? 'Estimated due date'
                        : 'Date of birth'}{' '}
                      <small>Optional if uncertain</small>
                    </span>
                    <Input
                      id="mama-control-4"
                      type="date"
                      max={
                        profileDraft.stage === 'postpartum'
                          ? currentDay
                          : undefined
                      }
                      value={profileDraft.date}
                      onChange={(e) =>
                        setProfileDraft({
                          ...profileDraft,
                          date: e.target.value,
                        })
                      }
                    />
                  </label>
                  {profileDraft.stage === 'pregnancy' && (
                    <Choice
                      label="Where did this date come from?"
                      value={profileDraft.dateSource}
                      options={{
                        estimate: 'My estimate',
                        clinician: 'Established by my clinician',
                      }}
                      onChange={(v) =>
                        setProfileDraft({
                          ...profileDraft,
                          dateSource: v as Profile['dateSource'],
                        })
                      }
                    />
                  )}
                </>
              )}
              <div className="form-divider" />
              <label htmlFor="mama-control-5" className="field">
                <span>
                  Healthcare contact or facility <small>Optional</small>
                </span>
                <Input
                  id="mama-control-5"
                  value={profileDraft.contactName}
                  maxLength={100}
                  onChange={(e) =>
                    setProfileDraft({
                      ...profileDraft,
                      contactName: e.target.value,
                    })
                  }
                  placeholder="Your clinic or maternity unit"
                />
              </label>
              <label htmlFor="mama-control-6" className="field">
                <span>
                  Verified phone number <small>Optional</small>
                </span>
                <Input
                  id="mama-control-6"
                  type="tel"
                  value={profileDraft.phone}
                  maxLength={30}
                  onChange={(e) =>
                    setProfileDraft({ ...profileDraft, phone: e.target.value })
                  }
                  placeholder="e.g. +234…"
                />
              </label>
              <p className="helper">
                Confirm that this number works and ask about after-hours care.
              </p>
              <Button type="submit" disabled={saving} className="primary-btn">
                {saving ? 'Saving…' : 'Save my journey'}
              </Button>
            </form>
          )}
          {modal === 'checkin' && checkinDraft && (
            <form
              className="mama-form"
              onSubmit={(e) => {
                e.preventDefault();
                void save(checkinDraft);
              }}
            >
              <label htmlFor="mama-control-7" className="field">
                <span>Date</span>
                <Input
                  id="mama-control-7"
                  type="date"
                  required
                  max={currentDay}
                  value={checkinDraft.date}
                  onChange={(e) =>
                    setCheckinDraft({ ...checkinDraft, date: e.target.value })
                  }
                />
              </label>
              <Choice
                label="How do you feel?"
                value={checkinDraft.mood}
                options={moodOptions}
                onChange={(v) => setCheckinDraft({ ...checkinDraft, mood: v })}
              />
              <fieldset>
                <legend>
                  What have you noticed? <small>Optional</small>
                </legend>
                <div className="symptom-choices">
                  {symptomOptions.map((s) => (
                    <label
                      htmlFor={`symptom-${s}`}
                      key={s}
                      className="check-label"
                    >
                      <Checkbox
                        id={`symptom-${s}`}
                        checked={checkinDraft.symptoms.includes(s)}
                        onCheckedChange={(v) =>
                          setCheckinDraft({
                            ...checkinDraft,
                            symptoms: v
                              ? [...checkinDraft.symptoms, s]
                              : checkinDraft.symptoms.filter((x) => x !== s),
                          })
                        }
                      />
                      {s}
                    </label>
                  ))}
                </div>
              </fieldset>
              <div className="form-two">
                <Choice
                  label="Bleeding"
                  value={checkinDraft.bleeding}
                  options={[
                    'Not recorded',
                    'None',
                    'Spotting',
                    'Light',
                    'Moderate',
                    'Heavy',
                  ]}
                  onChange={(v) =>
                    setCheckinDraft({ ...checkinDraft, bleeding: v })
                  }
                />
                <Choice
                  label="Pain"
                  value={checkinDraft.pain}
                  options={[
                    'Not recorded',
                    'None',
                    'Mild',
                    'Moderate',
                    'Severe',
                  ]}
                  onChange={(v) =>
                    setCheckinDraft({ ...checkinDraft, pain: v })
                  }
                />
              </div>
              <div className="info-banner">
                <CircleHelp size={18} />
                <p>
                  Severe symptoms or feeling unsafe?{' '}
                  <button
                    type="button"
                    className="underlined"
                    onClick={() => setModal('help')}
                  >
                    View urgent guidance now.
                  </button>{' '}
                  Saving a check-in does not alert a clinician.
                </p>
              </div>
              <label htmlFor="mama-control-8" className="field">
                <span>
                  Anything else? <small>Optional</small>
                </span>
                <Textarea
                  id="mama-control-8"
                  value={checkinDraft.notes}
                  maxLength={2000}
                  rows={3}
                  onChange={(e) =>
                    setCheckinDraft({ ...checkinDraft, notes: e.target.value })
                  }
                  placeholder="When it started, what changed, or what you want to ask…"
                />
              </label>
              <Button type="submit" disabled={saving} className="primary-btn">
                {saving ? 'Saving…' : 'Save check-in'}
              </Button>
            </form>
          )}
          {modal === 'period' && periodDraft && (
            <form
              className="mama-form"
              onSubmit={(e) => {
                e.preventDefault();
                void save(periodDraft);
              }}
            >
              <label htmlFor="mama-control-9" className="field">
                <span>First day of menstruation</span>
                <Input
                  id="mama-control-9"
                  type="date"
                  required
                  max={currentDay}
                  value={periodDraft.start}
                  onChange={(e) =>
                    setPeriodDraft({ ...periodDraft, start: e.target.value })
                  }
                />
              </label>
              <label htmlFor="mama-control-10" className="field">
                <span>
                  Last day <small>Leave blank if not known</small>
                </span>
                <Input
                  id="mama-control-10"
                  type="date"
                  min={periodDraft.start}
                  max={currentDay}
                  value={periodDraft.end}
                  onChange={(e) =>
                    setPeriodDraft({ ...periodDraft, end: e.target.value })
                  }
                />
              </label>
              <label htmlFor="mama-control-11" className="field">
                <span>
                  Notes <small>Optional</small>
                </span>
                <Textarea
                  id="mama-control-11"
                  rows={3}
                  maxLength={2000}
                  value={periodDraft.notes}
                  onChange={(e) =>
                    setPeriodDraft({ ...periodDraft, notes: e.target.value })
                  }
                />
              </label>
              <p className="helper">
                These dates describe your records. They do not confirm ovulation
                or identify safe days for contraception.
              </p>
              <Button type="submit" disabled={saving} className="primary-btn">
                {saving ? 'Saving…' : 'Save period'}
              </Button>
            </form>
          )}
          {modal === 'care' && careDraft && (
            <form
              className="mama-form"
              onSubmit={(e) => {
                e.preventDefault();
                void save(careDraft);
              }}
            >
              <label htmlFor="mama-control-12" className="field">
                <span>
                  {careDraft.type === 'task' ? 'Task' : 'Appointment title'}
                </span>
                <Input
                  id="mama-control-12"
                  required
                  maxLength={150}
                  value={careDraft.title}
                  onChange={(e) =>
                    setCareDraft({ ...careDraft, title: e.target.value })
                  }
                  placeholder={
                    careDraft.type === 'task'
                      ? 'What would you like to do?'
                      : 'e.g. Antenatal visit'
                  }
                />
              </label>
              <div className="form-two">
                <label htmlFor="mama-control-13" className="field">
                  <span>
                    Date {careDraft.type === 'task' && <small>Optional</small>}
                  </span>
                  <Input
                    id="mama-control-13"
                    type="date"
                    required={careDraft.type === 'appointment'}
                    value={careDraft.date}
                    onChange={(e) =>
                      setCareDraft({ ...careDraft, date: e.target.value })
                    }
                  />
                </label>
                {careDraft.type === 'appointment' && (
                  <label htmlFor="mama-control-14" className="field">
                    <span>
                      Time <small>Local time</small>
                    </span>
                    <Input
                      id="mama-control-14"
                      type="time"
                      value={careDraft.time}
                      onChange={(e) =>
                        setCareDraft({ ...careDraft, time: e.target.value })
                      }
                    />
                  </label>
                )}
              </div>
              {careDraft.type === 'appointment' && (
                <label htmlFor="mama-control-15" className="field">
                  <span>
                    Clinic or location <small>Optional</small>
                  </span>
                  <Input
                    id="mama-control-15"
                    value={careDraft.location}
                    maxLength={200}
                    onChange={(e) =>
                      setCareDraft({ ...careDraft, location: e.target.value })
                    }
                  />
                </label>
              )}
              <label htmlFor="mama-control-16" className="field">
                <span>
                  Questions & notes <small>Optional</small>
                </span>
                <Textarea
                  id="mama-control-16"
                  rows={4}
                  maxLength={2000}
                  value={careDraft.notes}
                  onChange={(e) =>
                    setCareDraft({ ...careDraft, notes: e.target.value })
                  }
                  placeholder="What do you want to discuss or remember?"
                />
              </label>
              <Button type="submit" disabled={saving} className="primary-btn">
                {saving
                  ? 'Saving…'
                  : careDraft.type === 'task'
                    ? 'Save task'
                    : 'Save appointment'}
              </Button>
            </form>
          )}
          {modal === 'help' && (
            <div className="help-content">
              <div className="urgent-box">
                <AlertTriangle size={24} />
                <div>
                  <h3>Seek emergency care now</h3>
                  <p>
                    For collapse, severe breathing difficulty, chest pain, heavy
                    bleeding, or severe persistent abdominal pain, go to
                    emergency care immediately. Ask someone to help you get
                    there safely.
                  </p>
                </div>
              </div>
              <section>
                <h3>During pregnancy or after birth</h3>
                <p>
                  Get immediate medical assessment for severe or persistent
                  headache, vision changes, fever, or marked one-sided limb pain
                  or swelling. If you may harm yourself or your baby, seek
                  immediate help and ask a trusted person to stay with you.
                </p>
                <a
                  href="https://www.cdc.gov/hearher/maternal-warning-signs/index.html"
                  target="_blank"
                  rel="noreferrer"
                >
                  Read CDC maternal warning signs <ArrowUpRight size={14} />
                </a>
              </section>
              <section>
                <h3>Baby moving less, bleeding, or waters breaking?</h3>
                <p>
                  Contact maternity services immediately. Do not wait until
                  tomorrow. Suspected labour before 37 weeks also needs
                  immediate contact.
                </p>
                <a
                  href="https://www.nhs.uk/pregnancy/labour-and-birth/signs-that-labour-has-begun/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Read NHS maternity guidance <ArrowUpRight size={14} />
                </a>
              </section>
              <section>
                <h3>Possible pregnancy with one-sided or shoulder-tip pain?</h3>
                <p>
                  Seek urgent assessment, even without a positive pregnancy
                  test. Sudden intense pain with dizziness or fainting is an
                  emergency.
                </p>
                <a
                  href="https://www.nhs.uk/conditions/ectopic-pregnancy/symptoms/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Read about ectopic warning signs <ArrowUpRight size={14} />
                </a>
              </section>
              <section>
                <h3>Unsure, or your symptom is not listed?</h3>
                <p>
                  This is not a complete list and cannot rule out a serious
                  problem. Contact a healthcare professional if you are worried.
                  If you cannot reach your usual clinician for an urgent
                  concern, seek care at an emergency facility.
                </p>
              </section>
              {profile.phone ? (
                <a
                  className="primary-btn call-button"
                  href={'tel:' + profile.phone.replace(/[^+\d]/g, '')}
                >
                  <Phone size={17} /> Call{' '}
                  {profile.contactName || 'my saved contact'}
                </a>
              ) : (
                <p className="helper">
                  No healthcare number is saved. Use your known local maternity
                  or emergency service; MAMA does not verify facility
                  availability.
                </p>
              )}
              <p className="helper">
                Source-linked education · Awaiting Nigerian clinical validation.
                Overseas sources may list phone numbers that do not apply in
                Nigeria.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={article !== null}
        onOpenChange={(open) => !open && setArticle(null)}
      >
        <DialogContent className="mama-dialog article-dialog">
          <DialogTitle>{article?.title}</DialogTitle>
          <DialogDescription>{article?.intro}</DialogDescription>
          {article && (
            <>
              <span className="article-category">{article.category}</span>
              {article.paragraphs.map((p) => (
                <p key={p}>{p}</p>
              ))}
              <div className="source-box">
                <BookOpen size={18} />
                <div>
                  <span>Source</span>
                  <a href={article.source} target="_blank" rel="noreferrer">
                    {article.sourceTitle} <ArrowUpRight size={15} />
                  </a>
                </div>
              </div>
              <p className="helper">
                Prepared 9 September 2026 · Local clinical approval pending.
                This guide does not assess your individual health.
              </p>
              <button
                className="text-btn"
                onClick={() => {
                  setArticle(null);
                  setModal('help');
                }}
              >
                When to get help <ArrowUpRight size={16} />
              </button>
            </>
          )}
        </DialogContent>
      </Dialog>
      <AlertDialog
        open={deletion !== null}
        onOpenChange={(v) => {
          if (!v && !saving) {
            setDeletion(null);
            setError('');
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogTitle>
            {deletion === 'all'
              ? 'Delete all your records?'
              : 'Delete this entry?'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {deletion === 'all'
              ? 'This removes your profile, journal and care plan from this app. Export a copy first if you want to keep it. This cannot be undone.'
              : 'This entry will be removed from your care space. This cannot be undone.'}
          </AlertDialogDescription>
          {error && (
            <p role="alert" className="danger-text">
              {error}
            </p>
          )}
          <div className="dialog-actions">
            <AlertDialogCancel disabled={saving}>
              Keep records
            </AlertDialogCancel>
            <Button
              className="delete-btn"
              disabled={saving}
              onClick={() => void remove()}
            >
              {saving ? 'Deleting…' : 'Delete'}
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarProvider>
  );
}
