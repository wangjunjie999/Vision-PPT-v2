import { Crosshair, MousePointer2 } from 'lucide-react';

export function EmptyFormState() {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center max-w-xs">
        {/* Cartography calibration target */}
        <div className="relative mx-auto mb-6 w-20 h-20">
          {/* Concentric rings */}
          <div className="absolute inset-0 rounded-full border border-accent/20" />
          <div className="absolute inset-2 rounded-full border border-accent/15" />
          <div className="absolute inset-4 rounded-full border border-primary/20" />
          <div className="absolute inset-6 rounded-full border border-primary/15" />
          {/* Crosshair lines */}
          <div className="absolute top-0 left-1/2 w-px h-full bg-gradient-to-b from-accent/30 via-accent/10 to-accent/30" />
          <div className="absolute left-0 top-1/2 h-px w-full bg-gradient-to-r from-accent/30 via-accent/10 to-accent/30" />
          {/* Center icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <Crosshair className="h-5 w-5 text-accent/60" />
          </div>
        </div>
        <h3 className="text-xs font-bold text-foreground mb-2 uppercase tracking-[0.15em] font-mono">
          选择配置项
        </h3>
        <p className="text-[11px] text-muted-foreground leading-relaxed mb-4">
          从左侧项目树中选择一个项目、工位或模块，查看和编辑配置信息
        </p>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded border border-border bg-secondary/30 text-[10px] text-muted-foreground font-mono tracking-wider">
          <MousePointer2 className="h-3 w-3 text-accent/60" />
          <span>SELECT NODE TO BEGIN</span>
        </div>
      </div>
    </div>
  );
}