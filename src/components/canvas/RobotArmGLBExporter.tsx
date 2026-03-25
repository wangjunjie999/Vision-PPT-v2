/**
 * RobotArmGLBExporter
 * Renders the robot arm in a hidden offscreen Canvas, then exports to GLB on demand.
 */
import { useRef, useCallback, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Cylinder, Box, Sphere } from '@react-three/drei';
import { Button } from '@/components/ui/button';
import { Download, Loader2, Upload } from 'lucide-react';
import { exportToGLB, downloadBlob } from '@/utils/glbExporter';
import { uploadGLBFile } from '@/utils/glbUpload';
import { toast } from 'sonner';
import * as THREE from 'three';

interface RobotArmGLBExporterProps {
  w: number;   // width in mm
  h: number;   // height in mm
  d: number;   // depth in mm
  onUploaded?: (url: string) => void;
}

// ---- Material helpers (same as Layout3DPreview) ----
function mechMat(color: string, metalness = 0.5, roughness = 0.4) {
  return { color, metalness, roughness };
}
function rubberMat(color: string) {
  return { color, metalness: 0.05, roughness: 0.95 };
}

// ---- Standalone RobotArm geometry (no selection/xray) ----
function RobotArmGeometry({ w, h, d }: { w: number; h: number; d: number }) {
  const groupRef = useRef<THREE.Group>(null);
  // KUKA-style proportions
  const baseR = Math.min(w, d) * 0.5;
  const baseH = h * 0.18;
  const shoulderH = h * 0.08;
  const arm1L = h * 0.35;
  const arm2L = h * 0.30;
  const arm3L = h * 0.15;
  const jointR = w * 0.13;
  const armW = w * 0.22;
  const armD = w * 0.14;
  const flangeR = w * 0.08;

  const bodyColor = '#f97316';
  const jointColor = '#ff6b00';
  const baseColor = '#64748b';
  const darkAccent = '#1e293b';
  const flangeColor = '#facc15';
  const cableColor = '#1a1a1a';

  const IndustrialJoint = ({ r, thickness }: { r: number; thickness?: number }) => {
    const t = thickness || r * 0.5;
    return (
      <group>
        <Cylinder args={[r * 1.08, r * 1.08, t * 0.15, 20]} position={[0, t * 0.45, 0]}>
          <meshStandardMaterial {...mechMat(darkAccent, 0.7, 0.3)} />
        </Cylinder>
        <Cylinder args={[r * 1.08, r * 1.08, t * 0.15, 20]} position={[0, -t * 0.45, 0]}>
          <meshStandardMaterial {...mechMat(darkAccent, 0.7, 0.3)} />
        </Cylinder>
        <Cylinder args={[r, r, t, 20]}>
          <meshStandardMaterial {...mechMat(jointColor, 0.55, 0.35)} />
        </Cylinder>
      </group>
    );
  };

  return (
    <group ref={groupRef} name="robot-arm-export">
      {/* BASE */}
      <Cylinder args={[baseR * 1.08, baseR * 1.15, h * 0.03, 24]} position={[0, h * 0.015, 0]}>
        <meshStandardMaterial {...mechMat(darkAccent, 0.7, 0.25)} />
      </Cylinder>
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        return (
          <Cylinder key={i} args={[baseR * 0.04, baseR * 0.04, h * 0.015, 6]}
            position={[Math.cos(angle) * baseR * 1.05, h * 0.035, Math.sin(angle) * baseR * 1.05]}>
            <meshStandardMaterial {...mechMat('#94a3b8', 0.8, 0.2)} />
          </Cylinder>
        );
      })}
      <Cylinder args={[baseR, baseR * 1.02, baseH, 24]} position={[0, h * 0.03 + baseH / 2, 0]}>
        <meshStandardMaterial {...mechMat(baseColor, 0.6, 0.35)} />
      </Cylinder>
      <Cylinder args={[baseR * 1.02, baseR * 1.02, h * 0.012, 24]} position={[0, h * 0.03 + baseH, 0]}>
        <meshStandardMaterial {...mechMat(darkAccent, 0.7, 0.3)} />
      </Cylinder>

      {/* SHOULDER TURRET */}
      <Cylinder args={[baseR * 0.55, baseR * 0.62, shoulderH, 20]}
        position={[0, h * 0.03 + baseH + shoulderH / 2, 0]}>
        <meshStandardMaterial {...mechMat(bodyColor, 0.5, 0.4)} />
      </Cylinder>

      {/* SHOULDER JOINT */}
      <group position={[0, h * 0.03 + baseH + shoulderH, 0]}>
        <IndustrialJoint r={jointR} thickness={jointR * 0.55} />
        <Cylinder args={[jointR * 0.35, jointR * 0.35, jointR * 1.6, 12]}
          rotation={[0, 0, Math.PI / 2]} position={[jointR * 0.9, 0, 0]}>
          <meshStandardMaterial {...mechMat(baseColor, 0.65, 0.3)} />
        </Cylinder>
        <Cylinder args={[jointR * 0.35, jointR * 0.35, jointR * 1.6, 12]}
          rotation={[0, 0, Math.PI / 2]} position={[-jointR * 0.9, 0, 0]}>
          <meshStandardMaterial {...mechMat(baseColor, 0.65, 0.3)} />
        </Cylinder>
      </group>

      {/* ARM1 */}
      <group position={[0, h * 0.03 + baseH + shoulderH, 0]} rotation={[0, 0, 0.25]}>
        <Box args={[armW, arm1L, armD]} position={[0, arm1L / 2, 0]}>
          <meshStandardMaterial {...mechMat(bodyColor, 0.5, 0.4)} />
        </Box>
        {[1, -1].map(side => (
          <Box key={side} args={[armW * 0.06, arm1L * 0.85, armD * 1.15]}
            position={[side * armW * 0.53, arm1L * 0.5, 0]}>
            <meshStandardMaterial {...mechMat(bodyColor, 0.45, 0.5)} />
          </Box>
        ))}
        <Cylinder args={[armW * 0.06, armW * 0.06, arm1L * 0.8, 6]}
          position={[armW * 0.4, arm1L * 0.5, -armD * 0.5]}>
          <meshStandardMaterial {...rubberMat(cableColor)} />
        </Cylinder>

        {/* ELBOW */}
        <group position={[0, arm1L, 0]}>
          <IndustrialJoint r={jointR * 0.85} thickness={jointR * 0.5} />
          <Cylinder args={[jointR * 0.3, jointR * 0.3, jointR * 1.3, 12]}
            rotation={[0, 0, Math.PI / 2]} position={[jointR * 0.75, 0, 0]}>
            <meshStandardMaterial {...mechMat(baseColor, 0.65, 0.3)} />
          </Cylinder>
        </group>

        {/* ARM2 */}
        <group position={[0, arm1L, 0]} rotation={[0, 0, -1.0]}>
          <Box args={[armW * 0.85, arm2L, armD * 0.85]} position={[0, arm2L / 2, 0]}>
            <meshStandardMaterial {...mechMat(bodyColor, 0.5, 0.4)} />
          </Box>
          {[1, -1].map(side => (
            <Box key={side} args={[armW * 0.85 * 0.06, arm2L * 0.8, armD * 0.85 * 1.1]}
              position={[side * armW * 0.85 * 0.53, arm2L * 0.5, 0]}>
              <meshStandardMaterial {...mechMat(bodyColor, 0.45, 0.5)} />
            </Box>
          ))}
          <Cylinder args={[armW * 0.05, armW * 0.05, arm2L * 0.75, 6]}
            position={[armW * 0.35, arm2L * 0.5, -armD * 0.4]}>
            <meshStandardMaterial {...rubberMat(cableColor)} />
          </Cylinder>

          {/* WRIST */}
          <group position={[0, arm2L, 0]}>
            <IndustrialJoint r={jointR * 0.65} thickness={jointR * 0.4} />
          </group>

          {/* ARM3 */}
          <group position={[0, arm2L, 0]} rotation={[0, 0, -0.8]}>
            <Cylinder args={[armW * 0.3, armW * 0.25, arm3L, 14]} position={[0, arm3L / 2, 0]}>
              <meshStandardMaterial {...mechMat(bodyColor, 0.5, 0.4)} />
            </Cylinder>
            <Cylinder args={[armW * 0.04, armW * 0.04, arm3L * 0.65, 6]}
              position={[armW * 0.28, arm3L * 0.5, armW * 0.1]}>
              <meshStandardMaterial {...rubberMat('#3f3f46')} />
            </Cylinder>

            {/* END JOINT */}
            <group position={[0, arm3L, 0]}>
              <Cylinder args={[jointR * 0.5, jointR * 0.5, jointR * 0.12, 16]} position={[0, jointR * 0.1, 0]}>
                <meshStandardMaterial {...mechMat(darkAccent, 0.7, 0.3)} />
              </Cylinder>
              <Cylinder args={[jointR * 0.45, jointR * 0.45, jointR * 0.3, 16]}>
                <meshStandardMaterial {...mechMat(jointColor, 0.55, 0.35)} />
              </Cylinder>
            </group>

            {/* FLANGE */}
            <Cylinder args={[jointR * 0.35, jointR * 0.3, h * 0.03, 12]}
              position={[0, arm3L + h * 0.025, 0]}>
              <meshStandardMaterial {...mechMat(darkAccent, 0.6, 0.3)} />
            </Cylinder>
            <Cylinder args={[flangeR, flangeR, h * 0.025, 20]}
              position={[0, arm3L + h * 0.05, 0]}>
              <meshStandardMaterial {...mechMat(flangeColor, 0.5, 0.35)} />
            </Cylinder>
            {Array.from({ length: 6 }).map((_, i) => {
              const angle = (i / 6) * Math.PI * 2;
              return (
                <Cylinder key={i} args={[flangeR * 0.1, flangeR * 0.1, h * 0.01, 6]}
                  position={[Math.cos(angle) * flangeR * 0.72, arm3L + h * 0.065, Math.sin(angle) * flangeR * 0.72]}>
                  <meshStandardMaterial {...mechMat(darkAccent, 0.8, 0.2)} />
                </Cylinder>
              );
            })}
            <Box args={[flangeR * 1.4, h * 0.002, flangeR * 0.025]}
              position={[0, arm3L + h * 0.064, 0]}>
              <meshStandardMaterial color="#dc2626" metalness={0.3} roughness={0.7} />
            </Box>
            <Box args={[flangeR * 0.025, h * 0.002, flangeR * 1.4]}
              position={[0, arm3L + h * 0.064, 0]}>
              <meshStandardMaterial color="#dc2626" metalness={0.3} roughness={0.7} />
            </Box>
          </group>
        </group>
      </group>
    </group>
  );
}

/** Inner component that accesses the Three.js scene */
function ExportTrigger({ onExport }: { onExport: (scene: THREE.Scene) => void }) {
  const { scene } = useThree();

  // Expose scene to parent via callback on mount
  const called = useRef(false);
  if (!called.current) {
    called.current = true;
    // Defer to let geometry mount
    setTimeout(() => onExport(scene), 100);
  }
  return null;
}

export default function RobotArmGLBExporter({ w, h, d, onUploaded }: RobotArmGLBExporterProps) {
  const [exporting, setExporting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const [ready, setReady] = useState(false);

  const handleSceneReady = useCallback((scene: THREE.Scene) => {
    sceneRef.current = scene;
    setReady(true);
  }, []);

  const handleExport = useCallback(async (upload: boolean = false) => {
    const scene = sceneRef.current;
    if (!scene) {
      toast.error('3D 场景未就绪');
      return;
    }

    const group = scene.getObjectByName('robot-arm-export');
    if (!group) {
      toast.error('未找到机械臂模型');
      return;
    }

    try {
      if (upload) setUploading(true);
      else setExporting(true);

      const blob = await exportToGLB(group, 'robot-arm.glb');

      if (upload) {
        const file = new File([blob], `robot-arm-${w}x${h}x${d}.glb`, {
          type: 'application/octet-stream',
        });
        const url = await uploadGLBFile(file, 'mechanisms');
        if (url) {
          toast.success('机械臂模型已上传到存储');
          onUploaded?.(url);
        }
      } else {
        downloadBlob(blob, `robot-arm-${w}x${h}x${d}.glb`);
        toast.success('GLB 文件已下载');
      }
    } catch (err) {
      console.error('GLB export error:', err);
      toast.error('导出失败');
    } finally {
      setExporting(false);
      setUploading(false);
    }
  }, [w, h, d, onUploaded]);

  return (
    <div className="flex flex-col gap-2">
      {/* Hidden offscreen canvas for geometry */}
      <div style={{ width: 1, height: 1, overflow: 'hidden', position: 'absolute', left: -9999 }}>
        <Canvas gl={{ preserveDrawingBuffer: true }}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 5, 5]} intensity={0.8} />
          <RobotArmGeometry w={w} h={h} d={d} />
          <ExportTrigger onExport={handleSceneReady} />
        </Canvas>
      </div>

      {/* Export buttons */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs"
          onClick={() => handleExport(false)}
          disabled={!ready || exporting || uploading}
        >
          {exporting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
          下载 GLB
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs"
          onClick={() => handleExport(true)}
          disabled={!ready || exporting || uploading}
        >
          {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
          上传到存储
        </Button>
      </div>
      <p className="text-[10px] text-muted-foreground font-mono">
        尺寸: {w}×{h}×{d}mm · {ready ? '✓ 就绪' : '⏳ 加载中...'}
      </p>
    </div>
  );
}
