'use client';

import { useEffect } from 'react';

export function DevWatcher() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') {
      return;
    }

    const socket = new WebSocket(`ws://localhost:${process.env.NEXT_PUBLIC_WS_PORT ?? '3001'}`);
    socket.onmessage = () => window.location.reload();

    return () => socket.close();
  }, []);

  return null;
}
