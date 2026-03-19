import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type FillStatus = 'idle' | 'generating' | 'typing' | 'done';

interface UseAIFormFillOptions {
  formType: 'project' | 'workstation' | 'module';
  getFormData: () => Record<string, any>;
  setFormField: (field: string, value: string) => void;
  projectContext?: Record<string, any>;
  /** typing speed in ms per character, default 40 */
  charDelay?: number;
}

export function useAIFormFill({
  formType,
  getFormData,
  setFormField,
  projectContext,
  charDelay = 40,
}: UseAIFormFillOptions) {
  const [status, setStatus] = useState<FillStatus>('idle');
  const [currentField, setCurrentField] = useState<string | null>(null);
  const [completedFields, setCompletedFields] = useState<Set<string>>(new Set());
  const abortRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopFill = useCallback(() => {
    abortRef.current = true;
    if (timerRef.current) clearTimeout(timerRef.current);
    setStatus('idle');
    setCurrentField(null);
  }, []);

  const typeFieldValue = useCallback(
    (field: string, targetValue: string): Promise<void> => {
      return new Promise((resolve) => {
        setCurrentField(field);
        let pos = 0;
        const tick = () => {
          if (abortRef.current) { resolve(); return; }
          pos++;
          setFormField(field, targetValue.substring(0, pos));
          if (pos >= targetValue.length) {
            setCompletedFields(prev => new Set(prev).add(field));
            setCurrentField(null);
            resolve();
          } else {
            // Vary speed slightly for natural feel
            const jitter = Math.random() * 20 - 10;
            timerRef.current = setTimeout(tick, charDelay + jitter);
          }
        };
        timerRef.current = setTimeout(tick, charDelay);
      });
    },
    [charDelay, setFormField]
  );

  const startFill = useCallback(async () => {
    abortRef.current = false;
    setCompletedFields(new Set());
    setStatus('generating');

    try {
      const currentData = getFormData();

      const { data, error } = await supabase.functions.invoke('ai-form-assist', {
        body: { formType, currentData, projectContext },
      });

      if (error) {
        console.error('AI form assist error:', error);
        toast.error('AI 生成建议失败');
        setStatus('idle');
        return;
      }

      if (data?.error) {
        toast.error(data.error);
        setStatus('idle');
        return;
      }

      const suggestions = data?.suggestions as Record<string, string> | undefined;
      if (!suggestions || Object.keys(suggestions).length === 0) {
        toast.info('所有字段已填写完整，无需补充');
        setStatus('done');
        setTimeout(() => setStatus('idle'), 2000);
        return;
      }

      setStatus('typing');

      // Type each field sequentially
      for (const [field, value] of Object.entries(suggestions)) {
        if (abortRef.current) break;
        await typeFieldValue(field, value);
        // Brief pause between fields
        if (!abortRef.current) {
          await new Promise(r => { timerRef.current = setTimeout(r, 200); });
        }
      }

      if (!abortRef.current) {
        setStatus('done');
        toast.success('AI 智能填写完成');
        setTimeout(() => setStatus('idle'), 3000);
      }
    } catch (err) {
      console.error('AI form fill error:', err);
      toast.error('AI 填写失败');
      setStatus('idle');
    }
  }, [formType, getFormData, projectContext, typeFieldValue]);

  return {
    status,
    currentField,
    completedFields,
    startFill,
    stopFill,
    isGenerating: status === 'generating',
    isTyping: status === 'typing',
    isDone: status === 'done',
    isActive: status === 'generating' || status === 'typing',
  };
}
