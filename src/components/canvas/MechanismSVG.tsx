import React, { useState, useCallback } from 'react';
import { getMechanismImage } from '@/utils/mechanismImageUrls';

export interface CameraMountPoint {
  id: string;
  type: 'top' | 'side' | 'arm_end' | 'angled' | 'bracket';
  position: { x: number; y: number };
  rotation: number;
  description: string;
}

export interface ProductMountPoint {
  id: string;
  type: 'surface' | 'clamp' | 'carrier' | 'center';
  position: { x: number; y: number };
  description: string;
}

// Mechanism category constants
export const CAMERA_INTERACTION_TYPES = ['camera_mount', 'robot_arm'];
export const PRODUCT_INTERACTION_TYPES = ['conveyor', 'turntable', 'lift', 'stop', 'cylinder', 'gripper'];

interface MechanismSVGProps {
  type: string;
  width: number;
  height: number;
  view: 'front' | 'side' | 'top';
  showMountPoints?: boolean;
  highlightMountPoint?: string | null;
  onMountPointClick?: (mountPoint: CameraMountPoint) => void;
  useImage?: boolean; // Whether to use generated images instead of SVG
  imageUrl?: string | null; // Optional override image URL from database
}

// Camera mount points - ONLY for camera interaction mechanisms
export const getMechanismMountPoints = (type: string, view: 'front' | 'side' | 'top'): CameraMountPoint[] => {
  // Only camera interaction mechanisms have camera mount points
  if (!CAMERA_INTERACTION_TYPES.includes(type)) return [];
  
  const configs: Record<string, Record<string, CameraMountPoint[]>> = {
    robot_arm: {
      front: [
        { id: 'arm_end', type: 'arm_end', position: { x: 0.75, y: -0.55 }, rotation: -45, description: '末端法兰安装' },
        { id: 'wrist', type: 'side', position: { x: 0.5, y: -0.2 }, rotation: 0, description: '腕部侧装' },
      ],
      side: [
        { id: 'arm_end', type: 'arm_end', position: { x: 0.85, y: -0.45 }, rotation: -30, description: '末端法兰安装' },
      ],
      top: [
        { id: 'arm_end', type: 'arm_end', position: { x: 0.7, y: -0.1 }, rotation: 0, description: '末端法兰安装' },
      ],
    },
    camera_mount: {
      front: [
        { id: 'mount_plate', type: 'bracket', position: { x: 0, y: -0.3 }, rotation: 0, description: '相机安装板' },
      ],
      side: [
        { id: 'mount_plate', type: 'bracket', position: { x: 0, y: -0.3 }, rotation: 0, description: '相机安装板' },
      ],
      top: [
        { id: 'mount_top', type: 'top', position: { x: 0, y: 0 }, rotation: 0, description: '安装点' },
      ],
    },
  };

  return configs[type]?.[view] || [];
};

// Product mount points - ONLY for product interaction mechanisms
export const getProductMountPoints = (type: string, view: 'front' | 'side' | 'top'): ProductMountPoint[] => {
  if (!PRODUCT_INTERACTION_TYPES.includes(type)) return [];
  
  const configs: Record<string, Record<string, ProductMountPoint[]>> = {
    conveyor: {
      front: [
        { id: 'belt_surface', type: 'surface', position: { x: 0, y: -0.1 }, description: '传送带承载面' },
      ],
      side: [
        { id: 'belt_surface', type: 'surface', position: { x: 0, y: -0.1 }, description: '传送带承载面' },
      ],
      top: [
        { id: 'belt_center', type: 'center', position: { x: 0, y: 0 }, description: '传送带中心' },
      ],
    },
    turntable: {
      front: [
        { id: 'disc_surface', type: 'surface', position: { x: 0, y: -0.3 }, description: '转盘台面' },
      ],
      side: [
        { id: 'disc_surface', type: 'surface', position: { x: 0, y: -0.3 }, description: '转盘台面' },
      ],
      top: [
        { id: 'disc_center', type: 'center', position: { x: 0, y: 0 }, description: '转盘中心' },
      ],
    },
    lift: {
      front: [
        { id: 'platform_surface', type: 'surface', position: { x: 0, y: -0.2 }, description: '顶升平台面' },
      ],
      side: [
        { id: 'platform_surface', type: 'surface', position: { x: 0, y: -0.2 }, description: '顶升平台面' },
      ],
      top: [
        { id: 'platform_center', type: 'center', position: { x: 0, y: 0 }, description: '平台中心' },
      ],
    },
    stop: {
      front: [
        { id: 'contact_surface', type: 'surface', position: { x: 0, y: -0.3 }, description: '挡停接触面' },
      ],
      side: [
        { id: 'contact_surface', type: 'surface', position: { x: 0, y: -0.3 }, description: '挡停接触面' },
      ],
      top: [
        { id: 'contact_center', type: 'center', position: { x: 0, y: 0 }, description: '接触中心' },
      ],
    },
    cylinder: {
      front: [
        { id: 'rod_end', type: 'carrier', position: { x: 0, y: -0.5 }, description: '活塞杆末端' },
      ],
      side: [
        { id: 'rod_end', type: 'carrier', position: { x: 0, y: -0.5 }, description: '活塞杆末端' },
      ],
      top: [
        { id: 'rod_center', type: 'center', position: { x: 0, y: 0 }, description: '杆端中心' },
      ],
    },
    gripper: {
      front: [
        { id: 'clamp_center', type: 'clamp', position: { x: 0, y: -0.2 }, description: '夹持中心' },
      ],
      side: [
        { id: 'clamp_center', type: 'clamp', position: { x: 0, y: -0.2 }, description: '夹持中心' },
      ],
      top: [
        { id: 'clamp_center', type: 'center', position: { x: 0, y: 0 }, description: '夹持中心' },
      ],
    },
  };

  return configs[type]?.[view] || [];
};

// SVG drawings for each mechanism type
const MechanismDrawings: Record<string, Record<string, React.ReactNode>> = {
  robot_arm: {
    front: (
      <g>
        {/* Base */}
        <rect x={-20} y={20} width={40} height={15} fill="#4b5563" rx={2} />
        <ellipse cx={0} cy={20} rx={25} ry={8} fill="#374151" />
        {/* Joint 1 */}
        <rect x={-8} y={-5} width={16} height={25} fill="#6b7280" rx={3} />
        <circle cx={0} cy={0} r={10} fill="#374151" stroke="#9ca3af" strokeWidth={2} />
        {/* Arm 1 */}
        <rect x={-6} y={-35} width={12} height={35} fill="#4b5563" rx={2} />
        {/* Joint 2 */}
        <circle cx={0} cy={-35} r={8} fill="#374151" stroke="#9ca3af" strokeWidth={2} />
        {/* Arm 2 - angled */}
        <rect x={0} y={-35} width={35} height={10} fill="#4b5563" rx={2} transform="rotate(-30 0 -35)" />
        {/* End effector flange */}
        <circle cx={28} cy={-52} r={6} fill="#1f2937" stroke="#f97316" strokeWidth={2} strokeDasharray="3 2" />
        <text x={28} y={-52} textAnchor="middle" dy={3} fill="#f97316" fontSize={8}>📷</text>
      </g>
    ),
    side: (
      <g>
        {/* Base */}
        <rect x={-15} y={20} width={30} height={15} fill="#4b5563" rx={2} />
        {/* Body */}
        <rect x={-10} y={-10} width={20} height={30} fill="#6b7280" rx={3} />
        {/* Arm extending forward */}
        <rect x={-5} y={-35} width={10} height={25} fill="#4b5563" rx={2} />
        <rect x={0} y={-50} width={30} height={8} fill="#4b5563" rx={2} />
        {/* End effector */}
        <circle cx={30} cy={-46} r={5} fill="#1f2937" stroke="#f97316" strokeWidth={2} strokeDasharray="3 2" />
      </g>
    ),
    top: (
      <g>
        {/* Base circle */}
        <circle cx={0} cy={0} r={25} fill="#374151" stroke="#6b7280" strokeWidth={2} />
        {/* Arm */}
        <rect x={-5} y={-25} width={10} height={50} fill="#4b5563" rx={2} transform="rotate(30 0 0)" />
        {/* End effector */}
        <circle cx={20} cy={-15} r={5} fill="#1f2937" stroke="#f97316" strokeWidth={2} strokeDasharray="3 2" />
      </g>
    ),
  },
  turntable: {
    front: (
      <g>
        {/* Motor housing */}
        <rect x={-15} y={10} width={30} height={20} fill="#4b5563" rx={3} />
        {/* Rotating disc */}
        <ellipse cx={0} cy={0} rx={35} ry={10} fill="#6b7280" stroke="#9ca3af" strokeWidth={2} />
        {/* Center shaft */}
        <circle cx={0} cy={5} r={6} fill="#374151" />
        {/* Index marks */}
        <line x1={-30} y1={0} x2={-25} y2={0} stroke="#22d3ee" strokeWidth={2} />
        <line x1={25} y1={0} x2={30} y2={0} stroke="#22d3ee" strokeWidth={2} />
      </g>
    ),
    side: (
      <g>
        <rect x={-15} y={10} width={30} height={20} fill="#4b5563" rx={3} />
        <rect x={-30} y={-5} width={60} height={15} fill="#6b7280" rx={2} />
      </g>
    ),
    top: (
      <g>
        <circle cx={0} cy={0} r={30} fill="#6b7280" stroke="#9ca3af" strokeWidth={2} />
        <circle cx={0} cy={0} r={5} fill="#374151" />
        {/* Index holes */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map(angle => (
          <circle
            key={angle}
            cx={Math.cos(angle * Math.PI / 180) * 22}
            cy={Math.sin(angle * Math.PI / 180) * 22}
            r={2}
            fill="#22d3ee"
          />
        ))}
      </g>
    ),
  },
  lift: {
    front: (
      <g>
        {/* Guide rails */}
        <rect x={-25} y={-30} width={4} height={60} fill="#4b5563" />
        <rect x={21} y={-30} width={4} height={60} fill="#4b5563" />
        {/* Platform */}
        <rect x={-20} y={-5} width={40} height={10} fill="#6b7280" rx={2} />
        {/* Lift arrows */}
        <path d="M 0 -25 L 5 -18 L -5 -18 Z" fill="#22d3ee" />
        <path d="M 0 25 L 5 18 L -5 18 Z" fill="#22d3ee" />
      </g>
    ),
    side: (
      <g>
        <rect x={-10} y={-30} width={20} height={60} fill="#4b5563" rx={2} />
        <rect x={-15} y={-5} width={30} height={10} fill="#6b7280" rx={2} />
      </g>
    ),
    top: (
      <g>
        <rect x={-20} y={-15} width={40} height={30} fill="#6b7280" rx={3} />
        <rect x={-15} y={-10} width={30} height={20} fill="#9ca3af" rx={2} />
      </g>
    ),
  },
  conveyor: {
    front: (
      <g>
        {/* Belt section */}
        <rect x={-35} y={5} width={70} height={12} fill="#4b5563" rx={2} />
        <line x1={-30} y1={11} x2={30} y2={11} stroke="#22d3ee" strokeWidth={1} strokeDasharray="5 3" />
        {/* Side rails */}
        <rect x={-30} y={17} width={4} height={8} fill="#374151" rx={1} />
        <rect x={26} y={17} width={4} height={8} fill="#374151" rx={1} />
      </g>
    ),
    side: (
      <g>
        <ellipse cx={-20} cy={10} rx={8} ry={8} fill="#4b5563" stroke="#6b7280" strokeWidth={2} />
        <ellipse cx={20} cy={10} rx={8} ry={8} fill="#4b5563" stroke="#6b7280" strokeWidth={2} />
        <rect x={-20} y={2} width={40} height={4} fill="#6b7280" />
        <rect x={-20} y={14} width={40} height={4} fill="#6b7280" />
        <path d="M -15 10 L 15 10" stroke="#22d3ee" strokeWidth={2} markerEnd="url(#arrow)" />
        <circle cx={0} cy={-20} r={4} fill="none" stroke="#f97316" strokeWidth={2} strokeDasharray="3 2" />
      </g>
    ),
    top: (
      <g>
        <rect x={-35} y={-10} width={70} height={20} fill="#4b5563" rx={3} />
        <rect x={-30} y={-5} width={60} height={10} fill="#6b7280" />
        <path d="M -25 0 L 25 0" stroke="#22d3ee" strokeWidth={2} strokeDasharray="8 4" />
      </g>
    ),
  },
  camera_mount: {
    front: (
      <g>
        {/* L-bracket base */}
        <rect x={-5} y={10} width={10} height={20} fill="#4b5563" />
        {/* Vertical arm */}
        <rect x={-8} y={-25} width={16} height={40} fill="#6b7280" rx={2} />
        {/* Adjustment slot */}
        <rect x={-3} y={-20} width={6} height={15} fill="#374151" rx={1} />
        {/* Camera plate */}
        <rect x={-12} y={-30} width={24} height={8} fill="#4b5563" rx={2} />
        {/* Mount holes */}
        <circle cx={-6} cy={-26} r={2} fill="#1f2937" />
        <circle cx={6} cy={-26} r={2} fill="#1f2937" />
        {/* Camera position indicator */}
        <circle cx={0} cy={-35} r={5} fill="none" stroke="#f97316" strokeWidth={2} strokeDasharray="3 2" />
        <text x={0} y={-33} textAnchor="middle" fill="#f97316" fontSize={6}>📷</text>
      </g>
    ),
    side: (
      <g>
        <rect x={-5} y={10} width={10} height={20} fill="#4b5563" />
        <rect x={-8} y={-15} width={16} height={30} fill="#6b7280" rx={2} />
        <rect x={-15} y={-25} width={30} height={12} fill="#4b5563" rx={2} />
        <circle cx={0} cy={-30} r={4} fill="none" stroke="#f97316" strokeWidth={2} strokeDasharray="3 2" />
      </g>
    ),
    top: (
      <g>
        <rect x={-12} y={-8} width={24} height={16} fill="#6b7280" rx={2} />
        <circle cx={-5} cy={0} r={2} fill="#1f2937" />
        <circle cx={5} cy={0} r={2} fill="#1f2937" />
      </g>
    ),
  },
  stop: {
    front: (
      <g>
        {/* Cylinder body */}
        <rect x={-8} y={5} width={16} height={25} fill="#4b5563" rx={2} />
        {/* Stopper block */}
        <rect x={-12} y={-10} width={24} height={18} fill="#6b7280" rx={3} />
        {/* Rubber pad */}
        <rect x={-10} y={-10} width={20} height={4} fill="#1f2937" rx={1} />
        {/* Port fittings */}
        <circle cx={-12} cy={15} r={3} fill="#374151" />
        <circle cx={12} cy={15} r={3} fill="#374151" />
      </g>
    ),
    side: (
      <g>
        <rect x={-6} y={5} width={12} height={25} fill="#4b5563" rx={2} />
        <rect x={-10} y={-8} width={20} height={15} fill="#6b7280" rx={2} />
        <rect x={-8} y={-8} width={16} height={3} fill="#1f2937" rx={1} />
      </g>
    ),
    top: (
      <g>
        <rect x={-12} y={-8} width={24} height={16} fill="#6b7280" rx={3} />
        <rect x={-10} y={-6} width={20} height={12} fill="#4b5563" rx={2} />
      </g>
    ),
  },
  cylinder: {
    front: (
      <g>
        {/* Cylinder body */}
        <rect x={-10} y={0} width={20} height={30} fill="#4b5563" rx={3} />
        {/* End caps */}
        <rect x={-12} y={-2} width={24} height={6} fill="#6b7280" rx={2} />
        <rect x={-12} y={26} width={24} height={6} fill="#6b7280" rx={2} />
        {/* Piston rod */}
        <rect x={-3} y={-25} width={6} height={25} fill="#9ca3af" rx={1} />
        {/* Rod end */}
        <rect x={-6} y={-28} width={12} height={5} fill="#374151" rx={2} />
        {/* Port fittings */}
        <circle cx={-14} cy={10} r={3} fill="#374151" />
        <circle cx={14} cy={20} r={3} fill="#374151" />
        {/* Mount point at rod end */}
        <circle cx={0} cy={-32} r={4} fill="none" stroke="#f97316" strokeWidth={2} strokeDasharray="3 2" />
      </g>
    ),
    side: (
      <g>
        <rect x={-8} y={0} width={16} height={30} fill="#4b5563" rx={3} />
        <rect x={-10} y={-2} width={20} height={6} fill="#6b7280" rx={2} />
        <rect x={-10} y={26} width={20} height={6} fill="#6b7280" rx={2} />
        <rect x={-2} y={-20} width={4} height={22} fill="#9ca3af" rx={1} />
      </g>
    ),
    top: (
      <g>
        <circle cx={0} cy={0} r={12} fill="#4b5563" stroke="#6b7280" strokeWidth={2} />
        <circle cx={0} cy={0} r={4} fill="#9ca3af" />
      </g>
    ),
  },
  gripper: {
    front: (
      <g>
        {/* Body */}
        <rect x={-15} y={0} width={30} height={15} fill="#4b5563" rx={3} />
        {/* Left finger */}
        <rect x={-18} y={-20} width={8} height={22} fill="#6b7280" rx={2} />
        <rect x={-20} y={-22} width={10} height={5} fill="#374151" rx={1} />
        {/* Right finger */}
        <rect x={10} y={-20} width={8} height={22} fill="#6b7280" rx={2} />
        <rect x={10} y={-22} width={10} height={5} fill="#374151" rx={1} />
        {/* Opening arrows */}
        <path d="M -8 -10 L -12 -10" stroke="#22d3ee" strokeWidth={1.5} />
        <path d="M 8 -10 L 12 -10" stroke="#22d3ee" strokeWidth={1.5} />
        {/* Camera mount above */}
        <circle cx={0} cy={-28} r={4} fill="none" stroke="#f97316" strokeWidth={2} strokeDasharray="3 2" />
      </g>
    ),
    side: (
      <g>
        <rect x={-8} y={0} width={16} height={15} fill="#4b5563" rx={3} />
        <rect x={-10} y={-18} width={20} height={20} fill="#6b7280" rx={2} />
        <rect x={-8} y={-20} width={16} height={4} fill="#374151" rx={1} />
      </g>
    ),
    top: (
      <g>
        <rect x={-15} y={-8} width={30} height={16} fill="#4b5563" rx={3} />
        <rect x={-20} y={-5} width={8} height={10} fill="#6b7280" rx={2} />
        <rect x={12} y={-5} width={8} height={10} fill="#6b7280" rx={2} />
      </g>
    ),
  },
};

export function MechanismSVG({
  type,
  width,
  height,
  view,
  showMountPoints = true,
  highlightMountPoint,
  onMountPointClick,
  useImage = true,
  imageUrl,
}: MechanismSVGProps) {
  const [imageLoadError, setImageLoadError] = useState(false);
  const drawing = MechanismDrawings[type]?.[view];
  const mountPoints = getMechanismMountPoints(type, view);

  // Scale factor based on default 80x80 design
  const scaleX = width / 80;
  const scaleY = height / 80;
  const scale = Math.min(scaleX, scaleY);
  
  // Get image URL - prioritize: LOCAL ASSETS FIRST > props imageUrl > fallback to SVG
  const localImageUrl = getMechanismImage(type, view);
  const mechanismImageUrl = imageUrl || localImageUrl;
  const shouldUseImage = useImage && mechanismImageUrl && !imageLoadError;
  
  // Reset error state when type or view changes
  const handleImageError = useCallback(() => {
    setImageLoadError(true);
  }, []);

  return (
    <g transform={`scale(${scale})`}>
      {/* Background with subtle gradient */}
      <defs>
        <linearGradient id={`mech-bg-${type}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1f2937" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#111827" stopOpacity="0.95" />
        </linearGradient>
      </defs>
      
      {/* Mechanism drawing - use image if available, otherwise SVG */}
      {shouldUseImage ? (
        <image
          href={mechanismImageUrl}
          x={-40}
          y={-40}
          width={80}
          height={80}
          preserveAspectRatio="xMidYMid meet"
          onError={handleImageError}
        />
      ) : drawing || (
        <rect x={-35} y={-35} width={70} height={70} fill="#4b5563" rx={5} />
      )}
      
      {/* Interactive mount points */}
      {showMountPoints && mountPoints.map(mp => {
        const isHighlighted = highlightMountPoint === mp.id;
        const mpX = mp.position.x * 40;
        const mpY = mp.position.y * 40;
        
        return (
          <g
            key={mp.id}
            transform={`translate(${mpX}, ${mpY})`}
            onClick={() => onMountPointClick?.(mp)}
            style={{ cursor: onMountPointClick ? 'pointer' : 'default' }}
          >
            {/* Mount point indicator */}
            <circle
              r={isHighlighted ? 8 : 6}
              fill={isHighlighted ? 'rgba(249, 115, 22, 0.3)' : 'transparent'}
              stroke={isHighlighted ? '#f97316' : '#f9731666'}
              strokeWidth={isHighlighted ? 3 : 2}
              strokeDasharray={isHighlighted ? 'none' : '4 2'}
              className={isHighlighted ? 'animate-pulse' : ''}
            />
            {/* Camera icon */}
            <text
              textAnchor="middle"
              dy={3}
              fill={isHighlighted ? '#f97316' : '#f9731699'}
              fontSize={isHighlighted ? 10 : 8}
            >
              📷
            </text>
            {/* Tooltip on hover */}
            {isHighlighted && (
              <g transform="translate(15, -5)">
                <rect x={0} y={-10} width={60} height={16} rx={3} fill="rgba(0,0,0,0.8)" />
                <text x={5} y={0} fill="#fff" fontSize={8}>{mp.description}</text>
              </g>
            )}
          </g>
        );
      })}
    </g>
  );
}

export default MechanismSVG;
