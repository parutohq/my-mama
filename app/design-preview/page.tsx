import { notFound } from 'next/navigation';
import { DesignPreviewClient } from '@/components/mama/design-preview-client';

/**
 * The Design Lab is intentionally available for local work and Vercel Preview
 * review only. It is not a production user route and never reads care data.
 */
export default function DesignPreviewPage() {
  if (process.env.VERCEL_ENV === 'production') notFound();
  return <DesignPreviewClient />;
}
