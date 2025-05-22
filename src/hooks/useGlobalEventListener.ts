import { useEffect, useRef } from 'react';

export function useGlobalEventListener(event: string, handler: (e: any) => void) {
  const savedHandler = useRef(handler);

  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    const eventListener = (e: any) => savedHandler.current(e);
    window.addEventListener(event, eventListener);
    return () => {
      window.removeEventListener(event, eventListener);
    };
  }, [event]);
} 