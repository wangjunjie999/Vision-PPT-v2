import { memo, useRef, useCallback, useState, Suspense } from 'react';
import { Canvas, useThree, useFrame, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Box, Cone, Line, Text, Grid, Plane, Sphere, Cylinder } from '@react-three/drei';
import { Button } from '@/components/ui/button';
import { RotateCcw, X, Move, MousePointer, Magnet } from 'lucide-react';
import type { LayoutObject } from './ObjectPropertyPanel';
import * as THREE from 'three';

interface Layout3DPreviewProps {
  objects: LayoutObject[];
  productDimensions: { length: number; width: number; height: number };
  onSelectObject?: (id: string | null) => void;
  selectedObjectId?: string | null;
  onUpdateObject?: (id: string, updates: Partial<LayoutObject>) => void;
}

const SCALE = 0.01;
const INV_SCALE = 100; // 1 / SCALE

// Shared drag state across components
interface DragState {
  isDragging: boolean;
  objectId: string | null;
  startPoint: THREE.Vector3 | null;
  startPos: { posX: number; posY: number; posZ: number } | null;
}

function DraggableGroup({
  children,
  objectId,
  position,
  dragState,
  onDragStart,
  onClick,
}: {
  children: React.ReactNode;
  objectId: string;
  position: [number, number, number];
  dragState: React.MutableRefObject<DragState>;
  onDragStart: (id: string, point: THREE.Vector3) => void;
  onClick: (id: string) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);

  return (
    <group
      ref={groupRef}
      position={position}
      onPointerDown={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        // Only start drag with left button
        if (e.button === 0) {
          onDragStart(objectId, e.point);
        }
      }}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        if (!dragState.current.isDragging) {
          onClick(objectId);
        }
      }}
    >
      {children}
    </group>
  );
}

// Helper: standard material props for mechanisms
function mechMat(color: string, selected: boolean) {
  const highlightColor = '#facc15';
  return {
    color: selected ? highlightColor : color,
    transparent: true,
    opacity: selected ? 0.9 : 0.75,
    emissive: selected ? highlightColor : '#000000',
    emissiveIntensity: selected ? 0.3 : 0,
  } as const;
}

function RobotArmModel({ w, h, d, selected }: { w: number; h: number; d: number; selected: boolean }) {
  const baseR = Math.min(w, d) * 0.5;
  const armW = w * 0.25;
  return (
    <group>
      {/* Base cylinder */}
      <Cylinder args={[baseR, baseR * 1.1, h * 0.2, 16]} position={[0, h * 0.1, 0]}>
        <meshStandardMaterial {...mechMat('#4a4a4a', selected)} />
      </Cylinder>
      {/* Vertical arm */}
      <Box args={[armW, h * 0.65, armW]} position={[0, h * 0.2 + h * 0.325, 0]}>
        <meshStandardMaterial {...mechMat('#ea580c', selected)} />
      </Box>
      {/* Shoulder joint */}
      <Sphere args={[armW * 0.6, 12, 12]} position={[0, h * 0.2, 0]}>
        <meshStandardMaterial {...mechMat('#6b7280', selected)} />
      </Sphere>
      {/* End effector joint */}
      <Sphere args={[armW * 0.5, 12, 12]} position={[0, h * 0.85, 0]}>
        <meshStandardMaterial {...mechMat('#f97316', selected)} />
      </Sphere>
    </group>
  );
}

function ConveyorModel({ w, h, d, selected }: { w: number; h: number; d: number; selected: boolean }) {
  const rollerR = Math.min(h, d) * 0.25;
  return (
    <group>
      {/* Belt surface */}
      <Box args={[w, h * 0.3, d]} position={[0, h * 0.5, 0]}>
        <meshStandardMaterial {...mechMat('#6b7280', selected)} />
      </Box>
      {/* Left roller */}
      <Cylinder args={[rollerR, rollerR, d * 0.9, 12]} rotation={[Math.PI / 2, 0, 0]} position={[-w * 0.42, h * 0.35, 0]}>
        <meshStandardMaterial {...mechMat('#22c55e', selected)} />
      </Cylinder>
      {/* Right roller */}
      <Cylinder args={[rollerR, rollerR, d * 0.9, 12]} rotation={[Math.PI / 2, 0, 0]} position={[w * 0.42, h * 0.35, 0]}>
        <meshStandardMaterial {...mechMat('#22c55e', selected)} />
      </Cylinder>
      {/* Legs */}
      <Box args={[w * 0.06, h * 0.35, d * 0.06]} position={[-w * 0.4, h * 0.175, -d * 0.4]}>
        <meshStandardMaterial {...mechMat('#4a4a4a', selected)} />
      </Box>
      <Box args={[w * 0.06, h * 0.35, d * 0.06]} position={[w * 0.4, h * 0.175, -d * 0.4]}>
        <meshStandardMaterial {...mechMat('#4a4a4a', selected)} />
      </Box>
      <Box args={[w * 0.06, h * 0.35, d * 0.06]} position={[-w * 0.4, h * 0.175, d * 0.4]}>
        <meshStandardMaterial {...mechMat('#4a4a4a', selected)} />
      </Box>
      <Box args={[w * 0.06, h * 0.35, d * 0.06]} position={[w * 0.4, h * 0.175, d * 0.4]}>
        <meshStandardMaterial {...mechMat('#4a4a4a', selected)} />
      </Box>
    </group>
  );
}

function CylinderModel({ w, h, d, selected }: { w: number; h: number; d: number; selected: boolean }) {
  const r = Math.min(w, d) * 0.35;
  return (
    <group>
      <Cylinder args={[r, r, h, 16]} position={[0, h * 0.5, 0]}>
        <meshStandardMaterial {...mechMat('#9ca3af', selected)} metalness={0.4} roughness={0.3} />
      </Cylinder>
      {/* Piston rod */}
      <Cylinder args={[r * 0.25, r * 0.25, h * 0.4, 8]} position={[0, h * 0.9, 0]}>
        <meshStandardMaterial {...mechMat('#d1d5db', selected)} metalness={0.6} roughness={0.2} />
      </Cylinder>
    </group>
  );
}

function GripperModel({ w, h, d, selected }: { w: number; h: number; d: number; selected: boolean }) {
  const jawW = w * 0.15;
  return (
    <group>
      {/* Center body */}
      <Box args={[w * 0.4, h * 0.5, d * 0.6]} position={[0, h * 0.5, 0]}>
        <meshStandardMaterial {...mechMat('#4b5563', selected)} />
      </Box>
      {/* Left jaw */}
      <Box args={[jawW, h * 0.7, d * 0.2]} position={[-w * 0.35, h * 0.35, 0]}>
        <meshStandardMaterial {...mechMat('#6b7280', selected)} />
      </Box>
      {/* Right jaw */}
      <Box args={[jawW, h * 0.7, d * 0.2]} position={[w * 0.35, h * 0.35, 0]}>
        <meshStandardMaterial {...mechMat('#6b7280', selected)} />
      </Box>
    </group>
  );
}

function TurntableModel({ w, h, d, selected }: { w: number; h: number; d: number; selected: boolean }) {
  const r = Math.max(w, d) * 0.45;
  return (
    <group>
      {/* Base */}
      <Cylinder args={[r * 0.8, r, h * 0.4, 20]} position={[0, h * 0.2, 0]}>
        <meshStandardMaterial {...mechMat('#1e3a5f', selected)} />
      </Cylinder>
      {/* Top disc */}
      <Cylinder args={[r, r, h * 0.08, 20]} position={[0, h * 0.44, 0]}>
        <meshStandardMaterial {...mechMat('#2563eb', selected)} />
      </Cylinder>
    </group>
  );
}

function LiftModel({ w, h, d, selected }: { w: number; h: number; d: number; selected: boolean }) {
  const pillarW = w * 0.12;
  return (
    <group>
      {/* Left pillar */}
      <Box args={[pillarW, h, pillarW]} position={[-w * 0.35, h * 0.5, 0]}>
        <meshStandardMaterial {...mechMat('#6b7280', selected)} />
      </Box>
      {/* Right pillar */}
      <Box args={[pillarW, h, pillarW]} position={[w * 0.35, h * 0.5, 0]}>
        <meshStandardMaterial {...mechMat('#6b7280', selected)} />
      </Box>
      {/* Platform */}
      <Box args={[w * 0.8, h * 0.08, d * 0.8]} position={[0, h * 0.6, 0]}>
        <meshStandardMaterial {...mechMat('#9ca3af', selected)} />
      </Box>
    </group>
  );
}

function StopModel({ w, h, d, selected }: { w: number; h: number; d: number; selected: boolean }) {
  return (
    <group>
      {/* Base block */}
      <Box args={[w * 0.5, h * 0.4, d * 0.5]} position={[0, h * 0.2, 0]}>
        <meshStandardMaterial {...mechMat('#991b1b', selected)} />
      </Box>
      {/* Stop plate */}
      <Box args={[w * 0.8, h * 0.7, d * 0.1]} position={[0, h * 0.55, d * 0.25]}>
        <meshStandardMaterial {...mechMat('#dc2626', selected)} />
      </Box>
    </group>
  );
}

function CameraMountModel({ w, h, d, selected }: { w: number; h: number; d: number; selected: boolean }) {
  return (
    <group>
      {/* Vertical bar */}
      <Box args={[w * 0.15, h, d * 0.15]} position={[0, h * 0.5, -d * 0.3]}>
        <meshStandardMaterial {...mechMat('#64748b', selected)} />
      </Box>
      {/* Horizontal arm */}
      <Box args={[w * 0.6, h * 0.1, d * 0.12]} position={[0, h * 0.9, 0]}>
        <meshStandardMaterial {...mechMat('#94a3b8', selected)} />
      </Box>
    </group>
  );
}

function DefaultMechanismModel({ w, h, d, selected }: { w: number; h: number; d: number; selected: boolean }) {
  const isMounted = false;
  const baseColor = '#f97316';
  const highlightColor = '#facc15';
  return (
    <group position={[0, h / 2, 0]}>
      <Box args={[w, h, d]}>
        <meshStandardMaterial {...mechMat(baseColor, selected)} />
      </Box>
      <Box args={[w, h, d]}>
        <meshBasicMaterial color={selected ? highlightColor : baseColor} wireframe />
      </Box>
    </group>
  );
}

function Mechanism3DModel({ obj, selected }: { obj: LayoutObject; selected: boolean }) {
  const w = (obj.width || 100) * SCALE;
  const h = (obj.height || 100) * SCALE;
  const d = ((obj as any).depth || 80) * SCALE;
  const mechType = obj.mechanismType || '';
  const highlightColor = '#facc15';

  let model: React.ReactNode;
  switch (mechType) {
    case 'robot_arm': model = <RobotArmModel w={w} h={h} d={d} selected={selected} />; break;
    case 'conveyor': model = <ConveyorModel w={w} h={h} d={d} selected={selected} />; break;
    case 'cylinder': model = <CylinderModel w={w} h={h} d={d} selected={selected} />; break;
    case 'gripper': model = <GripperModel w={w} h={h} d={d} selected={selected} />; break;
    case 'turntable': model = <TurntableModel w={w} h={h} d={d} selected={selected} />; break;
    case 'lift': model = <LiftModel w={w} h={h} d={d} selected={selected} />; break;
    case 'stop': model = <StopModel w={w} h={h} d={d} selected={selected} />; break;
    case 'camera_mount': model = <CameraMountModel w={w} h={h} d={d} selected={selected} />; break;
    default: model = <DefaultMechanismModel w={w} h={h} d={d} selected={selected} />; break;
  }

  return (
    <>
      {model}
      {selected && (
        <Box args={[w + 0.06, h + 0.06, d + 0.06]} position={[0, h / 2, 0]}>
          <meshBasicMaterial color={highlightColor} wireframe transparent opacity={0.5} />
        </Box>
      )}
      <Text
        position={[0, h + 0.15, 0]}
        fontSize={0.18}
        color="#fafafa"
        anchorX="center"
        anchorY="bottom"
      >
        {obj.name || '机构'}
      </Text>
    </>
  );
}

function ProductBox({ dimensions, selected }: { dimensions: { length: number; width: number; height: number }; selected: boolean }) {
  const w = dimensions.length * SCALE;
  const h = dimensions.height * SCALE;
  const d = dimensions.width * SCALE;
  const highlightColor = '#facc15';

  return (
    <>
      <group position={[0, h / 2, 0]}>
        <Box args={[w, h, d]}>
          <meshStandardMaterial
            color={selected ? highlightColor : '#06b6d4'}
            transparent opacity={selected ? 0.8 : 0.5}
            emissive={selected ? highlightColor : '#000000'}
            emissiveIntensity={selected ? 0.3 : 0}
          />
        </Box>
        <Box args={[w, h, d]}>
          <meshBasicMaterial color={selected ? highlightColor : '#06b6d4'} wireframe />
        </Box>
        {selected && (
          <Box args={[w + 0.06, h + 0.06, d + 0.06]}>
            <meshBasicMaterial color={highlightColor} wireframe transparent opacity={0.5} />
          </Box>
        )}
      </group>
      <Text
        position={[0, h + 0.15, 0]}
        fontSize={0.18}
        color="#fafafa"
        anchorX="center"
        anchorY="bottom"
      >
        产品
      </Text>
    </>
  );
}

function CameraObject({ obj, selected }: { obj: LayoutObject; selected: boolean }) {
  const isMounted = !!obj.mountedToMechanismId;
  const baseColor = isMounted ? '#16a34a' : '#3b82f6';
  const baseDark = isMounted ? '#15803d' : '#1d4ed8';
  const highlightColor = '#facc15';

  return (
    <>
      <Box args={[0.3, 0.25, 0.4]}>
        <meshStandardMaterial
          color={selected ? highlightColor : baseColor}
          emissive={selected ? highlightColor : '#000000'}
          emissiveIntensity={selected ? 0.3 : 0}
        />
      </Box>
      <group position={[0, -0.25, 0]} rotation={[Math.PI, 0, 0]}>
        <Cone args={[0.15, 0.3, 8]}>
          <meshStandardMaterial
            color={selected ? highlightColor : baseDark}
            emissive={selected ? highlightColor : '#000000'}
            emissiveIntensity={selected ? 0.2 : 0}
          />
        </Cone>
      </group>
      {selected && (
        <Box args={[0.4, 0.35, 0.5]}>
          <meshBasicMaterial color={highlightColor} wireframe transparent opacity={0.5} />
        </Box>
      )}
      <Text
        position={[0, 0.25, 0]}
        fontSize={0.16}
        color="#fafafa"
        anchorX="center"
        anchorY="bottom"
      >
        {obj.name || 'CAM'}
      </Text>
    </>
  );
}

function MountingLines({ objects }: { objects: LayoutObject[] }) {
  const lines: { start: [number, number, number]; end: [number, number, number] }[] = [];
  objects.forEach(obj => {
    if (obj.mountedToMechanismId) {
      const parent = objects.find(o => o.id === obj.mountedToMechanismId);
      if (parent) {
        lines.push({
          start: [(obj.posX ?? 0) * SCALE, (obj.posZ ?? 0) * SCALE, (obj.posY ?? 0) * SCALE],
          end: [(parent.posX ?? 0) * SCALE, (parent.posZ ?? 0) * SCALE, (parent.posY ?? 0) * SCALE],
        });
      }
    }
  });
  return (
    <>
      {lines.map((line, i) => (
        <Line key={i} points={[line.start, line.end]} color="#22c55e" lineWidth={1.5} dashed dashSize={0.15} gapSize={0.1} />
      ))}
    </>
  );
}

const VIEW_PRESETS = [
  { label: '正视', icon: '🎯', position: [0, 3, 10] as [number, number, number], target: [0, 1.5, 0] as [number, number, number] },
  { label: '侧视', icon: '📐', position: [10, 3, 0] as [number, number, number], target: [0, 1.5, 0] as [number, number, number] },
  { label: '俯视', icon: '🔍', position: [0, 12, 0.01] as [number, number, number], target: [0, 0, 0] as [number, number, number] },
  { label: '等轴测', icon: '🧊', position: [7, 6, 7] as [number, number, number], target: [0, 1, 0] as [number, number, number] },
] as const;

function CameraController({
  cameraRef,
  dragMode,
}: {
  cameraRef: React.MutableRefObject<{ position: [number, number, number]; target: [number, number, number] } | null>;
  dragMode: boolean;
}) {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);

  if (cameraRef.current) {
    const { position, target } = cameraRef.current;
    camera.position.set(...position);
    if (controlsRef.current) {
      controlsRef.current.target.set(...target);
      controlsRef.current.update();
    }
    cameraRef.current = null;
  }

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping
      dampingFactor={0.1}
      minDistance={2}
      maxDistance={30}
      enabled={!dragMode}
    />
  );
}

/** Invisible ground plane for raycasting during drag */
function DragPlane({
  dragStateRef,
  onDragMove,
  onDragEnd,
}: {
  dragStateRef: React.MutableRefObject<DragState>;
  onDragMove: (point: THREE.Vector3) => void;
  onDragEnd: () => void;
}) {
  const planeRef = useRef<THREE.Mesh>(null);

  return (
    <Plane
      ref={planeRef}
      args={[200, 200]}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0, 0]}
      visible={false}
      onPointerMove={(e: ThreeEvent<PointerEvent>) => {
        if (dragStateRef.current.isDragging) {
          e.stopPropagation();
          onDragMove(e.point);
        }
      }}
      onPointerUp={(e: ThreeEvent<PointerEvent>) => {
        if (dragStateRef.current.isDragging) {
          e.stopPropagation();
          onDragEnd();
        }
      }}
    >
      <meshBasicMaterial transparent opacity={0} />
    </Plane>
  );
}

function SelectedInfoPanel({ obj, onDeselect }: { obj: LayoutObject | null; onDeselect: () => void }) {
  if (!obj) return null;
  const typeLabel = obj.type === 'camera' ? '相机' : obj.type === 'mechanism' ? '机构' : '产品';
  return (
    <div className="absolute top-3 left-3 bg-slate-800/90 backdrop-blur-sm rounded-lg border border-yellow-500/50 p-3 z-10 min-w-[160px]">
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-semibold text-yellow-400">已选中</span>
        <button onClick={onDeselect} className="text-slate-400 hover:text-slate-200 transition-colors">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="text-sm font-medium text-slate-100 truncate">{obj.name || '未命名'}</div>
      <div className="text-[10px] text-slate-400 mt-1">类型: {typeLabel}</div>
      <div className="text-[10px] text-slate-400">
        位置: ({obj.posX ?? 0}, {obj.posY ?? 0}, {obj.posZ ?? 0})
      </div>
      {obj.width && obj.height && (
        <div className="text-[10px] text-slate-400">
          尺寸: {obj.width}×{obj.height}{(obj as any).depth ? `×${(obj as any).depth}` : ''}
        </div>
      )}
    </div>
  );
}

export const Layout3DPreview = memo(function Layout3DPreview({
  objects,
  productDimensions,
  onSelectObject,
  selectedObjectId,
  onUpdateObject,
}: Layout3DPreviewProps) {
  const cameraActionRef = useRef<{ position: [number, number, number]; target: [number, number, number] } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [localSelectedId, setLocalSelectedId] = useState<string | null>(null);
  const [dragMode, setDragMode] = useState(false);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const SNAP_GRID = 10; // mm
  const dragStateRef = useRef<DragState>({
    isDragging: false,
    objectId: null,
    startPoint: null,
    startPos: null,
  });
  // Track if a real drag happened (moved > threshold)
  const dragMovedRef = useRef(false);

  const activeSelectedId = selectedObjectId !== undefined ? selectedObjectId : localSelectedId;

  const handleSelect = useCallback((id: string | null) => {
    const newId = activeSelectedId === id ? null : id;
    setLocalSelectedId(newId);
    onSelectObject?.(newId);
  }, [activeSelectedId, onSelectObject]);

  const handleDeselect = useCallback(() => {
    setLocalSelectedId(null);
    onSelectObject?.(null);
  }, [onSelectObject]);

  const handleViewPreset = useCallback((position: [number, number, number], target: [number, number, number]) => {
    cameraActionRef.current = { position, target };
    if (canvasRef.current) {
      canvasRef.current.dispatchEvent(new Event('resize'));
    }
  }, []);

  // Drag handlers
  const handleDragStart = useCallback((id: string, point: THREE.Vector3) => {
    if (!dragMode || !onUpdateObject) return;
    const obj = objects.find(o => o.id === id);
    if (!obj || obj.locked) return;

    dragStateRef.current = {
      isDragging: true,
      objectId: id,
      startPoint: point.clone(),
      startPos: { posX: obj.posX ?? 0, posY: obj.posY ?? 0, posZ: obj.posZ ?? 0 },
    };
    dragMovedRef.current = false;

    // Select the object being dragged
    setLocalSelectedId(id);
    onSelectObject?.(id);
  }, [dragMode, onUpdateObject, objects, onSelectObject]);

  const handleDragMove = useCallback((point: THREE.Vector3) => {
    const state = dragStateRef.current;
    if (!state.isDragging || !state.objectId || !state.startPoint || !state.startPos || !onUpdateObject) return;

    const dx = point.x - state.startPoint.x;
    const dz = point.z - state.startPoint.z;

    if (Math.abs(dx) > 0.02 || Math.abs(dz) > 0.02) {
      dragMovedRef.current = true;
    }

    // Convert 3D delta back to mm: x maps to posX, z maps to posY
    let newPosX = Math.round(state.startPos.posX + dx * INV_SCALE);
    let newPosY = Math.round(state.startPos.posY + dz * INV_SCALE);

    // Snap to grid
    if (snapEnabled) {
      newPosX = Math.round(newPosX / SNAP_GRID) * SNAP_GRID;
      newPosY = Math.round(newPosY / SNAP_GRID) * SNAP_GRID;
    }

    onUpdateObject(state.objectId, { posX: newPosX, posY: newPosY });
  }, [onUpdateObject, snapEnabled, SNAP_GRID]);

  const handleDragEnd = useCallback(() => {
    dragStateRef.current = {
      isDragging: false,
      objectId: null,
      startPoint: null,
      startPos: null,
    };
  }, []);

  const selectedObj = activeSelectedId
    ? (activeSelectedId === '__product__' ? null : objects.find(o => o.id === activeSelectedId) || null)
    : null;

  const mechanisms = objects.filter(o => o.type === 'mechanism');
  const cameras = objects.filter(o => o.type === 'camera');

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Canvas
        ref={canvasRef}
        camera={{ position: [7, 6, 7], fov: 50, near: 0.1, far: 100 }}
        gl={{ antialias: true, alpha: false }}
        onCreated={({ gl }) => { gl.setClearColor('#0f172a'); }}
        onPointerMissed={() => {
          if (!dragStateRef.current.isDragging) {
            handleSelect(null);
          }
        }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 8, 5]} intensity={0.8} />
          <directionalLight position={[-3, 5, -3]} intensity={0.3} />

          <Grid
            args={[20, 20]}
            cellSize={1}
            cellThickness={0.5}
            cellColor="#334155"
            sectionSize={5}
            sectionThickness={1}
            sectionColor="#475569"
            fadeDistance={30}
            position={[0, -0.01, 0]}
          />

          <axesHelper args={[3]} />

          {/* Invisible drag plane */}
          <DragPlane
            dragStateRef={dragStateRef}
            onDragMove={handleDragMove}
            onDragEnd={handleDragEnd}
          />

          {/* Product (not draggable, always at origin) */}
          <group
            position={[0, 0, 0]}
            onClick={(e: ThreeEvent<MouseEvent>) => {
              e.stopPropagation();
              if (!dragStateRef.current.isDragging) handleSelect('__product__');
            }}
          >
            <ProductBox
              dimensions={productDimensions}
              selected={activeSelectedId === '__product__'}
            />
          </group>

          {/* Mechanisms */}
          {mechanisms.map(obj => (
            <DraggableGroup
              key={obj.id}
              objectId={obj.id}
              position={[(obj.posX ?? 0) * SCALE, (obj.posZ ?? 0) * SCALE, (obj.posY ?? 0) * SCALE]}
              dragState={dragStateRef}
              onDragStart={handleDragStart}
              onClick={(id) => { if (!dragMovedRef.current) handleSelect(id); }}
            >
              <MechanismBox obj={obj} selected={activeSelectedId === obj.id} />
            </DraggableGroup>
          ))}

          {/* Cameras */}
          {cameras.map(obj => (
            <DraggableGroup
              key={obj.id}
              objectId={obj.id}
              position={[(obj.posX ?? 0) * SCALE, (obj.posZ ?? 0) * SCALE, (obj.posY ?? 0) * SCALE]}
              dragState={dragStateRef}
              onDragStart={handleDragStart}
              onClick={(id) => { if (!dragMovedRef.current) handleSelect(id); }}
            >
              <CameraObject obj={obj} selected={activeSelectedId === obj.id} />
            </DraggableGroup>
          ))}

          <MountingLines objects={objects} />
          <CameraController cameraRef={cameraActionRef} dragMode={dragStateRef.current.isDragging} />
        </Suspense>
      </Canvas>

      {/* Selected object info */}
      <SelectedInfoPanel obj={selectedObj} onDeselect={handleDeselect} />

      {/* Drag mode toggle */}
      {onUpdateObject && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10">
          <div className="flex bg-slate-800/90 backdrop-blur-sm rounded-lg border border-slate-600/50 overflow-hidden">
            <button
              onClick={() => setDragMode(false)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs transition-colors ${
                !dragMode
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <MousePointer className="h-3.5 w-3.5" />
              旋转视角
            </button>
            <button
              onClick={() => setDragMode(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs transition-colors ${
                dragMode
                  ? 'bg-orange-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Move className="h-3.5 w-3.5" />
              拖拽移动
            </button>
          </div>
          {dragMode && (
            <button
              onClick={() => setSnapEnabled(!snapEnabled)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs mt-1.5 rounded-lg border backdrop-blur-sm transition-colors ${
                snapEnabled
                  ? 'bg-emerald-600 text-white border-emerald-500/50'
                  : 'bg-slate-800/90 text-slate-400 border-slate-600/50 hover:text-slate-200'
              }`}
            >
              <Magnet className="h-3.5 w-3.5" />
              网格吸附 ({SNAP_GRID}mm)
            </button>
          )}
        </div>
      )}

      {/* View presets */}
      <div className="absolute top-3 right-3 flex flex-col gap-1.5 z-10">
        {VIEW_PRESETS.map((preset) => (
          <Button
            key={preset.label}
            variant="secondary"
            size="sm"
            className="gap-1.5 h-7 text-xs bg-slate-800/80 hover:bg-slate-700/80 border border-slate-600/50 backdrop-blur-sm"
            onClick={() => handleViewPreset(preset.position, preset.target)}
          >
            <span>{preset.icon}</span>
            {preset.label}
          </Button>
        ))}
        <div className="h-px bg-slate-600/50 my-0.5" />
        <Button
          variant="secondary"
          size="sm"
          className="gap-1.5 h-7 text-xs bg-slate-800/80 hover:bg-slate-700/80 border border-slate-600/50 backdrop-blur-sm"
          onClick={() => handleViewPreset([7, 6, 7], [0, 1, 0])}
        >
          <RotateCcw className="h-3 w-3" />
          重置
        </Button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 bg-slate-800/80 backdrop-blur-sm rounded-lg border border-slate-600/50 p-2.5 z-10">
        <div className="text-[10px] font-semibold text-slate-400 mb-1.5">图例</div>
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-slate-300"><span className="w-3 h-3 rounded-sm bg-cyan-500/70" />产品</div>
          <div className="flex items-center gap-2 text-xs text-slate-300"><span className="w-3 h-3 rounded-sm bg-orange-500/70" />机构</div>
          <div className="flex items-center gap-2 text-xs text-slate-300"><span className="w-3 h-3 rounded-sm bg-blue-500/70" />相机</div>
          <div className="flex items-center gap-2 text-xs text-slate-300"><span className="w-3 h-3 rounded-sm bg-green-500/70" />已挂载</div>
          <div className="flex items-center gap-2 text-xs text-slate-300"><span className="w-3 h-3 rounded-sm bg-yellow-400/70" />选中</div>
        </div>
      </div>

      <div className="absolute bottom-3 right-3 text-[10px] text-slate-500 bg-slate-800/60 backdrop-blur-sm rounded px-2 py-1 z-10">
        {dragMode
          ? '🖐 拖拽对象移动 · 点击切换到旋转模式'
          : '🖱 左键旋转 · 右键平移 · 滚轮缩放 · 点击选中'}
      </div>
    </div>
  );
});
