import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Reset Password | Toy Creator',
  description: 'Recover and reset your Toy Creator developer portal password.',
  robots: {
    index: false,
    follow: true,
  },
  alternates: {
    canonical: '/forgot-password',
  },
};

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
