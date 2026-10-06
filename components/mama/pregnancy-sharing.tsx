'use client';

import { useEffect, useState } from 'react';
import { Check, Copy, Link2, RotateCcw, ShieldCheck, X } from 'lucide-react';
import styles from './pregnancy-sharing.module.css';

type Scope = 'week' | 'progress' | 'edd' | 'appointment';
type ShareLink = { id: string; label: string | null; scopes: Scope[]; expires_at: string; revoked_at: string | null; created_at: string };
const choices: { id: Scope; title: string; description: string }[] = [
  { id: 'week', title: 'Current week and trimester', description: 'A simple marker of this pregnancy journey.' },
  { id: 'progress', title: 'Journey progress', description: 'Approximate place on a forty-week reference timeline.' },
  { id: 'edd', title: 'Estimated due date', description: 'The date saved in your pregnancy record.' },
  { id: 'appointment', title: 'Next appointment date', description: 'Date only; no location, clinician or notes.' },
];

export function PregnancySharing({ enabled }: { enabled: boolean }) {
  const [scopes, setScopes] = useState<Scope[]>(['week', 'progress']);
  const [days, setDays] = useState(7);
  const [label, setLabel] = useState('');
  const [links, setLinks] = useState<ShareLink[]>([]);
  const [generated, setGenerated] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [clock, setClock] = useState(() => Date.now());
  useEffect(() => { const timer = window.setInterval(() => setClock(Date.now()), 60_000); return () => window.clearInterval(timer); }, []);
  useEffect(() => {
    if (!enabled) return;
    fetch('/api/pregnancy-sharing', { cache: 'no-store' }).then((r) => r.json()).then((data) => setLinks(data.links ?? [])).catch(() => setMessage('Support links could not be loaded.'));
  }, [enabled]);
  const toggle = (id: Scope) => setScopes((current) => current.includes(id) ? current.filter((scope) => scope !== id) : [...current, id]);
  async function create(rotateId?: string) {
    setBusy(true); setMessage(''); setGenerated(''); setCopied(false);
    try {
      const response = await fetch('/api/pregnancy-sharing', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scopes, days, label, rotateId }) });
      const data = await response.json();
      if (!response.ok) { setMessage(data.error ?? 'Could not create a support link.'); return; }
      setGenerated(data.url);
      const refreshed = await fetch('/api/pregnancy-sharing', { cache: 'no-store' }).then((r) => r.json());
      setLinks(refreshed.links ?? []);
      setMessage('New link ready. Copy it now; for privacy, it cannot be recovered later.');
    } catch { setMessage('Could not create a support link. Try again.'); }
    finally { setBusy(false); }
  }
  async function revoke(id: string) {
    setBusy(true); setMessage('');
    try {
      const response = await fetch('/api/pregnancy-sharing', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
      if (!response.ok) { setMessage('Link could not be revoked.'); return; }
      setLinks((current) => current.map((link) => link.id === id ? { ...link, revoked_at: new Date().toISOString() } : link));
      setGenerated(''); setMessage('Access revoked.');
    } catch { setMessage('Link could not be revoked.'); }
    finally { setBusy(false); }
  }
  if (!enabled) return null;
  return <section className={styles.panel} aria-labelledby="partner-share-title">
    <div className={styles.heading}><div className={styles.icon}><ShieldCheck size={24} /></div><div><span>BY YOUR CHOICE</span><h2 id="partner-share-title">Invite someone into your journey.</h2><p>Create a temporary, read-only link for a partner or trusted support person. Your private records stay yours.</p></div></div>
    <fieldset className={styles.choices}><legend>Choose exactly what they can see</legend>{choices.map((choice) => <label key={choice.id}><input type="checkbox" aria-label={choice.title} checked={scopes.includes(choice.id)} onChange={() => toggle(choice.id)} /><span><strong>{choice.title}</strong><small>{choice.description}</small></span></label>)}</fieldset>
    <div className={styles.controls}><label>Link expires after<select value={days} onChange={(event) => setDays(Number(event.target.value))}><option value={1}>24 hours</option><option value={7}>7 days</option><option value={30}>30 days</option></select></label><label>Private label (optional)<input value={label} maxLength={60} onChange={(event) => setLabel(event.target.value)} placeholder="For my partner" /></label></div>
    <button className={styles.primary} type="button" disabled={busy || scopes.length === 0} onClick={() => void create()}><Link2 size={17} /> Generate temporary link</button>
    {generated && <div className={styles.generated}><span>Copy this link now. It is shown only once.</span><div><input readOnly aria-label="Your new support link" value={generated} onFocus={(event) => event.target.select()} /><button type="button" onClick={async () => { try { await navigator.clipboard.writeText(generated); setCopied(true); } catch { setMessage('Select and copy the link manually.'); } }}>{copied ? <Check size={17} /> : <Copy size={17} />}{copied ? 'Copied' : 'Copy'}</button></div></div>}
    {message && <output className={styles.message}>{message}</output>}
    <div className={styles.list}><h3>Your support links</h3>{links.length === 0 ? <p>No links created. Sharing is off by default.</p> : links.map((link) => { const active = !link.revoked_at && new Date(link.expires_at).getTime() > clock; return <div className={styles.linkRow} key={link.id}><div><strong>{link.label || 'Support link'}</strong><small>{active ? `Active until ${new Date(link.expires_at).toLocaleDateString()}` : link.revoked_at ? 'Revoked' : 'Expired'} · {link.scopes.map((scope) => choices.find((choice) => choice.id === scope)?.title).join(', ')}</small></div>{active && <div className={styles.actions}><button type="button" disabled={busy} onClick={() => void create(link.id)} title="Revoke this link and make a new one"><RotateCcw size={15} /> Rotate</button><button type="button" disabled={busy} onClick={() => void revoke(link.id)}><X size={15} /> Revoke</button></div>}</div>; })}</div>
    <p className={styles.note}>Anyone with an active link can see only the information selected above. You can revoke it at any time.</p>
  </section>;
}
