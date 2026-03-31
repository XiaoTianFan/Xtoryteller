'use client';

import { useEffect } from 'react';

export function LiveRegion({ message }: { message: string }) {
  useEffect(() => undefined, [message]);
  return (
    <div className="srOnly" aria-live="polite" aria-atomic="true">
      {message}
    </div>
  );
}
