'use client';

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { canShowCycleDayMarker, typicalHormonePattern } from '@/lib/typical-hormone-pattern-model';

type Props = { cycleDay?: number | null; cyclePattern?: 'regular' | 'varies' | 'not_sure' };

const series = [
  { key: 'estrogen', label: 'Estrogen', color: '#b86688' },
  { key: 'progesterone', label: 'Progesterone', color: '#76547d' },
  { key: 'lh', label: 'LH', color: '#d28b55' },
  { key: 'fsh', label: 'FSH', color: '#8b8ac2' },
] as const;

export function TypicalHormonePattern({ cycleDay, cyclePattern }: Props) {
  const canPlaceMarker = canShowCycleDayMarker(cycleDay);
  const note = cyclePattern === 'varies' || cyclePattern === 'not_sure'
    ? 'Your cycle history varies, so this remains a general educational reference.'
    : 'Your cycle day is based on the period details you have recorded.';
  return <section className="typical-hormone-pattern" aria-labelledby="typical-hormone-title">
    <div className="typical-hormone-heading"><div><span className="eyebrow">EDUCATIONAL VIEW</span><h3 id="typical-hormone-title">Typical hormone pattern</h3><p>This illustration shows how hormone patterns commonly change across a reference cycle. It does not measure your hormone levels.</p></div><span className="data-label typical">Typical</span></div>
    <div className="typical-hormone-legend" aria-label="Hormone pattern legend">{series.map((item) => <span key={item.key}><i style={{ backgroundColor: item.color }} />{item.label}</span>)}</div>
    <p id="typical-hormone-summary" className="sr-only">Typical educational hormone pattern for estrogen, progesterone, LH and FSH across a reference 28 day cycle. {canPlaceMarker ? `Your recorded cycle day is day ${cycleDay}; the marker is context only, not a measured hormone level.` : 'No personal cycle day marker is shown.'}</p>
    <div className="typical-hormone-chart" aria-labelledby="typical-hormone-summary">
      <ResponsiveContainer width="100%" height="100%"><LineChart data={typicalHormonePattern} margin={{ top: 10, right: 12, left: -25, bottom: 0 }}>
        <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: 'var(--mama-muted)', fontSize: 11 }} tickFormatter={(value) => `D${value}`} />
        <YAxis domain={[0, 100]} hide />
        <Tooltip formatter={(value, name) => [`Typical relative pattern`, String(name)]} labelFormatter={(value) => `Reference day ${value}`} />
        {series.map((item) => <Line key={item.key} type="monotone" dataKey={item.key} name={item.label} stroke={item.color} strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />)}
        {canPlaceMarker && <Line data={[{ day: cycleDay, marker: 0 }, { day: cycleDay, marker: 100 }]} dataKey="marker" name={`Your recorded cycle day ${cycleDay}`} stroke="var(--mama-text)" strokeDasharray="3 4" strokeWidth={1.5} dot={false} isAnimationActive={false} />}
      </LineChart></ResponsiveContainer>
    </div>
    <p className="typical-hormone-note">{canPlaceMarker ? `Day ${cycleDay} · ${note}` : 'Keep tracking your cycle to add more context. This chart remains a typical educational reference.'}</p>
  </section>;
}
