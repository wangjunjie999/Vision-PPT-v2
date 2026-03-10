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

// Helper: standard material props for mechanisms (metallic)
function mechMat(color: string, selected: boolean, metalness = 0.6, roughness = 0.3) {
  const highlightColor = '#facc15';
  return {
    color: selected ? highlightColor : color,
    transparent: true,
    opacity: selected ? 0.92 : 0.85,
    emissive: selected ? highlightColor : '#000000',
    emissiveIntensity: selected ? 0.3 : 0,
    metalness,
    roughness,
  } as const;
}

// Rubber/plastic material
function rubberMat(color: string, selected: boolean) {
  return mechMat(color, selected, 0.05, 0.8);
}

function RobotArmModel({ w, h, d, selected }: { w: number; h: number; d: number; selected: boolean }) {
  const baseR = Math.min(w, d) * 0.5;
  const jointR = w * 0.12;
  const armR = w * 0.08;
  const arm1L = h * 0.38;
  const arm2L = h * 0.30;
  const waistH = h * 0.12;
  const ribCount = 6;

  return (
    <group position={[0, 0, 0]}>
      {/* 底座 - 大扁圆柱 */}
      <Cylinder args={[baseR, baseR * 1.1, h * 0.08, 24]} position={[0, h * 0.04, 0]}>
        <meshStandardMaterial {...mechMat('#3a3a3a', selected, 0.7, 0.25)} />
      </Cylinder>
      {/* 底座加强筋 */}
      {Array.from({ length: ribCount }).map((_, i) => {
        const angle = (i / ribCount) * Math.PI * 2;
        return (
          <Box key={`rib-${i}`} args={[baseR * 0.08, h * 0.06, baseR * 0.5]}
            position={[Math.cos(angle) * baseR * 0.75, h * 0.05, Math.sin(angle) * baseR * 0.75]}
            rotation={[0, -angle, 0]}>
            <meshStandardMaterial {...mechMat('#2a2a2a', selected, 0.7, 0.3)} />
          </Box>
        );
      })}
      {/* 腰部转台 */}
      <Cylinder args={[baseR * 0.6, baseR * 0.65, waistH, 20]} position={[0, h * 0.08 + waistH / 2, 0]}>
        <meshStandardMaterial {...mechMat('#4a4a4a', selected, 0.6, 0.35)} />
      </Cylinder>
      {/* 肩关节 (关节1) */}
      <Sphere args={[jointR, 16, 16]} position={[0, h * 0.08 + waistH, 0]}>
        <meshStandardMaterial {...mechMat('#ea580c', selected, 0.5, 0.4)} />
      </Sphere>
      {/* 大臂 */}
      <group position={[0, h * 0.08 + waistH, 0]} rotation={[0, 0, 0.5]}>
        <Cylinder args={[armR, armR * 0.9, arm1L, 12]} position={[0, arm1L / 2, 0]}>
          <meshStandardMaterial {...mechMat('#ea580c', selected, 0.5, 0.4)} />
        </Cylinder>
        {/* 线缆管道沿大臂 */}
        <Cylinder args={[armR * 0.15, armR * 0.15, arm1L * 0.85, 6]} position={[armR * 1.2, arm1L / 2, 0]}>
          <meshStandardMaterial {...rubberMat('#1a1a1a', selected)} />
        </Cylinder>
        {/* 肘关节 (关节2) */}
        <Sphere args={[jointR * 0.85, 16, 16]} position={[0, arm1L, 0]}>
          <meshStandardMaterial {...mechMat('#6b7280', selected, 0.65, 0.25)} />
        </Sphere>
        {/* 小臂 */}
        <group position={[0, arm1L, 0]} rotation={[0, 0, -1.2]}>
          <Cylinder args={[armR * 0.85, armR * 0.75, arm2L, 12]} position={[0, arm2L / 2, 0]}>
            <meshStandardMaterial {...mechMat('#f97316', selected, 0.5, 0.4)} />
          </Cylinder>
          {/* 线缆管道沿小臂 */}
          <Cylinder args={[armR * 0.12, armR * 0.12, arm2L * 0.8, 6]} position={[armR * 1.0, arm2L / 2, 0]}>
            <meshStandardMaterial {...rubberMat('#1a1a1a', selected)} />
          </Cylinder>
          {/* 腕关节 (关节3) */}
          <Sphere args={[jointR * 0.65, 14, 14]} position={[0, arm2L, 0]}>
            <meshStandardMaterial {...mechMat('#6b7280', selected, 0.65, 0.25)} />
          </Sphere>
          {/* 腕关节4 - 小旋转关节 */}
          <Cylinder args={[jointR * 0.35, jointR * 0.35, h * 0.04, 10]} position={[0, arm2L + h * 0.03, 0]}>
            <meshStandardMaterial {...mechMat('#4b5563', selected, 0.6, 0.3)} />
          </Cylinder>
          {/* 末端法兰盘 */}
          <Cylinder args={[w * 0.08, w * 0.08, h * 0.03, 16]} position={[0, arm2L + h * 0.06, 0]}>
            <meshStandardMaterial {...mechMat('#facc15', selected, 0.5, 0.35)} />
          </Cylinder>
        </group>
      </group>
    </group>
  );
}

function ConveyorModel({ w, h, d, selected }: { w: number; h: number; d: number; selected: boolean }) {
  const rollerR = Math.min(h, d) * 0.25;
  const rollerCount = 5;
  return (
    <group>
      {/* Belt surface */}
      <Box args={[w, h * 0.28, d]} position={[0, h * 0.5, 0]}>
        <meshStandardMaterial {...rubberMat('#4b5563', selected)} />
      </Box>
      {/* Belt texture stripes */}
      {Array.from({ length: 8 }).map((_, i) => (
        <Box key={`stripe-${i}`} args={[w * 0.01, h * 0.29, d * 0.98]}
          position={[-w * 0.4 + (i / 7) * w * 0.8, h * 0.5, 0]}>
          <meshStandardMaterial {...rubberMat('#374151', selected)} />
        </Box>
      ))}
      {/* Rollers distributed evenly */}
      {Array.from({ length: rollerCount }).map((_, i) => {
        const xPos = -w * 0.42 + (i / (rollerCount - 1)) * w * 0.84;
        return (
          <Cylinder key={`roller-${i}`} args={[rollerR, rollerR, d * 0.92, 12]}
            rotation={[Math.PI / 2, 0, 0]} position={[xPos, h * 0.35, 0]}>
            <meshStandardMaterial {...mechMat('#22c55e', selected, 0.5, 0.35)} />
          </Cylinder>
        );
      })}
      {/* Side guard rails */}
      <Box args={[w * 1.02, h * 0.15, d * 0.04]} position={[0, h * 0.58, -d * 0.52]}>
        <meshStandardMaterial {...mechMat('#c0c0c0', selected, 0.6, 0.3)} />
      </Box>
      <Box args={[w * 1.02, h * 0.15, d * 0.04]} position={[0, h * 0.58, d * 0.52]}>
        <meshStandardMaterial {...mechMat('#c0c0c0', selected, 0.6, 0.3)} />
      </Box>
      {/* 4 Legs */}
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz], i) => (
        <Box key={`leg-${i}`} args={[w * 0.06, h * 0.35, d * 0.06]}
          position={[sx * w * 0.4, h * 0.175, sz * d * 0.4]}>
          <meshStandardMaterial {...mechMat('#4a4a4a', selected, 0.6, 0.35)} />
        </Box>
      ))}
      {/* Cross beams between legs */}
      <Box args={[w * 0.86, h * 0.04, d * 0.04]} position={[0, h * 0.08, -d * 0.4]}>
        <meshStandardMaterial {...mechMat('#4a4a4a', selected, 0.6, 0.35)} />
      </Box>
      <Box args={[w * 0.86, h * 0.04, d * 0.04]} position={[0, h * 0.08, d * 0.4]}>
        <meshStandardMaterial {...mechMat('#4a4a4a', selected, 0.6, 0.35)} />
      </Box>
    </group>
  );
}

function CylinderModel({ w, h, d, selected }: { w: number; h: number; d: number; selected: boolean }) {
  const r = Math.min(w, d) * 0.35;
  return (
    <group>
      {/* Main cylinder body */}
      <Cylinder args={[r, r, h, 20]} position={[0, h * 0.5, 0]}>
        <meshStandardMaterial {...mechMat('#9ca3af', selected, 0.55, 0.3)} />
      </Cylinder>
      {/* End cap top */}
      <Cylinder args={[r * 1.08, r * 1.08, h * 0.06, 20]} position={[0, h * 0.97, 0]}>
        <meshStandardMaterial {...mechMat('#6b7280', selected, 0.65, 0.25)} />
      </Cylinder>
      {/* End cap bottom */}
      <Cylinder args={[r * 1.08, r * 1.08, h * 0.06, 20]} position={[0, h * 0.03, 0]}>
        <meshStandardMaterial {...mechMat('#6b7280', selected, 0.65, 0.25)} />
      </Cylinder>
      {/* Piston rod */}
      <Cylinder args={[r * 0.22, r * 0.22, h * 0.4, 10]} position={[0, h * 0.9, 0]}>
        <meshStandardMaterial {...mechMat('#e5e7eb', selected, 0.75, 0.15)} />
      </Cylinder>
      {/* Mounting ears (left & right) */}
      <Cylinder args={[r * 0.2, r * 0.2, d * 0.15, 10]} rotation={[Math.PI / 2, 0, 0]} position={[-r * 0.05, h * 0.03, r * 1.2]}>
        <meshStandardMaterial {...mechMat('#6b7280', selected, 0.6, 0.3)} />
      </Cylinder>
      <Cylinder args={[r * 0.2, r * 0.2, d * 0.15, 10]} rotation={[Math.PI / 2, 0, 0]} position={[-r * 0.05, h * 0.03, -r * 1.2]}>
        <meshStandardMaterial {...mechMat('#6b7280', selected, 0.6, 0.3)} />
      </Cylinder>
      {/* Pneumatic port fittings */}
      <Cylinder args={[r * 0.1, r * 0.08, h * 0.08, 8]} position={[r * 0.8, h * 0.8, 0]} rotation={[0, 0, Math.PI / 2]}>
        <meshStandardMaterial {...mechMat('#d4a017', selected, 0.7, 0.2)} />
      </Cylinder>
      <Cylinder args={[r * 0.1, r * 0.08, h * 0.08, 8]} position={[r * 0.8, h * 0.2, 0]} rotation={[0, 0, Math.PI / 2]}>
        <meshStandardMaterial {...mechMat('#d4a017', selected, 0.7, 0.2)} />
      </Cylinder>
    </group>
  );
}

function GripperModel({ w, h, d, selected }: { w: number; h: number; d: number; selected: boolean }) {
  const jawW = w * 0.15;
  return (
    <group>
      {/* Mounting flange (top) */}
      <Cylinder args={[w * 0.18, w * 0.18, h * 0.06, 16]} position={[0, h * 0.82, 0]}>
        <meshStandardMaterial {...mechMat('#c0c0c0', selected, 0.6, 0.3)} />
      </Cylinder>
      {/* Center body */}
      <Box args={[w * 0.4, h * 0.5, d * 0.6]} position={[0, h * 0.5, 0]}>
        <meshStandardMaterial {...mechMat('#4b5563', selected, 0.55, 0.35)} />
      </Box>
      {/* Guide rail slots */}
      <Box args={[w * 0.75, h * 0.04, d * 0.08]} position={[0, h * 0.4, d * 0.2]}>
        <meshStandardMaterial {...mechMat('#374151', selected, 0.6, 0.3)} />
      </Box>
      <Box args={[w * 0.75, h * 0.04, d * 0.08]} position={[0, h * 0.4, -d * 0.2]}>
        <meshStandardMaterial {...mechMat('#374151', selected, 0.6, 0.3)} />
      </Box>
      {/* Left jaw */}
      <Box args={[jawW, h * 0.65, d * 0.2]} position={[-w * 0.35, h * 0.35, 0]}>
        <meshStandardMaterial {...mechMat('#6b7280', selected, 0.55, 0.35)} />
      </Box>
      {/* Left jaw fingertip (cone) */}
      <Cone args={[jawW * 0.5, h * 0.12, 8]} position={[-w * 0.35, h * 0.02, 0]} rotation={[0, 0, 0]}>
        <meshStandardMaterial {...mechMat('#9ca3af', selected, 0.6, 0.25)} />
      </Cone>
      {/* Right jaw */}
      <Box args={[jawW, h * 0.65, d * 0.2]} position={[w * 0.35, h * 0.35, 0]}>
        <meshStandardMaterial {...mechMat('#6b7280', selected, 0.55, 0.35)} />
      </Box>
      {/* Right jaw fingertip (cone) */}
      <Cone args={[jawW * 0.5, h * 0.12, 8]} position={[w * 0.35, h * 0.02, 0]} rotation={[0, 0, 0]}>
        <meshStandardMaterial {...mechMat('#9ca3af', selected, 0.6, 0.25)} />
      </Cone>
      {/* Pneumatic port */}
      <Cylinder args={[w * 0.04, w * 0.03, h * 0.08, 6]} position={[w * 0.22, h * 0.72, d * 0.32]} rotation={[Math.PI / 2, 0, 0]}>
        <meshStandardMaterial {...mechMat('#d4a017', selected, 0.7, 0.2)} />
      </Cylinder>
    </group>
  );
}

function TurntableModel({ w, h, d, selected }: { w: number; h: number; d: number; selected: boolean }) {
  const r = Math.max(w, d) * 0.45;
  return (
    <group>
      {/* Base */}
      <Cylinder args={[r * 0.8, r, h * 0.4, 24]} position={[0, h * 0.2, 0]}>
        <meshStandardMaterial {...mechMat('#1e3a5f', selected, 0.55, 0.35)} />
      </Cylinder>
      {/* Mounting holes on base (4) */}
      {[0, 1, 2, 3].map(i => {
        const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
        return (
          <Cylinder key={`mount-${i}`} args={[r * 0.06, r * 0.06, h * 0.02, 8]}
            position={[Math.cos(angle) * r * 0.88, h * 0.01, Math.sin(angle) * r * 0.88]}>
            <meshStandardMaterial {...mechMat('#0f172a', selected, 0.3, 0.5)} />
          </Cylinder>
        );
      })}
      {/* Bearing ring */}
      <Cylinder args={[r * 0.55, r * 0.55, h * 0.04, 24]} position={[0, h * 0.4, 0]}>
        <meshStandardMaterial {...mechMat('#94a3b8', selected, 0.7, 0.2)} />
      </Cylinder>
      <Cylinder args={[r * 0.45, r * 0.45, h * 0.05, 24]} position={[0, h * 0.4, 0]}>
        <meshStandardMaterial {...mechMat('#64748b', selected, 0.7, 0.2)} />
      </Cylinder>
      {/* Top disc */}
      <Cylinder args={[r, r, h * 0.08, 24]} position={[0, h * 0.46, 0]}>
        <meshStandardMaterial {...mechMat('#2563eb', selected, 0.5, 0.35)} />
      </Cylinder>
      {/* Positioning pins on top */}
      {[0, 1, 2].map(i => {
        const angle = (i / 3) * Math.PI * 2;
        return (
          <Cylinder key={`pin-${i}`} args={[r * 0.04, r * 0.04, h * 0.08, 8]}
            position={[Math.cos(angle) * r * 0.75, h * 0.54, Math.sin(angle) * r * 0.75]}>
            <meshStandardMaterial {...mechMat('#e5e7eb', selected, 0.7, 0.2)} />
          </Cylinder>
        );
      })}
    </group>
  );
}

function LiftModel({ w, h, d, selected }: { w: number; h: number; d: number; selected: boolean }) {
  const pillarW = w * 0.1;
  return (
    <group>
      {/* Base plate */}
      <Box args={[w * 0.9, h * 0.04, d * 0.7]} position={[0, h * 0.02, 0]}>
        <meshStandardMaterial {...mechMat('#4a4a4a', selected, 0.6, 0.3)} />
      </Box>
      {/* Left pillar with guide slot */}
      <Box args={[pillarW, h, pillarW]} position={[-w * 0.35, h * 0.5, 0]}>
        <meshStandardMaterial {...mechMat('#6b7280', selected, 0.6, 0.3)} />
      </Box>
      <Box args={[pillarW * 0.3, h * 0.9, pillarW * 0.3]} position={[-w * 0.35 + pillarW * 0.4, h * 0.5, 0]}>
        <meshStandardMaterial {...mechMat('#4b5563', selected, 0.6, 0.3)} />
      </Box>
      {/* Right pillar with guide slot */}
      <Box args={[pillarW, h, pillarW]} position={[w * 0.35, h * 0.5, 0]}>
        <meshStandardMaterial {...mechMat('#6b7280', selected, 0.6, 0.3)} />
      </Box>
      <Box args={[pillarW * 0.3, h * 0.9, pillarW * 0.3]} position={[w * 0.35 - pillarW * 0.4, h * 0.5, 0]}>
        <meshStandardMaterial {...mechMat('#4b5563', selected, 0.6, 0.3)} />
      </Box>
      {/* Scissor X arms */}
      <Box args={[w * 0.55, h * 0.03, d * 0.06]} position={[0, h * 0.35, d * 0.15]}
        rotation={[0, 0, 0.4]}>
        <meshStandardMaterial {...mechMat('#9ca3af', selected, 0.6, 0.3)} />
      </Box>
      <Box args={[w * 0.55, h * 0.03, d * 0.06]} position={[0, h * 0.35, d * 0.15]}
        rotation={[0, 0, -0.4]}>
        <meshStandardMaterial {...mechMat('#9ca3af', selected, 0.6, 0.3)} />
      </Box>
      <Box args={[w * 0.55, h * 0.03, d * 0.06]} position={[0, h * 0.35, -d * 0.15]}
        rotation={[0, 0, 0.4]}>
        <meshStandardMaterial {...mechMat('#9ca3af', selected, 0.6, 0.3)} />
      </Box>
      <Box args={[w * 0.55, h * 0.03, d * 0.06]} position={[0, h * 0.35, -d * 0.15]}
        rotation={[0, 0, -0.4]}>
        <meshStandardMaterial {...mechMat('#9ca3af', selected, 0.6, 0.3)} />
      </Box>
      {/* Platform */}
      <Box args={[w * 0.8, h * 0.06, d * 0.8]} position={[0, h * 0.6, 0]}>
        <meshStandardMaterial {...mechMat('#c0c0c0', selected, 0.6, 0.3)} />
      </Box>
      {/* Platform surface texture */}
      <Box args={[w * 0.78, h * 0.01, d * 0.78]} position={[0, h * 0.635, 0]}>
        <meshStandardMaterial {...mechMat('#d4d4d8', selected, 0.5, 0.4)} />
      </Box>
    </group>
  );
}

function StopModel({ w, h, d, selected }: { w: number; h: number; d: number; selected: boolean }) {
  return (
    <group>
      {/* Base block */}
      <Box args={[w * 0.5, h * 0.4, d * 0.5]} position={[0, h * 0.2, 0]}>
        <meshStandardMaterial {...mechMat('#991b1b', selected, 0.5, 0.4)} />
      </Box>
      {/* Mounting bolts (4) */}
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz], i) => (
        <Cylinder key={`bolt-${i}`} args={[w * 0.025, w * 0.025, h * 0.06, 6]}
          position={[sx * w * 0.2, h * 0.01, sz * d * 0.2]}>
          <meshStandardMaterial {...mechMat('#c0c0c0', selected, 0.7, 0.2)} />
        </Cylinder>
      ))}
      {/* Cylinder driving rod */}
      <Cylinder args={[w * 0.04, w * 0.04, h * 0.35, 8]} position={[0, h * 0.4 + h * 0.175, -d * 0.1]}>
        <meshStandardMaterial {...mechMat('#9ca3af', selected, 0.7, 0.2)} />
      </Cylinder>
      {/* Stop plate */}
      <Box args={[w * 0.8, h * 0.7, d * 0.08]} position={[0, h * 0.55, d * 0.25]}>
        <meshStandardMaterial {...mechMat('#dc2626', selected, 0.5, 0.35)} />
      </Box>
      {/* Rubber bumper pad */}
      <Box args={[w * 0.7, h * 0.5, d * 0.04]} position={[0, h * 0.55, d * 0.31]}>
        <meshStandardMaterial {...rubberMat('#1a1a1a', selected)} />
      </Box>
    </group>
  );
}

function CameraMountModel({ w, h, d, selected }: { w: number; h: number; d: number; selected: boolean }) {
  return (
    <group>
      {/* Mounting base plate */}
      <Box args={[w * 0.35, h * 0.04, d * 0.35]} position={[0, h * 0.02, -d * 0.3]}>
        <meshStandardMaterial {...mechMat('#4a4a4a', selected, 0.6, 0.3)} />
      </Box>
      {/* Vertical bar */}
      <Box args={[w * 0.12, h, d * 0.12]} position={[0, h * 0.5, -d * 0.3]}>
        <meshStandardMaterial {...mechMat('#64748b', selected, 0.6, 0.3)} />
      </Box>
      {/* Horizontal arm */}
      <Box args={[w * 0.6, h * 0.08, d * 0.1]} position={[0, h * 0.9, 0]}>
        <meshStandardMaterial {...mechMat('#94a3b8', selected, 0.6, 0.3)} />
      </Box>
      {/* Diagonal brace */}
      <Box args={[w * 0.04, h * 0.35, d * 0.04]}
        position={[0, h * 0.72, -d * 0.12]}
        rotation={[0.6, 0, 0]}>
        <meshStandardMaterial {...mechMat('#64748b', selected, 0.6, 0.3)} />
      </Box>
      {/* Adjustment knob */}
      <Sphere args={[w * 0.04, 10, 10]} position={[w * 0.08, h * 0.9, -d * 0.08]}>
        <meshStandardMaterial {...mechMat('#1a1a1a', selected, 0.3, 0.6)} />
      </Sphere>
      {/* Cable channel */}
      <Cylinder args={[w * 0.025, w * 0.025, h * 0.7, 6]} position={[w * 0.1, h * 0.55, -d * 0.3]}>
        <meshStandardMaterial {...rubberMat('#1a1a1a', selected)} />
      </Cylinder>
    </group>
  );
}

function DefaultMechanismModel({ w, h, d, selected }: { w: number; h: number; d: number; selected: boolean }) {
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
  const edgeR = 0.008;

  // 12 edges of a box
  const edges: { pos: [number, number, number]; rot: [number, number, number]; len: number }[] = [
    // bottom 4
    { pos: [-w/2, 0, -d/2], rot: [0, 0, 0], len: h },
    { pos: [w/2, 0, -d/2], rot: [0, 0, 0], len: h },
    { pos: [-w/2, 0, d/2], rot: [0, 0, 0], len: h },
    { pos: [w/2, 0, d/2], rot: [0, 0, 0], len: h },
    // top horizontal (x-axis)
    { pos: [0, h, -d/2], rot: [0, 0, Math.PI/2], len: w },
    { pos: [0, h, d/2], rot: [0, 0, Math.PI/2], len: w },
    { pos: [0, 0, -d/2], rot: [0, 0, Math.PI/2], len: w },
    { pos: [0, 0, d/2], rot: [0, 0, Math.PI/2], len: w },
    // depth (z-axis)
    { pos: [-w/2, h, 0], rot: [Math.PI/2, 0, 0], len: d },
    { pos: [w/2, h, 0], rot: [Math.PI/2, 0, 0], len: d },
    { pos: [-w/2, 0, 0], rot: [Math.PI/2, 0, 0], len: d },
    { pos: [w/2, 0, 0], rot: [Math.PI/2, 0, 0], len: d },
  ];

  return (
    <>
      <group position={[0, h / 2, 0]}>
        <Box args={[w, h, d]}>
          <meshStandardMaterial
            color={selected ? highlightColor : '#06b6d4'}
            transparent opacity={selected ? 0.7 : 0.4}
            emissive={selected ? highlightColor : '#000000'}
            emissiveIntensity={selected ? 0.3 : 0}
            metalness={0.1}
            roughness={0.6}
          />
        </Box>
        {/* Edge chamfer cylinders */}
        {edges.map((edge, i) => (
          <Cylinder key={`edge-${i}`} args={[edgeR, edgeR, edge.len, 4]}
            position={edge.pos} rotation={edge.rot}>
            <meshStandardMaterial color={selected ? highlightColor : '#22d3ee'} metalness={0.3} roughness={0.5} />
          </Cylinder>
        ))}
        {/* Front face marker */}
        <Box args={[w * 0.15, h * 0.15, d * 0.01]} position={[0, 0, d / 2 + 0.005]}>
          <meshStandardMaterial color="#0891b2" metalness={0.2} roughness={0.5} />
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
      {/* Main camera body */}
      <Box args={[0.3, 0.25, 0.4]}>
        <meshStandardMaterial
          color={selected ? highlightColor : baseColor}
          emissive={selected ? highlightColor : '#000000'}
          emissiveIntensity={selected ? 0.3 : 0}
          metalness={0.5}
          roughness={0.35}
        />
      </Box>
      {/* Back panel / interface plate */}
      <Box args={[0.28, 0.22, 0.02]} position={[0, 0, 0.21]}>
        <meshStandardMaterial {...mechMat('#1a1a1a', selected, 0.3, 0.6)} />
      </Box>
      {/* Cooling fins on the back */}
      {Array.from({ length: 5 }).map((_, i) => (
        <Box key={`fin-${i}`} args={[0.26, 0.03, 0.015]}
          position={[0, -0.09 + i * 0.045, 0.2]}>
          <meshStandardMaterial {...mechMat('#2a2a2a', selected, 0.5, 0.4)} />
        </Box>
      ))}
      {/* Lens assembly */}
      <group position={[0, -0.25, 0]} rotation={[Math.PI, 0, 0]}>
        {/* Lens ring */}
        <Cylinder args={[0.16, 0.16, 0.04, 16]} position={[0, -0.02, 0]}>
          <meshStandardMaterial {...mechMat('#374151', selected, 0.6, 0.25)} />
        </Cylinder>
        {/* Lens cone */}
        <Cone args={[0.14, 0.28, 12]}>
          <meshStandardMaterial
            color={selected ? highlightColor : baseDark}
            emissive={selected ? highlightColor : '#000000'}
            emissiveIntensity={selected ? 0.2 : 0}
            metalness={0.5}
            roughness={0.3}
          />
        </Cone>
        {/* Glass element at tip */}
        <Cylinder args={[0.04, 0.04, 0.02, 12]} position={[0, 0.15, 0]}>
          <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.1} transparent opacity={0.7} />
        </Cylinder>
      </group>
      {/* Status LED (green emissive) */}
      <Sphere args={[0.02, 8, 8]} position={[0.12, 0.1, -0.2]}>
        <meshStandardMaterial
          color="#22c55e"
          emissive="#22c55e"
          emissiveIntensity={0.8}
          metalness={0.1}
          roughness={0.3}
        />
      </Sphere>
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

  useFrame(() => {
    if (cameraRef.current) {
      const { position, target } = cameraRef.current;
      camera.position.set(...position);
      if (controlsRef.current) {
        controlsRef.current.target.set(...target);
        controlsRef.current.update();
      }
      cameraRef.current = null;
    }
  });

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
  dragMovedRef,
  onDragMove,
  onDragEnd,
  onDeselect,
}: {
  dragStateRef: React.MutableRefObject<DragState>;
  dragMovedRef: React.MutableRefObject<boolean>;
  onDragMove: (point: THREE.Vector3) => void;
  onDragEnd: () => void;
  onDeselect: () => void;
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
      onClick={(e: ThreeEvent<MouseEvent>) => {
        if (!dragStateRef.current.isDragging && !dragMovedRef.current) {
          e.stopPropagation();
          onDeselect();
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
    // Delay reset so click event fires first and can check dragMovedRef
    setTimeout(() => { dragMovedRef.current = false; }, 0);
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
            dragMovedRef.current = false;
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
            dragMovedRef={dragMovedRef}
            onDragMove={handleDragMove}
            onDragEnd={handleDragEnd}
            onDeselect={() => handleSelect(null)}
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
              <Mechanism3DModel obj={obj} selected={activeSelectedId === obj.id} />
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
