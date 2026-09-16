import type { ReactNode } from 'react';

type Point = { label: string; value: number; detail?: string };
export function InsightCard({ title, description, points, valueLabel = 'Recorded', empty, footer }: {
  title: string; description: string; points: Point[]; valueLabel?: 'Recorded' | 'Estimated'; empty: string; footer?: ReactNode;
}) {
  const max = Math.max(1, ...points.map((point) => point.value));
  const chartSummary = points.map((point) => `${point.label}: ${point.detail || point.value}`).join('. ');
  return <article className="insight-card">
    <div className="insight-heading"><div><h2>{title}</h2><p>{description}</p></div><span className={'data-label ' + valueLabel.toLowerCase()}>{valueLabel}</span></div>
    {points.length ? <div className="insight-chart" role="img" aria-label={`${title}: ${valueLabel.toLowerCase()} data. ${chartSummary}`}>
      {points.slice(-8).map((point) => <div className="insight-bar" key={point.label} title={point.detail || `${point.label}: ${point.value}`}>
        <div className="bar-track"><span style={{ height: `${Math.max(10, (point.value / max) * 100)}%` }} /></div><small>{point.label}</small>
      </div>)}
    </div> : <div className="insight-empty">{empty}</div>}
    {footer && <div className="insight-footer">{footer}</div>}
  </article>;
}
