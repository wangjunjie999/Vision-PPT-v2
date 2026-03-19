import { Button } from '@/components/ui/button';
import { Wand2, Loader2, Square, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AIFillButtonProps {
  status: 'idle' | 'generating' | 'typing' | 'done';
  onStart: () => void;
  onStop: () => void;
  className?: string;
}

export function AIFillButton({ status, onStart, onStop, className }: AIFillButtonProps) {
  const isActive = status === 'generating' || status === 'typing';

  return (
    <Button
      variant={isActive ? 'destructive' : 'outline'}
      size="sm"
      onClick={isActive ? onStop : onStart}
      disabled={status === 'done'}
      className={cn(
        'gap-1.5 transition-all duration-300',
        status === 'done' && 'border-green-500 text-green-600 bg-green-50 dark:bg-green-950/30',
        !isActive && status !== 'done' && 'border-primary/30 hover:border-primary hover:bg-primary/5',
        className
      )}
    >
      {status === 'generating' && (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span className="text-xs">生成中...</span>
        </>
      )}
      {status === 'typing' && (
        <>
          <Square className="h-3.5 w-3.5" />
          <span className="text-xs">停止</span>
        </>
      )}
      {status === 'done' && (
        <>
          <Check className="h-3.5 w-3.5" />
          <span className="text-xs">已完成</span>
        </>
      )}
      {status === 'idle' && (
        <>
          <Wand2 className="h-3.5 w-3.5" />
          <span className="text-xs">AI 填写</span>
        </>
      )}
    </Button>
  );
}

/** CSS class helper: returns field highlight class based on AI fill state */
export function getFieldHighlightClass(
  fieldName: string,
  currentField: string | null,
  completedFields: Set<string>
): string {
  if (currentField === fieldName) {
    return 'ring-2 ring-primary/50 border-primary animate-pulse';
  }
  if (completedFields.has(fieldName)) {
    return 'border-green-500/50 bg-green-50/30 dark:bg-green-950/10 transition-colors duration-500';
  }
  return '';
}
