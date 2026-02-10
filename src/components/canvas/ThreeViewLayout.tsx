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
  const textWidth = displayText.length * 7 + 12;
  const isShort = displayText.length <= 2;
  return (
    <g>
      {isShort ? (
        <>
          <circle cx={x} cy={y} r={11} fill={color} fillOpacity={0.9} />
          <text x={x} y={y + 4} textAnchor="middle" fill="#fff" fontSize={9} fontWeight="bold">{displayText}</text>
        </>
      ) : (
        <>
          <rect x={x - textWidth / 2} y={y - 9} width={textWidth} height={18} rx={9} fill={color} fillOpacity={0.9} />
          <text x={x} y={y + 4} textAnchor="middle" fill="#fff" fontSize={8} fontWeight="bold">{displayText}</text>
        </>
      )}
    </g>
  );
}

function CameraShape({ x, y, label, color }: { x: number; y: number; label: string; color: string }) {
  return (
    <g>
      <rect x={x - 14} y={y - 11} width={28} height={22} rx={3}
        fill={color} fillOpacity={0.15} stroke={color} strokeWidth={1.5} />
      <circle cx={x} cy={y} r={7} fill="none" stroke={color} strokeWidth={1.5} />
      <circle cx={x} cy={y} r={3} fill={color} />
      <ViewLabel label={label} x={x} y={y - 20} color={color} />
    </g>
  );
}

function ProductShape({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <rect x={x - 30} y={y - 18} width={60} height={36} rx={4}
        fill="#1e3a5f" stroke="#06b6d4" strokeWidth={2} strokeDasharray="6 3" />
      <line x1={x - 10} y1={y} x2={x + 10} y2={y} stroke="#06b6d4" strokeWidth={0.5} opacity={0.5} />
      <line x1={x} y1={y - 10} x2={x} y2={y + 10} stroke="#06b6d4" strokeWidth={0.5} opacity={0.5} />
      <ViewLabel label="P" x={x} y={y - 28} color="#06b6d4" />
    </g>
  );
}

function MechanismShape({ x, y, label, color, mechType, displayName }: { x: number; y: number; label: string; color: string; mechType: string; displayName?: string }) {
  const shapes: Record<string, JSX.Element> = {
    conveyor: <rect x={x - 18} y={y - 5} width={36} height={10} rx={5} fill="none" stroke={color} strokeWidth={1.5} />,
    cylinder: <rect x={x - 5} y={y - 14} width={10} height={28} rx={2} fill="none" stroke={color} strokeWidth={1.5} />,
    gripper: (
      <>
        <rect x={x - 3} y={y - 10} width={6} height={12} rx={1} fill="none" stroke={color} strokeWidth={1.5} />
        <line x1={x - 7} y1={y + 2} x2={x - 3} y2={y - 2} stroke={color} strokeWidth={1.5} />
        <line x1={x + 7} y1={y + 2} x2={x + 3} y2={y - 2} stroke={color} strokeWidth={1.5} />
      </>
    ),
    lift: (
      <>
        <rect x={x - 12} y={y - 3} width={24} height={6} rx={2} fill="none" stroke={color} strokeWidth={1.5} />
        <polygon points={`${x - 3},${y - 10} ${x + 3},${y - 10} ${x},${y - 14}`} fill={color} />
        <line x1={x} y1={y - 10} x2={x} y2={y - 3} stroke={color} strokeWidth={1} />
      </>
    ),
    turntable: <circle cx={x} cy={y} r={14} fill="none" stroke={color} strokeWidth={1.5} />,
    stopper: <rect x={x - 8} y={y - 10} width={16} height={20} rx={2} fill="none" stroke={color} strokeWidth={1.5} />,
    robot_arm: (
      <>
        <line x1={x} y1={y - 12} x2={x - 8} y2={y} stroke={color} strokeWidth={2} strokeLinecap="round" />
        <line x1={x - 8} y1={y} x2={x + 4} y2={y + 8} stroke={color} strokeWidth={2} strokeLinecap="round" />
        <circle cx={x} cy={y - 12} r={2.5} fill={color} />
      </>
    ),
    camera_mount: (
      <>
        <line x1={x} y1={y - 14} x2={x} y2={y + 4} stroke={color} strokeWidth={2} />
        <line x1={x} y1={y + 4} x2={x + 12} y2={y + 4} stroke={color} strokeWidth={2} />
      </>
    ),
  };

  return (
    <g>
      {shapes[mechType] || shapes.stopper}
      <ViewLabel label={label} x={x} y={y - 24} color={color} fullName={displayName} />
    </g>
  );
}

// ===== Coordinate Axes =====

function CoordinateAxes({ ox, oy, vw, vh, headerH, view }: {
  ox: number; oy: number; vw: number; vh: number; headerH: number; view: ViewProjection;
}) {
  const cxView = ox + vw / 2;
  const cyView = oy + headerH + (vh - headerH) / 2;
  const axisLabels: Record<ViewProjection, { h: string; v: string }> = {
    front: { h: 'X', v: 'Z' },
    side: { h: 'Y', v: 'Z' },
    top: { h: 'X', v: 'Y' },
  };
  const labels = axisLabels[view];

  return (
    <g opacity={0.3}>
      {/* Horizontal axis */}
      <line x1={ox + 12} y1={cyView} x2={ox + vw - 12} y2={cyView} stroke="#475569" strokeWidth={0.7} strokeDasharray="4 4" />
      {/* Vertical axis */}
      <line x1={cxView} y1={oy + headerH + 6} x2={cxView} y2={oy + vh - 6} stroke="#475569" strokeWidth={0.7} strokeDasharray="4 4" />
      {/* Labels */}
      <text x={ox + vw - 14} y={cyView - 5} fill="#64748b" fontSize={11} fontWeight="bold">{labels.h}</text>
      <text x={cxView + 7} y={oy + headerH + 18} fill="#64748b" fontSize={11} fontWeight="bold">{labels.v}</text>
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
}: ThreeViewLayoutProps) {
  const halfW = width / 2;
  const halfH = height / 2;
  const headerH = 32;
  const padding = 40;

  const labeled = useMemo(() => assignLabels(objects), [objects]);

  // Compute auto-scale to fit all objects in each view
  const computeViewTransform = (view: ViewProjection, vw: number, vh: number) => {
    if (labeled.length === 0) return { scale: 1, offsetX: vw / 2, offsetY: vh / 2 };

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const obj of labeled) {
      const p = project(obj, view);
      minX = Math.min(minX, p.x - 40);
      maxX = Math.max(maxX, p.x + 40);
      minY = Math.min(minY, p.y - 40);
      maxY = Math.max(maxY, p.y + 40);
    }

    const rangeX = maxX - minX || 200;
    const rangeY = maxY - minY || 200;
    const availW = vw - padding * 2;
    const availH = vh - padding * 2 - headerH;
    const s = Math.min(availW / rangeX, availH / rangeY, 1.5) * 0.7;
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;

    return { scale: s, offsetX: vw / 2 - cx * s, offsetY: (vh + headerH) / 2 - cy * s };
  };

  const frontT = computeViewTransform('front', halfW, halfH);
  const sideT = computeViewTransform('side', halfW, halfH);
  const topT = computeViewTransform('top', halfW, halfH);

  const renderView = (view: ViewProjection, tx: number, ty: number, vw: number, vh: number, transform: ReturnType<typeof computeViewTransform>, viewLabel: string) => {
    return (
      <g key={view}>
        <rect x={tx} y={ty} width={vw} height={vh} fill="#0f172a" stroke="#334155" strokeWidth={1} />
        <rect x={tx} y={ty} width={vw} height={headerH} fill="#1e293b" />
        <text x={tx + vw / 2} y={ty + 20} textAnchor="middle" fill="#94a3b8" fontSize={12} fontWeight="bold">
          {viewLabel}
        </text>

        {/* Coordinate axes */}
        <CoordinateAxes ox={tx} oy={ty} vw={vw} vh={vh} headerH={headerH} view={view} />

        {/* Connection lines (camera to product) */}
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
                stroke="#475569" strokeWidth={0.8} strokeDasharray="3 3" opacity={0.4}
              />
            );
          })}
        </g>

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
          strokeWidth={0.5}
          strokeDasharray="3 4"
          opacity={0.3}
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
          strokeWidth={0.5}
          strokeDasharray="3 4"
          opacity={0.3}
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
    const rowH = 20;
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
        <text x={halfW + halfW / 2} y={halfH + 20} textAnchor="middle" fill="#94a3b8" fontSize={12} fontWeight="bold">
          尺寸说明表
        </text>

        {/* Header row */}
        {headers.map((h, i) => {
          const hx = tableX + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
          return (
            <g key={`header-${i}`}>
              <rect x={hx} y={tableY} width={colWidths[i]} height={rowH} fill="#1b3b70" fillOpacity={0.5} stroke="#334155" strokeWidth={0.5} />
              <text x={hx + colWidths[i] / 2} y={tableY + 14} textAnchor="middle" fill="#93c5fd" fontSize={9} fontWeight="bold">{h}</text>
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
                  y={ry + 14}
                  textAnchor={ci === 0 ? 'middle' : 'start'}
                  fill={ci === 0 ? obj.color : '#cbd5e1'}
                  fontSize={9}
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
      {/* Title */}
      <text x={width / 2} y={18} textAnchor="middle" fill="#f1f5f9" fontSize={14} fontWeight="bold">
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

export type { ViewProjection };
