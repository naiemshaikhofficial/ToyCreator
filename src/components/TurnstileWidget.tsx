'use client';

import React from 'react';
import { Turnstile } from '@marsidev/react-turnstile';

interface TurnstileWidgetProps {
  onSuccess: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
  className?: string;
}

export function TurnstileWidget({
  onSuccess,
  onError,
  onExpire,
  className = '',
}: TurnstileWidgetProps) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '0x4AAAAAAEke7vi0G2cAoQ9j';

  return (
    <div className={`flex justify-center my-3 ${className}`}>
      <Turnstile
        siteKey={siteKey}
        onSuccess={onSuccess}
        onError={onError}
        onExpire={onExpire}
        options={{
          theme: 'dark',
          size: 'normal',
        }}
      />
    </div>
  );
}
