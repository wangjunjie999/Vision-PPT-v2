/**
 * ThreeViewLayout - Engineering-style 2x2 grid with Front, Side, Top views + Dimension Table.
 * Uses projection alignment lines and a unified label system (C1, M1, P...).
 * Read-only component for overview/export purposes.
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

function getLayerConfig(type: string, mechType?: string): LayerConfig {
  if (type === 'camera') return LAYER_CONFIG.camera;
  if (type === 'product') return LAYER_CONFIG.product;
  if (mechType === 'conveyor' || mechType === 'camera_mount') return LAYER_CONFIG[mechType];
  return LAYER_CONFIG.mechanism;
}

// ===== Label Assignment =====

interface LabeledObject extends LayoutObject3D {
  label: string;
  layer: LayerConfig;
  displayName: string;
}

function assignLabels(objects: LayoutObject3D[]): LabeledObject[] {
  let cameraIdx = 1;
  let mechIdx = 1;

  // Sort by zIndex for rendering order
  const sorted = [...objects].sort((a, b) => {
    const la = getLayerConfig(a.type, a.mechanismType);
    const lb = getLayerConfig(b.type, b.mechanismType);
    return la.zIndex - lb.zIndex;
  });

  return sorted.map(obj => {
    const layer = getLayerConfig(obj.type, obj.mechanismType);
    let label: string;
    let displayName: string;

    if (obj.type === 'camera') {
      label = `C${cameraIdx++}`;
      displayName = obj.name || label;
    } else if (obj.type === 'product') {
      label = 'P';
      displayName = '待测件';
    } else {
      label = `M${mechIdx++}`;
      displayName = obj.name || getLabel(obj.mechanismType || obj.type, MECHANISM_LABELS, 'zh');
    }

    return { ...obj, label, layer, displayName };
  });
}

// ===== Projection Helpers =====

type ViewProjection = 'front' | 'side' | 'top';

function project(obj: LayoutObject3D, view: ViewProjection): { x: number; y: number } {
  const px = obj.posX ?? 0;
  const py = obj.posY ?? 0;
  const pz = obj.posZ ?? 0;
  switch (view) {
    case 'front': return { x: px, y: -pz }; // X right, Z up
    case 'side': return { x: py, y: -pz };  // Y right, Z up
    case 'top': return { x: px, y: py };      // X right, Y down
  }
}

function getObjSize(obj: LayoutObject3D, view: ViewProjection): { w: number; h: number } {
  const w = obj.width ?? 60;
  const h = obj.height ?? 40;
  const d = obj.depth ?? 40;
  switch (view) {
    case 'front': return { w, h };
    case 'side': return { w: d, h };
    case 'top': return { w, h: d };
  }
}

// ===== Sub-Components =====

function ViewLabel({ label, x, y, layer }: { label: string; x: number; y: number; layer: LayerConfig }) {
  const r = 10;
  return (
    <g>
      <circle cx={x} cy={y - 22} r={r} fill={layer.stroke} fillOpacity={0.9} />
      <text x={x} y={y - 18} textAnchor="middle" fill="#fff" fontSize={8} fontWeight="bold">{label}</text>
    </g>
  );
}

function ObjectShape({ obj, pos, size, layer }: {
  obj: LabeledObject;
  pos: { x: number; y: number };
  size: { w: number; h: number };
  layer: LayerConfig;
}) {
  const scaledW = size.w * 0.3;
  const scaledH = size.h * 0.3;

  if (obj.type === 'product') {
    return (
      <g>
        <rect
          x={pos.x - scaledW / 2} y={pos.y - scaledH / 2}
          width={scaledW} height={scaledH}
          rx={3}
          fill={layer.fill} fillOpacity={layer.fillOpacity}
          stroke={layer.stroke} strokeWidth={layer.strokeWidth}
          strokeDasharray="6 3"
        />
        {/* Crosshair */}
        <line x1={pos.x - 8} y1={pos.y} x2={pos.x + 8} y2={pos.y} stroke={layer.stroke} strokeWidth={0.5} opacity={0.6} />
        <line x1={pos.x} y1={pos.y - 8} x2={pos.x} y2={pos.y + 8} stroke={layer.stroke} strokeWidth={0.5} opacity={0.6} />
        <ViewLabel label={obj.label} x={pos.x} y={pos.y - scaledH / 2 + 4} layer={layer} />
      </g>
    );
  }

  if (obj.type === 'camera') {
    return (
      <g>
        <rect
          x={pos.x - 12} y={pos.y - 10}
          width={24} height={20}
          rx={3}
          fill={layer.fill} fillOpacity={layer.fillOpacity}
          stroke={layer.stroke} strokeWidth={layer.strokeWidth}
        />
        <circle cx={pos.x} cy={pos.y} r={5} fill="none" stroke={layer.stroke} strokeWidth={1} />
        <circle cx={pos.x} cy={pos.y} r={2} fill={layer.stroke} />
        <ViewLabel label={obj.label} x={pos.x} y={pos.y - 8} layer={layer} />
      </g>
    );
  }

  // Mechanism
  return (
    <g>
      <rect
        x={pos.x - scaledW / 2} y={pos.y - scaledH / 2}
        width={Math.max(scaledW, 24)} height={Math.max(scaledH, 20)}
        rx={4}
        fill={layer.fill} fillOpacity={layer.fillOpacity}
        stroke={layer.stroke} strokeWidth={layer.strokeWidth}
      />
      <ViewLabel label={obj.label} x={pos.x} y={pos.y - Math.max(scaledH, 20) / 2 + 4} layer={layer} />
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
  width = 1200,
  height = 700,
}: ThreeViewLayoutProps) {
  const halfW = width / 2;
  const halfH = height / 2;
  const headerH = 32;
  const padding = 40;

  // Labeled objects
  const labeled = useMemo(() => assignLabels(objects), [objects]);

  // Compute auto-scale to fit all objects in each view
  const computeViewTransform = (view: ViewProjection, vw: number, vh: number) => {
    if (labeled.length === 0) return { scale: 1, offsetX: vw / 2, offsetY: vh / 2 };

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const obj of labeled) {
      const p = project(obj, view);
      const s = getObjSize(obj, view);
      minX = Math.min(minX, p.x - s.w / 2);
      maxX = Math.max(maxX, p.x + s.w / 2);
      minY = Math.min(minY, p.y - s.h / 2);
      maxY = Math.max(maxY, p.y + s.h / 2);
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
        {/* View background */}
        <rect x={tx} y={ty} width={vw} height={vh} fill="#0f172a" stroke="#334155" strokeWidth={1} />
        {/* View title */}
        <rect x={tx} y={ty} width={vw} height={headerH} fill="#1e293b" />
        <text x={tx + vw / 2} y={ty + 20} textAnchor="middle" fill="#94a3b8" fontSize={11} fontWeight="bold">
          {viewLabel}
        </text>

        {/* Objects */}
        <g transform={`translate(${tx + transform.offsetX}, ${ty + transform.offsetY})`}>
          {labeled.map(obj => {
            const pos = project(obj, view);
            const size = getObjSize(obj, view);
            const scaledPos = { x: pos.x * transform.scale, y: pos.y * transform.scale };
            return (
              <ObjectShape
                key={`${view}-${obj.id}`}
                obj={obj}
                pos={scaledPos}
                size={{ w: size.w * transform.scale, h: size.h * transform.scale }}
                layer={obj.layer}
              />
            );
          })}
        </g>
      </g>
    );
  };

  // Projection alignment lines
  const renderAlignmentLines = () => {
    const lines: JSX.Element[] = [];
    labeled.forEach(obj => {
      // Front-Top vertical alignment (shared X)
      const frontPos = project(obj, 'front');
      const topPos = project(obj, 'top');
      const fx = frontT.offsetX + frontPos.x * frontT.scale;
      const tx2 = topT.offsetX + topPos.x * topT.scale;
      if (Math.abs(fx - tx2) < 30) {
        lines.push(
          <line
            key={`align-v-${obj.id}`}
            x1={fx} y1={halfH - 2}
            x2={tx2} y2={halfH + 4}
            stroke={obj.layer.stroke}
            strokeWidth={0.5}
            strokeDasharray="3 4"
            opacity={0.3}
          />
        );
      }

      // Front-Side horizontal alignment (shared Z)
      const sidePos = project(obj, 'side');
      const fy = frontT.offsetY + frontPos.y * frontT.scale;
      const sy = sideT.offsetY + sidePos.y * sideT.scale;
      if (Math.abs(fy - sy) < 30) {
        lines.push(
          <line
            key={`align-h-${obj.id}`}
            x1={halfW - 2} y1={fy}
            x2={halfW + 4} y2={sy}
            stroke={obj.layer.stroke}
            strokeWidth={0.5}
            strokeDasharray="3 4"
            opacity={0.3}
          />
        );
      }
    });
    return lines;
  };

  // Dimension table
  const renderDimensionTable = () => {
    const tableX = halfW + 8;
    const tableY = halfH + headerH + 8;
    const tableW = halfW - 16;
    const rowH = 18;
    const colWidths = [40, 90, 120, 90]; // Label, Name, Coords, Relation

    const headers = ['编号', '名称', '坐标 (X, Y, Z)', '关系'];

    return (
      <g>
        {/* Table background */}
        <rect x={halfW} y={halfH} width={halfW} height={halfH} fill="#0f172a" stroke="#334155" strokeWidth={1} />
        <rect x={halfW} y={halfH} width={halfW} height={headerH} fill="#1e293b" />
        <text x={halfW + halfW / 2} y={halfH + 20} textAnchor="middle" fill="#94a3b8" fontSize={11} fontWeight="bold">
          尺寸说明表
        </text>

        {/* Header row */}
        {headers.map((h, i) => {
          const hx = tableX + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
          return (
            <g key={`header-${i}`}>
              <rect x={hx} y={tableY} width={colWidths[i]} height={rowH} fill="#1b3b70" fillOpacity={0.5} stroke="#334155" strokeWidth={0.5} />
              <text x={hx + colWidths[i] / 2} y={tableY + 13} textAnchor="middle" fill="#93c5fd" fontSize={8} fontWeight="bold">{h}</text>
            </g>
          );
        })}

        {/* Data rows */}
        {labeled.slice(0, Math.floor((halfH - headerH - 40) / rowH)).map((obj, rowIdx) => {
          const ry = tableY + rowH + rowIdx * rowH;
          const coords = `(${obj.posX ?? 0}, ${obj.posY ?? 0}, ${obj.posZ ?? 0})`;
          const relation = obj.mountedToMechanismId
            ? `挂载于 ${labeled.find(l => l.id === obj.mountedToMechanismId)?.label || '?'}`
            : obj.type === 'product' ? '检测目标' : '-';

          const cells = [obj.label, obj.displayName, coords, relation];

          return cells.map((cellText, ci) => {
            const cx = tableX + colWidths.slice(0, ci).reduce((a, b) => a + b, 0);
            return (
              <g key={`cell-${rowIdx}-${ci}`}>
                <rect x={cx} y={ry} width={colWidths[ci]} height={rowH} fill={rowIdx % 2 === 0 ? '#0f172a' : '#1e293b'} stroke="#334155" strokeWidth={0.5} />
                <text x={cx + (ci === 0 ? colWidths[ci] / 2 : 6)} y={ry + 13} textAnchor={ci === 0 ? 'middle' : 'start'} fill={ci === 0 ? obj.layer.stroke : '#cbd5e1'} fontSize={8} fontWeight={ci === 0 ? 'bold' : 'normal'}>
                  {cellText.length > 14 ? cellText.slice(0, 13) + '…' : cellText}
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
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ backgroundColor: '#0f172a' }}
    >
      {/* Title */}
      <text x={width / 2} y={16} textAnchor="middle" fill="#f1f5f9" fontSize={12} fontWeight="bold">
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
        <text x={halfW / 2} y={height - 6} textAnchor="middle" fill="#64748b" fontSize={8}>
          产品尺寸: {productDimensions.length} × {productDimensions.width} × {productDimensions.height} mm
        </text>
      )}
    </svg>
  );
}

export type { ViewProjection };
