import React from 'react';

export function CreatorPortalJsonLd() {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL && !process.env.NEXT_PUBLIC_SITE_URL.includes('localhost')
      ? process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')
      : 'https://creators.producertoy.com';

  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${baseUrl}/#website`,
        url: baseUrl,
        name: 'Toy Creator — Audio Developer & Publisher Portal',
        description:
          'Dedicated creator platform for music plugin developers, VST architects, sample pack producers, and audio publishers. Distribute, license, and monetize audio software.',
        publisher: {
          '@type': 'Organization',
          '@id': 'https://producertoy.com/#organization',
          name: 'Producer Toy',
          url: 'https://producertoy.com',
          logo: {
            '@type': 'ImageObject',
            url: `${baseUrl}/icon.png`,
            width: 512,
            height: 512,
          },
          sameAs: [
            'https://twitter.com/producertoy',
            'https://instagram.com/producertoy',
            'https://youtube.com/@producertoy',
          ],
        },
      },
      {
        '@type': 'WebApplication',
        '@id': `${baseUrl}/#webapp`,
        url: baseUrl,
        name: 'Toy Creator Portal',
        applicationCategory: 'DeveloperApplication, BusinessApplication, MultimediaApplication',
        operatingSystem: 'All (Web Platform)',
        browserRequirements: 'Requires JavaScript. Requires HTML5.',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
          availability: 'https://schema.org/InStock',
        },
        description:
          'Comprehensive creator dashboard and distribution engine for digital audio products, VST/AU plugins, sound packs, and presets.',
      },
      {
        '@type': 'FAQPage',
        '@id': `${baseUrl}/#faq`,
        mainEntity: [
          {
            '@type': 'Question',
            name: 'What products can I publish on Toy Creator?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'You can publish Audio Plugins (VST3, AU, AAX, CLAP for Windows and macOS), Sample Packs & Sound Libraries (WAV, AIFF, MIDI), Synth Presets (Serum, Diva, Vital, Phase Plant), and DAW project templates.',
            },
          },
          {
            '@type': 'Question',
            name: 'How do payouts and creator earnings work?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Creators receive automated revenue share payouts directly to their bank account or PayPal. Earnings are tracked in real time on your dashboard with complete breakdown by product, country, and license tier.',
            },
          },
          {
            '@type': 'Question',
            name: 'Does Toy Creator offer license key management for VST plugins?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Yes. Toy Creator includes a built-in cryptographic license generator with machine activation limits, offline validation tokens, and anti-piracy revoke capabilities.',
            },
          },
          {
            '@type': 'Question',
            name: 'How do I apply for a Creator Brand account?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Submit the Creator Partnership Application with your developer portfolio or sound design samples. Applications are reviewed within 24 to 48 hours to ensure top audio quality on Producer Toy.',
            },
          },
        ],
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
