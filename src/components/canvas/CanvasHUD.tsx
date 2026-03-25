import { memo } from 'react';

export const CanvasHUD = memo(function CanvasHUD() {
  return (
    <div className="absolute bottom-4 right-4 pointer-events-none z-10">
      <div className="bg-card/90 backdrop-blur-sm rounded-lg px-3 py-2.5 border border-border/50 shadow-md">
        <div className="text-[11px] text-muted-foreground font-semibold mb-1.5 uppercase tracking-widest font-mono">图例</div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-3.5 h-3.5 rounded-sm bg-primary border border-primary/60" />
          <span className="text-[10px] text-foreground/80">相机（未吸附）</span>
        </div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-3.5 h-3.5 rounded-sm bg-success border border-success/60 opacity-70" />
          <span className="text-[10px] text-foreground/80">相机（已吸附）</span>
        </div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-3.5 h-3.5 rounded-sm bg-warning border border-warning/60" />
          <span className="text-[10px] text-foreground/80">执行机构</span>
        </div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-3.5 h-3.5 rounded-sm bg-accent border border-accent/60" />
          <span className="text-[10px] text-foreground/80">产品（未吸附）</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 rounded-sm bg-accent border border-success/60" />
          <span className="text-[10px] text-foreground/80">产品（已吸附）</span>
        </div>
      </div>
    </div>
  );
});
