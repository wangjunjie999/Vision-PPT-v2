import { memo } from 'react';

export const CanvasHUD = memo(function CanvasHUD() {
  return (
    <div className="absolute bottom-4 right-4 pointer-events-none z-10">
      <div className="bg-slate-800/90 rounded-lg px-3 py-2.5 border border-slate-600/30">
        <div className="text-[11px] text-slate-400 font-semibold mb-1.5">图例说明</div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-3.5 h-3.5 rounded-sm bg-blue-600 border border-blue-500" />
          <span className="text-[10px] text-slate-300">相机（未吸附）</span>
        </div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-3.5 h-3.5 rounded-sm bg-green-600 border border-green-500 opacity-70" />
          <span className="text-[10px] text-slate-300">相机（已吸附）</span>
        </div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-3.5 h-3.5 rounded-sm bg-amber-600 border border-amber-500" />
          <span className="text-[10px] text-slate-300">执行机构</span>
        </div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-3.5 h-3.5 rounded-sm bg-cyan-600 border border-cyan-500" />
          <span className="text-[10px] text-slate-300">产品（未吸附）</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 rounded-sm bg-cyan-600 border border-green-500" />
          <span className="text-[10px] text-slate-300">产品（已吸附）</span>
        </div>
      </div>
    </div>
  );
});
