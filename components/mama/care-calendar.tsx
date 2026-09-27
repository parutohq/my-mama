'use client';

import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import type { Checkin, CareItem, Period } from '@/lib/care-model';
import type { Investigation } from '@/lib/care-details-model';
import { calendarDays, recordedMarkers } from '@/lib/care-calendar-model';
import { TypicalHormonePattern } from '@/components/mama/typical-hormone-pattern';

type Props = {
  periods: Period[];
  checkins: Checkin[];
  care: CareItem[];
  investigations: Investigation[];
  currentDay: string;
  cycleDay?: number | null;
  cyclePattern?: 'regular' | 'varies' | 'not_sure';
  onAddCheckin: (date?: string) => void;
  onAddPeriod: () => void;
};

const monthLabel = (date: Date) => date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
const dayLabel = (value: string) => new Date(`${value}T12:00:00`).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

export function CareCalendar({ periods, checkins, care, investigations, currentDay, cycleDay, cyclePattern, onAddCheckin, onAddPeriod }: Props) {
  const [month, setMonth] = useState(() => new Date(`${currentDay}T12:00:00`));
  const [selected, setSelected] = useState(currentDay);
  const days = useMemo(() => calendarDays(month), [month]);
  const recorded = useMemo(() => recordedMarkers(periods, checkins, care, investigations), [care, checkins, investigations, periods]);
  const details = useMemo<{ periods: Period[]; checkins: Checkin[]; care: CareItem[]; investigations: Investigation[] }>(() => ({
    periods: periods.filter((item) => item.start <= selected && (!item.end || item.end >= selected)),
    checkins: checkins.filter((item) => item.date === selected),
    care: care.filter((item) => item.date === selected),
    investigations: investigations.filter((item) => item.scheduledOn === selected),
  }), [care, checkins, investigations, periods, selected]);
  const hasDetails = Object.values(details).some((items) => items.length > 0);
  const move = (offset: number) => setMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));

  return <section className="care-calendar card" aria-labelledby="calendar-title">
    <div className="care-calendar-header">
      <div><span className="eyebrow">YOUR RECORDED HISTORY</span><h2 id="calendar-title">Calendar</h2><p>Recorded dates are shown as entries. Estimated dates, when supported, are labelled separately.</p></div>
      <div className="care-calendar-actions"><button className="icon-button" aria-label="Previous month" onClick={() => move(-1)}><ChevronLeft size={18} /></button><button className="outline-btn" onClick={() => { setMonth(new Date(`${currentDay}T12:00:00`)); setSelected(currentDay); }}>Today</button><button className="icon-button" aria-label="Next month" onClick={() => move(1)}><ChevronRight size={18} /></button></div>
    </div>
    <div className="care-calendar-month"><h3>{monthLabel(month)}</h3><button className="text-btn" onClick={onAddPeriod}><Plus size={15} /> Record period</button></div>
    <div className="care-calendar-grid" role="grid" aria-label={monthLabel(month)}>
      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((label) => <span className="care-calendar-weekday" key={label}>{label}</span>)}
      {days.map(({ date, value }) => {
        const marker = recorded.get(value);
        const inMonth = date.getMonth() === month.getMonth();
        const isSelected = value === selected;
        return <button type="button" aria-label={`${dayLabel(value)}${marker ? ', recorded entries' : ''}${isSelected ? ', selected' : ''}`} className={`care-calendar-day ${inMonth ? '' : 'muted'} ${isSelected ? 'selected' : ''} ${value === currentDay ? 'today' : ''}`} onClick={() => setSelected(value)} key={value}>
          <b>{date.getDate()}</b>{marker && <span className="care-calendar-markers" aria-label="Recorded entries">{marker.period && <i className="period" title="Recorded period" />}{marker.spotting && <i className="spotting" title="Recorded spotting" />}{marker.checkin && <i className="checkin" title="Recorded check-in" />}{(marker.care || marker.investigation) && <i className="care" title="Recorded care activity" />}</span>}
        </button>;
      })}
    </div>
    <div className="care-calendar-legend" aria-label="Calendar legend"><span><i className="period" /> Period</span><span><i className="spotting" /> Spotting</span><span><i className="checkin" /> Check-in</span><span><i className="care" /> Care activity</span><span className="estimated-key">No estimated dates shown yet</span></div>
    <div className="care-calendar-details" aria-live="polite"><div className="care-calendar-details-heading"><div><span className="eyebrow">DAY DETAILS</span><h3>{dayLabel(selected)}</h3></div><button className="outline-btn" onClick={() => onAddCheckin(selected)}><Plus size={15} /> Add check-in</button></div>{hasDetails ? <div className="care-calendar-detail-list">{details.periods.map((item) => <p key={item.id}><strong>Period</strong> {item.end ? `${item.start} to ${item.end}` : `${item.start}; end not recorded`}</p>)}{details.checkins.map((item) => <p key={item.id}><strong>Check-in</strong> {item.mood}{item.bleeding !== 'Not recorded' ? ` · Bleeding ${item.bleeding.toLowerCase()}` : ''}{item.symptoms.length ? ` · ${item.symptoms.join(', ')}` : ''}{item.pain !== 'Not recorded' ? ` · Pain ${item.pain.toLowerCase()}` : ''}{item.notes ? ` · Note: ${item.notes}` : ''}</p>)}{details.care.map((item) => <p key={item.id}><strong>{item.type === 'appointment' ? 'Appointment' : 'Task'}</strong> {item.title}</p>)}{details.investigations.map((item) => <p key={item.id}><strong>Investigation</strong> {item.title}</p>)}</div> : <div className="care-calendar-empty"><p>No entries recorded for this day.</p><small>Missing information remains unknown. Add only what feels useful.</small></div>}</div>
    <TypicalHormonePattern cycleDay={cycleDay} cyclePattern={cyclePattern} />
  </section>;
}
