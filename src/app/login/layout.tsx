import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In to Toy Creator',
  description:
    'Sign in to your Toy Creator developer portal to manage VST plugins, sample packs, sales analytics, and payouts.',
  alternates: {
    canonical: '/login',
  },
  openGraph: {
    title: 'Sign In | Toy Creator',
    description:
      'Access your authorized developer portal to manage VST plugins, audio sample packs, and revenue.',
  },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
