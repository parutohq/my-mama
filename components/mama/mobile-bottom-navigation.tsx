'use client';
import { BookHeart, CircleHelp, House, ListChecks, Route } from 'lucide-react';
import type { MamaView } from '@/components/mama/navigation';

const navigation = [
  ['Today', 'Home', House],
  ['Journey', 'Journey', Route],
  ['My journal', 'Track', ListChecks],
  ['Ask MAMA', 'Ask MAMA', CircleHelp],
  ['My care', 'My Care', BookHeart],
] as const;

export function MobileBottomNavigation({ view, onNavigate }: { view: MamaView; onNavigate: (view: MamaView) => void }) {
  return <nav className="mobile-bottom-nav" aria-label="Primary care navigation">
    {navigation.map(([target, label, Icon]) => <button key={target} type="button" className={view === target ? 'active' : ''}
      aria-current={view === target ? 'page' : undefined} onClick={() => onNavigate(target)}>
      <Icon aria-hidden="true" strokeWidth={view === target ? 2.35 : 1.9} />
      <span>{label}</span>
    </button>)}
  </nav>;
}
