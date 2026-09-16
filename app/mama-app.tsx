'use client';
import { useCallback, useEffect, useMemo, useRef, useState, useId } from 'react';
import {
  Heart,
  CalendarDays,
  BookOpen,
  ClipboardList,
  ShieldCheck,
  ArrowUpRight,
  Plus,
  Flower2,
  ChevronRight,
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
  UserRound,
  BellRing,
  Trophy,
  Sparkles,
  Clock3,
} from 'lucide-react';
import {
  SidebarProvider,
  Sidebar,
  SidebarTrigger,
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
  type CareQuestion,
  type Stage,
} from '@/lib/care-model';
import { articles, starterTasks, type Article } from '@/lib/education';
import { createClient as createSupabaseClient } from '@/lib/supabase/client';
import { careViews, MamaNavigation, type MamaView } from '@/components/mama/navigation';
import { MobileBottomNavigation } from '@/components/mama/mobile-bottom-navigation';
import { InsightCard } from '@/components/mama/insight-card';
import { HomeVisualPrototype, type HomeDesignState } from '@/components/mama/home-visual-prototype';
import { defaultEngagementPreferences, type EngagementData, type JourneyTask, type UserReminder } from '@/lib/engagement-model';
type View = MamaView;
type Modal = 'profile' | 'checkin' | 'period' | 'care' | 'question' | 'help' | 'reminder' | null;
const faces = ['😊', '🙂', '😐', '😔', '😣'];
const isLocalDevelopment = process.env.NODE_ENV === 'development';
const isDesignPreviewHost = (host: string, search: string) =>
  host.includes('-git-design-mymama-v2-') ||
  (host.endsWith('.vercel.app') && new URLSearchParams(search).get('mamaDesignPreview') === '1');
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
export default function MamaApp() {
  const [view, setView] = useState<View>('Today'),
    [records, setRecords] = useState<CareRecord[]>([]),
    [loading, setLoading] = useState(true),
    [loadError, setLoadError] = useState(''),
    [saving, setSaving] = useState(false),
    [error, setError] = useState(''),
    [notice, setNotice] = useState(''),
    [engagement, setEngagement] = useState<EngagementData>({ preferences: defaultEngagementPreferences, tasks: [], reminders: [], achievements: [], notifications: [] }),
    [engagementReady, setEngagementReady] = useState(true),
    [demoData, setDemoData] = useState(false),
    [demoCleared, setDemoCleared] = useState(false),
    [developmentHomeState, setDevelopmentHomeState] = useState<HomeDesignState>('cycle'),
    [homeDesignPreviewEnabled, setHomeDesignPreviewEnabled] = useState(isLocalDevelopment);
  const [modal, setModal] = useState<Modal>(null),
    [article, setArticle] = useState<Article | null>(null),
    [deletion, setDeletion] = useState<string | null>(null),
    [query, setQuery] = useState(''),
    [learnFilter, setLearnFilter] = useState('All'),
    [journalTab, setJournalTab] = useState('checkins');
  const [profileDraft, setProfileDraft] = useState<Profile>(emptyProfile),
    [checkinDraft, setCheckinDraft] = useState<Checkin | null>(null),
    [periodDraft, setPeriodDraft] = useState<Period | null>(null),
    [careDraft, setCareDraft] = useState<CareItem | null>(null),
    [questionDraft, setQuestionDraft] = useState<CareQuestion | null>(null),
    [reminderDraft, setReminderDraft] = useState<UserReminder | null>(null);
  const [includeNotes, setIncludeNotes] = useState(false),
    [currentDay, setCurrentDay] = useState(today());
  const heading = useRef<HTMLHeadingElement>(null),
    busy = useRef(false);
  const profile =
    records.find((r): r is Profile => r.kind === 'profile') || emptyProfile;
  useEffect(() => {
    // Vercel Preview builds use NODE_ENV=production. Limit the temporary state
    // switcher to this design branch's preview URL while keeping it off production.
    if (typeof window !== 'undefined' && isDesignPreviewHost(window.location.hostname, window.location.search)) {
      setHomeDesignPreviewEnabled(true);
    }
  }, []);
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
  const questions = records
    .filter((r): r is CareQuestion => r.kind === 'question')
    .sort((a, b) => a.status.localeCompare(b.status));
  const todayCheck = checkins.find((c) => c.date === currentDay);
  const metric = journeyMetric(profile, currentDay),
    stats = cycleStats(periods, currentDay);
  const cycleMode =
    profile.stage === 'cycle' || profile.stage === 'preconception';
  const actualHomeDesignState: HomeDesignState | null =
    profile.stage === 'pregnancy'
      ? 'pregnancy'
      : profile.stage === 'postpartum'
        ? 'postpartum'
        : profile.stage === 'cycle' || profile.stage === 'preconception'
          ? 'cycle'
          : null;
  const homeDesignState = homeDesignPreviewEnabled
    ? developmentHomeState
    : actualHomeDesignState;
  const relevant = articles
    .filter((a) => a.stages.includes(profile.stage))
    .slice(0, 3);
  const go = useCallback((v: View) => {
    setView(v);
    setArticle(null);
    setTimeout(() => heading.current?.focus(), 0);
  }, []);
  const load = useCallback(() => {
    return fetch('/api/demo', { cache: 'no-store' })
      .then(async (demoResponse) => {
        const demo = await demoResponse.json() as { isDemo?: boolean; cleared?: boolean };
        if (!demoResponse.ok) throw new Error('Could not prepare your care space.');
        setDemoData(Boolean(demo.isDemo));
        setDemoCleared(Boolean(demo.cleared));
        return Promise.all([fetch('/api/records', { cache: 'no-store' }), fetch('/api/engagement', { cache: 'no-store' })]);
      })
      .then(async ([recordsResponse, engagementResponse]) => {
        const recordsData = await recordsResponse.json() as { records?: CareRecord[]; error?: string };
        const engagementData = await engagementResponse.json() as { engagement?: EngagementData; error?: string };
        if (!recordsResponse.ok) throw new Error(recordsData.error || 'Could not load your records.');
        return { records: recordsData.records || [], engagement: engagementData.engagement || { preferences: defaultEngagementPreferences, tasks: [], reminders: [], achievements: [], notifications: [] }, engagementReady: engagementResponse.ok };
      })
      .then((data) => { setRecords(data.records); setEngagement(data.engagement); setEngagementReady(data.engagementReady); setLoading(false); })
      .catch((e: unknown) => { setLoadError(e instanceof Error ? e.message : 'Could not load your care space.'); setLoading(false); });
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
  const activeTasks = engagement.tasks.filter((task) => task.status !== 'dismissed');
  const completedTasks = activeTasks.filter((task) => task.status === 'completed');
  const taskProgress = activeTasks.length ? Math.round((completedTasks.length / activeTasks.length) * 100) : 0;
  const sensitiveJourney = profile.stage === 'recovery';
  const journeyTimeline = (() => {
    const hasCheckins = checkins.length > 0;
    const hasTasks = activeTasks.length > 0;
    const hasCareNote = appointments.length > 0 || questions.length > 0;
    const byStage = {
      cycle: [
        ['Your recorded rhythm', hasCheckins ? 'Check-ins saved in your private journal.' : 'Start with any observation that feels useful.', hasCheckins],
        ['Your chosen care', hasTasks ? `${completedTasks.length} of ${activeTasks.length} chosen steps complete.` : 'Choose a practical step when it would help.', hasTasks],
        ['Your next conversation', hasCareNote ? 'Keep an appointment or a question close at hand.' : 'Save a question whenever you want to remember it.', hasCareNote],
      ],
      pregnancy: [
        ['Your pregnancy record', hasCheckins ? 'Your recorded check-ins stay in your private space.' : 'Record only what you want to keep close.', hasCheckins],
        ['Your care choices', hasTasks ? `${completedTasks.length} of ${activeTasks.length} chosen steps complete.` : 'Choose preparation steps at your own pace.', hasTasks],
        ['Your next conversation', hasCareNote ? 'Your appointment and question notes are ready when you are.' : 'Keep a question ready for your care conversation.', hasCareNote],
      ],
      postpartum: [
        ['Your recovery record', hasCheckins ? 'Your recorded check-ins stay in your private space.' : 'Begin with what feels meaningful today.', hasCheckins],
        ['Your support plan', hasTasks ? `${completedTasks.length} of ${activeTasks.length} chosen steps complete.` : 'Add a small support or follow-up step when useful.', hasTasks],
        ['Your next conversation', hasCareNote ? 'Your appointment and question notes are ready when you are.' : 'Keep a question ready for your care conversation.', hasCareNote],
      ],
      preconception: [
        ['Your private record', hasCheckins ? 'Your recorded check-ins stay in your private space.' : 'Start with any observation that feels useful.', hasCheckins],
        ['Your chosen preparation', hasTasks ? `${completedTasks.length} of ${activeTasks.length} chosen steps complete.` : 'Choose a practical step when it would help.', hasTasks],
        ['Your next conversation', hasCareNote ? 'Your appointment and question notes are ready when you are.' : 'Save a question whenever you want to remember it.', hasCareNote],
      ],
      none: [
        ['Your private space', hasCheckins ? 'Your recorded check-ins stay in your private space.' : 'Choose a journey when you are ready.', hasCheckins],
        ['Your chosen care', hasTasks ? `${completedTasks.length} of ${activeTasks.length} chosen steps complete.` : 'Add a practical step whenever one feels useful.', hasTasks],
        ['Your next conversation', hasCareNote ? 'Your appointment and question notes are ready when you are.' : 'Save a question whenever you want to remember it.', hasCareNote],
      ],
      recovery: [],
    } as const;
    return byStage[profile.stage];
  })();
  const insightPoints = useMemo(() => checkins.slice(0, 7).reverse().map((checkin) => ({ label: new Date(checkin.date + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'short' }), value: 1, detail: `${checkin.mood} check-in` })), [checkins]);
  async function updateEngagement(kind: 'preferences' | 'task' | 'reminder', value: unknown) {
    const res = await fetch('/api/engagement', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind, value }) });
    const data = await res.json() as { engagement?: EngagementData; error?: string };
    if (!res.ok || !data.engagement) throw new Error(data.error || 'Could not save this setting.');
    setEngagement(data.engagement);
  }
  async function toggleJourneyTask(task: JourneyTask) {
    try { await updateEngagement('task', { ...task, status: task.status === 'completed' ? 'available' : 'completed' }); setNotice(task.status === 'completed' ? 'Task reopened.' : 'A thoughtful step, saved.'); }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not update task.'); }
  }
  function openReminder(existing?: UserReminder) {
    setReminderDraft(existing ? { ...existing } : { id: crypto.randomUUID(), title: '', remindAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(), active: true, completedAt: null });
    setError(''); setModal('reminder');
  }
  function openProfile() {
    setProfileDraft({ ...profile });
    setError('');
    setModal('profile');
  }
  function openQuestion(existing?: CareQuestion, initialQuestion = '') {
    setQuestionDraft(
      existing
        ? { ...existing }
        : { kind: 'question', id: crypto.randomUUID(), question: initialQuestion, status: 'open' },
    );
    setError('');
    setModal('question');
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
  async function clearSampleData() {
    if (busy.current) return;
    busy.current = true;
    setSaving(true);
    setError('');
    try {
      const response = await fetch('/api/demo', { method: 'DELETE' });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error || 'Could not remove sample data.');
      setDemoData(false);
      setDemoCleared(true);
      setRecords([]);
      setEngagement({ preferences: defaultEngagementPreferences, tasks: [], reminders: [], achievements: [], notifications: [] });
      setNotice('Sample data removed. Your care space is ready for your own records.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not remove sample data.');
    } finally {
      busy.current = false;
      setSaving(false);
    }
  }
  async function signOut() {
    const { error } = await createSupabaseClient().auth.signOut();
    if (error) { setError('Could not sign out. Please try again.'); return; }
    location.assign('/sign-in');
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
        properties: { view: { type: 'string', enum: careViews.map((x) => x[0]) } },
        required: ['view'],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false },
      execute: async (input: unknown) => {
        const v = (input as { view?: unknown })?.view;
        if (typeof v !== 'string' || !careViews.some((x) => x[0] === v))
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
        <MamaNavigation view={view} onNavigate={go} />
      </Sidebar>
      <main id="main-content" className="app-main" tabIndex={-1}>
        <header className="topbar">
          <div className="topbar-title">
            <SidebarTrigger />
            <span>Your daily companion</span>
          </div>
          <div className="topbar-actions">
            <button className="account-link" onClick={() => go('Settings')}>
              <UserRound size={17} /> Profile & privacy
            </button>
            <button
              className="help-link"
              onClick={() => {
                setError('');
                setModal('help');
              }}
            >
              <CircleHelp size={17} /> When to get help <ArrowUpRight size={15} />
            </button>
          </div>
        </header>
        <div className="page">
          <div className="page-heading">
            <div>
              <p className="eyebrow">
                {view === 'Today'
                  ? 'A MOMENT FOR YOU'
                  : view === 'Settings'
                    ? 'ON YOUR TERMS'
                    : view === 'Journey'
                      ? 'YOUR MAMA JOURNEY'
                      : view === 'Ask MAMA'
                        ? 'PREPARE FOR YOUR CARE CONVERSATION'
                        : 'YOUR PERSONAL CARE SPACE'}
              </p>
              <h1 tabIndex={-1} ref={heading}>
                {view === 'Today'
                  ? profile.name
                    ? `Hello, ${profile.name}`
                    : 'Welcome to your space'
                  : view === 'Settings'
                    ? 'My profile & privacy'
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
                          : view === 'Journey'
                            ? sensitiveJourney ? 'Your pace is enough. We have paused celebratory prompts.' : 'Small, constructive steps that are yours to choose.'
                            : view === 'Ask MAMA'
                              ? 'Save questions and prepare. MAMA does not diagnose or send messages for you.'
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
          {!loading && !loadError && !engagementReady && (
            <div className="engagement-pending" role="status">MAMA’s new journey tools are being prepared for this preview. Your existing care records remain available.</div>
          )}
          {!loading && !loadError && demoData && (
            <div className="engagement-pending" role="status"><b>Sample care experience</b> — these clearly labelled example records are private to this account and can be removed in My Care.</div>
          )}
          {loading ? (
            <div
              className="loading-grid loading-v2"
              aria-label="Loading your care records"
              aria-busy="true"
            >
              <section className="loading-v2-hero">
                <Skeleton className="loading-v2-label" />
                <Skeleton className="loading-v2-title" />
                <Skeleton className="loading-v2-copy" />
                <Skeleton className="loading-v2-action" />
              </section>
              <section className="loading-v2-side">
                <Skeleton className="loading-v2-orbit" />
                <Skeleton className="loading-v2-copy short" />
              </section>
              <Skeleton className="loading-v2-card" />
              <Skeleton className="loading-v2-card" />
              <Skeleton className="loading-v2-card" />
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
                homeDesignState ? (
                  <HomeVisualPrototype
                    state={homeDesignState}
                    displayName={profile.name}
                    metric={metric}
                    cycleDay={stats.day}
                    hasCheckin={Boolean(todayCheck)}
                    appointment={pending.length ? pending[0] : null}
                    preview={homeDesignPreviewEnabled}
                    showDevelopmentSwitcher={homeDesignPreviewEnabled}
                    onDevelopmentStateChange={setDevelopmentHomeState}
                    onLogCheckin={() => openCheckin()}
                    onLogPeriod={() => openPeriod()}
                    onUpdateJourney={openProfile}
                    onOpenCare={() => go('My care')}
                    onOpenJournal={() => go('My journal')}
                    onOpenLearn={() => go('Learn')}
                  />
                ) : (
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
                )
              )}
              {view === 'My journal' && (
                <div className="journal-v2">
                  <section className="journal-v2-hero">
                    <div>
                      <span className="journal-v2-eyebrow"><BookOpen size={15} /> YOUR PRIVATE JOURNAL</span>
                      <h2>Keep the details that help you tell your story.</h2>
                      <p>Record only what feels useful. Entries stay private to your signed-in care space.</p>
                    </div>
                    <div className="journal-v2-hero-actions">
                      <span><b>{checkins.length}</b> check-in{checkins.length === 1 ? '' : 's'} recorded</span>
                      <button className="white-btn" onClick={() => openCheckin()}><Plus size={16} /> Add a check-in</button>
                    </div>
                  </section>
                  <section className="journal-v2-quick-actions" aria-label="Quick private tracking actions">
                    <button type="button" onClick={() => openCheckin()}>
                      <span className="journal-v2-quick-icon checkin"><Heart size={18} /></span>
                      <span><b>Make a check-in</b><small>Notice your day in your own words.</small></span>
                      <Plus size={18} aria-hidden="true" />
                    </button>
                    <button type="button" onClick={() => { setJournalTab('periods'); openPeriod(); }}>
                      <span className="journal-v2-quick-icon period"><CalendarDays size={18} /></span>
                      <span><b>Record period dates</b><small>Add dates you want to keep track of.</small></span>
                      <Plus size={18} aria-hidden="true" />
                    </button>
                    <button type="button" onClick={() => openReminder()}>
                      <span className="journal-v2-quick-icon reminder"><BellRing size={18} /></span>
                      <span><b>Set a gentle reminder</b><small>Create a private prompt for yourself.</small></span>
                      <Plus size={18} aria-hidden="true" />
                    </button>
                  </section>
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
                      <div className="card list-card journal-v2-list">
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
                      <div className="metric-grid journal-v2-metrics">
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
                      <p className="helper spaced journal-v2-disclaimer">
                        Summaries describe your entries, not a diagnosis or a
                        fertility prediction. Missing periods can distort
                        averages. Postpartum bleeding should be recorded in
                        check-ins, separately from periods.
                      </p>
                      <div className="section-title spaced journal-v2-record-heading">
                        <h2>Period records</h2>
                        <button
                          className="outline-btn"
                          onClick={() => openPeriod()}
                        >
                          <Plus size={16} /> Log a period
                        </button>
                      </div>
                      <div className="card list-card journal-v2-list">
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
                </div>
              )}
              {view === 'My care' && (
                <div className="care-v2">
                  <section className="care-v2-hero">
                    <div>
                      <span><CalendarDays size={15} /> YOUR CARE PLAN</span>
                      <h2>Keep your next conversation within reach.</h2>
                      <p>Appointments, questions and practical tasks in one private place.</p>
                    </div>
                    <button className="white-btn" onClick={() => openCare()}><Plus size={16} /> Add appointment</button>
                  </section>
                  <div className="care-columns care-v2-columns">
                    <section className="card care-v2-appointments">
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
                    <section className="card care-v2-checklist">
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
                  <section className="card questions-card care-v2-questions">
                    <div className="section-title">
                      <div>
                        <h2>Questions for your next visit</h2>
                        <p className="helper">A private prompt list for your own conversation. It is not sent to a clinician.</p>
                      </div>
                      <button className="outline-btn" onClick={() => openQuestion()}>
                        <Plus size={16} /> Add question
                      </button>
                    </div>
                    {questions.length ? (
                      <div className="question-list">
                        {questions.map((question) => (
                          <div className="record-row" key={question.id}>
                            <CircleHelp size={19} className="question-icon" />
                            <div className="record-body">
                              <h3>{question.question}</h3>
                              <p>{question.status === 'open' ? 'Open question' : question.status === 'answered' ? 'Marked answered' : 'Closed'}</p>
                            </div>
                            <button className="icon-button" aria-label="Edit question" onClick={() => openQuestion(question)}>
                              <Pencil size={16} />
                            </button>
                            <button className="icon-button" aria-label="Delete question" onClick={() => { setError(''); setDeletion(question.id); }}>
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="spaced">Save questions as they come to mind, ready for a future appointment.</p>
                    )}
                  </section>
                  <section className="card contact-card care-v2-contact">
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
                </div>
              )}
              {view === 'Learn' && (
                <div className="learn-v2">
                  <section className="learn-v2-hero">
                    <span><BookOpen size={15} /> MAMA LEARNING LIBRARY</span>
                    <h2>Clear information for the questions you are carrying.</h2>
                    <p>Evidence-linked reading to support a conversation with your care team—not a diagnosis or a symptom assessment.</p>
                  </section>
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
                  <div className="info-banner learn-v2-note">
                    <BookOpen size={18} />
                    <p>
                      Evidence-linked reading. These summaries await local
                      clinical approval; they do not assess your symptoms.
                    </p>
                  </div>
                  <div className="article-grid library-grid learn-v2-library">
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
                </div>
              )}
              {view === 'Care summary' && (
                <div className="summary-v2">
                  <section className="summary-v2-hero">
                    <div><span><ClipboardList size={15} /> YOUR PERSONAL SUMMARY</span><h2>Bring your own record into a care conversation.</h2><p>Review the information before sharing. It remains your user-entered record, not a verified clinical file.</p></div>
                    <ShieldCheck size={42} strokeWidth={1.25} />
                  </section>
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
                  <article className="card print-summary summary-v2-sheet">
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
                </div>
              )}
              {view === 'Journey' && (
                <div className="journey-experience journey-v2">
                  <section className={'journey-progress-card journey-v2-hero ' + (sensitiveJourney ? 'quiet' : '')}>
                    <div>
                      <span className="pill light"><Sparkles size={15} /> {sensitiveJourney ? 'YOUR SPACE, YOUR PACE' : stages[profile.stage].toUpperCase()}</span>
                      <h2>{sensitiveJourney ? 'There is no timeline to keep.' : 'A journey shaped around your own next steps.'}</h2>
                      <p>{sensitiveJourney ? 'Celebrations, streaks and journey prompts are paused. Keep only what feels useful.' : 'MAMA rewards preparation, tracking, learning and follow-up — never a medical outcome.'}</p>
                      {!sensitiveJourney && <div className="journey-v2-meta" aria-label="Your private journey activity"><span>{checkins.length} check-in{checkins.length === 1 ? '' : 's'} recorded</span><span>{completedTasks.length} step{completedTasks.length === 1 ? '' : 's'} complete</span><span>Private by default</span></div>}
                    </div>
                    <div className="progress-orb" style={{ '--progress': `${taskProgress * 3.6}deg` } as React.CSSProperties}><b>{taskProgress}%</b><span>chosen steps</span></div>
                  </section>
                  {!sensitiveJourney && <section className="journey-v2-timeline" aria-labelledby="journey-timeline-title"><div className="journey-v2-timeline-heading"><div><span>YOUR JOURNEY, AT YOUR PACE</span><h2 id="journey-timeline-title">A private path shaped by your choices</h2></div><p>Nothing here predicts an outcome or asks you to keep up.</p></div><ol>{journeyTimeline.map(([title, description, complete], index) => <li className={complete ? 'complete' : ''} key={title}><span aria-hidden="true">{complete ? '✓' : index + 1}</span><div><b>{title}</b><p>{description}</p></div></li>)}</ol></section>}
                  <div className="journey-v2-section-heading"><div><span>YOUR PERSONAL VIEW</span><h2>Notice what you have recorded</h2></div><p>These visuals describe entries and chosen actions. They are never a clinical score.</p></div>
                  <div className="insights-grid journey-v2-insights">
                    <InsightCard title="Check-in rhythm" description="A view of entries you recorded." points={insightPoints} empty="Log a check-in to begin a private pattern view." footer="Recorded check-ins only. This is not a wellbeing or diagnostic score." />
                    <InsightCard title={profile.stage === 'pregnancy' ? 'Journey progression' : profile.stage === 'postpartum' ? 'Postpartum timeline' : 'Cycle history'} description={metric ? metric.detail : stats.day ? `Day ${stats.day} from your latest recorded period.` : 'MAMA will only display dates you choose to record.'} points={metric ? [{ label: 'Today', value: 1, detail: `${metric.value} ${metric.label}` }] : periods.slice(0, 6).reverse().map((period) => ({ label: new Date(period.start + 'T12:00:00').toLocaleDateString('en-GB', { month: 'short' }), value: 1, detail: `Period start recorded ${prettyDate(period.start)}` }))} valueLabel={metric ? 'Estimated' : 'Recorded'} empty="No recorded timeline yet." footer={metric ? 'Estimated from the date you entered. It is not a clinical assessment.' : 'Recorded information only. MAMA does not predict fertility.'} />
                    <InsightCard title="Care actions" description="The practical things you chose to prepare." points={activeTasks.map((task) => ({ label: task.category.replace('_', ' '), value: task.status === 'completed' ? 1 : 0.35, detail: task.title }))} empty="Add a task below when a step would help you feel prepared." footer="Progress is private and can be paused at any time." />
                  </div>
                  <section className="card journey-tasks-card journey-v2-tasks">
                    <div className="section-title"><div><p className="eyebrow">GENTLE CONSISTENCY</p><h2>Your chosen steps</h2></div><span className="task-count">{completedTasks.length}/{activeTasks.length || 0}</span></div>
                    {activeTasks.length ? <div className="task-list">{activeTasks.map((task) => <label className={'journey-task ' + task.status} key={task.id}><Checkbox checked={task.status === 'completed'} onCheckedChange={() => void toggleJourneyTask(task)} aria-label={`Mark ${task.title} ${task.status === 'completed' ? 'incomplete' : 'complete'}`} /><span><b>{task.title}</b><small>{task.description || task.category.replace('_', ' ')}</small></span>{engagement.preferences.pointsEnabled && <em>+{task.pointsAwarded || 1} MAMA point{task.pointsAwarded === 1 ? '' : 's'}</em>}</label>)}</div> : <Blank title="Choose your first helpful step" description="Add a personal task for tracking, learning, preparation or follow-up." action={<button className="outline-btn" onClick={() => openCare('task')}>Add a care task</button>} />}
                  </section>
                  {!sensitiveJourney && <section className="achievement-strip journey-v2-milestone"><Trophy /><div><span>YOUR CARE MOMENTS</span><h2>{engagement.achievements.length ? 'Small actions, thoughtfully noticed.' : 'Your care moments will appear here'}</h2><p>{engagement.achievements.length ? engagement.achievements.map((achievement) => achievement.title).join(' · ') : 'MAMA recognises practical care actions, never medical outcomes.'}</p></div></section>}
                </div>
              )}
              {view === 'Ask MAMA' && (
                <div className="ask-mama-grid ask-v2">
                  <section className="card ask-mama-intro ask-v2-intro">
                    <span className="icon-box"><CircleHelp /></span>
                    <span className="ask-v2-label">ASK MAMA</span>
                    <h2>What&apos;s on your mind?</h2>
                    <p>Turn a thought into a private question for your next care conversation. MAMA does not diagnose or replace a clinician.</p>
                    <div className="ask-v2-prompts" aria-label="Suggested question prompts">
                      {(profile.stage === 'pregnancy'
                        ? ['What is changing this week?', 'Help me prepare for my appointment.', 'What should I ask my clinician?']
                        : profile.stage === 'postpartum'
                          ? ['What support would feel useful this week?', 'Help me prepare for my follow-up.', 'What should I ask my clinician?']
                          : ['What have I noticed in my cycle?', 'Help me prepare for an appointment.', 'What should I ask my clinician?']
                      ).map((prompt) => <button type="button" key={prompt} onClick={() => openQuestion(undefined, prompt)}>{prompt}<ArrowUpRight size={14} /></button>)}
                    </div>
                    <button className="primary-btn spaced" onClick={() => openQuestion()}><Plus size={16} /> Write my own question</button>
                  </section>
                  <section className="card ask-v2-questions"><div className="section-title"><div><span className="ask-v2-label">YOUR QUESTIONS</span><h2>Your saved questions</h2></div><button className="text-btn" onClick={() => openQuestion()}>Add <Plus size={15} /></button></div>{questions.length ? <div className="question-list">{questions.map((question) => <div className="question-row" key={question.id}><div><span className="pill">{question.status}</span><p>{question.question}</p></div><button className="icon-button" aria-label="Edit question" onClick={() => openQuestion(question)}><Pencil size={16} /></button></div>)}</div> : <Blank title="Nothing saved yet" description="A question can help make a future care conversation feel clearer." />}</section>
                  <section className="card wide ask-v2-guide"><span className="ask-v2-label">HOW MAMA SUPPORTS YOU</span><h2>Use your records to prepare, not to self-diagnose.</h2><div className="ask-guides"><div><BookOpen /><b>Learn</b><span>Explore reviewed information and note what you want to discuss.</span></div><div><ClipboardList /><b>Summarise</b><span>Bring your own recorded details to a care conversation.</span></div><div><Phone /><b>Seek care</b><span>Use urgent-care guidance when something feels seriously wrong.</span></div></div></section>
                </div>
              )}
              {view === 'Settings' && (
                <div className="settings-grid settings-v2">
                  <section className="card wide settings-v2-profile-header">
                    <div className="settings-v2-avatar" aria-hidden="true">{profile.name.trim().slice(0, 1).toUpperCase() || 'M'}</div>
                    <div>
                      <span>MY HEALTH IDENTITY</span>
                      <h2>{profile.name ? profile.name : 'Your MAMA space'}</h2>
                      <p>{stages[profile.stage]} · Your records are private to your signed-in account.</p>
                    </div>
                    <button className="outline-btn" onClick={openProfile}><Pencil size={16} /> Edit profile</button>
                  </section>
                  <section className="card settings-v2-journey">
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
                  <section className="card settings-v2-notifications">
                    <BellRing size={23} />
                    <h2 className="spaced">Notifications, your way</h2>
                    <p>By default, lock-screen reminders stay discreet and never display health details.</p>
                    <div className="preference-list">
                      <label><span>Discreet lock-screen messages</span><Checkbox checked={engagement.preferences.discreetNotifications} onCheckedChange={(checked) => void updateEngagement('preferences', { ...engagement.preferences, discreetNotifications: !!checked }).catch((e) => setError(e instanceof Error ? e.message : 'Could not save preference.'))} /></label>
                      <label><span>Weekly private recap</span><Checkbox checked={engagement.preferences.weeklyRecapEnabled} onCheckedChange={(checked) => void updateEngagement('preferences', { ...engagement.preferences, weeklyRecapEnabled: !!checked }).catch((e) => setError(e instanceof Error ? e.message : 'Could not save preference.'))} /></label>
                      <label><span>Optional MAMA Points</span><Checkbox checked={engagement.preferences.pointsEnabled} onCheckedChange={(checked) => void updateEngagement('preferences', { ...engagement.preferences, pointsEnabled: !!checked }).catch((e) => setError(e instanceof Error ? e.message : 'Could not save preference.'))} /></label>
                    </div>
                    <button className="outline-btn spaced" disabled={!engagementReady} onClick={() => openReminder()}><Clock3 size={16} /> Add a private reminder</button>
                    <p className="helper">Push delivery needs your browser permission. No clinical details are placed in notification payloads.</p>
                  </section>
                  <section className="card settings-v2-demo">
                    <Sparkles size={23} />
                    <h2 className="spaced">Sample care experience</h2>
                    {demoData ? <>
                      <p>You are viewing clearly labelled example records so you can explore MAMA’s charts, tasks and care views. They are not health information and are private to this account.</p>
                      <button className="outline-btn danger-text spaced" disabled={saving} onClick={() => void clearSampleData()}><Trash2 size={16} /> {saving ? 'Removing…' : 'Clear sample data'}</button>
                    </> : <p>{demoCleared ? 'Sample data has been removed. Add your own records whenever you are ready.' : 'Your care space starts with the records you choose to add.'}</p>}
                  </section>
                  <section className="card settings-v2-privacy">
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
                      <button className="text-btn" onClick={() => void signOut()}>
                        <LogOut size={16} /> Sign out
                      </button>
                    </div>
                    <p className="helper">
                      Downloaded files may contain sensitive information. Keep
                      them somewhere private.
                    </p>
                  </section>
                  <section className="card wide settings-v2-about">
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
      <MobileBottomNavigation view={view} onNavigate={go} />
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
                    : modal === 'question'
                      ? 'Question for your next visit'
                      : modal === 'reminder'
                        ? 'A private reminder'
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
                    : modal === 'question'
                      ? 'Save a question for your own conversation with a health professional. MAMA will not send it to anyone.'
                      : modal === 'reminder'
                        ? 'Use a general title. MAMA avoids showing health details in notifications.'
                        : 'If something feels seriously wrong, seek care now. Do not wait for an app response.'}
          </DialogDescription>
          {error && (
            <div className="error-banner" role="alert">
              {error}
            </div>
          )}
          {modal === 'reminder' && reminderDraft && (
            <form className="mama-form" onSubmit={(e) => { e.preventDefault(); void updateEngagement('reminder', reminderDraft).then(() => { setModal(null); setNotice('Private reminder saved.'); }).catch((err) => setError(err instanceof Error ? err.message : 'Could not save reminder.')); }}>
              <label htmlFor="mama-reminder-title" className="field"><span>Reminder title</span><Input id="mama-reminder-title" required maxLength={120} value={reminderDraft.title} onChange={(e) => setReminderDraft({ ...reminderDraft, title: e.target.value })} placeholder="For example: A moment for my care list" /></label>
              <label htmlFor="mama-reminder-time" className="field"><span>When</span><Input id="mama-reminder-time" type="datetime-local" required value={reminderDraft.remindAt.slice(0, 16)} onChange={(e) => setReminderDraft({ ...reminderDraft, remindAt: new Date(e.target.value).toISOString() })} /></label>
              <div className="dialog-actions"><Button className="primary-btn" disabled={saving}>Save reminder</Button></div>
            </form>
          )}
          {modal === 'question' && questionDraft && (
            <form
              className="mama-form"
              onSubmit={(e) => {
                e.preventDefault();
                void save(questionDraft);
              }}
            >
              <label htmlFor="mama-question" className="field">
                <span>Your question</span>
                <Textarea
                  id="mama-question"
                  required
                  maxLength={2000}
                  value={questionDraft.question}
                  onChange={(e) => setQuestionDraft({ ...questionDraft, question: e.target.value })}
                  placeholder="For example: What should I ask about at my next visit?"
                />
              </label>
              <Choice
                label="Status"
                value={questionDraft.status}
                options={{ open: 'Open', answered: 'Answered', closed: 'Closed' }}
                onChange={(status) => setQuestionDraft({ ...questionDraft, status: status as CareQuestion['status'] })}
              />
              <Button type="submit" disabled={saving} className="primary-btn">
                {saving ? 'Saving…' : 'Save question'}
              </Button>
            </form>
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
