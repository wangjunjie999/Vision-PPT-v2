/**
 * SimpleLayoutDiagram - Simplified layout diagram for PPT export
 * Uses small icons instead of realistic images, auto-arranges objects,
 * and integrates key specs in a side panel.
 */
import { MECHANISM_LABELS, CAMERA_MOUNT_LABELS, getLabel } from '@/services/labelMaps';

// === Icon SVG components (simplified schematic style) ===

function CameraIcon({ label, x, y }: { label: string; x: number; y: number }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <rect x={-20} y={-16} width={40} height={32} rx={4} fill="#3b82f6" fillOpacity={0.15} stroke="#3b82f6" strokeWidth={1.5} />
      <circle cx={0} cy={0} r={10} fill="none" stroke="#3b82f6" strokeWidth={1.5} />
      <circle cx={0} cy={0} r={4} fill="#3b82f6" />
      <rect x={-6} y={-22} width={12} height={6} rx={2} fill="#3b82f6" fillOpacity={0.3} stroke="#3b82f6" strokeWidth={1} />
      <text y={28} textAnchor="middle" fill="#e2e8f0" fontSize={9} fontWeight="bold">{label}</text>
    </g>
  );
}

function MechanismIcon({ type, label, x, y }: { type: string; label: string; x: number; y: number }) {
  const iconMap: Record<string, JSX.Element> = {
    robot_arm: (
      <>
        <line x1={0} y1={-15} x2={-10} y2={0} stroke="#a855f7" strokeWidth={2.5} strokeLinecap="round" />
        <line x1={-10} y1={0} x2={5} y2={12} stroke="#a855f7" strokeWidth={2.5} strokeLinecap="round" />
        <circle cx={0} cy={-15} r={3} fill="#a855f7" />
        <circle cx={-10} cy={0} r={2.5} fill="#a855f7" />
        <circle cx={5} cy={12} r={2} fill="#a855f7" />
      </>
    ),
    conveyor: (
      <>
        <rect x={-20} y={-6} width={40} height={12} rx={6} fill="none" stroke="#22c55e" strokeWidth={1.5} />
        <circle cx={-14} cy={0} r={4} fill="none" stroke="#22c55e" strokeWidth={1.5} />
        <circle cx={14} cy={0} r={4} fill="none" stroke="#22c55e" strokeWidth={1.5} />
        <line x1={-10} y1={-6} x2={10} y2={-6} stroke="#22c55e" strokeWidth={1} />
        <polygon points="8,-10 14,-6 8,-2" fill="#22c55e" fillOpacity={0.6} />
      </>
    ),
    cylinder: (
      <>
        <rect x={-6} y={-18} width={12} height={30} rx={3} fill="none" stroke="#f59e0b" strokeWidth={1.5} />
        <line x1={0} y1={-18} x2={0} y2={-24} stroke="#f59e0b" strokeWidth={2} strokeLinecap="round" />
        <polygon points="-4,-24 4,-24 0,-28" fill="#f59e0b" />
        <rect x={-4} y={8} width={8} height={4} rx={1} fill="#f59e0b" fillOpacity={0.3} />
      </>
    ),
    gripper: (
      <>
        <rect x={-4} y={-12} width={8} height={14} rx={2} fill="none" stroke="#ec4899" strokeWidth={1.5} />
        <line x1={-8} y1={2} x2={-4} y2={-2} stroke="#ec4899" strokeWidth={2} strokeLinecap="round" />
        <line x1={8} y1={2} x2={4} y2={-2} stroke="#ec4899" strokeWidth={2} strokeLinecap="round" />
        <line x1={-8} y1={2} x2={-8} y2={10} stroke="#ec4899" strokeWidth={2} strokeLinecap="round" />
        <line x1={8} y1={2} x2={8} y2={10} stroke="#ec4899" strokeWidth={2} strokeLinecap="round" />
      </>
    ),
    lift: (
      <>
        <rect x={-14} y={-4} width={28} height={8} rx={2} fill="none" stroke="#06b6d4" strokeWidth={1.5} />
        <polygon points="-4,-14 4,-14 0,-20" fill="#06b6d4" />
        <line x1={0} y1={-14} x2={0} y2={-4} stroke="#06b6d4" strokeWidth={1.5} />
        <polygon points="-4,14 4,14 0,20" fill="#06b6d4" />
        <line x1={0} y1={4} x2={0} y2={14} stroke="#06b6d4" strokeWidth={1.5} />
      </>
    ),
    turntable: (
      <>
        <circle cx={0} cy={0} r={16} fill="none" stroke="#8b5cf6" strokeWidth={1.5} />
        <circle cx={0} cy={0} r={3} fill="#8b5cf6" />
        <path d="M 10,-12 A 16,16 0 0,1 16,0" fill="none" stroke="#8b5cf6" strokeWidth={1.5} markerEnd="url(#arrowTurntable)" />
      </>
    ),
    stopper: (
      <>
        <rect x={-10} y={-14} width={20} height={28} rx={3} fill="none" stroke="#ef4444" strokeWidth={1.5} />
        <line x1={-6} y1={0} x2={6} y2={0} stroke="#ef4444" strokeWidth={2} />
        <line x1={0} y1={-6} x2={0} y2={6} stroke="#ef4444" strokeWidth={2} />
      </>
    ),
    camera_mount: (
      <>
        <line x1={0} y1={-18} x2={0} y2={6} stroke="#64748b" strokeWidth={2} />
        <line x1={0} y1={6} x2={16} y2={6} stroke="#64748b" strokeWidth={2} />
        <circle cx={16} cy={6} r={3} fill="#64748b" fillOpacity={0.4} stroke="#64748b" strokeWidth={1} />
      </>
    ),
  };

  const icon = iconMap[type] || iconMap.stopper;

  return (
    <g transform={`translate(${x}, ${y})`}>
      {icon}
      <text y={30} textAnchor="middle" fill="#cbd5e1" fontSize={8}>{label}</text>
    </g>
  );
}

// === Types ===

interface LayoutObject {
  id: string;
  type: string;
  name?: string;
  mechanismType?: string;
  posX?: number;
  posY?: number;
  posZ?: number;
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
  /** Layout objects from layout_objects JSON */
  layoutObjects: LayoutObject[];
  /** Mechanisms list */
  mechanisms: string[];
  /** Camera mounts */
  cameraMounts: string[];
  /** Camera count */
  cameraCount: number;
  /** Workstation name */
  workstationName: string;
  /** Cycle time in seconds */
  cycleTime?: number | null;
  /** Shot count */
  shotCount?: number | null;
  /** Modules for this workstation */
  modules: ModuleInfo[];
  /** Hardware summary */
  hardware: HardwareSummary;
  /** Canvas width */
  width?: number;
  /** Canvas height */
  height?: number;
}

const MODULE_TYPE_LABELS_ZH: Record<string, string> = {
  positioning: '定位检测',
  defect: '缺陷检测',
  ocr: 'OCR识别',
  deeplearning: '深度学习',
  measurement: '尺寸测量',
};

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
  // Layout regions
  const diagramW = width * 0.62;
  const panelX = diagramW + 10;
  const panelW = width - panelX - 10;

  // Auto-layout: product center, cameras top, mechanisms sides
  const centerX = diagramW / 2;
  const centerY = height / 2;

  // Extract cameras from layout objects
  const cameraObjects = layoutObjects.filter(o => o.type === 'camera');
  const mechObjects = layoutObjects.filter(o => o.type !== 'camera' && o.type !== 'product');
  
  // If no camera objects, create placeholders based on count
  const cameras = cameraObjects.length > 0
    ? cameraObjects
    : Array.from({ length: cameraCount || 1 }, (_, i) => ({
        id: `cam-${i}`,
        type: 'camera',
        name: `CAM${i + 1}`,
      }));

  // Build mechanism entries from mechanisms array if no mechObjects
  const mechEntries = mechObjects.length > 0
    ? mechObjects
    : mechanisms.map((m, i) => ({
        id: `mech-${i}`,
        type: m,
        mechanismType: m,
        name: getLabel(m, MECHANISM_LABELS, 'zh'),
      }));

  // Position cameras evenly at top
  const cameraPositions = cameras.map((_, i) => ({
    x: centerX + (i - (cameras.length - 1) / 2) * 90,
    y: 70,
  }));

  // Position mechanisms on sides
  const leftMechs = mechEntries.filter((_, i) => i % 2 === 0);
  const rightMechs = mechEntries.filter((_, i) => i % 2 === 1);

  const leftPositions = leftMechs.map((_, i) => ({
    x: 60,
    y: 160 + i * 80,
  }));

  const rightPositions = rightMechs.map((_, i) => ({
    x: diagramW - 60,
    y: 160 + i * 80,
  }));

  // Info panel data
  const cameraInfo = hardware.cameras.map(c => `${c.brand} ${c.model}${c.resolution ? ` (${c.resolution})` : ''}`);
  const lensInfo = hardware.lenses.map(l => `${l.brand} ${l.model}${l.focal_length ? ` ${l.focal_length}` : ''}`);
  const lightInfo = hardware.lights.map(l => `${l.brand} ${l.model}${l.type ? ` ${l.type}` : ''}`);
  const moduleTypes = modules.map(m => MODULE_TYPE_LABELS_ZH[m.type] || m.type);

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ backgroundColor: '#0f172a' }}
    >
      <defs>
        <marker id="arrowTurntable" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <polygon points="0 0, 6 3, 0 6" fill="#8b5cf6" />
        </marker>
        <marker id="arrowDash" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
          <polygon points="0 0, 6 2, 0 4" fill="#475569" />
        </marker>
      </defs>

      {/* Diagram area background */}
      <rect x={0} y={0} width={diagramW} height={height} fill="#0f172a" />

      {/* Title */}
      <text x={centerX} y={24} textAnchor="middle" fill="#f1f5f9" fontSize={14} fontWeight="bold">
        {workstationName} - 布局概览
      </text>

      {/* Product (center) */}
      <rect
        x={centerX - 60}
        y={centerY - 30}
        width={120}
        height={60}
        rx={6}
        fill="#1e3a5f"
        stroke="#3b82f6"
        strokeWidth={2}
        strokeDasharray="6 3"
      />
      <text x={centerX} y={centerY + 5} textAnchor="middle" fill="#93c5fd" fontSize={11} fontWeight="bold">
        待测件
      </text>

      {/* Connection lines: cameras → product */}
      {cameraPositions.map((pos, i) => (
        <line
          key={`cam-line-${i}`}
          x1={pos.x}
          y1={pos.y + 30}
          x2={centerX}
          y2={centerY - 35}
          stroke="#475569"
          strokeWidth={1}
          strokeDasharray="4 3"
          markerEnd="url(#arrowDash)"
        />
      ))}

      {/* Cameras */}
      {cameras.map((cam, i) => (
        <CameraIcon
          key={cam.id}
          label={cam.name || `CAM${i + 1}`}
          x={cameraPositions[i].x}
          y={cameraPositions[i].y}
        />
      ))}

      {/* Left mechanisms */}
      {leftMechs.map((mech, i) => {
        const mechType = mech.mechanismType || mech.type;
        const label = mech.name || getLabel(mechType, MECHANISM_LABELS, 'zh');
        return (
          <MechanismIcon
            key={mech.id}
            type={mechType}
            label={label}
            x={leftPositions[i].x}
            y={leftPositions[i].y}
          />
        );
      })}

      {/* Right mechanisms */}
      {rightMechs.map((mech, i) => {
        const mechType = mech.mechanismType || mech.type;
        const label = mech.name || getLabel(mechType, MECHANISM_LABELS, 'zh');
        return (
          <MechanismIcon
            key={mech.id}
            type={mechType}
            label={label}
            x={rightPositions[i].x}
            y={rightPositions[i].y}
          />
        );
      })}

      {/* Connection lines: mechanisms → product */}
      {leftPositions.map((pos, i) => (
        <line
          key={`left-line-${i}`}
          x1={pos.x + 25}
          y1={pos.y}
          x2={centerX - 65}
          y2={centerY}
          stroke="#334155"
          strokeWidth={0.8}
          strokeDasharray="3 3"
        />
      ))}
      {rightPositions.map((pos, i) => (
        <line
          key={`right-line-${i}`}
          x1={pos.x - 25}
          y1={pos.y}
          x2={centerX + 65}
          y2={centerY}
          stroke="#334155"
          strokeWidth={0.8}
          strokeDasharray="3 3"
        />
      ))}

      {/* Camera mount labels */}
      {cameraMounts.length > 0 && (
        <text x={centerX} y={height - 16} textAnchor="middle" fill="#64748b" fontSize={9}>
          安装方式: {cameraMounts.map(m => getLabel(m, CAMERA_MOUNT_LABELS, 'zh')).join(' / ')}
        </text>
      )}

      {/* ===== Info Panel (right side) ===== */}
      <rect x={panelX} y={0} width={panelW} height={height} fill="#1e293b" rx={0} />

      {/* Panel title */}
      <rect x={panelX} y={8} width={panelW} height={28} fill="#334155" />
      <text x={panelX + panelW / 2} y={27} textAnchor="middle" fill="#f1f5f9" fontSize={11} fontWeight="bold">
        关键参数
      </text>

      {/* Optical summary */}
      {renderInfoSection(panelX + 8, 48, panelW - 16, '光学配置', [
        ...cameraInfo.slice(0, 2),
        ...lensInfo.slice(0, 1),
        ...lightInfo.slice(0, 1),
        ...(hardware.controller ? [`IPC: ${hardware.controller.brand} ${hardware.controller.model}`] : []),
      ])}

      {/* Detection modules */}
      {renderInfoSection(panelX + 8, 48 + (cameraInfo.length + lensInfo.length + lightInfo.length + (hardware.controller ? 1 : 0) + 1) * 16 + 24, panelW - 16, '检测方式', moduleTypes)}

      {/* Cycle info */}
      {renderInfoSection(
        panelX + 8,
        height - 90,
        panelW - 16,
        '节拍信息',
        [
          `目标节拍: ${cycleTime ? `${cycleTime} s/pcs` : '待定'}`,
          `拍照次数: ${shotCount || cameras.length} 次`,
          `相机数量: ${cameras.length} 台`,
        ]
      )}
    </svg>
  );
}

function renderInfoSection(x: number, y: number, w: number, title: string, items: string[]): JSX.Element {
  return (
    <>
      <rect x={x - 2} y={y} width={w + 4} height={16} fill="#1b3b70" fillOpacity={0.4} rx={2} />
      <text x={x + 4} y={y + 12} fill="#93c5fd" fontSize={9} fontWeight="bold">{title}</text>
      {items.map((item, i) => (
        <text key={i} x={x + 6} y={y + 30 + i * 16} fill="#cbd5e1" fontSize={8}>
          • {item}
        </text>
      ))}
    </>
  );
}

export type { SimpleLayoutDiagramProps, LayoutObject, ModuleInfo, HardwareSummary };
