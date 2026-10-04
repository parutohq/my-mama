'use client';
import { CalendarDays, CircleUserRound, House, HeartPulse, Plus } from 'lucide-react';
import type { MamaView } from '@/components/mama/navigation';

const navigation = [
  ['Today', 'Today', House],
  ['My journal', 'Calendar', CalendarDays],
  ['My care', 'Self Care', HeartPulse],
  ['Settings', 'Mine', CircleUserRound],
] as const;

export function MobileBottomNavigation({ view, onNavigate, onAction }: { view: MamaView; onNavigate: (view: MamaView) => void; onAction: () => void }) {
  return <nav className="mobile-bottom-nav" data-mobile-nav="true" aria-label="Primary care navigation">
    {navigation.slice(0, 2).map(([target, label, Icon]) => <button key={target} type="button" className={view === target ? 'active' : ''}
      aria-current={view === target ? 'page' : undefined} onClick={() => onNavigate(target)}>
      <Icon aria-hidden="true" strokeWidth={view === target ? 2.35 : 1.9} /><span>{label}</span>
    </button>)}
    <button type="button" className="mobile-bottom-nav-action" aria-label="Log a check-in" onClick={onAction}><Plus aria-hidden="true" strokeWidth={2.4} /><span className="sr-only">Log a check-in</span></button>
    {navigation.slice(2).map(([target, label, Icon]) => <button key={target} type="button" className={view === target ? 'active' : ''}
      aria-current={view === target ? 'page' : undefined} onClick={() => onNavigate(target)}>
      <Icon aria-hidden="true" strokeWidth={view === target ? 2.35 : 1.9} /><span>{label}</span>
    </button>)}
  </nav>;
}
