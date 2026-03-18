import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Bot, Send, Trash2, X, Loader2, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useData } from '@/contexts/DataContext';

type Message = { role: 'user' | 'assistant'; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-assistant`;

async function streamChat({
  messages,
  context,
  onDelta,
  onDone,
  signal,
}: {
  messages: Message[];
  context?: string;
  onDelta: (text: string) => void;
  onDone: () => void;
  signal?: AbortSignal;
}) {
  const resp = await fetch(CHAT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ messages, context }),
    signal,
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error || `Error ${resp.status}`);
  }

  if (!resp.body) throw new Error('No response body');

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let done = false;

  while (!done) {
    const { done: readerDone, value } = await reader.read();
    if (readerDone) break;
    buffer += decoder.decode(value, { stream: true });

    let idx: number;
    while ((idx = buffer.indexOf('\n')) !== -1) {
      let line = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 1);
      if (line.endsWith('\r')) line = line.slice(0, -1);
      if (line.startsWith(':') || line.trim() === '') continue;
      if (!line.startsWith('data: ')) continue;

      const jsonStr = line.slice(6).trim();
      if (jsonStr === '[DONE]') { done = true; break; }

      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) onDelta(content);
      } catch {
        buffer = line + '\n' + buffer;
        break;
      }
    }
  }

  // flush remaining
  if (buffer.trim()) {
    for (let raw of buffer.split('\n')) {
      if (!raw) continue;
      if (raw.endsWith('\r')) raw = raw.slice(0, -1);
      if (!raw.startsWith('data: ')) continue;
      const jsonStr = raw.slice(6).trim();
      if (jsonStr === '[DONE]') continue;
      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) onDelta(content);
      } catch { /* ignore */ }
    }
  }

  onDone();
}

function formatJsonConfig(label: string, config: any): string {
  if (!config || typeof config !== 'object') return '';
  const entries = Object.entries(config).filter(([, v]) => v !== null && v !== undefined && v !== '');
  if (entries.length === 0) return '';
  return `      ${label}: ${entries.map(([k, v]) => `${k}=${v}`).join(', ')}`;
}

function buildProjectContext(data: ReturnType<typeof useData>): string {
  const { selectedProjectId, projects, workstations, modules, layouts, getProjectWorkstations, getWorkstationModules } = data;

  const parts: string[] = [];

  const project = projects.find(p => p.id === selectedProjectId);
  if (project) {
    parts.push(`【当前项目】${project.name}（编号: ${project.code || '无'}）`);
    if (project.customer) parts.push(`客户: ${project.customer}`);
    if (project.product_process) parts.push(`工艺: ${project.product_process}`);
    if (project.cycle_time_target) parts.push(`节拍目标: ${project.cycle_time_target}s`);
    if (project.main_camera_brand) parts.push(`主相机品牌: ${project.main_camera_brand}`);
    if (project.environment) parts.push(`环境: ${project.environment}`);
    if (project.quality_strategy) parts.push(`质量策略: ${project.quality_strategy}`);
    if (project.production_line) parts.push(`产线: ${project.production_line}`);
    if (project.responsible) parts.push(`负责人: ${project.responsible}`);
    if (project.vision_responsible) parts.push(`视觉负责人: ${project.vision_responsible}`);
    if (project.sales_responsible) parts.push(`销售负责人: ${project.sales_responsible}`);
    if (project.notes) parts.push(`备注: ${project.notes}`);
    if (project.status) parts.push(`状态: ${project.status}`);

    const pws = getProjectWorkstations(project.id);
    parts.push(`工位数量: ${pws.length}`);

    pws.forEach((ws, wi) => {
      parts.push(`\n  工位${wi + 1}: ${ws.name}（编号: ${ws.code || '无'}, 类型: ${ws.type || '未知'}）`);
      if (ws.observation_target) parts.push(`    观测目标: ${ws.observation_target}`);
      if (ws.cycle_time) parts.push(`    节拍: ${ws.cycle_time}s`);
      if (ws.process_stage) parts.push(`    工序: ${ws.process_stage}`);
      if (ws.motion_description) parts.push(`    运动描述: ${ws.motion_description}`);
      if (ws.risk_notes) parts.push(`    风险提示: ${ws.risk_notes}`);
      if (ws.action_script) parts.push(`    动作脚本: ${ws.action_script}`);
      if (ws.enclosed) parts.push(`    封闭环境: 是`);
      if (ws.shot_count) parts.push(`    拍照次数: ${ws.shot_count}`);
      if (ws.status) parts.push(`    状态: ${ws.status}`);
      const dims = ws.product_dimensions as any;
      if (dims && (dims.length || dims.width || dims.height)) {
        parts.push(`    产品尺寸: ${dims.length || '?'}×${dims.width || '?'}×${dims.height || '?'} mm`);
      }
      const installSpace = ws.install_space as any;
      if (installSpace && (installSpace.length || installSpace.width || installSpace.height)) {
        parts.push(`    安装空间: ${installSpace.length || '?'}×${installSpace.width || '?'}×${installSpace.height || '?'} mm`);
      }
      const acceptance = ws.acceptance_criteria as any;
      if (acceptance) {
        const accStr = typeof acceptance === 'object' ? JSON.stringify(acceptance) : String(acceptance);
        if (accStr !== '{}' && accStr !== 'null') parts.push(`    验收标准: ${accStr}`);
      }

      const layout = layouts.find(l => l.workstation_id === ws.id);
      if (layout) {
        if (layout.width || layout.height || layout.depth) {
          parts.push(`    布局尺寸: ${layout.width || '?'}×${layout.height || '?'}×${layout.depth || '?'} mm`);
        }
        if (layout.conveyor_type) parts.push(`    传送类型: ${layout.conveyor_type}`);
        if (layout.camera_count) parts.push(`    相机数量: ${layout.camera_count}`);
      }

      const wsMods = getWorkstationModules(ws.id);
      wsMods.forEach((mod, mi) => {
        parts.push(`    模块${mi + 1}: ${mod.name}（类型: ${mod.type || '未知'}, 状态: ${mod.status || '未知'}）`);
        if (mod.description) parts.push(`      描述: ${mod.description}`);
        if (mod.selected_camera) parts.push(`      相机: ${mod.selected_camera}`);
        if (mod.selected_lens) parts.push(`      镜头: ${mod.selected_lens}`);
        if (mod.selected_light) parts.push(`      光源: ${mod.selected_light}`);
        if (mod.selected_controller) parts.push(`      控制器: ${mod.selected_controller}`);
        if (mod.trigger_type) parts.push(`      触发方式: ${mod.trigger_type}`);
        if (mod.roi_strategy) parts.push(`      ROI策略: ${mod.roi_strategy}`);
        if (mod.processing_time_limit) parts.push(`      处理时限: ${mod.processing_time_limit}ms`);
        if (mod.output_types?.length) parts.push(`      输出类型: ${mod.output_types.join(', ')}`);
        const defectLine = formatJsonConfig('缺陷检测配置', mod.defect_config);
        if (defectLine) parts.push(defectLine);
        const measureLine = formatJsonConfig('测量配置', mod.measurement_config);
        if (measureLine) parts.push(measureLine);
        const ocrLine = formatJsonConfig('OCR配置', mod.ocr_config);
        if (ocrLine) parts.push(ocrLine);
        const dlLine = formatJsonConfig('深度学习配置', mod.deep_learning_config);
        if (dlLine) parts.push(dlLine);
        const posLine = formatJsonConfig('定位配置', mod.positioning_config);
        if (posLine) parts.push(posLine);
      });
    });
  }

  return parts.length > 0 ? parts.join('\n') : '';
}

export function AIChatPanel() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [contextEnabled, setContextEnabled] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const dataCtx = useData();
  const projectContext = useMemo(() => buildProjectContext(dataCtx), [
    dataCtx.selectedProjectId, dataCtx.projects, dataCtx.workstations, dataCtx.modules, dataCtx.layouts,
  ]);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMsg: Message = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    let assistantSoFar = '';
    const controller = new AbortController();
    abortRef.current = controller;

    const upsert = (chunk: string) => {
      assistantSoFar += chunk;
      const current = assistantSoFar;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant') {
          return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: current } : m);
        }
        return [...prev, { role: 'assistant', content: current }];
      });
    };

    try {
      // Build messages with optional project context
      const chatMessages = [...messages, userMsg];
      const contextPayload = contextEnabled && projectContext ? projectContext : undefined;

      await streamChat({
        messages: chatMessages,
        context: contextPayload,
        onDelta: upsert,
        onDone: () => setIsLoading(false),
        signal: controller.signal,
      });
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        toast.error(e.message || 'AI 请求失败');
      }
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClear = () => {
    if (abortRef.current) abortRef.current.abort();
    setMessages([]);
    setIsLoading(false);
  };

  return (
    <>
      {/* Floating trigger button */}
      <Button
        onClick={() => setOpen(true)}
        size="icon-lg"
        className={cn(
          'fixed bottom-6 right-6 z-50 rounded-full shadow-xl',
          'bg-primary text-primary-foreground hover:bg-primary/90',
          'transition-transform hover:scale-105',
          open && 'hidden'
        )}
      >
        <Bot className="h-6 w-6" />
      </Button>

      <Sheet open={open} onOpenChange={setOpen} modal={false}>
        <SheetContent side="right" className="w-[400px] sm:w-[440px] p-0 flex flex-col gap-0 shadow-2xl bg-background/60 backdrop-blur-xl border-border/50 [&>button]:hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 bg-card/80 backdrop-blur-md shrink-0">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-primary/15 flex items-center justify-center">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <span className="font-semibold text-sm">AI 视觉方案助手</span>
            </div>
            <div className="flex items-center gap-0.5">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setContextEnabled(prev => !prev)}
                title={contextEnabled && projectContext ? "已启用项目上下文" : "点击启用项目上下文"}
                className={cn(
                  "rounded-lg h-8 w-8 transition-all",
                  contextEnabled && projectContext
                    ? "bg-primary/15 text-primary hover:bg-primary/25"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                )}
              >
                <Database className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={handleClear}
                title="清空对话"
                className="rounded-lg h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setOpen(false)}
                className="rounded-lg h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Context indicator */}
          {contextEnabled && projectContext && (
            <div className="px-4 py-1.5 bg-primary/5 border-b border-border/40 text-xs text-muted-foreground flex items-center gap-1.5 shrink-0 backdrop-blur-md">
              <Database className="h-3 w-3 text-primary" />
              <span>已加载当前项目配置信息，AI 将基于实际数据回答</span>
            </div>
          )}

          {/* Messages */}
          <ScrollArea className="flex-1 overflow-hidden">
            <div ref={scrollRef} className="p-4 space-y-4 min-h-full">
              {messages.length === 0 && (
                <div className="text-center text-muted-foreground text-sm py-12 space-y-3">
                  <Bot className="h-12 w-12 mx-auto text-muted-foreground/40" />
                  <p>你好！我是 AI 视觉方案助手。</p>
                  <p className="text-xs">可以问我关于相机选型、镜头计算、光源设计、检测算法等问题。</p>
                </div>
              )}
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={cn(
                    'flex',
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  <div
                    className={cn(
                      'max-w-[85%] rounded-xl px-3 py-2 text-sm',
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground'
                    )}
                  >
                    {msg.role === 'assistant' ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-xl px-3 py-2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-3 border-t border-border bg-card shrink-0">
            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="输入问题..."
                className="min-h-[40px] max-h-[120px] resize-none text-sm"
                rows={1}
              />
              <Button
                size="icon"
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
