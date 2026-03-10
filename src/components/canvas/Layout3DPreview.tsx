import { memo, useRef, useCallback, Suspense } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Box, Cone, Line, Text, Grid } from '@react-three/drei';
import { Button } from '@/components/ui/button';
import { RotateCcw, Eye } from 'lucide-react';
import type { LayoutObject } from './ObjectPropertyPanel';
import * as THREE from 'three';

interface Layout3DPreviewProps {
  objects: LayoutObject[];
  productDimensions: { length: number; width: number; height: number };
}

// Scale factor: convert mm to Three.js units (1 unit = 100mm)
const SCALE = 0.01;

function MechanismBox({ obj }: { obj: LayoutObject }) {
  const w = (obj.width || 100) * SCALE;
  const h = (obj.height || 100) * SCALE;
  const d = (obj.depth || 80) * SCALE;
  const px = (obj.posX ?? 0) * SCALE;
  const py = (obj.posZ ?? 0) * SCALE; // Z in layout = Y in 3D (up)
  const pz = (obj.posY ?? 0) * SCALE;
  const isMounted = !!obj.mountedToMechanismId;

  return (
    <group position={[px, py + h / 2, pz]}>
      <Box args={[w, h, d]}>
        <meshStandardMaterial
          color={isMounted ? '#16a34a' : '#f97316'}
          transparent
          opacity={0.75}
        />
      </Box>
      <Box args={[w, h, d]}>
        <meshBasicMaterial color={isMounted ? '#16a34a' : '#f97316'} wireframe />
      </Box>
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

function ProductBox({ dimensions }: { dimensions: { length: number; width: number; height: number } }) {
  const w = dimensions.length * SCALE;
  const h = dimensions.height * SCALE;
  const d = dimensions.width * SCALE;

  return (
    <group position={[0, h / 2, 0]}>
      <Box args={[w, h, d]}>
        <meshStandardMaterial color="#06b6d4" transparent opacity={0.5} />
      </Box>
      <Box args={[w, h, d]}>
        <meshBasicMaterial color="#06b6d4" wireframe />
      </Box>
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

function CameraObject({ obj }: { obj: LayoutObject }) {
  const px = (obj.posX ?? 0) * SCALE;
  const py = (obj.posZ ?? 0) * SCALE;
  const pz = (obj.posY ?? 0) * SCALE;
  const isMounted = !!obj.mountedToMechanismId;

  return (
    <group position={[px, py, pz]}>
      {/* Camera body */}
      <Box args={[0.3, 0.25, 0.4]}>
        <meshStandardMaterial color={isMounted ? '#16a34a' : '#3b82f6'} />
      </Box>
      {/* Lens cone pointing down */}
      <group position={[0, -0.25, 0]} rotation={[Math.PI, 0, 0]}>
        <Cone args={[0.15, 0.3, 8]}>
          <meshStandardMaterial color={isMounted ? '#15803d' : '#1d4ed8'} />
        </Cone>
      </group>
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
        const start: [number, number, number] = [
          (obj.posX ?? 0) * SCALE,
          (obj.posZ ?? 0) * SCALE,
          (obj.posY ?? 0) * SCALE,
        ];
        const end: [number, number, number] = [
          (parent.posX ?? 0) * SCALE,
          (parent.posZ ?? 0) * SCALE,
          (parent.posY ?? 0) * SCALE,
        ];
        lines.push({ start, end });
      }
    }
  });

  return (
    <>
      {lines.map((line, i) => (
        <Line
          key={i}
          points={[line.start, line.end]}
          color="#22c55e"
          lineWidth={1.5}
          dashed
          dashSize={0.15}
          gapSize={0.1}
        />
      ))}
    </>
  );
}

function SceneContent({ objects, productDimensions }: Layout3DPreviewProps) {
  const mechanisms = objects.filter(o => o.type === 'mechanism');
  const cameras = objects.filter(o => o.type === 'camera');
  // Product objects exist but we use productDimensions for the main product

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 8, 5]} intensity={0.8} />
      <directionalLight position={[-3, 5, -3]} intensity={0.3} />

      {/* Ground grid */}
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

      {/* Axes helper */}
      <axesHelper args={[3]} />

      {/* Product */}
      <ProductBox dimensions={productDimensions} />

      {/* Mechanisms */}
      {mechanisms.map(obj => (
        <MechanismBox key={obj.id} obj={obj} />
      ))}

      {/* Cameras */}
      {cameras.map(obj => (
        <CameraObject key={obj.id} obj={obj} />
      ))}

      {/* Mounting lines */}
      <MountingLines objects={objects} />

      {/* Orbit controls */}
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.1}
        minDistance={2}
        maxDistance={30}
      />
    </>
  );
}

// View preset camera positions
const VIEW_PRESETS = [
  { label: '正视', icon: '🎯', position: [0, 3, 10] as [number, number, number], target: [0, 1.5, 0] as [number, number, number] },
  { label: '侧视', icon: '📐', position: [10, 3, 0] as [number, number, number], target: [0, 1.5, 0] as [number, number, number] },
  { label: '俯视', icon: '🔍', position: [0, 12, 0.01] as [number, number, number], target: [0, 0, 0] as [number, number, number] },
  { label: '等轴测', icon: '🧊', position: [7, 6, 7] as [number, number, number], target: [0, 1, 0] as [number, number, number] },
] as const;

function CameraController({ cameraRef }: { cameraRef: React.MutableRefObject<{ position: [number, number, number]; target: [number, number, number] } | null> }) {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);

  // Check if we need to update camera
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
    />
  );
}

export const Layout3DPreview = memo(function Layout3DPreview({
  objects,
  productDimensions,
}: Layout3DPreviewProps) {
  const cameraActionRef = useRef<{ position: [number, number, number]; target: [number, number, number] } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleViewPreset = useCallback((position: [number, number, number], target: [number, number, number]) => {
    cameraActionRef.current = { position, target };
    // Force a re-render to apply
    if (canvasRef.current) {
      canvasRef.current.dispatchEvent(new Event('resize'));
    }
  }, []);

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Canvas
        ref={canvasRef}
        camera={{
          position: [7, 6, 7],
          fov: 50,
          near: 0.1,
          far: 100,
        }}
        gl={{ antialias: true, alpha: false }}
        onCreated={({ gl }) => {
          gl.setClearColor('#0f172a');
        }}
      >
        <Suspense fallback={null}>
          {/* Lighting */}
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 8, 5]} intensity={0.8} />
          <directionalLight position={[-3, 5, -3]} intensity={0.3} />

          {/* Ground grid */}
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

          <ProductBox dimensions={productDimensions} />

          {objects.filter(o => o.type === 'mechanism').map(obj => (
            <MechanismBox key={obj.id} obj={obj} />
          ))}

          {objects.filter(o => o.type === 'camera').map(obj => (
            <CameraObject key={obj.id} obj={obj} />
          ))}

          <MountingLines objects={objects} />

          <CameraController cameraRef={cameraActionRef} />
        </Suspense>
      </Canvas>

      {/* View presets overlay */}
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
        </div>
      </div>

      {/* Interaction hint */}
      <div className="absolute bottom-3 right-3 text-[10px] text-slate-500 bg-slate-800/60 backdrop-blur-sm rounded px-2 py-1 z-10">
        🖱 左键旋转 · 右键平移 · 滚轮缩放
      </div>
    </div>
  );
});
