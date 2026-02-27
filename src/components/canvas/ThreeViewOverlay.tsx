/**
 * ThreeViewOverlay - Renders coordinate axes and HUD elements as a viewport-fixed overlay.
 * These elements stay anchored to the visible window edges regardless of zoom/pan.
 */
import { memo, useMemo } from 'react';

type ViewProjection = 'front' | 'side' | 'top';

interface ViewPanelInfo {
  view: ViewProjection;
  label: string;
  /** Origin of panel in SVG coordinate space */
  panelX: number;
  panelY: number;
  panelW: number;
  panelH: number;
  headerH: number;
  /** Transform computed by computeViewTransform */
  scale: number;
  offsetX: number;
  offsetY: number;
}

interface ThreeViewOverlayProps {
  panels: ViewPanelInfo[];
  ovZoom: number;
  ovPan: { x: number; y: number };
  containerWidth: number;
  containerHeight: number;
}

const AXIS_COLORS: Record<string, string> = { X: '#3b82f6', Y: '#22c55e', Z: '#f59e0b' };

const AXIS_LABELS: Record<ViewProjection, { h: string; v: string }> = {
  front: { h: 'X', v: 'Z' },
  side: { h: 'Y', v: 'Z' },
  top: { h: 'X', v: 'Y' },
};

const PLANE_LABELS: Record<ViewProjection, string> = { front: 'X-Z', side: 'Y-Z', top: 'X-Y' };

function chooseTickInterval(effectiveScale: number): number {
  const candidates = [10, 20, 50, 100, 200, 500, 1000];
  const targetPx = 60;
  for (const c of candidates) {
    if (c * effectiveScale >= targetPx) return c;
  }
  return 1000;
}

function PanelOverlay({ panel, ovZoom, ovPan, containerWidth, containerHeight }: {
  panel: ViewPanelInfo;
  ovZoom: number;
  ovPan: { x: number; y: number };
  containerWidth: number;
  containerHeight: number;
}) {
  const { view, panelX, panelY, panelW, panelH, headerH, scale, offsetX, offsetY } = panel;
  const labels = AXIS_LABELS[view];
  const hColor = AXIS_COLORS[labels.h];
  const vColor = AXIS_COLORS[labels.v];

  // Panel bounds in screen pixels
  const screenLeft = ovPan.x + panelX * ovZoom;
  const screenTop = ovPan.y + panelY * ovZoom;
  const screenRight = screenLeft + panelW * ovZoom;
  const screenBottom = screenTop + panelH * ovZoom;

  // Visible region clipped to container
  const visLeft = Math.max(0, screenLeft);
  const visRight = Math.min(containerWidth, screenRight);
  const visTop = Math.max(0, screenTop + headerH * ovZoom);
  const visBottom = Math.min(containerHeight, screenBottom);

  // If panel is completely offscreen, skip
  if (visLeft >= visRight || visTop >= visBottom) return null;

  const visW = visRight - visLeft;
  const visH = visBottom - visTop;

  // Coordinate origin in screen pixels
  const originScreenX = ovPan.x + (panelX + offsetX) * ovZoom;
  const originScreenY = ovPan.y + (panelY + offsetY) * ovZoom;

  // Origin relative to the overlay SVG
  const oxRel = originScreenX - visLeft;
  const oyRel = originScreenY - visTop;

  // Effective scale (SVG mm scale * zoom)
  const effScale = scale * ovZoom;
  const tickInterval = chooseTickInterval(effScale);
  const pxInterval = tickInterval * effScale;

  // Generate horizontal ticks
  const hTicks: JSX.Element[] = [];
  if (pxInterval > 10) {
    // positive
    for (let px = oxRel + pxInterval; px < visW - 20; px += pxInterval) {
      const mmVal = Math.round((px - oxRel) / effScale);
      hTicks.push(
        <g key={`ht-p-${mmVal}`}>
          <line x1={px} y1={oyRel - 5} x2={px} y2={oyRel + 5} stroke={hColor} strokeWidth={0.8} opacity={0.6} />
          <text x={px} y={oyRel + 16} textAnchor="middle" fill="#64748b" fontSize={9}>{mmVal}</text>
        </g>
      );
    }
    // negative
    for (let px = oxRel - pxInterval; px > 20; px -= pxInterval) {
      const mmVal = Math.round((px - oxRel) / effScale);
      hTicks.push(
        <g key={`ht-n-${mmVal}`}>
          <line x1={px} y1={oyRel - 5} x2={px} y2={oyRel + 5} stroke={hColor} strokeWidth={0.8} opacity={0.6} />
          <text x={px} y={oyRel + 16} textAnchor="middle" fill="#64748b" fontSize={9}>{mmVal}</text>
        </g>
      );
    }
  }

  // Generate vertical ticks
  const vTicks: JSX.Element[] = [];
  if (pxInterval > 10) {
    for (let py = oyRel + pxInterval; py < visH - 14; py += pxInterval) {
      const mmVal = Math.round((py - oyRel) / effScale);
      vTicks.push(
        <g key={`vt-p-${mmVal}`}>
          <line x1={oxRel - 5} y1={py} x2={oxRel + 5} y2={py} stroke={vColor} strokeWidth={0.8} opacity={0.6} />
          <text x={oxRel - 8} y={py + 3} textAnchor="end" fill="#64748b" fontSize={9}>{mmVal}</text>
        </g>
      );
    }
    for (let py = oyRel - pxInterval; py > 14; py -= pxInterval) {
      const mmVal = Math.round((py - oyRel) / effScale);
      vTicks.push(
        <g key={`vt-n-${mmVal}`}>
          <line x1={oxRel - 5} y1={py} x2={oxRel + 5} y2={py} stroke={vColor} strokeWidth={0.8} opacity={0.6} />
          <text x={oxRel - 8} y={py + 3} textAnchor="end" fill="#64748b" fontSize={9}>{mmVal}</text>
        </g>
      );
    }
  }

  // Scale bar calculation
  const barCandidates = [10, 20, 50, 100, 200, 500, 1000];
  let barMM = 100;
  for (const c of barCandidates) {
    if (c * effScale >= 40 && c * effScale <= 140) { barMM = c; break; }
  }
  const barPx = barMM * effScale;
  const ratio = Math.round(1 / scale * 10) / 10;

  return (
    <svg
      style={{
        position: 'absolute',
        left: visLeft,
        top: visTop,
        width: visW,
        height: visH,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      {/* Horizontal axis */}
      <line x1={4} y1={oyRel} x2={visW - 4} y2={oyRel} stroke={hColor} strokeWidth={1} strokeDasharray="6 3" opacity={0.35} />
      {/* Vertical axis */}
      <line x1={oxRel} y1={4} x2={oxRel} y2={visH - 4} stroke={vColor} strokeWidth={1} strokeDasharray="6 3" opacity={0.35} />

      {/* Ticks */}
      {hTicks}
      {vTicks}

      {/* Horizontal axis label at right edge */}
      <rect x={visW - 26} y={oyRel - 18} width={22} height={16} rx={4} fill={hColor} fillOpacity={0.85} />
      <text x={visW - 15} y={oyRel - 6} textAnchor="middle" fill="#fff" fontSize={11} fontWeight="bold">{labels.h}</text>

      {/* Vertical axis label at top edge */}
      <rect x={oxRel + 6} y={4} width={22} height={16} rx={4} fill={vColor} fillOpacity={0.85} />
      <text x={oxRel + 17} y={16} textAnchor="middle" fill="#fff" fontSize={11} fontWeight="bold">{labels.v}</text>

      {/* Bottom-left: scale bar */}
      <g transform={`translate(10, ${visH - 12})`}>
        <rect x={-4} y={-24} width={Math.max(barPx + 50, 95)} height={30} rx={6} fill="#1e293b" fillOpacity={0.92} stroke="#334155" strokeWidth={0.5} />
        <line x1={4} y1={-6} x2={4 + barPx} y2={-6} stroke="#94a3b8" strokeWidth={1.5} />
        <line x1={4} y1={-10} x2={4} y2={-2} stroke="#94a3b8" strokeWidth={1} />
        <line x1={4 + barPx} y1={-10} x2={4 + barPx} y2={-2} stroke="#94a3b8" strokeWidth={1} />
        <text x={4 + barPx / 2} y={-14} textAnchor="middle" fill="#cbd5e1" fontSize={9}>{barMM}mm</text>
        <text x={4 + barPx + 6} y={-3} textAnchor="start" fill="#64748b" fontSize={8}>1:{ratio}</text>
      </g>

      {/* Bottom-right: plane indicator */}
      <g transform={`translate(${visW - 58}, ${visH - 12})`}>
        <rect x={0} y={-24} width={52} height={30} rx={6} fill="#1e293b" fillOpacity={0.92} stroke="#334155" strokeWidth={0.5} />
        <text x={26} y={-12} textAnchor="middle" fill="#64748b" fontSize={8}>当前平面</text>
        <text x={26} y={2} textAnchor="middle" fill="#93c5fd" fontSize={13} fontWeight="bold">{PLANE_LABELS[view]}</text>
      </g>
    </svg>
  );
}

export const ThreeViewOverlay = memo(function ThreeViewOverlay({
  panels,
  ovZoom,
  ovPan,
  containerWidth,
  containerHeight,
}: ThreeViewOverlayProps) {
  if (containerWidth <= 0 || containerHeight <= 0) return null;

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {panels.map(panel => (
        <PanelOverlay
          key={panel.view}
          panel={panel}
          ovZoom={ovZoom}
          ovPan={ovPan}
          containerWidth={containerWidth}
          containerHeight={containerHeight}
        />
      ))}
    </div>
  );
});

export type { ViewPanelInfo };
