'use client';

import { Flower2, Heart, LockKeyhole, Settings2, Route, CircleHelp } from 'lucide-react';
import {
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { BookOpen, CalendarDays, ClipboardList, House, Sparkles } from 'lucide-react';

export const careViews = [
  ['Today', House],
  ['Journey', Route],
  ['My journal', BookOpen],
  ['My care', CalendarDays],
  ['Learn', Sparkles],
  ['Care summary', ClipboardList],
] as const;

export type MamaView = (typeof careViews)[number][0] | 'Settings' | 'Ask MAMA';

export function MamaNavigation({
  view,
  onNavigate,
}: {
  view: MamaView;
  onNavigate: (view: MamaView) => void;
}) {
  const { setOpenMobile } = useSidebar();

  const navigate = (nextView: MamaView) => {
    onNavigate(nextView);
    setOpenMobile(false);
  };

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
          {careViews.map(([title, Icon]) => (
            <SidebarMenuItem key={title}>
              <SidebarMenuButton
                isActive={view === title}
                className="nav-item"
                onClick={() => navigate(title)}
              >
                <Icon />
                <span>{title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
          <SidebarMenuItem>
            <SidebarMenuButton isActive={view === 'Ask MAMA'} className="nav-item" onClick={() => navigate('Ask MAMA')}>
              <CircleHelp /><span>Ask MAMA</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
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
          onClick={() => navigate('Settings')}
        >
          <Settings2 size={18} /> Profile & privacy
        </button>
        <div className="privacy-note">
          <LockKeyhole size={14} /> Your personal care space
        </div>
      </SidebarFooter>
    </>
  );
}
