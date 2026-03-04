/**
 * ThreeViewLayout - Engineering-style 2x2 grid with Front, Side, Top views + Dimension Table.
 * Uses projection alignment lines and a unified label system (C1, M1, P...).
 * All objects use fixed-size icons for visual consistency.
 */
import { useMemo } from 'react';
import { MECHANISM_LABELS, CAMERA_MOUNT_LABELS, getLabel } from '@/services/labelMaps';

// ===== Types =====

export interface LayoutObject3D {
  id: string;
  type: string;
  name?: string;
  mechanismType?: string;
  posX?: number;
  posY?: number;
  posZ?: number;
  width?: number;
  height?: number;
  depth?: number;
  mountedToMechanismId?: string;
}

export interface ThreeViewLayoutProps {
  objects: LayoutObject3D[];
  mechanisms: string[];
  cameraMounts: string[];
  workstationName: string;
  productDimensions?: { length: number; width: number; height: number };
  width?: number;
  height?: number;
  hideCameras?: boolean;
}

// ===== Visual Layer Config =====

interface LayerConfig {
  fill: string;
  fillOpacity: number;
  stroke: string;
  strokeWidth: number;
  labelPrefix: string;
  zIndex: number;
}

const LAYER_CONFIG: Record<string, LayerConfig> = {
  conveyor: { fill: '#64748b', fillOpacity: 0.15, stroke: '#64748b', strokeWidth: 1, labelPrefix: 'M', zIndex: 1 },
  camera_mount: { fill: '#64748b', fillOpacity: 0.15, stroke: '#64748b', strokeWidth: 1, labelPrefix: 'M', zIndex: 1 },
  mechanism: { fill: '#a855f7', fillOpacity: 0.1, stroke: '#a855f7', strokeWidth: 1.5, labelPrefix: 'M', zIndex: 2 },
  product: { fill: '#06b6d4', fillOpacity: 0.12, stroke: '#06b6d4', strokeWidth: 2, labelPrefix: 'P', zIndex: 3 },
  camera: { fill: '#3b82f6', fillOpacity: 0.2, stroke: '#3b82f6', strokeWidth: 2, labelPrefix: 'C', zIndex: 4 },
};

const MECH_COLORS: Record<string, string> = {
  conveyor: '#22c55e',
  cylinder: '#f59e0b',
  gripper: '#ec4899',
  lift: '#06b6d4',
  turntable: '#8b5cf6',
  stopper: '#ef4444',
  robot_arm: '#a855f7',
  camera_mount: '#64748b',
};

function getLayerConfig(type: string, mechType?: string): LayerConfig {
  if (type === 'camera') return LAYER_CONFIG.camera;
  if (type === 'product') return LAYER_CONFIG.product;
  if (mechType === 'conveyor' || mechType === 'camera_mount') return LAYER_CONFIG[mechType];
  return LAYER_CONFIG.mechanism;
}

function getMechColor(mechType?: string): string {
  return MECH_COLORS[mechType || ''] || '#a855f7';
}

// ===== Label Assignment =====

interface LabeledObject extends LayoutObject3D {
  label: string;
  layer: LayerConfig;
  displayName: string;
  color: string;
}

function assignLabels(objects: LayoutObject3D[]): LabeledObject[] {
  let cameraIdx = 1;
  let mechIdx = 1;

  const sorted = [...objects].sort((a, b) => {
    const la = getLayerConfig(a.type, a.mechanismType);
    const lb = getLayerConfig(b.type, b.mechanismType);
    return la.zIndex - lb.zIndex;
  });

  return sorted.map(obj => {
    const layer = getLayerConfig(obj.type, obj.mechanismType);
    let label: string;
    let displayName: string;
    let color: string;

    if (obj.type === 'camera') {
      label = `C${cameraIdx++}`;
      displayName = obj.name || label;
      color = '#3b82f6';
    } else if (obj.type === 'product') {
      label = 'P';
      displayName = '待测件';
      color = '#06b6d4';
    } else {
      label = `M${mechIdx++}`;
      displayName = obj.name || getLabel(obj.mechanismType || obj.type, MECHANISM_LABELS, 'zh');
      color = getMechColor(obj.mechanismType);
    }

    return { ...obj, label, layer, displayName, color };
  });
}

// ===== Projection Helpers =====

type ViewProjection = 'front' | 'side' | 'top';

function project(obj: LayoutObject3D, view: ViewProjection): { x: number; y: number } {
  const px = obj.posX ?? 0;
  const py = obj.posY ?? 0;
  const pz = obj.posZ ?? 0;
  switch (view) {
    case 'front': return { x: px, y: -pz };
    case 'side': return { x: py, y: -pz };
    case 'top': return { x: px, y: py };
  }
}

// ===== Fixed-Size Icon Components =====

function ViewLabel({ label, x, y, color, fullName }: { label: string; x: number; y: number; color: string; fullName?: string }) {
  const displayText = fullName || label;
  const textWidth = displayText.length * 8 + 16;
  const isShort = displayText.length <= 2;
  return (
    <g>
      {isShort ? (
        <>
          <circle cx={x} cy={y} r={14} fill={color} fillOpacity={0.9} />
          <text x={x} y={y + 5} textAnchor="middle" fill="#fff" fontSize={12} fontWeight="bold">{displayText}</text>
        </>
      ) : (
        <>
          <rect x={x - textWidth / 2} y={y - 11} width={textWidth} height={22} rx={11} fill={color} fillOpacity={0.9} />
          <text x={x} y={y + 5} textAnchor="middle" fill="#fff" fontSize={11} fontWeight="bold">{displayText}</text>
        </>
      )}
    </g>
  );
}

function CameraShape({ x, y, label, color }: { x: number; y: number; label: string; color: string }) {
  return (
    <g>
      {/* Pulsing halo */}
      <circle cx={x} cy={y} r={24} fill="none" stroke="#f59e0b" strokeWidth={1.2} strokeDasharray="4 3" opacity={0.5}>
        <animate attributeName="r" values="22;28;22" dur="2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.5;0.2;0.5" dur="2s" repeatCount="indefinite" />
      </circle>
      {/* Camera body - enlarged */}
      <rect x={x - 18} y={y - 14} width={36} height={28} rx={4}
        fill={color} fillOpacity={0.2} stroke={color} strokeWidth={2} />
      {/* Lens */}
      <circle cx={x} cy={y} r={10} fill="none" stroke={color} strokeWidth={2} />
      <circle cx={x} cy={y} r={4} fill={color} />
      {/* Label with blue bg */}
      <rect x={x - 16} y={y - 32} width={32} height={18} rx={9} fill={color} fillOpacity={0.95} />
      <text x={x} y={y - 19} textAnchor="middle" fill="#fff" fontSize={12} fontWeight="bold">{label}</text>
    </g>
  );
}

function ProductShape({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <rect x={x - 35} y={y - 21} width={70} height={42} rx={4}
        fill="#1e3a5f" stroke="#06b6d4" strokeWidth={2.5} strokeDasharray="6 3" />
      <line x1={x - 16} y1={y} x2={x + 16} y2={y} stroke="#06b6d4" strokeWidth={0.8} opacity={0.6} />
      <line x1={x} y1={y - 14} x2={x} y2={y + 14} stroke="#06b6d4" strokeWidth={0.8} opacity={0.6} />
      <ViewLabel label="P" x={x} y={y - 32} color="#06b6d4" />
    </g>
  );
}

function MechanismShape({ x, y, label, color, mechType }: { x: number; y: number; label: string; color: string; mechType: string; displayName?: string }) {
  const c = color;
  const sw = 1;
  const op = 0.7;
  const shapes: Record<string, JSX.Element> = {
    conveyor: <rect x={x - 11} y={y - 3} width={22} height={6} rx={3} fill="none" stroke={c} strokeWidth={sw} opacity={op} />,
    cylinder: <rect x={x - 3} y={y - 9} width={6} height={18} rx={1.5} fill="none" stroke={c} strokeWidth={sw} opacity={op} />,
    gripper: (
      <>
        <rect x={x - 2} y={y - 7} width={4} height={8} rx={1} fill="none" stroke={c} strokeWidth={sw} opacity={op} />
        <line x1={x - 5} y1={y + 1} x2={x - 2} y2={y - 2} stroke={c} strokeWidth={sw} opacity={op} />
        <line x1={x + 5} y1={y + 1} x2={x + 2} y2={y - 2} stroke={c} strokeWidth={sw} opacity={op} />
      </>
    ),
    lift: (
      <>
        <rect x={x - 8} y={y - 2} width={16} height={4} rx={1.5} fill="none" stroke={c} strokeWidth={sw} opacity={op} />
        <polygon points={`${x - 2},${y - 7} ${x + 2},${y - 7} ${x},${y - 10}`} fill={c} opacity={op} />
      </>
    ),
    turntable: <circle cx={x} cy={y} r={9} fill="none" stroke={c} strokeWidth={sw} opacity={op} />,
    stopper: <rect x={x - 5} y={y - 7} width={10} height={14} rx={1.5} fill="none" stroke={c} strokeWidth={sw} opacity={op} />,
    robot_arm: (
      <>
        <line x1={x} y1={y - 8} x2={x - 5} y2={y} stroke={c} strokeWidth={1.2} strokeLinecap="round" opacity={op} />
        <line x1={x - 5} y1={y} x2={x + 3} y2={y + 5} stroke={c} strokeWidth={1.2} strokeLinecap="round" opacity={op} />
        <circle cx={x} cy={y - 8} r={1.8} fill={c} opacity={op} />
      </>
    ),
    camera_mount: (
      <>
        <line x1={x} y1={y - 9} x2={x} y2={y + 3} stroke={c} strokeWidth={1.2} opacity={op} />
        <line x1={x} y1={y + 3} x2={x + 8} y2={y + 3} stroke={c} strokeWidth={1.2} opacity={op} />
      </>
    ),
  };

  return (
    <g>
      {shapes[mechType] || shapes.stopper}
      {/* Small numbered label only */}
      <circle cx={x} cy={y - 16} r={8} fill={c} fillOpacity={0.6} />
      <text x={x} y={y - 12.5} textAnchor="middle" fill="#fff" fontSize={8} fontWeight="bold">{label}</text>
    </g>
  );
}

// ===== Coordinate Axes =====

const AXIS_COLORS: Record<string, string> = { X: '#3b82f6', Y: '#22c55e', Z: '#f59e0b' };

function chooseTickInterval(scale: number): number {
  const candidates = [10, 20, 50, 100, 200, 500, 1000];
  const targetPx = 60;
  for (const c of candidates) {
    if (c * scale >= targetPx) return c;
  }
  return 1000;
}

function CoordinateAxes({ ox, oy, vw, vh, headerH, view, scale, offsetX, offsetY }: {
  ox: number; oy: number; vw: number; vh: number; headerH: number; view: ViewProjection;
  scale: number; offsetX: number; offsetY: number;
}) {
  const margin = 6;
  const left = ox + margin;
  const right = ox + vw - margin;
  const top = oy + headerH + margin;
  const bottom = oy + vh - margin;
  const cxView = ox + offsetX;
  const cyView = oy + offsetY;

  const axisLabels: Record<ViewProjection, { h: string; v: string }> = {
    front: { h: 'X', v: 'Z' },
    side: { h: 'Y', v: 'Z' },
    top: { h: 'X', v: 'Y' },
  };
  const labels = axisLabels[view];
  const hColor = AXIS_COLORS[labels.h];
  const vColor = AXIS_COLORS[labels.v];

  const tickInterval = chooseTickInterval(scale);
  const pxInterval = tickInterval * scale;

  // Generate ticks along horizontal axis
  const hTicks: JSX.Element[] = [];
  if (pxInterval > 10) {
    // positive direction
    for (let px = cxView + pxInterval; px < right - 20; px += pxInterval) {
      const mmVal = Math.round((px - cxView) / scale);
      hTicks.push(
        <g key={`ht-${mmVal}`}>
          <line x1={px} y1={cyView - 4} x2={px} y2={cyView + 4} stroke={hColor} strokeWidth={0.8} opacity={0.6} />
          <text x={px} y={cyView + 14} textAnchor="middle" fill="#64748b" fontSize={8}>{mmVal}</text>
        </g>
      );
    }
    // negative direction
    for (let px = cxView - pxInterval; px > left + 20; px -= pxInterval) {
      const mmVal = Math.round((px - cxView) / scale);
      hTicks.push(
        <g key={`ht-${mmVal}`}>
          <line x1={px} y1={cyView - 4} x2={px} y2={cyView + 4} stroke={hColor} strokeWidth={0.8} opacity={0.6} />
          <text x={px} y={cyView + 14} textAnchor="middle" fill="#64748b" fontSize={8}>{mmVal}</text>
        </g>
      );
    }
  }

  // Generate ticks along vertical axis
  const vTicks: JSX.Element[] = [];
  if (pxInterval > 10) {
    for (let py = cyView + pxInterval; py < bottom - 14; py += pxInterval) {
      const mmVal = Math.round((py - cyView) / scale);
      vTicks.push(
        <g key={`vt-${mmVal}`}>
          <line x1={cxView - 4} y1={py} x2={cxView + 4} y2={py} stroke={vColor} strokeWidth={0.8} opacity={0.6} />
          <text x={cxView - 8} y={py + 3} textAnchor="end" fill="#64748b" fontSize={8}>{mmVal}</text>
        </g>
      );
    }
    for (let py = cyView - pxInterval; py > top + 14; py -= pxInterval) {
      const mmVal = Math.round((py - cyView) / scale);
      vTicks.push(
        <g key={`vt-${mmVal}`}>
          <line x1={cxView - 4} y1={py} x2={cxView + 4} y2={py} stroke={vColor} strokeWidth={0.8} opacity={0.6} />
          <text x={cxView - 8} y={py + 3} textAnchor="end" fill="#64748b" fontSize={8}>{mmVal}</text>
        </g>
      );
    }
  }

  return (
    <g opacity={0.5}>
      {/* Horizontal axis full-width */}
      <line x1={left} y1={cyView} x2={right} y2={cyView} stroke={hColor} strokeWidth={1} strokeDasharray="6 3" opacity={0.4} />
      {/* Vertical axis full-height */}
      <line x1={cxView} y1={top} x2={cxView} y2={bottom} stroke={vColor} strokeWidth={1} strokeDasharray="6 3" opacity={0.4} />

      {/* Ticks */}
      {hTicks}
      {vTicks}

      {/* Axis labels with colored background */}
      <rect x={right - 22} y={cyView - 18} width={20} height={16} rx={4} fill={hColor} fillOpacity={0.85} />
      <text x={right - 12} y={cyView - 6} textAnchor="middle" fill="#fff" fontSize={11} fontWeight="bold">{labels.h}</text>

      <rect x={cxView + 6} y={top} width={20} height={16} rx={4} fill={vColor} fillOpacity={0.85} />
      <text x={cxView + 16} y={top + 12} textAnchor="middle" fill="#fff" fontSize={11} fontWeight="bold">{labels.v}</text>
    </g>
  );
}

// Scale bar and plane indicator HUD
function ViewHUD({ ox, oy, vw, vh, view, scale }: {
  ox: number; oy: number; vw: number; vh: number; view: ViewProjection; scale: number;
}) {
  const planeLabels: Record<ViewProjection, string> = { front: 'X-Z', side: 'Y-Z', top: 'X-Y' };

  // Scale bar: pick a nice mm length that maps to ~80px
  const candidates = [10, 20, 50, 100, 200, 500, 1000];
  let barMM = 100;
  for (const c of candidates) {
    if (c * scale >= 40 && c * scale <= 140) { barMM = c; break; }
  }
  const barPx = barMM * scale;
  const ratio = Math.round(1 / scale * 10) / 10;

  const blX = ox + 10;
  const blY = oy + vh - 10;

  const brX = ox + vw - 10;
  const brY = oy + vh - 10;

  return (
    <g>
      {/* Bottom-left: scale bar */}
      <rect x={blX} y={blY - 30} width={Math.max(barPx + 40, 90)} height={28} rx={6} fill="#1e293b" fillOpacity={0.92} stroke="#334155" strokeWidth={0.5} />
      <line x1={blX + 8} y1={blY - 12} x2={blX + 8 + barPx} y2={blY - 12} stroke="#94a3b8" strokeWidth={1.5} />
      <line x1={blX + 8} y1={blY - 16} x2={blX + 8} y2={blY - 8} stroke="#94a3b8" strokeWidth={1} />
      <line x1={blX + 8 + barPx} y1={blY - 16} x2={blX + 8 + barPx} y2={blY - 8} stroke="#94a3b8" strokeWidth={1} />
      <text x={blX + 8 + barPx / 2} y={blY - 18} textAnchor="middle" fill="#cbd5e1" fontSize={8}>{barMM}mm</text>
      <text x={blX + 8 + barPx + 6} y={blY - 9} textAnchor="start" fill="#64748b" fontSize={7}>1:{ratio}</text>

      {/* Bottom-right: plane indicator */}
      <rect x={brX - 50} y={brY - 30} width={48} height={28} rx={6} fill="#1e293b" fillOpacity={0.92} stroke="#334155" strokeWidth={0.5} />
      <text x={brX - 26} y={brY - 18} textAnchor="middle" fill="#64748b" fontSize={7}>当前平面</text>
      <text x={brX - 26} y={brY - 7} textAnchor="middle" fill="#93c5fd" fontSize={12} fontWeight="bold">{planeLabels[view]}</text>
    </g>
  );
}

// ===== Main Component =====

export function ThreeViewLayout({
  objects,
  mechanisms: _mechanisms,
  cameraMounts: _cameraMounts,
  workstationName,
  productDimensions,
  width = 1600,
  height = 900,
  hideCameras = false,
}: ThreeViewLayoutProps) {
  const halfW = width / 2;
  const halfH = height / 2;
  const headerH = 32;
  const padding = 40;

  const filteredObjects = useMemo(() => 
    hideCameras ? objects.filter(o => o.type !== 'camera') : objects,
    [objects, hideCameras]
  );
  const labeled = useMemo(() => assignLabels(filteredObjects), [filteredObjects]);

  // Compute auto-scale to fit all objects in each view
  // exported as getViewTransform below for overlay use
  const computeViewTransform = (view: ViewProjection, vw: number, vh: number) => {
    if (labeled.length === 0) return { scale: 1, offsetX: vw / 2, offsetY: vh / 2 };

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const obj of labeled) {
      const p = project(obj, view);
      minX = Math.min(minX, p.x - 25);
      maxX = Math.max(maxX, p.x + 25);
      minY = Math.min(minY, p.y - 25);
      maxY = Math.max(maxY, p.y + 25);
    }

    const rangeX = maxX - minX || 200;
    const rangeY = maxY - minY || 200;
    const availW = vw - padding * 2;
    const availH = vh - padding * 2 - headerH;
    const s = Math.min(availW / rangeX, availH / rangeY, 2.5) * 0.88;
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;

    return { scale: s, offsetX: vw / 2 - cx * s, offsetY: (vh + headerH) / 2 - cy * s };
  };

  const frontT = computeViewTransform('front', halfW, halfH);
  const sideT = computeViewTransform('side', halfW, halfH);
  const topT = computeViewTransform('top', halfW, halfH);

  // Per-view color themes
  const VIEW_THEMES: Record<ViewProjection, { accent: string; headerBg: string; headerBorder: string; label: string; panelBorder: string; iconPath: string }> = {
    front: {
      accent: '#3b82f6', headerBg: 'rgba(30,58,95,0.95)', headerBorder: 'rgba(59,130,246,0.4)',
      label: '#93c5fd', panelBorder: 'rgba(59,130,246,0.3)',
      iconPath: 'M4,8 L12,4 L20,8 L20,16 L12,20 L4,16 Z',
    },
    side: {
      accent: '#22c55e', headerBg: 'rgba(20,83,45,0.95)', headerBorder: 'rgba(34,197,94,0.4)',
      label: '#86efac', panelBorder: 'rgba(34,197,94,0.3)',
      iconPath: 'M6,6 L18,6 L18,18 L6,18 Z M6,6 L10,3 L22,3 L22,15 L18,18',
    },
    top: {
      accent: '#f59e0b', headerBg: 'rgba(120,53,15,0.95)', headerBorder: 'rgba(245,158,11,0.4)',
      label: '#fcd34d', panelBorder: 'rgba(245,158,11,0.3)',
      iconPath: 'M4,14 L12,6 L20,14 L12,22 Z',
    },
  };

  const renderView = (view: ViewProjection, tx: number, ty: number, vw: number, vh: number, transform: ReturnType<typeof computeViewTransform>, viewLabel: string) => {
    const theme = VIEW_THEMES[view];
    return (
      <g key={view}>
        {/* Panel background with themed border */}
        <rect x={tx} y={ty} width={vw} height={vh} fill="#0f172a" stroke={theme.panelBorder} strokeWidth={1.5} />
        {/* Accent top line */}
        <line x1={tx} y1={ty} x2={tx + vw} y2={ty} stroke={theme.accent} strokeWidth={2} opacity={0.7} />
        {/* Header with gradient feel */}
        <rect x={tx} y={ty} width={vw} height={headerH} fill={theme.headerBg} />
        <line x1={tx} y1={ty + headerH} x2={tx + vw} y2={ty + headerH} stroke={theme.headerBorder} strokeWidth={0.5} />
        {/* View icon */}
        <g transform={`translate(${tx + 10}, ${ty + 6})`}>
          <path d={theme.iconPath} fill="none" stroke={theme.accent} strokeWidth={1.2} opacity={0.8} transform="scale(0.8)" />
        </g>
        {/* View title */}
        <text x={tx + vw / 2} y={ty + 21} textAnchor="middle" fill={theme.label} fontSize={14} fontWeight="bold" letterSpacing="0.5">
          {viewLabel}
        </text>

        {/* CoordinateAxes and ViewHUD are now rendered in ThreeViewOverlay (viewport-fixed) */}

        {/* Connection lines (camera to product) - hidden when hideCameras */}
        {!hideCameras && (
        <g transform={`translate(${tx + transform.offsetX}, ${ty + transform.offsetY})`}>
          {labeled.filter(o => o.type === 'camera').map(cam => {
            const product = labeled.find(o => o.type === 'product');
            if (!product) return null;
            const cp = project(cam, view);
            const pp = project(product, view);
            return (
              <line
                key={`conn-${view}-${cam.id}`}
                x1={cp.x * transform.scale} y1={cp.y * transform.scale}
                x2={pp.x * transform.scale} y2={pp.y * transform.scale}
                stroke="#3b82f6" strokeWidth={1.8} strokeDasharray="6 3" opacity={0.6}
                markerEnd="url(#arrowBlue)"
              />
            );
          })}
        </g>
        )}

        {/* Objects with fixed-size icons */}
        <g transform={`translate(${tx + transform.offsetX}, ${ty + transform.offsetY})`}>
          {labeled.map(obj => {
            const pos = project(obj, view);
            const sx = pos.x * transform.scale;
            const sy = pos.y * transform.scale;

            if (obj.type === 'product') return <ProductShape key={`${view}-${obj.id}`} x={sx} y={sy} />;
            if (obj.type === 'camera') return <CameraShape key={`${view}-${obj.id}`} x={sx} y={sy} label={obj.label} color={obj.color} />;
            const mechType = obj.mechanismType || obj.type;
            return <MechanismShape key={`${view}-${obj.id}`} x={sx} y={sy} label={obj.label} color={obj.color} mechType={mechType} displayName={obj.displayName} />;
          })}
        </g>
      </g>
    );
  };

  // Projection alignment lines (always shown)
  const renderAlignmentLines = () => {
    const lines: JSX.Element[] = [];
    labeled.forEach(obj => {
      // Front-Top vertical alignment (shared X)
      const frontPos = project(obj, 'front');
      const topPos = project(obj, 'top');
      const fx = frontT.offsetX + frontPos.x * frontT.scale;
      const tx2 = topT.offsetX + topPos.x * topT.scale;
      lines.push(
        <line
          key={`align-v-${obj.id}`}
          x1={fx} y1={halfH - 2}
          x2={tx2} y2={halfH + 4}
          stroke={obj.color}
          strokeWidth={1.2}
          strokeDasharray="4 3"
          opacity={0.45}
        />
      );

      // Front-Side horizontal alignment (shared Z)
      const sidePos = project(obj, 'side');
      const fy = frontT.offsetY + frontPos.y * frontT.scale;
      const sy = sideT.offsetY + sidePos.y * sideT.scale;
      lines.push(
        <line
          key={`align-h-${obj.id}`}
          x1={halfW - 2} y1={fy}
          x2={halfW + 4} y2={sy}
          stroke={obj.color}
          strokeWidth={1.2}
          strokeDasharray="4 3"
          opacity={0.45}
        />
      );
    });
    return lines;
  };

  // Enhanced dimension table
  const renderDimensionTable = () => {
    const tableX = halfW + 10;
    const tableY = halfH + headerH + 10;
    const tableW = halfW - 20;
    const rowH = 24;
    const colWidths = [
      tableW * 0.08,  // Label
      tableW * 0.20,  // Name
      tableW * 0.22,  // Coords
      tableW * 0.22,  // Dimensions
      tableW * 0.14,  // Distance
      tableW * 0.14,  // Relation
    ];

    const headers = ['编号', '名称', '坐标 (X,Y,Z)', '尺寸 (WxHxD)', '到产品距离', '关系'];

    // Calculate distance to product center
    const product = labeled.find(o => o.type === 'product');
    const productCenter = { x: product?.posX ?? 0, y: product?.posY ?? 0, z: product?.posZ ?? 0 };

    const getDistToProduct = (obj: LabeledObject): string => {
      if (obj.type === 'product') return '-';
      const dx = (obj.posX ?? 0) - productCenter.x;
      const dy = (obj.posY ?? 0) - productCenter.y;
      const dz = (obj.posZ ?? 0) - productCenter.z;
      const dist = Math.round(Math.sqrt(dx * dx + dy * dy + dz * dz));
      return `${dist} mm`;
    };

    const getDimensions = (obj: LabeledObject): string => {
      if (obj.type === 'product' && productDimensions) {
        return `${productDimensions.length}×${productDimensions.width}×${productDimensions.height}`;
      }
      const w = obj.width ?? '-';
      const h = obj.height ?? '-';
      const d = obj.depth ?? '-';
      if (w === '-' && h === '-' && d === '-') return '-';
      return `${w}×${h}×${d}`;
    };

    const maxRows = Math.floor((halfH - headerH - 30) / rowH);

    return (
      <g>
        <rect x={halfW} y={halfH} width={halfW} height={halfH} fill="#0f172a" stroke="#334155" strokeWidth={1} />
        <rect x={halfW} y={halfH} width={halfW} height={headerH} fill="#1e293b" />
        <text x={halfW + halfW / 2} y={halfH + 21} textAnchor="middle" fill="#94a3b8" fontSize={14} fontWeight="bold">
          尺寸说明表
        </text>

        {/* Header row */}
        {headers.map((h, i) => {
          const hx = tableX + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
          return (
            <g key={`header-${i}`}>
              <rect x={hx} y={tableY} width={colWidths[i]} height={rowH} fill="#1b3b70" fillOpacity={0.5} stroke="#334155" strokeWidth={0.5} />
              <text x={hx + colWidths[i] / 2} y={tableY + 16} textAnchor="middle" fill="#93c5fd" fontSize={11} fontWeight="bold">{h}</text>
            </g>
          );
        })}

        {/* Data rows */}
        {labeled.slice(0, maxRows).map((obj, rowIdx) => {
          const ry = tableY + rowH + rowIdx * rowH;
          const coords = `(${obj.posX ?? 0}, ${obj.posY ?? 0}, ${obj.posZ ?? 0})`;
          const dims = getDimensions(obj);
          const dist = getDistToProduct(obj);
          const relation = obj.mountedToMechanismId
            ? `挂载于 ${labeled.find(l => l.id === obj.mountedToMechanismId)?.label || '?'}`
            : obj.type === 'product' ? '检测目标' : '-';

          const cells = [obj.label, obj.displayName, coords, dims, dist, relation];

          return cells.map((cellText, ci) => {
            const cx = tableX + colWidths.slice(0, ci).reduce((a, b) => a + b, 0);
            return (
              <g key={`cell-${rowIdx}-${ci}`}>
                <rect x={cx} y={ry} width={colWidths[ci]} height={rowH}
                  fill={rowIdx % 2 === 0 ? '#0f172a' : '#1e293b'} stroke="#334155" strokeWidth={0.5} />
                <text
                  x={cx + (ci === 0 ? colWidths[ci] / 2 : 6)}
                  y={ry + 16}
                  textAnchor={ci === 0 ? 'middle' : 'start'}
                  fill={ci === 0 ? obj.color : '#cbd5e1'}
                  fontSize={11}
                  fontWeight={ci === 0 ? 'bold' : 'normal'}
                >
                  {cellText.length > 16 ? cellText.slice(0, 15) + '…' : cellText}
                </text>
              </g>
            );
          });
        })}
      </g>
    );
  };

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid meet"
      xmlns="http://www.w3.org/2000/svg"
      style={{ backgroundColor: '#0f172a' }}
    >
      {/* Arrow marker for connection lines */}
      <defs>
        <marker id="arrowBlue" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6" fill="none" stroke="#3b82f6" strokeWidth={1} />
        </marker>
      </defs>
      {/* Title */}
      <text x={width / 2} y={20} textAnchor="middle" fill="#f1f5f9" fontSize={16} fontWeight="bold">
        {workstationName} - 三合一布局概览
      </text>

      {/* Three views */}
      {renderView('front', 0, 0, halfW, halfH, frontT, '正视图 (X-Z)')}
      {renderView('side', halfW, 0, halfW, halfH, sideT, '左视图 (Y-Z)')}
      {renderView('top', 0, halfH, halfW, halfH, topT, '俯视图 (X-Y)')}

      {/* Alignment lines */}
      {renderAlignmentLines()}

      {/* Dimension table */}
      {renderDimensionTable()}

      {/* Product dimensions note */}
      {productDimensions && (
        <text x={halfW / 2} y={height - 8} textAnchor="middle" fill="#64748b" fontSize={9}>
          产品尺寸: {productDimensions.length} × {productDimensions.width} × {productDimensions.height} mm
        </text>
      )}
    </svg>
  );
}

// Export a standalone version of computeViewTransform for overlay use
export function getViewTransforms(
  objects: LayoutObject3D[],
  width: number,
  height: number,
  productDimensions?: { length: number; width: number; height: number }
) {
  const halfW = width / 2;
  const halfH = height / 2;
  const headerH = 32;
  const padding = 40;

  const labeled = assignLabels(objects);

  const compute = (view: ViewProjection, vw: number, vh: number) => {
    if (labeled.length === 0) return { scale: 1, offsetX: vw / 2, offsetY: vh / 2 };

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const obj of labeled) {
      const p = project(obj, view);
      minX = Math.min(minX, p.x - 25);
      maxX = Math.max(maxX, p.x + 25);
      minY = Math.min(minY, p.y - 25);
      maxY = Math.max(maxY, p.y + 25);
    }

    const rangeX = maxX - minX || 200;
    const rangeY = maxY - minY || 200;
    const availW = vw - padding * 2;
    const availH = vh - padding * 2 - headerH;
    const s = Math.min(availW / rangeX, availH / rangeY, 2.5) * 0.88;
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;

    return { scale: s, offsetX: vw / 2 - cx * s, offsetY: (vh + headerH) / 2 - cy * s };
  };

  return {
    front: { ...compute('front', halfW, halfH), panelX: 0, panelY: 0, panelW: halfW, panelH: halfH },
    side: { ...compute('side', halfW, halfH), panelX: halfW, panelY: 0, panelW: halfW, panelH: halfH },
    top: { ...compute('top', halfW, halfH), panelX: 0, panelY: halfH, panelW: halfW, panelH: halfH },
    headerH,
  };
}

export type { ViewProjection };
