'use client';

import Link from 'next/link';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type Mode = 'sign-in' | 'sign-up' | 'recovery';

type Props = { initialMode?: Mode; initialMessage?: string };

const messages = {
  verification: 'That link could not be verified. Please request a new email and try again.',
  verified: 'Your email has been confirmed. Sign in to continue your MAMA journey.',
};

export function AuthForm({ initialMode = 'sign-in', initialMessage }: Props) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState(initialMessage ? messages[initialMessage as keyof typeof messages] || initialMessage : '');
  const [busy, setBusy] = useState(false);

  async function submit(event: { preventDefault(): void }) {
    event.preventDefault();
    setBusy(true); setMessage('');
    const supabase = createClient();
    if (mode === 'recovery') {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent('/reset-password')}`,
      });
      setMessage(error ? 'We could not send a reset link. Please check the email and try again.' : 'Check your email for a private password-reset link.');
    } else if (mode === 'sign-up') {
      const { error } = await supabase.auth.signUp({ email, password, options: {
        emailRedirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent('/sign-in?verified=1')}`,
      } });
      setMessage(error ? 'We could not create your account. Please check the details and try again.' : 'Check your email to confirm your private MAMA account.');
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMessage('We could not sign you in. Check your email and password, or reset your password.');
      else location.assign('/');
    }
    setBusy(false);
  }

  const title = mode === 'sign-up' ? 'Start your MAMA journey.' : mode === 'recovery' ? 'Reset your password.' : 'Welcome back.';
  const intro = mode === 'sign-up' ? 'Create a private space for your health, questions and care.' : mode === 'recovery' ? 'We’ll send a private reset link to your email.' : 'Your journey is right where you left it.';
  return <main id="main-content" className="auth-page"><section className="auth-card">
    <Link className="auth-brand" href="/">♥ mama.</Link><span className="auth-kicker">{mode === 'sign-up' ? 'PRIVATE BY DESIGN' : 'YOUR PERSONAL CARE SPACE'}</span><h1>{title}</h1><p>{intro}</p>
    <form onSubmit={submit}><label>Email<input required type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" /></label>{mode !== 'recovery' && <label>Password<input required minLength={8} type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete={mode === 'sign-up' ? 'new-password' : 'current-password'} /></label>}<button disabled={busy}>{busy ? 'Please wait…' : mode === 'sign-up' ? 'Create my private space' : mode === 'recovery' ? 'Send reset link' : 'Sign in'}</button></form>
    {message && <output aria-live="polite">{message}</output>}
    <p><button type="button" className="text-button" onClick={() => setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in')}>{mode === 'sign-in' ? 'Create an account' : 'I already have an account'}</button></p>
    {mode !== 'recovery' && <p><button type="button" className="text-button" onClick={() => setMode('recovery')}>Forgot your password?</button></p>}
    <p className="auth-preview-link"><Link href="/design-preview">Explore the design preview</Link></p>
  </section></main>;
}
