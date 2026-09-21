'use client';
import { useCallback, useEffect, useRef, useState, useId } from 'react';
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
import { type Investigation, type Medication } from '@/lib/care-details-model';
type View = MamaView;
type Modal = 'profile' | 'checkin' | 'period' | 'care' | 'question' | 'help' | 'reminder' | 'medication' | 'investigation' | null;
type SharingPermission = { id: string; provider_user_id: string; scopes: string[]; granted_at: string; expires_at: string | null; revoked_at: string | null };
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
    [engagement, setEngagement] = useState<EngagementData>({ preferences: defaultEngagementPreferences, tasks: [], reminders: [], achievements: [], notifications: [], transitions: [] }),
    [engagementReady, setEngagementReady] = useState(true),
    [careMode, setCareMode] = useState<'account' | 'demo'>('account'),
    [demoAvailable, setDemoAvailable] = useState(false),
    [demoHidden, setDemoHidden] = useState(false),
    [demoDeleted, setDemoDeleted] = useState(false),
    [pushSubscribed, setPushSubscribed] = useState(false),
    [pushStatus, setPushStatus] = useState(''),
    [sharingPermissions, setSharingPermissions] = useState<SharingPermission[]>([]),
    [medications, setMedications] = useState<Medication[]>([]),
    [investigations, setInvestigations] = useState<Investigation[]>([]),
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
    [reminderDraft, setReminderDraft] = useState<UserReminder | null>(null),
    [medicationDraft, setMedicationDraft] = useState<Medication | null>(null),
    [investigationDraft, setInvestigationDraft] = useState<Investigation | null>(null);
  const [includeNotes, setIncludeNotes] = useState(false),
    [currentDay, setCurrentDay] = useState(today());
  const heading = useRef<HTMLHeadingElement>(null),
    busy = useRef(false);
  const profile =
    records.find((r): r is Profile => r.kind === 'profile') || emptyProfile;
  useEffect(() => {
    // Vercel Preview builds use NODE_ENV=production. Limit the temporary state
    // switcher to this design branch's preview URL while keeping it off production.
    if (typeof window === 'undefined' || !isDesignPreviewHost(window.location.hostname, window.location.search)) return;
    const frame = window.requestAnimationFrame(() => setHomeDesignPreviewEnabled(true));
    return () => window.cancelAnimationFrame(frame);
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
    ['first_period', 'cycle', 'reproductive_health', 'preconception', 'trying_to_conceive', 'perimenopause', 'menopause'].includes(profile.stage);
  const actualHomeDesignState: HomeDesignState | null =
    profile.stage === 'pregnancy'
      ? 'pregnancy'
      : profile.stage === 'postpartum'
        ? 'postpartum'
        : ['first_period', 'cycle', 'reproductive_health', 'preconception', 'trying_to_conceive', 'perimenopause', 'menopause'].includes(profile.stage)
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
  const load = useCallback((requestedMode?: 'account' | 'demo') => {
    return fetch('/api/demo', { cache: 'no-store' })
      .then(async (demoResponse) => {
        const demo = await demoResponse.json() as { available?: boolean; hidden?: boolean; deleted?: boolean; activeMode?: 'account' | 'demo' };
        if (!demoResponse.ok) throw new Error('Could not load your care-space settings.');
        const mode = requestedMode === 'demo' && demo.available && !demo.hidden ? 'demo' : requestedMode || demo.activeMode || 'account';
        setCareMode(mode);
        setDemoAvailable(Boolean(demo.available));
        setDemoHidden(Boolean(demo.hidden));
        setDemoDeleted(Boolean(demo.deleted));
        const query = mode === 'demo' ? '?mode=demo' : '';
        return Promise.all([fetch(`/api/records${query}`, { cache: 'no-store' }), fetch(`/api/engagement${query}`, { cache: 'no-store' }), fetch('/api/sharing', { cache: 'no-store' }), fetch(`/api/care-details${query}`, { cache: 'no-store' })]);
      })
      .then(async ([recordsResponse, engagementResponse, sharingResponse, careDetailsResponse]) => {
        const recordsData = await recordsResponse.json() as { records?: CareRecord[]; error?: string };
        const engagementData = await engagementResponse.json() as { engagement?: EngagementData; error?: string };
        const sharingData = await sharingResponse.json() as { permissions?: SharingPermission[] };
        const careDetailsData = await careDetailsResponse.json() as { medications?: Medication[]; investigations?: Investigation[] };
        if (!recordsResponse.ok) throw new Error(recordsData.error || 'Could not load your records.');
        return { records: recordsData.records || [], engagement: engagementData.engagement || { preferences: defaultEngagementPreferences, tasks: [], reminders: [], achievements: [], notifications: [], transitions: [] }, engagementReady: engagementResponse.ok, permissions: sharingResponse.ok ? sharingData.permissions || [] : [], medications: careDetailsResponse.ok ? careDetailsData.medications || [] : [], investigations: careDetailsResponse.ok ? careDetailsData.investigations || [] : [] };
      })
      .then((data) => { setRecords(data.records); setEngagement(data.engagement); setEngagementReady(data.engagementReady); setSharingPermissions(data.permissions); setMedications(data.medications); setInvestigations(data.investigations); setLoading(false); })
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
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !('serviceWorker' in navigator)) return;
    void navigator.serviceWorker.getRegistration('/mama-push-sw.js').then((registration) => registration?.pushManager.getSubscription()).then((subscription) => setPushSubscribed(Boolean(subscription))).catch(() => undefined);
  }, []);
  function requireAccountMode() {
    if (careMode !== 'demo') return true;
    setNotice('Demo mode is view-only. Switch to your personal account to add or edit records.');
    return false;
  }
  async function save(record: CareRecord, close = true) {
    if (!requireAccountMode() || busy.current) return false;
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
      first_period: [
        ['Your private record', hasCheckins ? 'Your recorded check-ins stay in your private space.' : 'Start with a note only when it feels useful.', hasCheckins],
        ['Your questions', hasTasks ? `${completedTasks.length} of ${activeTasks.length} chosen steps complete.` : 'Choose a question or small care step at your own pace.', hasTasks],
        ['Your trusted support', hasCareNote ? 'Your care notes are ready when you are.' : 'Keep a question for someone you trust.', hasCareNote],
      ],
      reproductive_health: [
        ['Your private record', hasCheckins ? 'Your recorded check-ins stay in your private space.' : 'Start with any observation that feels useful.', hasCheckins],
        ['Your chosen care', hasTasks ? `${completedTasks.length} of ${activeTasks.length} chosen steps complete.` : 'Choose a practical step when it would help.', hasTasks],
        ['Your next conversation', hasCareNote ? 'Your appointment and question notes are ready when you are.' : 'Save a question whenever you want to remember it.', hasCareNote],
      ],
      trying_to_conceive: [
        ['Your private record', hasCheckins ? 'Your recorded check-ins stay in your private space.' : 'Start with any observation that feels useful.', hasCheckins],
        ['Your chosen preparation', hasTasks ? `${completedTasks.length} of ${activeTasks.length} chosen steps complete.` : 'Choose a practical step when it would help.', hasTasks],
        ['Your next conversation', hasCareNote ? 'Your appointment and question notes are ready when you are.' : 'Save a question whenever you want to remember it.', hasCareNote],
      ],
      perimenopause: [
        ['Your private record', hasCheckins ? 'Your recorded check-ins stay in your private space.' : 'Start with any observation that feels useful.', hasCheckins],
        ['Your chosen care', hasTasks ? `${completedTasks.length} of ${activeTasks.length} chosen steps complete.` : 'Choose a practical step when it would help.', hasTasks],
        ['Your next conversation', hasCareNote ? 'Your appointment and question notes are ready when you are.' : 'Save a question whenever you want to remember it.', hasCareNote],
      ],
      menopause: [
        ['Your private record', hasCheckins ? 'Your recorded check-ins stay in your private space.' : 'Start with any observation that feels useful.', hasCheckins],
        ['Your chosen care', hasTasks ? `${completedTasks.length} of ${activeTasks.length} chosen steps complete.` : 'Choose a practical step when it would help.', hasTasks],
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
  const insightPoints = checkins.slice(0, 7).reverse().map((checkin) => ({ label: new Date(checkin.date + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'short' }), value: 1, detail: `${checkin.mood} check-in` }));
  const notificationGroups = (() => {
    const startToday = new Date(`${currentDay}T00:00:00`).getTime();
    const groups: Record<'Today' | 'This week' | 'Earlier', EngagementData['notifications']> = { Today: [], 'This week': [], Earlier: [] };
    engagement.notifications.forEach((notification) => {
      const difference = Math.floor((startToday - new Date(notification.scheduledFor).setHours(0, 0, 0, 0)) / 86_400_000);
      groups[difference <= 0 ? 'Today' : difference < 7 ? 'This week' : 'Earlier'].push(notification);
    });
    return groups;
  })();
  async function updateEngagement(kind: 'preferences' | 'task' | 'reminder' | 'notification', value: unknown) {
    if (!requireAccountMode()) return;
    const res = await fetch('/api/engagement', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind, value }) });
    const data = await res.json() as { engagement?: EngagementData; error?: string };
    if (!res.ok || !data.engagement) throw new Error(data.error || 'Could not save this setting.');
    setEngagement(data.engagement);
  }
  async function toggleJourneyTask(task: JourneyTask) {
    try { await updateEngagement('task', { ...task, status: task.status === 'completed' ? 'available' : 'completed' }); setNotice(task.status === 'completed' ? 'Task reopened.' : 'A thoughtful step, saved.'); }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not update task.'); }
  }
  async function markNotificationRead(id: string) {
    try { await updateEngagement('notification', id); }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not update this notification.'); }
  }
  async function removeEngagementItem(kind: 'task' | 'reminder', id: string) {
    if (!requireAccountMode()) return;
    try {
      const response = await fetch('/api/engagement', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind, id }) });
      const data = await response.json() as { engagement?: EngagementData; error?: string };
      if (!response.ok || !data.engagement) throw new Error(data.error || 'Could not remove this item.');
      setEngagement(data.engagement);
      setNotice(kind === 'reminder' ? 'Private reminder removed.' : 'Chosen step removed.');
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not remove this item.'); }
  }
  function openReminder(existing?: UserReminder) {
    if (!requireAccountMode()) return;
    setReminderDraft(existing ? { ...existing } : { id: crypto.randomUUID(), title: '', remindAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(), active: true, completedAt: null });
    setError(''); setModal('reminder');
  }
  function openProfile() {
    if (!requireAccountMode()) return;
    setProfileDraft({ ...profile });
    setError('');
    setModal('profile');
  }
  function openQuestion(existing?: CareQuestion, initialQuestion = '') {
    if (!requireAccountMode()) return;
    setQuestionDraft(
      existing
        ? { ...existing }
        : { kind: 'question', id: crypto.randomUUID(), question: initialQuestion, status: 'open' },
    );
    setError('');
    setModal('question');
  }
  function openCheckin(mood = 'Okay', existing?: Checkin) {
    if (!requireAccountMode()) return;
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
    if (!requireAccountMode()) return;
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
    if (!requireAccountMode()) return;
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
  function openMedication(existing?: Medication) {
    if (!requireAccountMode()) return;
    setMedicationDraft(existing ? { ...existing } : { id: crypto.randomUUID(), name: '', schedule: '', notes: '', active: true });
    setError(''); setModal('medication');
  }
  function openInvestigation(existing?: Investigation) {
    if (!requireAccountMode()) return;
    setInvestigationDraft(existing ? { ...existing } : { id: crypto.randomUUID(), title: '', status: 'planned', scheduledOn: '', notes: '' });
    setError(''); setModal('investigation');
  }
  async function saveCareDetail(kind: 'medication' | 'investigation', value: Medication | Investigation) {
    if (!requireAccountMode() || busy.current) return;
    busy.current = true; setSaving(true); setError('');
    try {
      const response = await fetch('/api/care-details', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind, value }) });
      const data = await response.json() as { medications?: Medication[]; investigations?: Investigation[]; error?: string };
      if (!response.ok) throw new Error(data.error || 'Could not save this entry.');
      setMedications(data.medications || []); setInvestigations(data.investigations || []); setModal(null); setNotice(kind === 'medication' ? 'Medicine or supplement saved.' : 'Investigation saved.');
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not save this entry.'); }
    finally { busy.current = false; setSaving(false); }
  }
  async function removeCareDetail(kind: 'medication' | 'investigation', id: string) {
    if (!requireAccountMode() || busy.current) return;
    busy.current = true; setSaving(true); setError('');
    try {
      const response = await fetch('/api/care-details', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind, id }) });
      const data = await response.json() as { medications?: Medication[]; investigations?: Investigation[]; error?: string };
      if (!response.ok) throw new Error(data.error || 'Could not remove this entry.');
      setMedications(data.medications || []); setInvestigations(data.investigations || []); setNotice('Removed from your private care organiser.');
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not remove this entry.'); }
    finally { busy.current = false; setSaving(false); }
  }
  async function remove() {
    if (!requireAccountMode() || !deletion || busy.current) return;
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
  async function updateDemo(action: 'start' | 'account' | 'demo' | 'hide' | 'show') {
    if (busy.current) return;
    busy.current = true; setSaving(true); setError('');
    try {
      const response = await fetch('/api/demo', {
        method: action === 'start' ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await response.json() as { available?: boolean; hidden?: boolean; deleted?: boolean; activeMode?: 'account' | 'demo'; error?: string };
      if (!response.ok) throw new Error(data.error || 'Could not update demo mode.');
      const mode = data.activeMode || 'account';
      setCareMode(mode); setDemoAvailable(Boolean(data.available)); setDemoHidden(Boolean(data.hidden)); setDemoDeleted(Boolean(data.deleted));
      setLoading(true); await load(mode);
      setNotice(mode === 'demo' ? 'Demo mode is on. Your personal records are not shown or changed.' : action === 'hide' ? 'Demo hidden. Your personal account is active.' : 'Your personal account is active.');
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not update demo mode.'); }
    finally { busy.current = false; setSaving(false); }
  }
  async function clearSampleData() {
    if (busy.current) return;
    busy.current = true; setSaving(true); setError('');
    try {
      const response = await fetch('/api/demo', { method: 'DELETE' });
      const data = await response.json() as { available?: boolean; hidden?: boolean; deleted?: boolean; activeMode?: 'account' | 'demo'; error?: string };
      if (!response.ok) throw new Error(data.error || 'Could not delete demo data.');
      setCareMode('account'); setDemoAvailable(Boolean(data.available)); setDemoHidden(Boolean(data.hidden)); setDemoDeleted(Boolean(data.deleted));
      setLoading(true); await load('account');
      setNotice('Demo data permanently deleted. Your personal account is unchanged.');
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not delete demo data.'); }
    finally { busy.current = false; setSaving(false); }
  }
  async function revokeSharingPermission(id: string) {
    try {
      const response = await fetch('/api/sharing', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error || 'Could not revoke sharing permission.');
      setSharingPermissions((current) => current.map((permission) => permission.id === id ? { ...permission, revoked_at: new Date().toISOString() } : permission));
      setNotice('Clinician sharing revoked.');
    } catch (error) { setError(error instanceof Error ? error.message : 'Could not revoke sharing permission.'); }
  }
  async function updatePushSubscription(enable: boolean) {
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      setPushStatus('Browser notifications are not available in this browser yet.');
      return;
    }
    try {
      setPushStatus('');
      const registration = await navigator.serviceWorker.register('/mama-push-sw.js');
      const existing = await registration.pushManager.getSubscription();
      if (!enable && existing) {
        const response = await fetch('/api/push-subscription', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(existing.toJSON()) });
        if (!response.ok) throw new Error('Could not remove browser notification permission.');
        await existing.unsubscribe();
        setPushSubscribed(false);
        setPushStatus('Browser notifications turned off.');
        return;
      }
      const applicationServerKey = Uint8Array.from(atob(vapidKey.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(vapidKey.length / 4) * 4, '=')), (character) => character.charCodeAt(0));
      const subscription = existing || await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey });
      const response = await fetch('/api/push-subscription', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(subscription.toJSON()) });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error || 'Could not save browser notifications.');
      setPushSubscribed(true);
      setPushStatus('Browser notifications are on. MAMA will keep them discreet.');
    } catch (error) {
      setPushStatus(error instanceof Error ? error.message : 'Could not update browser notifications.');
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
            <output className="engagement-pending" aria-live="polite">MAMA’s new journey tools are being prepared for this preview. Your existing care records remain available.</output>
          )}
          {!loading && !loadError && careMode === 'demo' && (
            <output className="engagement-pending demo-mode-banner" aria-live="polite"><b>Demo mode</b> — illustrative records only. Your personal care records are not shown, changed or exported here. <button className="text-btn" onClick={() => void updateDemo('account')}>Return to personal account</button></output>
          )}
          {!loading && !loadError && careMode === 'account' && demoAvailable && !demoHidden && (
            <output className="engagement-pending demo-mode-banner" aria-live="polite">Want to compare the experience? <button className="text-btn" onClick={() => void updateDemo('demo')}>Open demo mode</button></output>
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
                  <section className="care-v2-organisers" aria-label="Private care organisers">
                    <article className="card care-v2-organiser">
                      <div className="section-title"><div><span>PERSONAL LIST</span><h2>Medicines & supplements</h2></div><button className="text-btn" onClick={() => openMedication()}><Plus size={16} /> Add</button></div>
                      <p className="helper">A private list only. Confirm medicines, doses, supplements and changes with your clinician or pharmacist.</p>
                      {medications.length ? <div className="care-v2-detail-list">{medications.map((item) => <div key={item.id}><div><b>{item.name}</b><small>{item.active ? item.schedule || 'Active — schedule not recorded' : 'No longer active'}{item.notes ? ` · ${item.notes}` : ''}</small></div><button className="icon-button" aria-label={`Edit ${item.name}`} onClick={() => openMedication(item)}><Pencil size={15} /></button><button className="icon-button" aria-label={`Remove ${item.name}`} onClick={() => void removeCareDetail('medication', item.id)}><Trash2 size={15} /></button></div>)}</div> : <Blank title="Keep a simple personal list" description="Add something only if it helps you prepare for a care conversation." action={<button className="outline-btn" onClick={() => openMedication()}><Plus size={16} /> Add item</button>} />}
                    </article>
                    <article className="card care-v2-organiser">
                      <div className="section-title"><div><span>PERSONAL ORGANISER</span><h2>Investigations</h2></div><button className="text-btn" onClick={() => openInvestigation()}><Plus size={16} /> Add</button></div>
                      <p className="helper">Plan or keep track of conversations and results. MAMA does not interpret results or provide clinical advice.</p>
                      {investigations.length ? <div className="care-v2-detail-list">{investigations.map((item) => <div key={item.id}><div><b>{item.title}</b><small>{item.status}{item.scheduledOn ? ` · ${prettyDate(item.scheduledOn)}` : ''}{item.notes ? ` · ${item.notes}` : ''}</small></div><button className="icon-button" aria-label={`Edit ${item.title}`} onClick={() => openInvestigation(item)}><Pencil size={15} /></button><button className="icon-button" aria-label={`Remove ${item.title}`} onClick={() => void removeCareDetail('investigation', item.id)}><Trash2 size={15} /></button></div>)}</div> : <Blank title="Keep your questions and plans together" description="Add an investigation only as a personal organiser for your next care conversation." action={<button className="outline-btn" onClick={() => openInvestigation()}><Plus size={16} /> Add item</button>} />}
                    </article>
                  </section>
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
                  <section className="card care-v2-consultation" aria-labelledby="consultation-access-title">
                    <div><span>CONSULTATION ACCESS</span><h2 id="consultation-access-title">Bring your existing care relationship.</h2><p>MAMA does not match you with clinicians or make clinical decisions. A manually provisioned clinician may access only an accepted consultation or a sharing permission you can revoke.</p></div>
                    <button className="outline-btn" onClick={openProfile}><Pencil size={16} /> Keep my care contact handy</button>
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
                    <div className="settings-v2-journey-history" aria-label="Your private journey history">
                      <span>PRIVATE JOURNEY HISTORY</span>
                      {engagement.transitions.length ? engagement.transitions.slice(0, 4).map((transition) => <div key={transition.id}><div><b>{stages[transition.toStage as Stage] || 'Journey updated'}</b><small>{transition.sensitive ? 'Sensitive transition · celebratory content paused' : transition.fromStage ? `Updated from ${stages[transition.fromStage as Stage] || 'a previous journey'}` : 'Your selected journey'} · {new Date(transition.occurredAt).toLocaleDateString('en-GB', { dateStyle: 'medium' })}</small></div></div>) : <p>Changes you choose will appear here. MAMA stores only the journey change, not a reason.</p>}
                    </div>
                  </section>
                  <section className="card settings-v2-notifications">
                    <BellRing size={23} />
                    <h2 className="spaced">Notifications, your way</h2>
                    <p>By default, lock-screen reminders stay discreet and never display health details.</p>
                    <div className="preference-list">
                      <div className="preference-control"><span>Discreet lock-screen messages</span><Checkbox aria-label="Discreet lock-screen messages" checked={engagement.preferences.discreetNotifications} onCheckedChange={(checked) => void updateEngagement('preferences', { ...engagement.preferences, discreetNotifications: !!checked }).catch((e) => setError(e instanceof Error ? e.message : 'Could not save preference.'))} /></div>
                      <div className="preference-control"><span>Journey updates</span><Checkbox aria-label="Journey updates" checked={engagement.preferences.journeyUpdatesEnabled} onCheckedChange={(checked) => void updateEngagement('preferences', { ...engagement.preferences, journeyUpdatesEnabled: !!checked }).catch((e) => setError(e instanceof Error ? e.message : 'Could not save preference.'))} /></div>
                      <div className="preference-control"><span>Appointment reminders</span><Checkbox aria-label="Appointment reminders" checked={engagement.preferences.appointmentRemindersEnabled} onCheckedChange={(checked) => void updateEngagement('preferences', { ...engagement.preferences, appointmentRemindersEnabled: !!checked }).catch((e) => setError(e instanceof Error ? e.message : 'Could not save preference.'))} /></div>
                      <div className="preference-control"><span>Consultation reminders</span><Checkbox aria-label="Consultation reminders" checked={engagement.preferences.consultationRemindersEnabled} onCheckedChange={(checked) => void updateEngagement('preferences', { ...engagement.preferences, consultationRemindersEnabled: !!checked }).catch((e) => setError(e instanceof Error ? e.message : 'Could not save preference.'))} /></div>
                      <div className="preference-control"><span>Weekly private recap</span><Checkbox aria-label="Weekly private recap" checked={engagement.preferences.weeklyRecapEnabled} onCheckedChange={(checked) => void updateEngagement('preferences', { ...engagement.preferences, weeklyRecapEnabled: !!checked }).catch((e) => setError(e instanceof Error ? e.message : 'Could not save preference.'))} /></div>
                      <div className="preference-control"><span>My private reminders</span><Checkbox aria-label="My private reminders" checked={engagement.preferences.userRemindersEnabled} onCheckedChange={(checked) => void updateEngagement('preferences', { ...engagement.preferences, userRemindersEnabled: !!checked }).catch((e) => setError(e instanceof Error ? e.message : 'Could not save preference.'))} /></div>
                      <div className="preference-control"><span>Optional MAMA Points</span><Checkbox aria-label="Optional MAMA Points" checked={engagement.preferences.pointsEnabled} onCheckedChange={(checked) => void updateEngagement('preferences', { ...engagement.preferences, pointsEnabled: !!checked }).catch((e) => setError(e instanceof Error ? e.message : 'Could not save preference.'))} /></div>
                    </div>
                    <button className="outline-btn spaced" disabled={!engagementReady} onClick={() => openReminder()}><Clock3 size={16} /> Add a private reminder</button>
                    <div className="settings-v2-browser-push"><div><b>Browser notifications</b><small>{process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ? 'Choose this only on a personal device you control.' : 'Available after browser notification delivery is configured.'}</small></div>{process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ? <button className="text-btn" onClick={() => void updatePushSubscription(!pushSubscribed)}>{pushSubscribed ? 'Turn off' : 'Turn on'}</button> : <span>Not configured</span>}</div>
                    {pushStatus && <output className="helper settings-v2-push-status" aria-live="polite">{pushStatus}</output>}
                    {engagement.reminders.length > 0 && <div className="settings-v2-reminders" aria-label="Your private reminders"><span>YOUR PRIVATE REMINDERS</span>{engagement.reminders.map((reminder) => <div key={reminder.id}><div><b>{reminder.title}</b><small>{new Date(reminder.remindAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}</small></div><button className="icon-button" aria-label={`Edit reminder ${reminder.title}`} onClick={() => openReminder(reminder)}><Pencil size={15} /></button><button className="icon-button" aria-label={`Remove reminder ${reminder.title}`} onClick={() => void removeEngagementItem('reminder', reminder.id)}><Trash2 size={15} /></button></div>)}</div>}
                    <p className="helper">Push delivery needs your browser permission. No clinical details are placed in notification payloads.</p>
                  </section>
                  <section className="card wide settings-v2-notification-centre" aria-labelledby="notification-centre-title"><div className="section-title"><div><span>PRIVATE NOTIFICATION CENTRE</span><h2 id="notification-centre-title">MAMA updates</h2></div><BellRing size={20} /></div>{engagement.notifications.length ? <div className="notification-centre-list">{(['Today', 'This week', 'Earlier'] as const).map((group) => notificationGroups[group].length ? <section key={group}><h3>{group}</h3>{notificationGroups[group].map((notification) => <div className={notification.readAt ? 'read' : ''} key={notification.id}><div><span>{notification.kind.replaceAll('_', ' ')}</span><b>{notification.title}</b><p>{notification.body}</p></div>{notification.readAt ? <small>Read</small> : <button className="text-btn" onClick={() => void markNotificationRead(notification.id)}>Mark read</button>}</div>)}</section> : null)}</div> : <p className="settings-v2-notification-empty">Your private reminders and care updates will appear here. MAMA keeps notification copy general by default.</p>}</section>
                  <section className="card settings-v2-care-team">
                    <Phone size={23} />
                    <h2 className="spaced">Your care circle</h2>
                    <p>{profile.contactName ? `${profile.contactName}${profile.phone ? ` · ${profile.phone}` : ''}` : 'Save the contact details you want close at hand for your own care conversations.'}</p>
                    <button className="outline-btn spaced" onClick={openProfile}><Pencil size={16} /> {profile.contactName ? 'Edit contact' : 'Add a contact'}</button>
                    <p className="helper">MAMA does not contact anyone or share your records from this page.</p>
                  </section>
                  <section className="card settings-v2-achievements">
                    <Trophy size={23} />
                    <h2 className="spaced">Your care moments</h2>
                    {sensitiveJourney ? <p>Care moments are paused here so you can keep only what feels useful.</p> : engagement.achievements.length ? <div className="settings-v2-achievement-list">{engagement.achievements.slice(0, 4).map((achievement) => <div key={achievement.code}><b>{achievement.title}</b><span>{achievement.description}</span></div>)}</div> : <p>Constructive moments such as tracking, learning, preparation and follow-up can appear here. MAMA never rewards medical outcomes.</p>}
                  </section>
                  <section className="card settings-v2-demo">
                    <Sparkles size={23} />
                    <h2 className="spaced">Demo care space</h2>
                    <p>Demo mode contains illustrative MAMA records in a separate view. It never changes, mixes with or exports your personal records.</p>
                    <div className="demo-space-status"><b>{careMode === 'demo' ? 'Demo mode is active' : 'Personal account is active'}</b><span>{careMode === 'demo' ? 'Demo is view-only.' : 'Only your personal records are shown.'}</span></div>
                    {!demoAvailable && !demoDeleted && <button className="outline-btn spaced" disabled={saving} onClick={() => void updateDemo('start')}><Sparkles size={16} /> {saving ? 'Preparing…' : 'Start demo mode'}</button>}
                    {demoAvailable && !demoHidden && careMode === 'account' && <button className="outline-btn spaced" disabled={saving} onClick={() => void updateDemo('demo')}><Sparkles size={16} /> Open demo mode</button>}
                    {careMode === 'demo' && <button className="outline-btn spaced" disabled={saving} onClick={() => void updateDemo('account')}>Return to personal account</button>}
                    {demoAvailable && !demoHidden && <button className="text-btn spaced" disabled={saving} onClick={() => void updateDemo('hide')}>Hide demo from my account</button>}
                    {demoAvailable && demoHidden && <button className="outline-btn spaced" disabled={saving} onClick={() => void updateDemo('show')}>Show demo again</button>}
                    {demoAvailable && <button className="outline-btn danger-text spaced" disabled={saving} onClick={() => void clearSampleData()}><Trash2 size={16} /> {saving ? 'Deleting…' : 'Permanently delete demo data'}</button>}
                    {demoDeleted && <p className="helper">Demo data has been permanently deleted. Your personal records remain unchanged.</p>}
                  </section>
                  <section className="card settings-v2-privacy">
                    <LockKeyhole size={23} />
                    <h2 className="spaced">Your records & privacy</h2>
                    <p>
                      Saved records belong to your signed-in account. Any clinician access must come from a manually provisioned care relationship and can be revoked here. Avoid entering identifying medical information while the prototype is under review.
                    </p>
                    <div className="settings-v2-sharing"><span>CLINICIAN SHARING</span>{sharingPermissions.filter((permission) => !permission.revoked_at).length ? sharingPermissions.filter((permission) => !permission.revoked_at).map((permission) => <div key={permission.id}><div><b>Verified care relationship</b><small>{permission.scopes.length ? `Limited to: ${permission.scopes.join(', ').replaceAll('_', ' ')}` : 'No care-record scopes granted'}{permission.expires_at ? ` · ends ${new Date(permission.expires_at).toLocaleDateString('en-GB', { dateStyle: 'medium' })}` : ''}</small></div><button className="text-btn danger-text" onClick={() => void revokeSharingPermission(permission.id)}>Revoke access</button></div>) : <p>No active clinician sharing. MAMA never grants access automatically.</p>}</div>
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
                        : modal === 'medication'
                          ? 'Medicine or supplement'
                          : modal === 'investigation'
                            ? 'Investigation organiser'
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
                        : modal === 'medication'
                          ? 'Keep a private personal list. MAMA does not prescribe, recommend doses or check interactions.'
                          : modal === 'investigation'
                            ? 'Use this only to organise your own plans, dates and care conversations. MAMA does not interpret results.'
                            : 'If something feels seriously wrong, seek care now. Do not wait for an app response.'}
          </DialogDescription>
          {error && (
            <div className="error-banner" role="alert">
              {error}
            </div>
          )}
          {modal === 'medication' && medicationDraft && (
            <form className="mama-form" onSubmit={(e) => { e.preventDefault(); void saveCareDetail('medication', medicationDraft); }}>
              <label htmlFor="mama-medication-name" className="field"><span>Name</span><Input id="mama-medication-name" required maxLength={150} value={medicationDraft.name} onChange={(e) => setMedicationDraft({ ...medicationDraft, name: e.target.value })} placeholder="For example: My supplement" /></label>
              <label htmlFor="mama-medication-schedule" className="field"><span>Schedule or note <small>Optional</small></span><Input id="mama-medication-schedule" maxLength={300} value={medicationDraft.schedule} onChange={(e) => setMedicationDraft({ ...medicationDraft, schedule: e.target.value })} placeholder="For your personal reference" /></label>
              <label htmlFor="mama-medication-notes" className="field"><span>Private note <small>Optional</small></span><Textarea id="mama-medication-notes" maxLength={2000} value={medicationDraft.notes} onChange={(e) => setMedicationDraft({ ...medicationDraft, notes: e.target.value })} /></label>
              <Choice label="List status" value={medicationDraft.active ? 'active' : 'inactive'} options={{ active: 'Active', inactive: 'No longer active' }} onChange={(value) => setMedicationDraft({ ...medicationDraft, active: value === 'active' })} />
              <Button type="submit" disabled={saving} className="primary-btn">{saving ? 'Saving…' : 'Save private list item'}</Button>
            </form>
          )}
          {modal === 'investigation' && investigationDraft && (
            <form className="mama-form" onSubmit={(e) => { e.preventDefault(); void saveCareDetail('investigation', investigationDraft); }}>
              <label htmlFor="mama-investigation-title" className="field"><span>Investigation or conversation</span><Input id="mama-investigation-title" required maxLength={150} value={investigationDraft.title} onChange={(e) => setInvestigationDraft({ ...investigationDraft, title: e.target.value })} placeholder="For example: Ask about a result" /></label>
              <Choice label="Status" value={investigationDraft.status} options={{ planned: 'Planned', completed: 'Completed', discussed: 'Discussed with care team' }} onChange={(value) => setInvestigationDraft({ ...investigationDraft, status: value as Investigation['status'] })} />
              <label htmlFor="mama-investigation-date" className="field"><span>Date <small>Optional</small></span><Input id="mama-investigation-date" type="date" value={investigationDraft.scheduledOn} onChange={(e) => setInvestigationDraft({ ...investigationDraft, scheduledOn: e.target.value })} /></label>
              <label htmlFor="mama-investigation-notes" className="field"><span>Private note <small>Optional</small></span><Textarea id="mama-investigation-notes" maxLength={2000} value={investigationDraft.notes} onChange={(e) => setInvestigationDraft({ ...investigationDraft, notes: e.target.value })} /></label>
              <Button type="submit" disabled={saving} className="primary-btn">{saving ? 'Saving…' : 'Save organiser item'}</Button>
            </form>
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
