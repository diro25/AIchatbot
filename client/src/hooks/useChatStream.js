import { useCallback, useEffect, useRef, useState } from 'react';
import { streamChat } from '../api/client';

export function useChatStream({ onEvent }) {
  const controllerRef = useRef(null);
  const [isStreaming, setIsStreaming] = useState(false);

  useEffect(() => () => controllerRef.current?.abort(), []);

  const start = useCallback(async (conversationId, body) => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setIsStreaming(true);
    try {
      await streamChat(conversationId, body, { signal: controller.signal, onEvent });
    } finally {
      if (controllerRef.current === controller) controllerRef.current = null;
      setIsStreaming(false);
    }
  }, [onEvent]);

  const stop = useCallback(() => controllerRef.current?.abort(), []);

  return { start, stop, isStreaming };
}
