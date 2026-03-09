import { memo } from 'react';

interface IsometricGridProps {
  isoProject: (px: number, py: number, pz: number) => { x: number; y: number };
}

export const IsometricGrid = memo(function IsometricGrid({ isoProject }: IsometricGridProps) {
  const gridExtent = 500;
  const gridStep = 100;
  const lines: JSX.Element[] = [];

  for (let i = -gridExtent; i <= gridExtent; i += gridStep) {
    const xStart = isoProject(-gridExtent, i, 0);
    const xEnd = isoProject(gridExtent, i, 0);
    lines.push(
      <line key={`gx-${i}`} x1={xStart.x} y1={xStart.y} x2={xEnd.x} y2={xEnd.y}
        stroke="#475569" strokeWidth={i === 0 ? 1.2 : 0.5} strokeDasharray={i === 0 ? undefined : "3 4"}
        opacity={i === 0 ? 0.5 : 0.2} />
    );
    const yStart = isoProject(i, -gridExtent, 0);
    const yEnd = isoProject(i, gridExtent, 0);
    lines.push(
      <line key={`gy-${i}`} x1={yStart.x} y1={yStart.y} x2={yEnd.x} y2={yEnd.y}
        stroke="#475569" strokeWidth={i === 0 ? 1.2 : 0.5} strokeDasharray={i === 0 ? undefined : "3 4"}
        opacity={i === 0 ? 0.5 : 0.2} />
    );
  }

  const origin = isoProject(0, 0, 0);
  const axisLen = 200;
  const xTip = isoProject(axisLen, 0, 0);
  const yTip = isoProject(0, axisLen, 0);
  const zTip = isoProject(0, 0, axisLen);

  const arrowHead = (tip: { x: number; y: number }, from: { x: number; y: number }, color: string) => {
    const dx = tip.x - from.x;
    const dy = tip.y - from.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len === 0) return null;
    const nx = dx / len, ny = dy / len;
    const px = -ny, py = nx;
    const hs = 8;
    return (
      <polygon
        points={`${tip.x},${tip.y} ${tip.x - nx * hs + px * hs * 0.4},${tip.y - ny * hs + py * hs * 0.4} ${tip.x - nx * hs - px * hs * 0.4},${tip.y - ny * hs - py * hs * 0.4}`}
        fill={color}
      />
    );
  };

  return (
    <g className="isometric-grid-axes">
      <g opacity={0.8}>{lines}</g>

      {/* X axis (red) */}
      <line x1={origin.x} y1={origin.y} x2={xTip.x} y2={xTip.y} stroke="#ef4444" strokeWidth={2.5} />
      {arrowHead(xTip, origin, '#ef4444')}
      <text x={xTip.x + 10} y={xTip.y + 4} fill="#ef4444" fontSize="14" fontWeight="bold">X</text>

      {/* Y axis (green) */}
      <line x1={origin.x} y1={origin.y} x2={yTip.x} y2={yTip.y} stroke="#22c55e" strokeWidth={2.5} />
      {arrowHead(yTip, origin, '#22c55e')}
      <text x={yTip.x - 20} y={yTip.y + 4} fill="#22c55e" fontSize="14" fontWeight="bold">Y</text>

      {/* Z axis (blue) */}
      <line x1={origin.x} y1={origin.y} x2={zTip.x} y2={zTip.y} stroke="#3b82f6" strokeWidth={2.5} />
      {arrowHead(zTip, origin, '#3b82f6')}
      <text x={zTip.x + 8} y={zTip.y + 4} fill="#3b82f6" fontSize="14" fontWeight="bold">Z</text>

      {/* Origin */}
      <circle cx={origin.x} cy={origin.y} r={4} fill="#f8fafc" stroke="#475569" strokeWidth={1.5} />
      <text x={origin.x - 18} y={origin.y + 16} fill="#94a3b8" fontSize="10" fontWeight="500">O (0,0,0)</text>

      {/* Scale labels */}
      {[100, 200, 300, 400].map(v => {
        const p = isoProject(v, 0, 0);
        return <text key={`xl-${v}`} x={p.x} y={p.y + 16} textAnchor="middle" fill="#64748b" fontSize="9">{v}</text>;
      })}
      {[100, 200, 300, 400].map(v => {
        const p = isoProject(0, v, 0);
        return <text key={`yl-${v}`} x={p.x} y={p.y + 16} textAnchor="middle" fill="#64748b" fontSize="9">{v}</text>;
      })}
      {[100, 200, 300].map(v => {
        const p = isoProject(0, 0, v);
        return <text key={`zl-${v}`} x={p.x - 14} y={p.y + 4} textAnchor="end" fill="#64748b" fontSize="9">{v}</text>;
      })}
    </g>
  );
});
