import { useRef, useState, useEffect, Suspense, useImperativeHandle } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment, Center, Html, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  RotateCcw, 
  Eye, 
  ArrowUp, 
  ArrowRight, 
  Maximize2,
  Loader2,
} from 'lucide-react';

interface Product3DViewerProps {
  modelUrl: string | null;
  imageUrls?: string[];
  onReady?: (ref: { takeScreenshot: () => string | null; takeScreenshotBlob: () => Promise<Blob | null> }) => void;
  fillContainer?: boolean;
}

// View presets
const VIEW_PRESETS = {
  isometric: { position: [5, 5, 5] as [number, number, number], name: '等轴测' },
  front: { position: [0, 0, 8] as [number, number, number], name: '正视' },
  side: { position: [8, 0, 0] as [number, number, number], name: '侧视' },
  top: { position: [0, 8, 0] as [number, number, number], name: '俯视' },
};

// Model component
function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  const modelRef = useRef<THREE.Group>(null);

  useEffect(() => {
    if (modelRef.current) {
      // Center and scale the model
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

// Image plane component for displaying images in 3D
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

// Camera controller component
function CameraController({ 
  viewPreset,
  onControlsReady,
}: { 
  viewPreset: keyof typeof VIEW_PRESETS | null;
  onControlsReady?: (controls: any) => void;
}) {
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

  useEffect(() => {
    if (controlsRef.current && onControlsReady) {
      onControlsReady(controlsRef.current);
    }
  }, [onControlsReady]);

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

// Screenshot helper component — keeps renderer refs fresh via useFrame
function ScreenshotHelper({ onReady }: { onReady: (fns: { sync: () => string | null; blob: () => Promise<Blob | null> }) => void }) {
  const glRef = useRef<THREE.WebGLRenderer>(null!);
  const sceneRef = useRef<THREE.Scene>(null!);
  const cameraRef = useRef<THREE.Camera>(null!);
  const { gl, scene, camera } = useThree();

  // Keep refs up-to-date every frame
  useFrame(() => {
    glRef.current = gl;
    sceneRef.current = scene;
    cameraRef.current = camera;
  });

  useEffect(() => {
    const renderOnce = () => {
      const r = glRef.current || gl;
      const s = sceneRef.current || scene;
      const c = cameraRef.current || camera;
      r.render(s, c);
      r.render(s, c);
      return r.domElement;
    };

    onReady({
      sync: () => {
        const canvas = renderOnce();
        return canvas.toDataURL('image/png');
      },
      blob: () => new Promise<Blob | null>((resolve) => {
        const canvas = renderOnce();
        canvas.toBlob((b) => resolve(b), 'image/png');
      }),
    });
  }, [gl, scene, camera, onReady]);

  return null;
}

// Loading fallback
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

export function Product3DViewer({ modelUrl, imageUrls = [], onReady, fillContainer }: Product3DViewerProps) {
  const [viewPreset, setViewPreset] = useState<keyof typeof VIEW_PRESETS | null>('isometric');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const screenshotFnRef = useRef<(() => string | null) | null>(null);

  const hasModel = !!modelUrl;
  const hasImages = imageUrls.length > 0;

  // Expose screenshot function to parent
  useEffect(() => {
    if (!onReady) return;
    if (!hasModel && hasImages) {
      // Image mode: return image URL directly (avoids CORS toDataURL issues)
      onReady({
        takeScreenshot: () => imageUrls[currentImageIndex] || null,
      });
    } else {
      // 3D mode: use screenshotFnRef from ScreenshotHelper
      onReady({
        takeScreenshot: () => {
          if (screenshotFnRef.current) {
            try {
              return screenshotFnRef.current();
            } catch (e) {
              console.warn('3D screenshot failed:', e);
              return null;
            }
          }
          return null;
        },
      });
    }
  }, [onReady, hasModel, hasImages, currentImageIndex, imageUrls]);

  // If only images and no model, show image gallery
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
      {/* View Preset Buttons */}
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

      {/* 3D Canvas */}
      <div className={cn(
        "relative bg-gradient-to-b from-background to-muted overflow-hidden border",
        fillContainer ? "flex-1 min-h-0" : "aspect-video rounded-lg"
      )}>
        <Canvas
          gl={{ preserveDrawingBuffer: true }}
          shadows
          dpr={[1, 2]}
          onCreated={({ gl }) => {
            const canvas = gl.domElement;
            canvas.addEventListener('webglcontextlost', (e) => {
              e.preventDefault();
              console.warn('WebGL context lost, attempting restore...');
            });
            canvas.addEventListener('webglcontextrestored', () => {
              console.log('WebGL context restored');
            });
          }}
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
            {!hasModel && hasImages && (
              <Center>
                {imageUrls.map((url, i) => (
                  <ImagePlane key={i} url={url} index={i} total={imageUrls.length} />
                ))}
              </Center>
            )}
            <Environment preset="studio" />
          </Suspense>

          <ScreenshotHelper onReady={(fn) => { screenshotFnRef.current = fn; }} />
          
          {/* Grid helper */}
          <gridHelper args={[10, 10, '#666', '#444']} />
        </Canvas>

        {/* Controls hint */}
        <div className="absolute bottom-2 right-2 text-[10px] text-muted-foreground bg-background/80 px-2 py-1 rounded">
          鼠标拖拽旋转 | 滚轮缩放 | 空格+拖拽平移
        </div>
      </div>
    </div>
  );
}
