import { useRef, useState, useEffect, useCallback, Suspense, useMemo, type MutableRefObject } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, Center, Html, PerspectiveCamera, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  getSupportedProductModelHint,
  resolveProductViewerDisplayMode,
  isSupportedProductModelSource,
  type ProductViewerDisplayMode,
} from '@/utils/productViewer';
import {
  captureWebGLFrameToDataUrl,
  DEFAULT_CAPTURE_MAX_EDGE,
  MIN_MEANINGFUL_CAPTURE_DATA_URL_LENGTH,
} from '@/utils/webglFrameCapture';
import { Eye, Loader2 } from 'lucide-react';

export interface Product3DViewerHandle {
  takeScreenshot: () => Promise<string | null>;
  canTakeScreenshot: () => boolean;
  getStatus: () => 'ready' | 'loading' | 'unsupported';
}

interface Product3DViewerProps {
  modelUrl: string | null;
  imageUrls?: string[];
  onReady?: (ref: Product3DViewerHandle) => void;
  fillContainer?: boolean;
  preferredDisplayMode?: ProductViewerDisplayMode;
}

const SCENE_BACKGROUND_HEX = '#f3f4f6';
const MODEL_TARGET_SIZE = 4;

const VIEW_PRESETS = {
  isometric: { position: [5, 5, 5] as [number, number, number], name: '等轴测' },
  front: { position: [0, 0, 8] as [number, number, number], name: '正视' },
  side: { position: [8, 0, 0] as [number, number, number], name: '侧视' },
  top: { position: [0, 8, 0] as [number, number, number], name: '俯视' },
};

function Model({ url, onLoaded }: { url: string; onLoaded?: () => void }) {
  const { scene: gltfScene } = useGLTF(url, true, true, (loader) => {
    loader.setCrossOrigin('anonymous');
  });
  const clonedScene = useMemo(() => gltfScene.clone(true), [gltfScene]);
  const modelRef = useRef<THREE.Group>(null);

  useEffect(() => {
    clonedScene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, [clonedScene]);

  useEffect(() => {
    if (!modelRef.current) return;

    const box = new THREE.Box3().setFromObject(modelRef.current);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z, 0.001);
    const scale = MODEL_TARGET_SIZE / maxDim;

    modelRef.current.scale.setScalar(scale);
    modelRef.current.position.set(-center.x * scale, -center.y * scale, -center.z * scale);
    modelRef.current.updateMatrixWorld(true);
    onLoaded?.();
  }, [clonedScene, onLoaded]);

  return (
    <group ref={modelRef}>
      <primitive object={clonedScene} />
    </group>
  );
}

function ImagePlane({ url, index, total }: { url: string; index: number; total: number }) {
  const [map, setMap] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');
    let cancelled = false;
    let current: THREE.Texture | null = null;
    loader.load(
      url,
      (tex) => {
        if (cancelled) {
          tex.dispose();
          return;
        }
        current = tex;
        setMap(tex);
      },
      undefined,
      () => {
        if (!cancelled) setMap(null);
      }
    );
    return () => {
      cancelled = true;
      current?.dispose();
      setMap(null);
    };
  }, [url]);

  const angle = (index / total) * Math.PI * 2;
  const radius = 3;

  if (!map) return null;

  return (
    <mesh
      position={[Math.cos(angle) * radius, 0, Math.sin(angle) * radius]}
      rotation={[0, -angle - Math.PI / 2, 0]}
    >
      <planeGeometry args={[3, 2]} />
      <meshBasicMaterial map={map} side={THREE.DoubleSide} />
    </mesh>
  );
}

function CameraController({
  viewPreset,
  controlsRef,
}: {
  viewPreset: keyof typeof VIEW_PRESETS | null;
  controlsRef: MutableRefObject<any>;
}) {
  const { camera } = useThree();
  const [spaceHeld, setSpaceHeld] = useState(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => { if (e.code === 'Space') { e.preventDefault(); setSpaceHeld(true); } };
    const onKeyUp = (e: KeyboardEvent) => { if (e.code === 'Space') setSpaceHeld(false); };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  useEffect(() => {
    if (viewPreset && controlsRef.current) {
      const preset = VIEW_PRESETS[viewPreset];
      camera.position.set(...preset.position);
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  }, [viewPreset, camera, controlsRef]);

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

function ScreenshotHelper({
  onReady,
  controlsRef,
}: {
  onReady: (fn: () => Promise<string | null>) => void;
  controlsRef: MutableRefObject<any>;
}) {
  const { gl, scene, camera } = useThree();

  useEffect(() => {
    onReady(async () => {
      for (let attempt = 0; attempt < 6; attempt += 1) {
        const dataUrl = captureWebGLFrameToDataUrl(gl, scene, camera, {
          maxEdge: DEFAULT_CAPTURE_MAX_EDGE,
          beforeRender: () => {
            controlsRef.current?.update?.();
          },
        });

        if (dataUrl && dataUrl.length > MIN_MEANINGFUL_CAPTURE_DATA_URL_LENGTH) {
          return dataUrl;
        }
      }

      console.warn('Screenshot capture did not produce a usable PNG data URL.');
      return null;
    });
  }, [gl, scene, camera, onReady, controlsRef]);

  return null;
}

function RenderReadyTracker({
  enabled,
  onSettled,
}: {
  enabled: boolean;
  onSettled: () => void;
}) {
  const frameCountRef = useRef(0);
  const notifiedRef = useRef(false);

  useEffect(() => {
    frameCountRef.current = 0;
    notifiedRef.current = false;
  }, [enabled]);

  useFrame(() => {
    if (!enabled || notifiedRef.current) return;

    frameCountRef.current += 1;
    if (frameCountRef.current >= 3) {
      notifiedRef.current = true;
      onSettled();
    }
  });

  return null;
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

type CanvasInnerProps = {
  viewPreset: keyof typeof VIEW_PRESETS | null;
  isModelMode: boolean;
  hasSupportedModel: boolean;
  modelUrl: string | null;
  hasModel: boolean;
  hasImages: boolean;
  imageUrls: string[];
  modelMounted: boolean;
  setModelMounted: (v: boolean) => void;
  setModelLoaded: () => void;
  registerScreenshot: (fn: () => Promise<string | null>) => void;
};

function ProductViewerCanvasInner({
  viewPreset,
  isModelMode,
  hasSupportedModel,
  modelUrl,
  hasModel,
  hasImages,
  imageUrls,
  modelMounted,
  setModelMounted,
  setModelLoaded,
  registerScreenshot,
}: CanvasInnerProps) {
  const controlsRef = useRef<any>(null);

  return (
    <>
      <PerspectiveCamera makeDefault position={[5, 5, 5]} fov={50} />
      <CameraController viewPreset={viewPreset} controlsRef={controlsRef} />

      <ambientLight intensity={0.8} />
      <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
      <directionalLight position={[-10, 10, -5]} intensity={0.5} />
      <directionalLight position={[0, -8, 0]} intensity={0.3} />
      <directionalLight position={[0, 2, 10]} intensity={0.4} />
      <directionalLight position={[0, 2, -10]} intensity={0.3} />

      <Suspense fallback={<LoadingFallback />}>
        {isModelMode && hasSupportedModel && modelUrl && (
          <Model
            url={modelUrl}
            onLoaded={() => setModelMounted(true)}
          />
        )}
        {!hasModel && hasImages && (
          <Center>
            {imageUrls.map((url, i) => (
              <ImagePlane key={i} url={url} index={i} total={imageUrls.length} />
            ))}
          </Center>
        )}
        <Environment preset="studio" />
      </Suspense>

      <RenderReadyTracker
        enabled={isModelMode && hasSupportedModel && modelMounted}
        onSettled={setModelLoaded}
      />

      <ScreenshotHelper onReady={registerScreenshot} controlsRef={controlsRef} />

      <gridHelper args={[10, 10, '#666', '#444']} />
    </>
  );
}

export function Product3DViewer({
  modelUrl,
  imageUrls = [],
  onReady,
  fillContainer,
  preferredDisplayMode = 'auto',
}: Product3DViewerProps) {
  const [viewPreset, setViewPreset] = useState<keyof typeof VIEW_PRESETS | null>('isometric');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const screenshotFnRef = useRef<(() => Promise<string | null>) | null>(null);
  const [modelMounted, setModelMounted] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const hasModel = !!modelUrl;
  const hasImages = imageUrls.length > 0;
  const hasSupportedModel = !!modelUrl && isSupportedProductModelSource(modelUrl);
  const displayMode = resolveProductViewerDisplayMode(preferredDisplayMode, modelUrl, imageUrls);
  const isImageMode = displayMode === 'image';
  const isModelMode = displayMode === 'model';
  const canCapture3D = hasSupportedModel && modelLoaded && !!screenshotFnRef.current;

  const registerScreenshot = useCallback((fn: () => Promise<string | null>) => {
    screenshotFnRef.current = fn;
  }, []);

  const markModelLoaded = useCallback(() => {
    setModelLoaded(true);
  }, []);

  useEffect(() => {
    setModelMounted(false);
    setModelLoaded(false);
  }, [modelUrl]);

  useEffect(() => {
    setImageLoaded(false);
  }, [currentImageIndex, imageUrls]);

  useEffect(() => {
    if (!onReady) return;
    onReady({
      takeScreenshot: async () => {
        if (isImageMode) {
          return imageLoaded ? imageUrls[currentImageIndex] || null : null;
        }

        if (!canCapture3D || !screenshotFnRef.current) {
          return null;
        }

        try {
          return await screenshotFnRef.current();
        } catch (e) {
          console.warn('3D screenshot failed:', e);
          return null;
        }
      },
      canTakeScreenshot: () => {
        if (isImageMode) {
          return imageLoaded && !!imageUrls[currentImageIndex];
        }
        return canCapture3D;
      },
      getStatus: () => {
        if (isImageMode) {
          return imageLoaded ? 'ready' : 'loading';
        }

        if (hasModel && !hasSupportedModel) {
          return 'unsupported';
        }

        return canCapture3D ? 'ready' : 'loading';
      },
    });
  }, [
    onReady,
    hasModel,
    hasSupportedModel,
    isImageMode,
    imageLoaded,
    currentImageIndex,
    imageUrls,
    canCapture3D,
  ]);

  if (isImageMode) {
    return (
      <div className={fillContainer ? 'h-full w-full flex items-center justify-center bg-muted' : 'space-y-2'}>
        <div className={cn(
          'relative overflow-hidden',
          fillContainer ? 'h-full w-full flex items-center justify-center' : 'aspect-video bg-muted rounded-lg'
        )}>
          <img
            src={imageUrls[currentImageIndex]}
            alt={`产品图片 ${currentImageIndex + 1}`}
            className={fillContainer ? 'max-w-full max-h-full object-contain' : 'w-full h-full object-contain'}
            onLoad={() => setImageLoaded(true)}
          />
          {imageUrls.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
              {imageUrls.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentImageIndex(i)}
                  className={cn(
                    'w-2.5 h-2.5 rounded-full transition-colors',
                    i === currentImageIndex ? 'bg-primary' : 'bg-primary/30'
                  )}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!isImageMode && hasModel && !hasSupportedModel) {
    return (
      <div className={fillContainer ? 'h-full w-full flex items-center justify-center bg-muted' : 'rounded-lg border bg-muted p-6'}>
        <div className="text-center text-muted-foreground space-y-2">
          <Eye className="h-8 w-8 mx-auto opacity-50" />
          <p className="text-sm">{getSupportedProductModelHint()}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={fillContainer ? 'h-full w-full flex flex-col' : 'space-y-2'}>
      <div className={cn('flex gap-1 justify-center', fillContainer ? 'py-2 shrink-0' : '')}>
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

      <div
        className={cn(
          'relative bg-gradient-to-b from-background to-muted overflow-hidden border',
          fillContainer ? 'flex-1 min-h-0' : 'aspect-video rounded-lg'
        )}
      >
        <Canvas
          gl={{ antialias: true, alpha: false, preserveDrawingBuffer: true }}
          shadows
          dpr={Math.min(window.devicePixelRatio || 1, 2)}
          onCreated={({ gl, scene }) => {
            gl.setClearColor(SCENE_BACKGROUND_HEX, 1);
            scene.background = new THREE.Color(SCENE_BACKGROUND_HEX);
          }}
        >
          <ProductViewerCanvasInner
            viewPreset={viewPreset}
            isModelMode={isModelMode}
            hasSupportedModel={hasSupportedModel}
            modelUrl={modelUrl}
            hasModel={hasModel}
            hasImages={hasImages}
            imageUrls={imageUrls}
            modelMounted={modelMounted}
            setModelMounted={setModelMounted}
            setModelLoaded={markModelLoaded}
            registerScreenshot={registerScreenshot}
          />
        </Canvas>

        <div
          data-capture-ignore="true"
          className="absolute bottom-2 right-2 text-[10px] text-muted-foreground bg-background/80 px-2 py-1 rounded"
        >
          鼠标拖拽旋转 | 滚轮缩放 | 空格+拖拽平移
        </div>
      </div>
    </div>
  );
}
