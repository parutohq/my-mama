import { createHash } from 'node:crypto';
import { headers } from 'next/headers';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { allowPublicRequest } from '@/lib/public-rate-limit';
import styles from './share.module.css';
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const metadata: Metadata = { title:'A MAMA support journey', description:'A private, temporary MAMA support link.', robots:{index:false,follow:false} };
type Projection = { week?:number; trimester?:number; progress?:number; estimatedDueDate?:string; nextAppointmentDate?:string|null };
export default async function PartnerView({ params }: { params:Promise<{ token:string }> }) {
  const { token } = await params;
  const requestHeaders = await headers();
  const allowed = allowPublicRequest(new Request('https://mama.invalid', { headers:requestHeaders }), 'partner-link', 40);
  let projection: Projection | null = null;
  if (allowed && /^[A-Za-z0-9_-]{40,60}$/.test(token)) {
    const hash = createHash('sha256').update(token).digest('hex');
    const client = await createClient();
    const result = await client.rpc('resolve_pregnancy_share',{lookup_hash:hash});
    if (!result.error && result.data && typeof result.data === 'object' && !Array.isArray(result.data)) projection = result.data as Projection;
  }
  return <main id="main-content" className={styles.page}><div className={styles.scene}><div className={styles.top}><span>MAMA · SUPPORT</span><span>PRIVATE LINK</span></div><div className={styles.intro}>{projection ? <><span>HERE TOGETHER</span><h1>A journey to support, together.</h1><p>This is a small view of what she chose to share. She can change or end access at any time.</p></> : <><span>LINK UNAVAILABLE</span><h1>This moment is private again.</h1><p>This link may have expired or been revoked. Ask the person who shared it for a new invitation.</p></>}</div></div>{projection && <section className={styles.content}><div className={styles.metrics}>{typeof projection.week === 'number' && <div><span>RECORDED JOURNEY</span><strong>Week {projection.week}</strong>{projection.trimester && <small>Trimester {projection.trimester}</small>}</div>}{typeof projection.progress === 'number' && <div><span>FORTY-WEEK REFERENCE</span><strong>{projection.progress}%</strong><small>Approximate timeline progress</small></div>}{projection.estimatedDueDate && <div><span>ESTIMATED ARRIVAL</span><strong>{new Date(`${projection.estimatedDueDate}T12:00:00`).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})}</strong><small>A date she chose to share</small></div>}{projection.nextAppointmentDate && <div><span>NEXT RECORDED VISIT</span><strong>{new Date(`${projection.nextAppointmentDate}T12:00:00`).toLocaleDateString('en-GB',{day:'numeric',month:'long'})}</strong><small>Date only, shared by her choice</small></div>}</div><section className={styles.support}><span>HOW TO BE THERE</span><h2>Support can be simple.</h2><ul><li>Ask what would make the coming week easier.</li><li>Offer help with practical tasks and rest.</li><li>Prepare questions together if she wants company.</li></ul><p>These are general ways to offer support, not personal medical advice.</p></section></section>}</main>;
}
