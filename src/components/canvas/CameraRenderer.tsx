import { memo } from 'react';
import { Lock } from 'lucide-react';
import type { LayoutObject } from './ObjectPropertyPanel';
import { ResizeHandles } from './ResizeHandles';

interface CameraRendererProps {
  objects: LayoutObject[];
  selectedId: string | null;
  secondSelectedId: string | null;
  panMode: boolean;
  isIsometric: boolean;
  onMouseDown: (e: React.PointerEvent, obj: LayoutObject) => void;
  onResize: (id: string, width: number, height: number, x: number, y: number) => void;
  isoProject: (px: number, py: number, pz: number) => { x: number; y: number };
}

export const CameraRenderer = memo(function CameraRenderer({
  objects, selectedId, secondSelectedId, panMode, isIsometric,
  onMouseDown, onResize, isoProject,
}: CameraRendererProps) {
  const cameras = objects.filter(obj => obj.type === 'camera');

  return (
    <>
      {/* Isometric 3D camera cubes */}
      {isIsometric && cameras.map(camObj => {
        const isMounted = !!camObj.mountedToMechanismId;
        const parentMech = isMounted ? objects.find(o => o.id === camObj.mountedToMechanismId) : null;

        const cPosX = isMounted && parentMech ? (parentMech.posX ?? 0) + (camObj.mountOffsetX ?? 0) : (camObj.posX ?? 0);
        const cPosY = isMounted && parentMech ? (parentMech.posY ?? 0) + (camObj.mountOffsetY ?? 0) : (camObj.posY ?? 0);
        const mechH = isMounted && parentMech ? (parentMech.height ?? 80) : 0;
        const cPosZ = isMounted && parentMech ? (parentMech.posZ ?? 0) + mechH / 2 + (camObj.height ?? 50) / 2 + 10 : (camObj.posZ ?? 0);

        const cW = (camObj.width ?? 50) / 2;
        const cH = (camObj.height ?? 50) / 2;
        const cD = 25;

        const p = (x: number, y: number, z: number) => isoProject(cPosX + x, cPosY + y, cPosZ + z);
        const t0 = p(-cW, -cD, cH), t1 = p(cW, -cD, cH), t2 = p(cW, cD, cH), t3 = p(-cW, cD, cH);
        const b0 = p(-cW, -cD, -cH), b1 = p(cW, -cD, -cH), b2 = p(cW, cD, -cH), b3 = p(-cW, cD, -cH);

        const topFace = `${t0.x},${t0.y} ${t1.x},${t1.y} ${t2.x},${t2.y} ${t3.x},${t3.y}`;
        const frontFace = `${t0.x},${t0.y} ${t1.x},${t1.y} ${b1.x},${b1.y} ${b0.x},${b0.y}`;
        const rightFace = `${t1.x},${t1.y} ${t2.x},${t2.y} ${b2.x},${b2.y} ${b1.x},${b1.y}`;
        const leftFace = `${t0.x},${t0.y} ${t3.x},${t3.y} ${b3.x},${b3.y} ${b0.x},${b0.y}`;

        const fillFront = isMounted ? '#16a34a' : '#2563eb';
        const fillRight = isMounted ? '#166534' : '#1d4ed8';
        const fillTop = isMounted ? '#4ade80' : '#60a5fa';
        const fillLeft = isMounted ? '#15803d' : '#1e40af';
        const strokeColor = isMounted ? '#22c55e' : '#3b82f6';
        const labelColor = isMounted ? '#86efac' : '#93c5fd';

        const connectionLine = isMounted && parentMech ? (() => {
          const camCenter = isoProject(cPosX, cPosY, cPosZ);
          const mechCenter = isoProject(parentMech.posX ?? 0, parentMech.posY ?? 0, parentMech.posZ ?? 0);
          return (
            <g>
              <line x1={camCenter.x} y1={camCenter.y} x2={mechCenter.x} y2={mechCenter.y}
                stroke="#22c55e" strokeWidth={2} strokeDasharray="6 3" opacity={0.5} />
              <circle cx={mechCenter.x} cy={mechCenter.y} r={3} fill="#ea580c" opacity={0.8} />
              <text
                x={(camCenter.x + mechCenter.x) / 2} y={(camCenter.y + mechCenter.y) / 2 - 6}
                textAnchor="middle" fontSize="11" style={{ pointerEvents: 'none' }}
              >🔗</text>
            </g>
          );
        })() : null;

        const center = isoProject(cPosX, cPosY, cPosZ);

        return (
          <g key={`iso-cam-${camObj.id}`} opacity={isMounted ? 0.7 : 1}>
            {connectionLine}
            <g filter="url(#drop-shadow)">
              <polygon points={leftFace} fill={fillLeft} fillOpacity="0.3" stroke={strokeColor} strokeWidth="1.5" />
              <polygon points={frontFace} fill={fillFront} fillOpacity="0.5" stroke={strokeColor} strokeWidth="1.5" />
              <polygon points={rightFace} fill={fillRight} fillOpacity="0.5" stroke={strokeColor} strokeWidth="1.5" />
              <polygon points={topFace} fill={fillTop} fillOpacity="0.4" stroke={strokeColor} strokeWidth="1.5" />
              <line x1={t2.x} y1={t2.y} x2={t3.x} y2={t3.y} stroke={strokeColor} strokeWidth="1" strokeDasharray="4 3" opacity={0.35} />
              <line x1={t3.x} y1={t3.y} x2={b3.x} y2={b3.y} stroke={strokeColor} strokeWidth="1" strokeDasharray="4 3" opacity={0.35} />
              <line x1={b3.x} y1={b3.y} x2={b2.x} y2={b2.y} stroke={strokeColor} strokeWidth="1" strokeDasharray="4 3" opacity={0.35} />
              <line x1={b0.x} y1={b0.y} x2={b3.x} y2={b3.y} stroke={strokeColor} strokeWidth="1" strokeDasharray="4 3" opacity={0.35} />
              <line x1={b0.x} y1={b0.y} x2={b1.x} y2={b1.y} stroke={strokeColor} strokeWidth="1" strokeDasharray="4 3" opacity={0.35} />
              <line x1={b1.x} y1={b1.y} x2={b2.x} y2={b2.y} stroke={strokeColor} strokeWidth="1" strokeDasharray="4 3" opacity={0.35} />
              <circle
                cx={(t0.x + t1.x + b1.x + b0.x) / 4} cy={(t0.y + t1.y + b1.y + b0.y) / 4}
                r={Math.min(cW, cH) * 0.4} fill="rgba(0,0,0,0.3)"
                stroke={isMounted ? '#4ade80' : '#93c5fd'} strokeWidth={1.5}
              />
              <text
                x={center.x} y={Math.max(b0.y, b1.y, b2.y) + 18}
                textAnchor="middle" fill={labelColor} fontSize="10" fontWeight="600"
              >
                {isMounted ? '🔗 ' : ''}{camObj.name}
              </text>
            </g>
          </g>
        );
      })}

      {/* 2D camera rendering */}
      {!isIsometric && cameras.map(obj => {
        const isSelected = obj.id === selectedId;
        const isSecondSelected = obj.id === secondSelectedId;
        const isMounted = !!(obj as any).mountedToMechanismId;

        return (
          <g
            key={obj.id}
            transform={`translate(${obj.x}, ${obj.y}) rotate(${obj.rotation})`}
            onMouseDown={(e) => onMouseDown(e, obj)}
            style={{ cursor: obj.locked ? 'not-allowed' : panMode ? 'inherit' : 'move' }}
            filter={isSelected ? "url(#glow)" : "url(#drop-shadow)"}
            opacity={isMounted ? 0.7 : 1}
          >
            {(isSelected || isSecondSelected) && (
              <rect
                x={-obj.width / 2 - 6} y={-obj.height / 2 - 6}
                width={obj.width + 12} height={obj.height + 12}
                fill="none" stroke={isSecondSelected ? '#22c55e' : '#60a5fa'}
                strokeWidth="2" strokeDasharray="6 3" rx={8} className="animate-pulse"
              />
            )}
            <rect
              x={-obj.width / 2} y={-obj.height / 2}
              width={obj.width} height={obj.height}
              fill={isSelected ? 'url(#camera-grad)' : (isMounted ? '#16a34a' : '#2563eb')}
              stroke={isSelected ? '#93c5fd' : (isMounted ? '#22c55e' : '#3b82f6')}
              strokeWidth={isSelected ? 3 : 2} rx={6}
            />
            <circle cx={0} cy={-4} r={Math.min(obj.width, obj.height) * 0.22}
              fill="rgba(0,0,0,0.4)" stroke={isMounted ? '#4ade80' : '#93c5fd'} strokeWidth={2} />
            <circle cx={0} cy={-4} r={Math.min(obj.width, obj.height) * 0.12}
              fill={isMounted ? '#4ade80' : '#60a5fa'} opacity={0.8} />
            <rect x={-obj.width / 2} y={obj.height / 2 + 4} width={obj.width} height={18} rx={4} fill="rgba(30, 41, 59, 0.95)" />
            <text x={0} y={obj.height / 2 + 16} textAnchor="middle" fill={isMounted ? '#86efac' : '#93c5fd'} fontSize="10" fontWeight="600">
              {obj.name}
            </text>
            {obj.locked && (
              <g transform={`translate(${obj.width / 2 - 6}, ${-obj.height / 2 - 6})`}>
                <circle r={10} fill="#1e293b" stroke="#64748b" strokeWidth="1.5" />
                <Lock x={-5} y={-5} width={10} height={10} className="text-amber-400" />
              </g>
            )}
            {isSelected && obj.rotation !== 0 && (
              <text x={obj.width / 2 + 8} y={0} fill="#94a3b8" fontSize="9">{obj.rotation}°</text>
            )}
            <ResizeHandles object={obj} isSelected={isSelected} onResize={onResize} />
          </g>
        );
      })}
    </>
  );
});
