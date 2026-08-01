'use client';

import { useEffect, useRef } from 'react';

interface InactivityGuardProps {
  timeoutMinutes?: number;
  onLock: () => void;
  children: React.ReactNode;
}

export default function InactivityGuard({
  timeoutMinutes = 5,
  onLock,
  children,
}: InactivityGuardProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      onLock();
    }, timeoutMinutes * 60 * 1000);
  };

  useEffect(() => {
    const events = ['mousemove', 'keydown', 'click', 'touchstart', 'scroll'];

    const handleUserActivity = () => {
      resetTimer();
    };

    // Inicia o timer inicial
    resetTimer();

    // Adiciona listeners para eventos de interação do usuário
    events.forEach((event) => {
      window.addEventListener(event, handleUserActivity);
    });

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      events.forEach((event) => {
        window.removeEventListener(event, handleUserActivity);
      });
    };
  }, [timeoutMinutes, onLock]);

  return <>{children}</>;
}
