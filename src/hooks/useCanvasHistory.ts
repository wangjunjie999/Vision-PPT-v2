import { useCallback, useRef, useState } from 'react';

const MAX_HISTORY = 50;

export interface CanvasHistoryEntry<T> {
  state: T;
  label: string;
}

export function useCanvasHistory<T>(initialState: T) {
  const historyRef = useRef<CanvasHistoryEntry<T>[]>([{ state: initialState, label: 'initial' }]);
  const indexRef = useRef(0);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const updateFlags = useCallback(() => {
    setCanUndo(indexRef.current > 0);
    setCanRedo(indexRef.current < historyRef.current.length - 1);
  }, []);

  const pushState = useCallback((state: T, label: string = 'edit') => {
    // Discard any redo history
    historyRef.current = historyRef.current.slice(0, indexRef.current + 1);
    historyRef.current.push({ state: JSON.parse(JSON.stringify(state)), label });
    // Limit history size
    if (historyRef.current.length > MAX_HISTORY) {
      historyRef.current = historyRef.current.slice(historyRef.current.length - MAX_HISTORY);
    }
    indexRef.current = historyRef.current.length - 1;
    updateFlags();
  }, [updateFlags]);

  const undo = useCallback((): T | null => {
    if (indexRef.current <= 0) return null;
    indexRef.current -= 1;
    updateFlags();
    return JSON.parse(JSON.stringify(historyRef.current[indexRef.current].state));
  }, [updateFlags]);

  const redo = useCallback((): T | null => {
    if (indexRef.current >= historyRef.current.length - 1) return null;
    indexRef.current += 1;
    updateFlags();
    return JSON.parse(JSON.stringify(historyRef.current[indexRef.current].state));
  }, [updateFlags]);

  const reset = useCallback((state: T) => {
    historyRef.current = [{ state: JSON.parse(JSON.stringify(state)), label: 'reset' }];
    indexRef.current = 0;
    updateFlags();
  }, [updateFlags]);

  return { pushState, undo, redo, canUndo, canRedo, reset };
}
