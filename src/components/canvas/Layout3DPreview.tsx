import { memo, useRef, useCallback, useState, Suspense } from 'react';
import { Canvas, useThree, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Box, Cone, Line, Text, Grid } from '@react-three/drei';
import { Button } from '@/components/ui/button';
import { RotateCcw, X } from 'lucide-react';
import type { LayoutObject } from './ObjectPropertyPanel';
import * as THREE from 'three';

interface Layout3DPreviewProps {
  objects: LayoutObject[];
  productDimensions: { length: number; width: number; height: number };
  onSelectObject?: (id: string | null) => void;
  selectedObjectId?: string | null;
}

const SCALE = 0.01;

function MechanismBox({ obj, selected, onSelect }: { obj: LayoutObject; selected: boolean; onSelect: (id: string) => void }) {
  const w = (obj.width || 100) * SCALE;
  const h = (obj.height || 100) * SCALE;
  const d = ((obj as any).depth || 80) * SCALE;
  const px = (obj.posX ?? 0) * SCALE;
  const py = (obj.posZ ?? 0) * SCALE;
  const pz = (obj.posY ?? 0) * SCALE;
  const isMounted = !!obj.mountedToMechanismId;

  const baseColor = isMounted ? '#16a34a' : '#f97316';
  const highlightColor = '#facc15';

  return (
    <group position={[px, py + h / 2, pz]} onClick={(e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); onSelect(obj.id); }}>
      <Box args={[w, h, d]}>
        <meshStandardMaterial
          color={selected ? highlightColor : baseColor}
          transparent
          opacity={selected ? 0.9 : 0.75}
          emissive={selected ? highlightColor : '#000000'}
          emissiveIntensity={selected ? 0.3 : 0}
        />
      </Box>
      <Box args={[w, h, d]}>
        <meshBasicMaterial color={selected ? highlightColor : baseColor} wireframe />
      </Box>
      {selected && (
        <Box args={[w + 0.06, h + 0.06, d + 0.06]}>
          <meshBasicMaterial color={highlightColor} wireframe transparent opacity={0.5} />
        </Box>
      )}
      <Text
        position={[0, h / 2 + 0.15, 0]}
        fontSize={0.18}
        color="#fafafa"
        anchorX="center"
        anchorY="bottom"
      >
        {obj.name || '机构'}
      </Text>
    </group>
  );
}

function ProductBox({ dimensions, selected, onSelect }: { dimensions: { length: number; width: number; height: number }; selected: boolean; onSelect: () => void }) {
  const w = dimensions.length * SCALE;
  const h = dimensions.height * SCALE;
  const d = dimensions.width * SCALE;
  const highlightColor = '#facc15';

  return (
    <group position={[0, h / 2, 0]} onClick={(e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); onSelect(); }}>
      <Box args={[w, h, d]}>
        <meshStandardMaterial
          color={selected ? highlightColor : '#06b6d4'}
          transparent
          opacity={selected ? 0.8 : 0.5}
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
      <Text
        position={[0, h / 2 + 0.15, 0]}
        fontSize={0.18}
        color="#fafafa"
        anchorX="center"
        anchorY="bottom"
      >
        产品
      </Text>
    </group>
  );
}

function CameraObject({ obj, selected, onSelect }: { obj: LayoutObject; selected: boolean; onSelect: (id: string) => void }) {
  const px = (obj.posX ?? 0) * SCALE;
  const py = (obj.posZ ?? 0) * SCALE;
  const pz = (obj.posY ?? 0) * SCALE;
  const isMounted = !!obj.mountedToMechanismId;
  const baseColor = isMounted ? '#16a34a' : '#3b82f6';
  const baseDark = isMounted ? '#15803d' : '#1d4ed8';
  const highlightColor = '#facc15';

  return (
    <group position={[px, py, pz]} onClick={(e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); onSelect(obj.id); }}>
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
    </group>
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

function CameraController({ cameraRef }: { cameraRef: React.MutableRefObject<{ position: [number, number, number]; target: [number, number, number] } | null> }) {
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
    <OrbitControls ref={controlsRef} makeDefault enableDamping dampingFactor={0.1} minDistance={2} maxDistance={30} />
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
}: Layout3DPreviewProps) {
  const cameraActionRef = useRef<{ position: [number, number, number]; target: [number, number, number] } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [localSelectedId, setLocalSelectedId] = useState<string | null>(null);

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

  const selectedObj = activeSelectedId ? objects.find(o => o.id === activeSelectedId) || null : null;

  const mechanisms = objects.filter(o => o.type === 'mechanism');
  const cameras = objects.filter(o => o.type === 'camera');

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Canvas
        ref={canvasRef}
        camera={{ position: [7, 6, 7], fov: 50, near: 0.1, far: 100 }}
        gl={{ antialias: true, alpha: false }}
        onCreated={({ gl }) => { gl.setClearColor('#0f172a'); }}
        onPointerMissed={() => handleSelect(null)}
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

          <ProductBox
            dimensions={productDimensions}
            selected={activeSelectedId === '__product__'}
            onSelect={() => handleSelect('__product__')}
          />

          {mechanisms.map(obj => (
            <MechanismBox key={obj.id} obj={obj} selected={activeSelectedId === obj.id} onSelect={handleSelect} />
          ))}

          {cameras.map(obj => (
            <CameraObject key={obj.id} obj={obj} selected={activeSelectedId === obj.id} onSelect={handleSelect} />
          ))}

          <MountingLines objects={objects} />
          <CameraController cameraRef={cameraActionRef} />
        </Suspense>
      </Canvas>

      {/* Selected object info */}
      <SelectedInfoPanel obj={selectedObj} onDeselect={handleDeselect} />

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
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <span className="w-3 h-3 rounded-sm bg-cyan-500/70" />产品
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <span className="w-3 h-3 rounded-sm bg-orange-500/70" />机构
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <span className="w-3 h-3 rounded-sm bg-blue-500/70" />相机
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <span className="w-3 h-3 rounded-sm bg-green-500/70" />已挂载
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <span className="w-3 h-3 rounded-sm bg-yellow-400/70" />选中
          </div>
        </div>
      </div>

      <div className="absolute bottom-3 right-3 text-[10px] text-slate-500 bg-slate-800/60 backdrop-blur-sm rounded px-2 py-1 z-10">
        🖱 左键旋转 · 右键平移 · 滚轮缩放 · 点击选中
      </div>
    </div>
  );
});
