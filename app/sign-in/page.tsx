import { AuthForm } from '@/components/mama/auth-form';

type Search = Promise<{ mode?: string; verified?: string; error?: string; from?: string }>;
export default async function SignInPage({ searchParams }: { searchParams: Search }) {
  const params = await searchParams;
  const initialMode = params.mode === 'sign-up' || params.mode === 'recovery' ? params.mode : 'sign-in';
  const initialMessage = params.verified === '1' ? 'verified' : params.error === 'verification' ? 'verification' : undefined;
  return <AuthForm initialMode={initialMode} initialMessage={initialMessage} />;
}
