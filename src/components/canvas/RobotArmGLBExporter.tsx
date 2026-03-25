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
  const baseR = Math.min(w, d) * 0.5;
  const jointR = w * 0.12;
  const armR = w * 0.08;
  const arm1L = h * 0.30;
  const arm2L = h * 0.25;
  const arm3L = h * 0.18;
  const waistH = h * 0.12;
  const ribCount = 6;
  const boltCount = 6;
  const flangeR = w * 0.09;
  const flangeBoltCount = 8;

  const bodyColor = '#f97316';
  const jointColor = '#ff6b00';
  const baseColor = '#e2e8f0';
  const darkAccent = '#1e293b';
  const flangeColor = '#facc15';
  const motorColor = '#64748b';
  const scaleRingColor = '#94a3b8';
  const ventColor = '#0f172a';
  const cableColors = ['#1a1a1a', '#292524', '#44403c'];
  const clipColor = '#a8a29e';

  const BoltRing = ({ radius, y, count, size }: { radius: number; y: number; count: number; size: number }) => (
    <>
      {Array.from({ length: count }).map((_, i) => {
        const angle = (i / count) * Math.PI * 2;
        return (
          <Cylinder key={i} args={[size, size, size * 2, 6]}
            position={[Math.cos(angle) * radius, y, Math.sin(angle) * radius]}>
            <meshStandardMaterial {...mechMat(darkAccent, 0.8, 0.2)} />
          </Cylinder>
        );
      })}
    </>
  );

  const MotorHousing = ({ r, length }: { r: number; length: number }) => (
    <group>
      <Cylinder args={[r, r, length, 12]} rotation={[0, 0, Math.PI / 2]} position={[length / 2, 0, 0]}>
        <meshStandardMaterial {...mechMat(motorColor, 0.7, 0.25)} />
      </Cylinder>
      <Cylinder args={[r, r, length, 12]} rotation={[0, 0, Math.PI / 2]} position={[-length / 2, 0, 0]}>
        <meshStandardMaterial {...mechMat(motorColor, 0.7, 0.25)} />
      </Cylinder>
    </group>
  );

  const JointAssembly = ({ r, motorR, motorL }: { r: number; motorR: number; motorL: number }) => (
    <group>
      <Cylinder args={[r * 1.05, r * 1.05, r * 0.15, 16]} position={[0, r * 0.25, 0]}>
        <meshStandardMaterial {...mechMat(darkAccent, 0.7, 0.3)} />
      </Cylinder>
      <Cylinder args={[r * 1.05, r * 1.05, r * 0.15, 16]} position={[0, -r * 0.25, 0]}>
        <meshStandardMaterial {...mechMat(darkAccent, 0.7, 0.3)} />
      </Cylinder>
      <Sphere args={[r, 16, 16]}>
        <meshStandardMaterial {...mechMat(jointColor, 0.5, 0.4)} />
      </Sphere>
      <MotorHousing r={motorR} length={motorL} />
      <Cylinder args={[r * 1.15, r * 1.15, r * 0.08, 20]}>
        <meshStandardMaterial {...mechMat(scaleRingColor, 0.4, 0.5)} />
      </Cylinder>
      <Cylinder args={[r * 0.3, r * 0.3, r * 0.15, 8]}
        rotation={[Math.PI / 2, 0, 0]} position={[r * 1.3, 0, 0]}>
        <meshStandardMaterial {...mechMat(clipColor, 0.3, 0.6)} />
      </Cylinder>
    </group>
  );

  return (
    <group ref={groupRef} name="robot-arm-export">
      {/* BASE */}
      <Cylinder args={[baseR * 1.05, baseR * 1.15, h * 0.04, 24]} position={[0, h * 0.02, 0]}>
        <meshStandardMaterial {...mechMat(baseColor, 0.7, 0.25)} />
      </Cylinder>
      <BoltRing radius={baseR * 1.0} y={h * 0.045} count={boltCount} size={baseR * 0.06} />
      <Cylinder args={[baseR, baseR * 1.05, h * 0.05, 24]} position={[0, h * 0.065, 0]}>
        <meshStandardMaterial {...mechMat(baseColor, 0.7, 0.25)} />
      </Cylinder>
      <Box args={[baseR * 0.6, h * 0.035, baseR * 0.04]} position={[0, h * 0.065, baseR * 0.95]}>
        <meshStandardMaterial {...mechMat(darkAccent, 0.3, 0.7)} />
      </Box>
      {Array.from({ length: ribCount }).map((_, i) => {
        const angle = (i / ribCount) * Math.PI * 2;
        return (
          <Box key={i} args={[baseR * 0.08, h * 0.04, baseR * 0.5]}
            position={[Math.cos(angle) * baseR * 0.75, h * 0.065, Math.sin(angle) * baseR * 0.75]}
            rotation={[0, -angle, 0]}>
            <meshStandardMaterial {...mechMat(darkAccent, 0.7, 0.3)} />
          </Box>
        );
      })}

      {/* WAIST */}
      <Cylinder args={[baseR * 0.6, baseR * 0.65, waistH, 20]} position={[0, h * 0.09 + waistH / 2, 0]}>
        <meshStandardMaterial {...mechMat(darkAccent, 0.6, 0.35)} />
      </Cylinder>
      <Cylinder args={[baseR * 0.67, baseR * 0.67, waistH * 0.06, 20]}
        position={[0, h * 0.09 + waistH * 0.85, 0]}>
        <meshStandardMaterial {...mechMat(scaleRingColor, 0.4, 0.5)} />
      </Cylinder>

      {/* SHOULDER */}
      <group position={[0, h * 0.09 + waistH, 0]}>
        <JointAssembly r={jointR} motorR={jointR * 0.35} motorL={jointR * 1.8} />
      </group>

      {/* ARM1 */}
      <group position={[0, h * 0.09 + waistH, 0]} rotation={[0, 0, 0.5]}>
        <Cylinder args={[armR * 1.1, armR * 0.95, arm1L, 14]} position={[0, arm1L / 2, 0]}>
          <meshStandardMaterial {...mechMat(bodyColor, 0.5, 0.4)} />
        </Cylinder>
        {[1, -1].map(side => (
          <Box key={side} args={[armR * 0.12, arm1L * 0.7, armR * 1.8]}
            position={[side * armR * 1.05, arm1L * 0.5, 0]}>
            <meshStandardMaterial {...mechMat(bodyColor, 0.5, 0.45)} />
          </Box>
        ))}
        {Array.from({ length: 4 }).map((_, i) => {
          const yOff = arm1L * 0.2 + (i / 3) * arm1L * 0.6;
          return (
            <Box key={i} args={[armR * 2.2, arm1L * 0.015, armR * 0.4]}
              position={[0, yOff, armR * 0.95]}>
              <meshStandardMaterial {...mechMat(ventColor, 0.3, 0.7)} />
            </Box>
          );
        })}
        <group position={[armR * 1.4, 0, 0]}>
          {cableColors.map((color, i) => {
            const r = armR * (0.12 - i * 0.02);
            const zOff = (i - 1) * armR * 0.25;
            return (
              <Cylinder key={i} args={[r, r, arm1L * 0.85, 6]}
                position={[0, arm1L / 2, zOff]}>
                <meshStandardMaterial {...rubberMat(color)} />
              </Cylinder>
            );
          })}
        </group>

        {/* ELBOW */}
        <group position={[0, arm1L, 0]}>
          <JointAssembly r={jointR * 0.85} motorR={jointR * 0.3} motorL={jointR * 1.5} />
        </group>

        {/* ARM2 */}
        <group position={[0, arm1L, 0]} rotation={[0, 0, -1.2]}>
          <Cylinder args={[armR * 0.95, armR * 0.8, arm2L, 14]} position={[0, arm2L / 2, 0]}>
            <meshStandardMaterial {...mechMat(bodyColor, 0.5, 0.4)} />
          </Cylinder>
          {[1, -1].map(side => (
            <Box key={side} args={[armR * 0.9 * 0.12, arm2L * 0.7, armR * 0.9 * 1.8]}
              position={[side * armR * 0.9 * 1.05, arm2L * 0.5, 0]}>
              <meshStandardMaterial {...mechMat(bodyColor, 0.5, 0.45)} />
            </Box>
          ))}
          <group position={[armR * 1.2, 0, 0]}>
            {cableColors.map((color, i) => {
              const r = armR * (0.12 - i * 0.02);
              const zOff = (i - 1) * armR * 0.25;
              return (
                <Cylinder key={i} args={[r, r, arm2L * 0.85, 6]}
                  position={[0, arm2L / 2, zOff]}>
                  <meshStandardMaterial {...rubberMat(color)} />
                </Cylinder>
              );
            })}
          </group>

          {/* WRIST */}
          <group position={[0, arm2L, 0]}>
            <JointAssembly r={jointR * 0.7} motorR={jointR * 0.22} motorL={jointR * 1.2} />
          </group>

          {/* ARM3 */}
          <group position={[0, arm2L, 0]} rotation={[0, 0, -0.6]}>
            <Cylinder args={[armR * 0.8, armR * 0.65, arm3L, 12]} position={[0, arm3L / 2, 0]}>
              <meshStandardMaterial {...mechMat(bodyColor, 0.5, 0.4)} />
            </Cylinder>
            <Cylinder args={[armR * 0.06, armR * 0.06, arm3L * 0.6, 6]}
              position={[armR * 0.9, arm3L * 0.5, armR * 0.4]}>
              <meshStandardMaterial {...rubberMat('#3f3f46')} />
            </Cylinder>
            <Cylinder args={[armR * 0.05, armR * 0.05, arm3L * 0.5, 6]}
              position={[-armR * 0.7, arm3L * 0.5, armR * 0.3]}>
              <meshStandardMaterial {...rubberMat('#1c1917')} />
            </Cylinder>

            {/* END JOINT */}
            <group position={[0, arm3L, 0]}>
              <Cylinder args={[jointR * 0.55, jointR * 0.55, jointR * 0.1, 14]} position={[0, jointR * 0.15, 0]}>
                <meshStandardMaterial {...mechMat(darkAccent, 0.7, 0.3)} />
              </Cylinder>
              <Cylinder args={[jointR * 0.55, jointR * 0.55, jointR * 0.1, 14]} position={[0, -jointR * 0.15, 0]}>
                <meshStandardMaterial {...mechMat(darkAccent, 0.7, 0.3)} />
              </Cylinder>
              <Sphere args={[jointR * 0.5, 12, 12]}>
                <meshStandardMaterial {...mechMat(jointColor, 0.65, 0.25)} />
              </Sphere>
            </group>

            {/* FLANGE */}
            <Cylinder args={[jointR * 0.4, jointR * 0.35, h * 0.04, 12]}
              position={[0, arm3L + h * 0.03, 0]}>
              <meshStandardMaterial {...mechMat(darkAccent, 0.6, 0.3)} />
            </Cylinder>
            {[0, Math.PI].map((angle, i) => (
              <Cylinder key={i} args={[jointR * 0.06, jointR * 0.06, h * 0.02, 6]}
                position={[Math.cos(angle) * jointR * 0.3, arm3L + h * 0.055, Math.sin(angle) * jointR * 0.3]}>
                <meshStandardMaterial {...mechMat(baseColor, 0.8, 0.2)} />
              </Cylinder>
            ))}
            <Cylinder args={[flangeR, flangeR, h * 0.03, 20]}
              position={[0, arm3L + h * 0.06, 0]}>
              <meshStandardMaterial {...mechMat(flangeColor, 0.5, 0.35)} />
            </Cylinder>
            <BoltRing radius={flangeR * 0.75} y={arm3L + h * 0.078} count={flangeBoltCount} size={flangeR * 0.08} />
            <Box args={[flangeR * 1.6, h * 0.002, flangeR * 0.03]}
              position={[0, arm3L + h * 0.077, 0]}>
              <meshStandardMaterial color="#dc2626" metalness={0.3} roughness={0.7} />
            </Box>
            <Box args={[flangeR * 0.03, h * 0.002, flangeR * 1.6]}
              position={[0, arm3L + h * 0.077, 0]}>
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
