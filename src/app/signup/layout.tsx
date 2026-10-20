import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Apply for Brand Creator Access | Toy Creator',
  description:
    'Distribute your audio plugins, sample packs, and synth presets on ProducerToy. Apply for Toy Creator brand partnership.',
  alternates: {
    canonical: '/signup',
  },
  openGraph: {
    title: 'Apply for Brand Creator Access | Toy Creator',
    description:
      'Distribute your audio plugins, sample packs, and synth presets on ProducerToy. Apply for Toy Creator brand partnership.',
  },
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
