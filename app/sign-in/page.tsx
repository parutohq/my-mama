'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'sign-in' | 'sign-up' | 'recovery'>('sign-in');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event: { preventDefault(): void }) {
    event.preventDefault(); setBusy(true); setMessage('');
    const supabase = createClient();
    if (mode === 'recovery') {
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${location.origin}/auth/callback?next=/` });
      setMessage(error ? error.message : 'Check your email for recovery instructions.');
    } else if (mode === 'sign-up') {
      const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${location.origin}/auth/callback` } });
      setMessage(error ? error.message : 'Check your email to confirm your account.');
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMessage(error.message); else location.assign('/');
    }
    setBusy(false);
  }
  return <main className="auth-page"><section className="auth-card"><p className="eyebrow">MAMA</p><h1>Your personal care space</h1><p>Sign in to keep your records private and available across devices.</p><form onSubmit={submit}><label>Email<input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></label>{mode !== 'recovery' && <label>Password<input required minLength={8} type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === 'sign-up' ? 'new-password' : 'current-password'} /></label>}<button disabled={busy} type="submit">{busy ? 'Please wait…' : mode === 'sign-up' ? 'Create account' : mode === 'recovery' ? 'Send recovery email' : 'Sign in'}</button></form>{message && <output>{message}</output>}<p><button type="button" className="text-button" onClick={() => setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in')}>{mode === 'sign-in' ? 'Create an account' : 'I already have an account'}</button></p><p><button type="button" className="text-button" onClick={() => setMode('recovery')}>Forgot your password?</button></p></section></main>;
}
