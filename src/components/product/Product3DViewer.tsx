import { useState, useEffect, Suspense } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment, PerspectiveCamera, Html } from '@react-three/drei';
import * as THREE from 'three';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface Product3DViewerProps {
  modelUrl: string | null;
  imageUrls?: string[];
  fillContainer?: boolean;
}

const VIEW_PRESETS = {
  isometric: { position: [5, 5, 5] as [number, number, number], name: '等轴测' },
  front: { position: [0, 0, 8] as [number, number, number], name: '正视' },
  side: { position: [8, 0, 0] as [number, number, number], name: '侧视' },
  top: { position: [0, 8, 0] as [number, number, number], name: '俯视' },
};

function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  const modelRef = useRef<THREE.Group>(null);

  useEffect(() => {
    if (modelRef.current) {
      const box = new THREE.Box3().setFromObject(modelRef.current);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 4 / maxDim;
      modelRef.current.scale.setScalar(scale);
      modelRef.current.position.copy(center).multiplyScalar(-scale);
    }
  }, [scene]);

  return (
    <group ref={modelRef}>
      <primitive object={scene.clone()} />
    </group>
  );
}

function ImagePlane({ url, index, total }: { url: string; index: number; total: number }) {
  const texture = new THREE.TextureLoader().load(url);
  const angle = (index / total) * Math.PI * 2;
  const radius = 3;
  return (
    <mesh
      position={[Math.cos(angle) * radius, 0, Math.sin(angle) * radius]}
      rotation={[0, -angle - Math.PI / 2, 0]}
    >
      <planeGeometry args={[3, 2]} />
      <meshBasicMaterial map={texture} side={THREE.DoubleSide} />
    </mesh>
  );
}

function CameraController({ viewPreset }: { viewPreset: keyof typeof VIEW_PRESETS | null }) {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  const [spaceHeld, setSpaceHeld] = useState(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => { if (e.code === 'Space') { e.preventDefault(); setSpaceHeld(true); } };
    const onKeyUp = (e: KeyboardEvent) => { if (e.code === 'Space') setSpaceHeld(false); };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => { window.removeEventListener('keydown', onKeyDown); window.removeEventListener('keyup', onKeyUp); };
  }, []);

  useEffect(() => {
    if (viewPreset && controlsRef.current) {
      const preset = VIEW_PRESETS[viewPreset];
      camera.position.set(...preset.position);
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  }, [viewPreset, camera]);

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.1}
      minDistance={2}
      maxDistance={20}
      mouseButtons={{
        LEFT: spaceHeld ? THREE.MOUSE.PAN : THREE.MOUSE.ROTATE,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: undefined as any,
      }}
    />
  );
}

function LoadingFallback() {
  return (
    <Html center>
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm">加载模型中...</span>
      </div>
    </Html>
  );
}

import { useRef } from 'react';

export function Product3DViewer({ modelUrl, imageUrls = [], fillContainer }: Product3DViewerProps) {
  const [viewPreset, setViewPreset] = useState<keyof typeof VIEW_PRESETS | null>('isometric');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const hasModel = !!modelUrl;
  const hasImages = imageUrls.length > 0;

  // Image-only mode
  if (!hasModel && hasImages) {
    return (
      <div className={fillContainer ? "h-full w-full flex items-center justify-center bg-muted" : "space-y-2"}>
        <div className={cn(
          "relative overflow-hidden",
          fillContainer ? "h-full w-full flex items-center justify-center" : "aspect-video bg-muted rounded-lg"
        )}>
          <img
            src={imageUrls[currentImageIndex]}
            alt={`产品图片 ${currentImageIndex + 1}`}
            className={fillContainer ? "max-w-full max-h-full object-contain" : "w-full h-full object-contain"}
          />
          {imageUrls.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
              {imageUrls.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentImageIndex(i)}
                  className={cn(
                    "w-2.5 h-2.5 rounded-full transition-colors",
                    i === currentImageIndex ? "bg-primary" : "bg-primary/30"
                  )}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={fillContainer ? "h-full w-full flex flex-col" : "space-y-2"}>
      <div className={cn("flex gap-1 justify-center", fillContainer ? "py-2 shrink-0" : "")}>
        {(Object.keys(VIEW_PRESETS) as (keyof typeof VIEW_PRESETS)[]).map((key) => (
          <Button
            key={key}
            variant={viewPreset === key ? 'default' : 'outline'}
            size="sm"
            className="text-xs h-7 px-2"
            onClick={() => setViewPreset(key)}
          >
            {VIEW_PRESETS[key].name}
          </Button>
        ))}
      </div>

      <div className={cn(
        "relative bg-gradient-to-b from-background to-muted overflow-hidden border",
        fillContainer ? "flex-1 min-h-0" : "aspect-video rounded-lg"
      )}>
        <Canvas
          gl={{ preserveDrawingBuffer: true }}
          shadows
          dpr={[1, 2]}
        >
          <PerspectiveCamera makeDefault position={[5, 5, 5]} fov={50} />
          <CameraController viewPreset={viewPreset} />

          <ambientLight intensity={0.8} />
          <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
          <directionalLight position={[-10, 10, -5]} intensity={0.5} />
          <directionalLight position={[0, -8, 0]} intensity={0.3} />
          <directionalLight position={[0, 2, 10]} intensity={0.4} />
          <directionalLight position={[0, 2, -10]} intensity={0.3} />

          <Suspense fallback={<LoadingFallback />}>
            {hasModel && <Model url={modelUrl} />}
            <Environment preset="studio" />
          </Suspense>

          <gridHelper args={[10, 10, '#666', '#444']} />
        </Canvas>

        <div className="absolute bottom-2 right-2 text-[10px] text-muted-foreground bg-background/80 px-2 py-1 rounded">
          鼠标拖拽旋转 | 滚轮缩放 | 空格+拖拽平移
        </div>
      </div>
    </div>
  );
}
