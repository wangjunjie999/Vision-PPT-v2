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
  // KUKA KR series high-fidelity 6-axis industrial robot arm
  const baseR = Math.min(w, d) * 0.48;
  const baseFlangeH = h * 0.04;
  const baseTowerH = h * 0.18;
  const shoulderShellH = h * 0.14;
  const arm1L = h * 0.32;
  const arm2L = h * 0.28;
  const wristTotalL = h * 0.12;
  const jointR = w * 0.14;
  const armW = w * 0.24;
  const armD = w * 0.16;
  const flangeR = w * 0.09;

  const bodyColor = '#f97316';
  const jointColor = '#ff6b00';
  const baseColor = '#64748b';
  const darkAccent = '#1e293b';
  const flangeColor = '#facc15';
  const cableColor = '#1a1a1a';
  const labelColor = '#fef3c7';

  const SealRing = ({ r, y }: { r: number; y?: number }) => (
    <Cylinder args={[r * 1.06, r * 1.06, r * 0.06, 24]} position={[0, y || 0, 0]}>
      <meshStandardMaterial {...mechMat(darkAccent, 0.7, 0.2)} />
    </Cylinder>
  );

  const IndustrialJoint = ({ r, thickness, showMotor }: { r: number; thickness?: number; showMotor?: boolean }) => {
    const t = thickness || r * 0.5;
    return (
      <group>
        <Cylinder args={[r * 1.12, r * 1.12, t * 0.12, 24]} position={[0, t * 0.48, 0]}>
          <meshStandardMaterial {...mechMat(darkAccent, 0.7, 0.25)} />
        </Cylinder>
        <Cylinder args={[r * 1.12, r * 1.12, t * 0.12, 24]} position={[0, -t * 0.48, 0]}>
          <meshStandardMaterial {...mechMat(darkAccent, 0.7, 0.25)} />
        </Cylinder>
        <Cylinder args={[r, r, t, 24]}>
          <meshStandardMaterial {...mechMat(jointColor, 0.55, 0.35)} />
        </Cylinder>
        <Cylinder args={[r * 0.35, r * 0.35, t * 0.6, 16]}>
          <meshStandardMaterial {...mechMat(darkAccent, 0.6, 0.3)} />
        </Cylinder>
        {showMotor !== false && (
          <>
            <Cylinder args={[jointR * 0.38, jointR * 0.38, jointR * 1.8, 14]}
              rotation={[0, 0, Math.PI / 2]} position={[jointR * 1.0, 0, 0]}>
              <meshStandardMaterial {...mechMat(baseColor, 0.65, 0.3)} />
            </Cylinder>
            <Cylinder args={[jointR * 0.42, jointR * 0.42, jointR * 0.15, 14]}
              rotation={[0, 0, Math.PI / 2]} position={[jointR * 1.9, 0, 0]}>
              <meshStandardMaterial {...mechMat(darkAccent, 0.7, 0.25)} />
            </Cylinder>
          </>
        )}
      </group>
    );
  };

  const shoulderTop = h * 0.04 + baseTowerH + shoulderShellH;
  const shellW = baseR * 1.3;
  const shellD = baseR * 0.9;

  const j4L = wristTotalL * 0.4;
  const j5L = wristTotalL * 0.3;
  const j6L = wristTotalL * 0.3;
  const wristR = armW * 0.22;

  return (
    <group ref={groupRef} name="robot-arm-export">
      {/* BASE FLANGE */}
      <Cylinder args={[baseR * 1.1, baseR * 1.15, baseFlangeH, 28]} position={[0, baseFlangeH / 2, 0]}>
        <meshStandardMaterial {...mechMat(darkAccent, 0.7, 0.25)} />
      </Cylinder>
      {Array.from({ length: 10 }).map((_, i) => {
        const angle = (i / 10) * Math.PI * 2;
        return (
          <Cylinder key={`bb-${i}`} args={[baseR * 0.04, baseR * 0.04, baseFlangeH * 0.5, 6]}
            position={[Math.cos(angle) * baseR * 1.08, baseFlangeH * 0.8, Math.sin(angle) * baseR * 1.08]}>
            <meshStandardMaterial {...mechMat('#94a3b8', 0.8, 0.2)} />
          </Cylinder>
        );
      })}

      {/* BASE TOWER */}
      <Cylinder args={[baseR * 0.95, baseR, baseTowerH, 28]} position={[0, baseFlangeH + baseTowerH / 2, 0]}>
        <meshStandardMaterial {...mechMat(baseColor, 0.6, 0.35)} />
      </Cylinder>
      <Cylinder args={[baseR * 1.02, baseR * 1.02, h * 0.01, 28]} position={[0, baseFlangeH + baseTowerH * 0.3, 0]}>
        <meshStandardMaterial {...mechMat(darkAccent, 0.7, 0.3)} />
      </Cylinder>
      <SealRing r={baseR * 0.98} y={baseFlangeH + baseTowerH} />

      {/* SHOULDER HOUSING */}
      <group position={[0, h * 0.04 + baseTowerH + shoulderShellH / 2, 0]}>
        <Box args={[shellW, shoulderShellH, shellD]}>
          <meshStandardMaterial {...mechMat(bodyColor, 0.5, 0.4)} />
        </Box>
        <Cylinder args={[shellD * 0.5, shellD * 0.5, shellW, 20]}
          rotation={[0, 0, Math.PI / 2]}>
          <meshStandardMaterial {...mechMat(bodyColor, 0.48, 0.42)} />
        </Cylinder>
        {[1, -1].map(side => (
          <group key={`mc-${side}`}>
            <Box args={[shellW * 0.18, shoulderShellH * 0.7, shellD * 1.15]}
              position={[side * shellW * 0.58, 0, 0]}>
              <meshStandardMaterial {...mechMat(bodyColor, 0.48, 0.45)} />
            </Box>
            <Cylinder args={[shoulderShellH * 0.25, shoulderShellH * 0.25, shellW * 0.2, 16]}
              rotation={[0, 0, Math.PI / 2]}
              position={[side * shellW * 0.68, 0, 0]}>
              <meshStandardMaterial {...mechMat(baseColor, 0.65, 0.3)} />
            </Cylinder>
          </group>
        ))}
        <Box args={[shellW * 0.8, shoulderShellH * 0.02, shellD * 0.6]}
          position={[0, shoulderShellH * 0.48, 0]}>
          <meshStandardMaterial {...mechMat(darkAccent, 0.5, 0.4)} />
        </Box>
        <SealRing r={baseR * 0.6} y={-shoulderShellH * 0.5} />
      </group>

      {/* SHOULDER JOINT (J2) */}
      <group position={[0, shoulderTop, 0]}>
        <IndustrialJoint r={jointR} thickness={jointR * 0.6} showMotor={true} />
      </group>

      {/* KINEMATIC CHAIN */}
      <group position={[0, shoulderTop, 0]} rotation={[0, 0, 1.05]}>
        {/* Upper arm */}
        <Box args={[armW, arm1L, armD]} position={[0, arm1L / 2, 0]}>
          <meshStandardMaterial {...mechMat(bodyColor, 0.5, 0.4)} />
        </Box>
        {[1, -1].map(side => (
          <Cylinder key={`a1e-${side}`} args={[armD * 0.5, armD * 0.5, arm1L * 0.96, 12, 1, false, 0, Math.PI]}
            position={[side * armW * 0.5, arm1L / 2, 0]}
            rotation={[0, side > 0 ? Math.PI / 2 : -Math.PI / 2, 0]}>
            <meshStandardMaterial {...mechMat(bodyColor, 0.48, 0.42)} />
          </Cylinder>
        ))}
        <Box args={[armW * 0.15, arm1L * 0.9, armD * 0.08]}
          position={[0, arm1L * 0.5, armD * 0.54]}>
          <meshStandardMaterial {...mechMat(bodyColor, 0.45, 0.5)} />
        </Box>
        <Box args={[armW * 0.15, arm1L * 0.9, armD * 0.08]}
          position={[0, arm1L * 0.5, -armD * 0.54]}>
          <meshStandardMaterial {...mechMat(bodyColor, 0.45, 0.5)} />
        </Box>
        <Box args={[armW * 0.01, arm1L * 0.35, armD * 0.55]}
          position={[armW * 0.52, arm1L * 0.55, 0]}>
          <meshStandardMaterial {...mechMat(labelColor, 0.2, 0.8)} />
        </Box>
        <Cylinder args={[armW * 0.065, armW * 0.065, arm1L * 0.85, 8]}
          position={[armW * 0.42, arm1L * 0.48, -armD * 0.45]}>
          <meshStandardMaterial {...rubberMat(cableColor)} />
        </Cylinder>

        {/* Elbow joint (J3) */}
        <group position={[0, arm1L, 0]}>
          <IndustrialJoint r={jointR * 0.85} thickness={jointR * 0.5} showMotor={true} />
          <SealRing r={jointR * 0.9} y={jointR * 0.3} />
        </group>

        {/* Forearm chain */}
        <group position={[0, arm1L, 0]} rotation={[0, 0, -1.8]}>
          {/* Tapered forearm */}
          <Cylinder args={[armW * 0.42, armW * 0.28, arm2L, 18]} position={[0, arm2L / 2, 0]}>
            <meshStandardMaterial {...mechMat(bodyColor, 0.5, 0.4)} />
          </Cylinder>
          {[1, -1].map(side => (
            <Box key={`a2p-${side}`} args={[armW * 0.05, arm2L * 0.85, armD * 0.9]}
              position={[side * armW * 0.45, arm2L * 0.48, 0]}>
              <meshStandardMaterial {...mechMat(bodyColor, 0.45, 0.5)} />
            </Box>
          ))}
          <Cylinder args={[armW * 0.045, armW * 0.045, arm2L * 0.8, 6]}
            position={[armW * 0.38, arm2L * 0.45, -armD * 0.35]}>
            <meshStandardMaterial {...rubberMat(cableColor)} />
          </Cylinder>

          {/* Wrist entry joint */}
          <group position={[0, arm2L, 0]}>
            <IndustrialJoint r={jointR * 0.6} thickness={jointR * 0.35} showMotor={false} />
          </group>

          {/* Compact wrist (J4/J5/J6) */}
          <group position={[0, arm2L, 0]} rotation={[0, 0, -0.5]}>
            {/* J4 */}
            <Cylinder args={[wristR * 1.1, wristR, j4L, 16]} position={[0, j4L / 2, 0]}>
              <meshStandardMaterial {...mechMat(bodyColor, 0.5, 0.4)} />
            </Cylinder>
            <SealRing r={wristR * 1.05} y={0} />
            {/* J5 */}
            <group position={[0, j4L, 0]}>
              <Cylinder args={[wristR * 1.15, wristR * 1.15, j5L * 0.6, 18]}>
                <meshStandardMaterial {...mechMat(jointColor, 0.55, 0.35)} />
              </Cylinder>
              <Cylinder args={[wristR * 1.2, wristR * 1.2, j5L * 0.12, 18]} position={[0, j5L * 0.35, 0]}>
                <meshStandardMaterial {...mechMat(darkAccent, 0.7, 0.25)} />
              </Cylinder>
              <Cylinder args={[wristR * 1.2, wristR * 1.2, j5L * 0.12, 18]} position={[0, -j5L * 0.35, 0]}>
                <meshStandardMaterial {...mechMat(darkAccent, 0.7, 0.25)} />
              </Cylinder>
            </group>
            {/* J6 + Flange */}
            <group position={[0, j4L + j5L, 0]}>
              <Cylinder args={[wristR * 0.9, wristR * 0.85, j6L * 0.5, 14]}>
                <meshStandardMaterial {...mechMat(bodyColor, 0.5, 0.4)} />
              </Cylinder>
              <Cylinder args={[flangeR * 0.9, flangeR * 0.85, h * 0.025, 14]}
                position={[0, j6L * 0.4, 0]}>
                <meshStandardMaterial {...mechMat(darkAccent, 0.65, 0.3)} />
              </Cylinder>
              <Cylinder args={[flangeR, flangeR, h * 0.02, 22]}
                position={[0, j6L * 0.55, 0]}>
                <meshStandardMaterial {...mechMat(flangeColor, 0.5, 0.35)} />
              </Cylinder>
              {Array.from({ length: 6 }).map((_, i) => {
                const angle = (i / 6) * Math.PI * 2;
                return (
                  <Cylinder key={`fb-${i}`} args={[flangeR * 0.1, flangeR * 0.1, h * 0.008, 6]}
                    position={[Math.cos(angle) * flangeR * 0.72, j6L * 0.57, Math.sin(angle) * flangeR * 0.72]}>
                    <meshStandardMaterial {...mechMat(darkAccent, 0.8, 0.2)} />
                  </Cylinder>
                );
              })}
              <Box args={[flangeR * 1.5, h * 0.002, flangeR * 0.02]}
                position={[0, j6L * 0.565, 0]}>
                <meshStandardMaterial color="#dc2626" metalness={0.3} roughness={0.7} />
              </Box>
              <Box args={[flangeR * 0.02, h * 0.002, flangeR * 1.5]}
                position={[0, j6L * 0.565, 0]}>
                <meshStandardMaterial color="#dc2626" metalness={0.3} roughness={0.7} />
              </Box>
              <Cylinder args={[flangeR * 0.06, flangeR * 0.06, h * 0.015, 8]}
                position={[flangeR * 0.5, j6L * 0.58, 0]}>
                <meshStandardMaterial {...mechMat('#94a3b8', 0.7, 0.2)} />
              </Cylinder>
            </group>
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
