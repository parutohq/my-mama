'use client';

import Link from 'next/link';
import { Eye, EyeOff, Heart, LockKeyhole, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { parsePublicStartIntent, publicJourneyChoices, publicStartIntentKey, type PublicStartIntent } from '@/lib/public-start-intent';

type Mode = 'sign-in' | 'sign-up' | 'recovery';
type Props = { initialMode?: Mode; initialMessage?: string };
const messages = { verification: 'That confirmation link is no longer valid. Request a new email and try again.', verified: 'Your email is confirmed. Sign in to continue your MAMA journey.' };
function friendlyError(mode: Mode, error: { message?: string } | null) {
  if (!error) return '';
  const message = error.message?.toLowerCase() || '';
  if (message.includes('already registered') || message.includes('already exists')) return 'An account may already exist for this email. Try signing in or resetting your password.';
  if (message.includes('rate limit')) return 'Please wait a few minutes before trying again.';
  if (message.includes('password')) return mode === 'sign-up' ? 'Choose a password with at least eight characters.' : 'That email or password was not recognised.';
  if (message.includes('email')) return 'Check that email address and try again.';
  return mode === 'recovery' ? 'We could not send that reset email. Please try again.' : 'We could not complete that request. Please try again.';
}
export function AuthForm({ initialMode = 'sign-in', initialMessage }: Props) {
  const [mode, setMode] = useState<Mode>(initialMode), [startIntent, setStartIntent] = useState<PublicStartIntent | null>(null), [email, setEmail] = useState(''), [password, setPassword] = useState(''), [showPassword, setShowPassword] = useState(false), [message, setMessage] = useState(initialMessage ? messages[initialMessage as keyof typeof messages] || initialMessage : ''), [busy, setBusy] = useState(false), [canResend, setCanResend] = useState(false), [username, setUsername] = useState(''), [age13Plus, setAge13Plus] = useState(false), [usernameStatus, setUsernameStatus] = useState('');
  useEffect(() => {
    if (initialMode !== 'sign-up') return;
    const timer = window.setTimeout(() => {
      try { const intent = parsePublicStartIntent(JSON.parse(window.sessionStorage.getItem(publicStartIntentKey) || 'null')); setStartIntent(intent); if (intent?.username) setUsername(intent.username); } catch { setStartIntent(null); }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [initialMode]);
  useEffect(() => { if (mode !== 'sign-up' || !username) return; const controller = new AbortController(); const timer = setTimeout(() => { fetch(`/api/identity/availability?username=${encodeURIComponent(username)}`, { signal: controller.signal }).then((response) => response.json()).then((result) => setUsernameStatus(result.status || 'unavailable')).catch(() => setUsernameStatus('unavailable')); }, 350); return () => { clearTimeout(timer); controller.abort(); }; }, [mode, username]);
  useEffect(() => { document.documentElement.dataset.theme = 'light'; document.documentElement.style.colorScheme = 'light'; window.localStorage.setItem('mama-theme', 'light'); }, []);
  const switchMode = (next: Mode) => { setMode(next); setMessage(''); setCanResend(false); };
  async function submit(event: { preventDefault(): void }) {
    event.preventDefault(); setBusy(true); setMessage(''); setCanResend(false); const supabase = createClient();
    try {
      if (mode === 'recovery') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent('/reset-password')}` });
        setMessage(friendlyError(mode, error) || 'Check your email for a private password-reset link.');
      } else if (mode === 'sign-up') {
        const response = await fetch('/api/identity/sign-up', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, username, age13Plus, startIntent }) });
        const result = await response.json();
        if (response.ok && startIntent) window.sessionStorage.removeItem(publicStartIntentKey);
        setCanResend(response.ok); setMessage(response.ok ? result.message : result.error || 'We could not create the account.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) setMessage(friendlyError(mode, error)); else location.assign('/');
      }
    } finally { setBusy(false); }
  }
  async function resendConfirmation() { setBusy(true); setMessage(''); const { error } = await createClient().auth.resend({ type: 'signup', email, options: { emailRedirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent('/')}` } }); setMessage(friendlyError('sign-up', error) || 'A new confirmation email is on its way.'); setBusy(false); }
  const title = mode === 'sign-up' ? 'Start your MAMA journey.' : mode === 'recovery' ? 'Reset your password.' : 'Welcome back.';
  const intro = mode === 'sign-up' ? 'Create a private space for your health, questions and care.' : mode === 'recovery' ? 'We’ll send a private reset link to your email.' : 'Your journey is right where you left it.';
  return <main id="main-content" className="auth-page premium-auth world-auth"><section className="auth-story"><Link href="/" className="auth-brand"><Heart size={22} fill="currentColor" /> mama.</Link><div><span className="auth-kicker">YOUR LIFE. YOUR PACE.</span><h1>Care that stays<br />with <i>you.</i></h1><p>A personal place for your health, questions and care conversations.</p></div><div className="auth-story-orbit"><span>Private by design</span><Sparkles size={19} /></div></section><section className="auth-panel"><div className="auth-mobile-brand"><Link href="/" className="auth-brand"><Heart size={20} fill="currentColor" /> mama.</Link></div><div className="auth-card"><span className="auth-kicker">{mode === 'sign-up' ? 'PRIVATE BY DESIGN' : mode === 'recovery' ? 'ACCOUNT SECURITY' : 'YOUR PERSONAL CARE SPACE'}</span><h2>{title}</h2><p>{intro}</p><form onSubmit={submit} noValidate>{mode === 'sign-up' && startIntent && <div className="auth-journey-summary"><span>Your chosen journey</span><b>{publicJourneyChoices.find((choice) => choice.stage === startIntent.stage)?.title}</b><small>{startIntent.name ? `MAMA will call you ${startIntent.name}. You can change this later.` : 'You can personalise this after confirmation.'}</small><Link href="/start">Change</Link></div>}{mode === 'sign-up' && <><label>Choose your @username<input required value={username} maxLength={20} autoCapitalize="none" autoComplete="off" onChange={(event) => { setUsername(event.target.value.toLowerCase().replace(/^@/, '')); setUsernameStatus(''); }} placeholder="yourname" /></label><small className="auth-helper" aria-live="polite">{usernameStatus === 'available' ? `@${username} is available. It is not reserved yet.` : usernameStatus === 'unavailable' ? 'That name is already claimed.' : usernameStatus === 'reserved' ? 'That name is reserved.' : 'Use 3–20 letters, numbers or underscores.'}</small></>}<label>Email<input required type="email" inputMode="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" placeholder="you@example.com" /></label>{mode !== 'recovery' && <label>Password<span className="password-input"><input required minLength={8} type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === 'sign-up' ? 'new-password' : 'current-password'} placeholder="At least 8 characters" /><button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword((visible) => !visible)}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></span></label>}{mode === 'sign-up' && <label className="auth-age-confirmation"><input type="checkbox" required checked={age13Plus} onChange={(event) => setAge13Plus(event.target.checked)} /> I confirm that I am at least 13 years old.</label>}{mode === 'sign-up' && <small className="auth-helper"><LockKeyhole size={14} /> We only ask for account details here. You choose what health information to add next.</small>}<button className="auth-submit" disabled={busy}>{busy ? 'Please wait…' : mode === 'sign-up' ? 'Create my private space' : mode === 'recovery' ? 'Send reset link' : 'Sign in'}</button></form>{message && <output className="auth-message" aria-live="polite">{message}</output>}{canResend && <button type="button" className="text-button auth-resend" disabled={busy} onClick={() => void resendConfirmation()}>Resend confirmation email</button>}<div className="auth-actions">{mode === 'sign-in' ? <><button type="button" className="text-button" onClick={() => switchMode('sign-up')}>Create an account</button><button type="button" className="text-button" onClick={() => switchMode('recovery')}>Forgot password?</button></> : <button type="button" className="text-button" onClick={() => switchMode('sign-in')}>Return to sign in</button>}</div></div></section></main>;
}
