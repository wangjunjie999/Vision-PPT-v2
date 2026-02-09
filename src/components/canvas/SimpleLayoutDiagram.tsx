/**
 * SimpleLayoutDiagram - Three-view layout diagram for PPT export.
 * 2x2 grid: Front (X-Z), Side (Y-Z), Top (X-Y), and Key Specs panel.
 * Uses simplified SVG icons with unified label system (C1, M1, P...).
 */
import { MECHANISM_LABELS, CAMERA_MOUNT_LABELS, getLabel } from '@/services/labelMaps';

// ===== Icon SVG components (simplified schematic style) =====

function CameraIcon({ label, x, y }: { label: string; x: number; y: number }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <rect x={-14} y={-11} width={28} height={22} rx={3} fill="#3b82f6" fillOpacity={0.15} stroke="#3b82f6" strokeWidth={1.5} />
      <circle cx={0} cy={0} r={7} fill="none" stroke="#3b82f6" strokeWidth={1.5} />
      <circle cx={0} cy={0} r={3} fill="#3b82f6" />
      <circle cx={0} cy={-16} r={8} fill="#3b82f6" fillOpacity={0.9} />
      <text y={-12} textAnchor="middle" fill="#fff" fontSize={7} fontWeight="bold">{label}</text>
    </g>
  );
}

function MechanismIcon({ type, label, x, y, color }: { type: string; label: string; x: number; y: number; color: string }) {
  // Simplified shape per mechanism type
  const shapes: Record<string, JSX.Element> = {
    conveyor: <rect x={-18} y={-5} width={36} height={10} rx={5} fill="none" stroke={color} strokeWidth={1.5} />,
    cylinder: <rect x={-5} y={-14} width={10} height={28} rx={2} fill="none" stroke={color} strokeWidth={1.5} />,
    gripper: (
      <>
        <rect x={-3} y={-10} width={6} height={12} rx={1} fill="none" stroke={color} strokeWidth={1.5} />
        <line x1={-7} y1={2} x2={-3} y2={-2} stroke={color} strokeWidth={1.5} />
        <line x1={7} y1={2} x2={3} y2={-2} stroke={color} strokeWidth={1.5} />
      </>
    ),
    lift: (
      <>
        <rect x={-12} y={-3} width={24} height={6} rx={2} fill="none" stroke={color} strokeWidth={1.5} />
        <polygon points="-3,-10 3,-10 0,-14" fill={color} />
        <line x1={0} y1={-10} x2={0} y2={-3} stroke={color} strokeWidth={1} />
      </>
    ),
    turntable: <circle cx={0} cy={0} r={14} fill="none" stroke={color} strokeWidth={1.5} />,
    stopper: <rect x={-8} y={-10} width={16} height={20} rx={2} fill="none" stroke={color} strokeWidth={1.5} />,
    robot_arm: (
      <>
        <line x1={0} y1={-12} x2={-8} y2={0} stroke={color} strokeWidth={2} strokeLinecap="round" />
        <line x1={-8} y1={0} x2={4} y2={8} stroke={color} strokeWidth={2} strokeLinecap="round" />
        <circle cx={0} cy={-12} r={2.5} fill={color} />
      </>
    ),
    camera_mount: (
      <>
        <line x1={0} y1={-14} x2={0} y2={4} stroke={color} strokeWidth={2} />
        <line x1={0} y1={4} x2={12} y2={4} stroke={color} strokeWidth={2} />
      </>
    ),
  };

  return (
    <g transform={`translate(${x}, ${y})`}>
      {shapes[type] || shapes.stopper}
      <circle cx={0} cy={-20} r={8} fill={color} fillOpacity={0.9} />
      <text y={-16} textAnchor="middle" fill="#fff" fontSize={7} fontWeight="bold">{label}</text>
    </g>
  );
}

function ProductIcon({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <rect x={-30} y={-18} width={60} height={36} rx={4} fill="#1e3a5f" stroke="#06b6d4" strokeWidth={2} strokeDasharray="6 3" />
      <line x1={-8} y1={0} x2={8} y2={0} stroke="#06b6d4" strokeWidth={0.5} opacity={0.5} />
      <line x1={0} y1={-8} x2={0} y2={8} stroke="#06b6d4" strokeWidth={0.5} opacity={0.5} />
      <circle cx={0} cy={-26} r={8} fill="#06b6d4" fillOpacity={0.9} />
      <text y={-22} textAnchor="middle" fill="#fff" fontSize={7} fontWeight="bold">P</text>
    </g>
  );
}

// ===== Types =====

interface LayoutObject {
  id: string;
  type: string;
  name?: string;
  mechanismType?: string;
  posX?: number;
  posY?: number;
  posZ?: number;
  mountedToMechanismId?: string;
}

interface ModuleInfo {
  name: string;
  type: string;
  trigger_type?: string | null;
  processing_time_limit?: number | null;
}

interface HardwareSummary {
  cameras: Array<{ brand: string; model: string; resolution?: string }>;
  lenses: Array<{ brand: string; model: string; focal_length?: string }>;
  lights: Array<{ brand: string; model: string; type?: string }>;
  controller?: { brand: string; model: string } | null;
}

interface SimpleLayoutDiagramProps {
  layoutObjects: LayoutObject[];
  mechanisms: string[];
  cameraMounts: string[];
  cameraCount: number;
  workstationName: string;
  cycleTime?: number | null;
  shotCount?: number | null;
  modules: ModuleInfo[];
  hardware: HardwareSummary;
  width?: number;
  height?: number;
}

const MODULE_TYPE_LABELS_ZH: Record<string, string> = {
  positioning: '定位检测',
  defect: '缺陷检测',
  ocr: 'OCR识别',
  deeplearning: '深度学习',
  measurement: '尺寸测量',
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

// ===== Projection helpers =====

type ViewType = 'front' | 'side' | 'top';

function projectTo2D(obj: LayoutObject, view: ViewType): { x: number; y: number } {
  const px = obj.posX ?? 0;
  const py = obj.posY ?? 0;
  const pz = obj.posZ ?? 0;
  switch (view) {
    case 'front': return { x: px, y: -pz };
    case 'side': return { x: py, y: -pz };
    case 'top': return { x: px, y: py };
  }
}

// ===== Labeled object builder =====

interface LabeledObj extends LayoutObject {
  label: string;
  color: string;
}

function buildLabeledObjects(
  layoutObjects: LayoutObject[],
  mechanisms: string[],
  cameraCount: number
): LabeledObj[] {
  const result: LabeledObj[] = [];

  // Extract cameras from layout objects
  const cameraObjects = layoutObjects.filter(o => o.type === 'camera');
  const cameras = cameraObjects.length > 0
    ? cameraObjects
    : Array.from({ length: cameraCount || 1 }, (_, i) => ({
        id: `cam-${i}`, type: 'camera', name: `CAM${i + 1}`,
        posX: (i - (cameraCount - 1) / 2) * 80, posY: -100, posZ: 300,
      }));

  // Extract mechanisms
  const mechObjects = layoutObjects.filter(o => o.type !== 'camera' && o.type !== 'product');
  const mechs = mechObjects.length > 0
    ? mechObjects
    : mechanisms.map((m, i) => ({
        id: `mech-${i}`, type: m, mechanismType: m,
        name: getLabel(m, MECHANISM_LABELS, 'zh'),
        posX: (i % 2 === 0 ? -1 : 1) * 150, posY: 100 + Math.floor(i / 2) * 100, posZ: 0,
      }));

  // Add product
  result.push({ id: 'product', type: 'product', name: '待测件', posX: 0, posY: 0, posZ: 0, label: 'P', color: '#06b6d4' });

  // Add mechanisms
  let mechIdx = 1;
  mechs.forEach(m => {
    const mechType = m.mechanismType || m.type;
    result.push({
      ...m,
      label: `M${mechIdx++}`,
      color: MECH_COLORS[mechType] || '#a855f7',
    });
  });

  // Add cameras
  let camIdx = 1;
  cameras.forEach(c => {
    result.push({
      ...c,
      label: `C${camIdx++}`,
      color: '#3b82f6',
    });
  });

  return result;
}

// ===== Render a single view panel =====

function renderViewPanel(
  labeled: LabeledObj[],
  view: ViewType,
  ox: number,
  oy: number,
  vw: number,
  vh: number,
  title: string
): JSX.Element {
  const headerH = 24;
  const pad = 30;

  // Compute fit scale
  let minX = 0, maxX = 0, minY = 0, maxY = 0;
  labeled.forEach(obj => {
    const p = projectTo2D(obj, view);
    minX = Math.min(minX, p.x - 40);
    maxX = Math.max(maxX, p.x + 40);
    minY = Math.min(minY, p.y - 30);
    maxY = Math.max(maxY, p.y + 30);
  });

  const rangeX = maxX - minX || 300;
  const rangeY = maxY - minY || 200;
  const availW = vw - pad * 2;
  const availH = vh - headerH - pad * 2;
  const fitScale = Math.min(availW / rangeX, availH / rangeY, 1.2) * 0.8;
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const offX = ox + vw / 2 - cx * fitScale;
  const offY = oy + headerH + (vh - headerH) / 2 - cy * fitScale;

  return (
    <g key={view}>
      <rect x={ox} y={oy} width={vw} height={vh} fill="#0f172a" stroke="#334155" strokeWidth={0.5} />
      <rect x={ox} y={oy} width={vw} height={headerH} fill="#1e293b" />
      <text x={ox + vw / 2} y={oy + 16} textAnchor="middle" fill="#94a3b8" fontSize={10} fontWeight="bold">{title}</text>

      {/* Render connection lines first (behind objects) */}
      {labeled.filter(o => o.type === 'camera').map(cam => {
        const product = labeled.find(o => o.type === 'product');
        if (!product) return null;
        const cp = projectTo2D(cam, view);
        const pp = projectTo2D(product, view);
        return (
          <line
            key={`conn-${view}-${cam.id}`}
            x1={offX + cp.x * fitScale} y1={offY + cp.y * fitScale}
            x2={offX + pp.x * fitScale} y2={offY + pp.y * fitScale}
            stroke="#475569" strokeWidth={0.8} strokeDasharray="3 3" opacity={0.5}
          />
        );
      })}

      {/* Render objects */}
      {labeled.map(obj => {
        const p = projectTo2D(obj, view);
        const sx = offX + p.x * fitScale;
        const sy = offY + p.y * fitScale;

        if (obj.type === 'product') return <ProductIcon key={`${view}-${obj.id}`} x={sx} y={sy} />;
        if (obj.type === 'camera') return <CameraIcon key={`${view}-${obj.id}`} label={obj.label} x={sx} y={sy} />;
        const mechType = obj.mechanismType || obj.type;
        return <MechanismIcon key={`${view}-${obj.id}`} type={mechType} label={obj.label} x={sx} y={sy} color={obj.color} />;
      })}
    </g>
  );
}

// ===== Main Component =====

export function SimpleLayoutDiagram({
  layoutObjects,
  mechanisms,
  cameraMounts,
  cameraCount,
  workstationName,
  cycleTime,
  shotCount,
  modules,
  hardware,
  width = 900,
  height = 500,
}: SimpleLayoutDiagramProps) {
  const halfW = width / 2;
  const halfH = height / 2;

  const labeled = buildLabeledObjects(layoutObjects, mechanisms, cameraCount);

  // Info panel data
  const cameraInfo = hardware.cameras.map(c => `${c.brand} ${c.model}${c.resolution ? ` (${c.resolution})` : ''}`);
  const lensInfo = hardware.lenses.map(l => `${l.brand} ${l.model}${l.focal_length ? ` ${l.focal_length}` : ''}`);
  const lightInfo = hardware.lights.map(l => `${l.brand} ${l.model}${l.type ? ` ${l.type}` : ''}`);
  const moduleTypes = modules.map(m => MODULE_TYPE_LABELS_ZH[m.type] || m.type);
  const cameras = labeled.filter(o => o.type === 'camera');

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ backgroundColor: '#0f172a' }}
    >
      {/* Three views */}
      {renderViewPanel(labeled, 'front', 0, 0, halfW, halfH, '正视图 (X-Z)')}
      {renderViewPanel(labeled, 'side', halfW, 0, halfW, halfH, '左视图 (Y-Z)')}
      {renderViewPanel(labeled, 'top', 0, halfH, halfW, halfH, '俯视图 (X-Y)')}

      {/* ===== Info Panel (bottom-right) ===== */}
      <rect x={halfW} y={halfH} width={halfW} height={halfH} fill="#1e293b" stroke="#334155" strokeWidth={0.5} />

      {/* Panel title */}
      <rect x={halfW} y={halfH} width={halfW} height={24} fill="#334155" />
      <text x={halfW + halfW / 2} y={halfH + 16} textAnchor="middle" fill="#f1f5f9" fontSize={10} fontWeight="bold">
        {workstationName} - 关键参数
      </text>

      {/* Label legend */}
      {renderLabelLegend(labeled, halfW + 8, halfH + 32, halfW - 16)}

      {/* Hardware summary */}
      {renderInfoSection(halfW + 8, halfH + 32 + Math.min(labeled.length, 8) * 14 + 10, halfW / 2 - 12, '光学配置', [
        ...cameraInfo.slice(0, 2),
        ...lensInfo.slice(0, 1),
        ...lightInfo.slice(0, 1),
        ...(hardware.controller ? [`IPC: ${hardware.controller.brand} ${hardware.controller.model}`] : []),
      ])}

      {/* Right column: detection + cycle */}
      {renderInfoSection(halfW + halfW / 2 + 4, halfH + 32 + Math.min(labeled.length, 8) * 14 + 10, halfW / 2 - 12, '检测方式', moduleTypes)}

      {renderInfoSection(halfW + halfW / 2 + 4, halfH + 32 + Math.min(labeled.length, 8) * 14 + 10 + (moduleTypes.length + 1) * 14 + 16, halfW / 2 - 12, '节拍信息', [
        `目标节拍: ${cycleTime ? `${cycleTime} s/pcs` : '待定'}`,
        `拍照次数: ${shotCount || cameras.length} 次`,
        `相机数量: ${cameras.length} 台`,
      ])}

      {/* Camera mount labels */}
      {cameraMounts.length > 0 && (
        <text x={halfW + halfW / 2} y={height - 6} textAnchor="middle" fill="#64748b" fontSize={8}>
          安装方式: {cameraMounts.map(m => getLabel(m, CAMERA_MOUNT_LABELS, 'zh')).join(' / ')}
        </text>
      )}
    </svg>
  );
}

// ===== Helper renderers =====

function renderLabelLegend(labeled: LabeledObj[], x: number, y: number, w: number): JSX.Element {
  const rowH = 14;
  const items = labeled.slice(0, 8);
  return (
    <>
      {items.map((obj, i) => {
        const ry = y + i * rowH;
        return (
          <g key={`legend-${obj.id}`}>
            <circle cx={x + 8} cy={ry + 5} r={6} fill={obj.color} fillOpacity={0.9} />
            <text x={x + 8} y={ry + 8} textAnchor="middle" fill="#fff" fontSize={6} fontWeight="bold">{obj.label}</text>
            <text x={x + 20} y={ry + 8} fill="#cbd5e1" fontSize={7}>
              {(obj.name || obj.label).slice(0, 20)}
            </text>
            <text x={x + w - 4} y={ry + 8} textAnchor="end" fill="#64748b" fontSize={6}>
              ({obj.posX ?? 0}, {obj.posY ?? 0}, {obj.posZ ?? 0})
            </text>
          </g>
        );
      })}
    </>
  );
}

function renderInfoSection(x: number, y: number, w: number, title: string, items: string[]): JSX.Element {
  return (
    <>
      <rect x={x - 2} y={y} width={w + 4} height={14} fill="#1b3b70" fillOpacity={0.4} rx={2} />
      <text x={x + 4} y={y + 10} fill="#93c5fd" fontSize={8} fontWeight="bold">{title}</text>
      {items.map((item, i) => (
        <text key={i} x={x + 4} y={y + 24 + i * 13} fill="#cbd5e1" fontSize={7}>
          • {item.length > 28 ? item.slice(0, 27) + '…' : item}
        </text>
      ))}
    </>
  );
}

export type { SimpleLayoutDiagramProps, LayoutObject, ModuleInfo, HardwareSummary };
