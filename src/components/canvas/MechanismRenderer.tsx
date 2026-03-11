import { memo, useMemo } from 'react';
import { Lock } from 'lucide-react';
import type { LayoutObject } from './ObjectPropertyPanel';
import { ResizeHandles } from './ResizeHandles';
import { CAMERA_INTERACTION_TYPES, PRODUCT_INTERACTION_TYPES, getMechanismMountPoints } from './MechanismSVG';

interface MechanismRendererProps {
  objects: LayoutObject[];
  selectedId: string | null;
  secondSelectedId: string | null;
  panMode: boolean;
  isDragging: boolean;
  draggingObject: LayoutObject | null;
  onMouseDown: (e: React.MouseEvent, obj: LayoutObject) => void;
  onResize: (id: string, width: number, height: number, x: number, y: number) => void;
  getMechanismImageForObject: (obj: LayoutObject) => string | null;
  currentView?: 'front' | 'side' | 'top';
}

export const MechanismRenderer = memo(function MechanismRenderer({
  objects, selectedId, secondSelectedId, panMode, isDragging, draggingObject,
  onMouseDown, onResize, getMechanismImageForObject,
}: MechanismRendererProps) {
  const mechanisms = objects.filter(obj => obj.type === 'mechanism');

  return (
    <>
      {mechanisms.map(obj => {
        const isSelected = obj.id === selectedId;
        const isSecondSelected = obj.id === secondSelectedId;
        const mechImage = getMechanismImageForObject(obj);

        return (
          <g
            key={obj.id}
            transform={`translate(${obj.x}, ${obj.y}) rotate(${obj.rotation})`}
            onMouseDown={(e) => onMouseDown(e, obj)}
            style={{ cursor: obj.locked ? 'not-allowed' : panMode ? 'inherit' : 'move' }}
            filter={isSelected ? "url(#glow)" : "url(#drop-shadow)"}
          >
            {(isSelected || isSecondSelected) && (
              <rect
                x={-obj.width / 2 - 6} y={-obj.height / 2 - 6}
                width={obj.width + 12} height={obj.height + 12}
                fill="none" stroke={isSecondSelected ? '#22c55e' : '#60a5fa'}
                strokeWidth="2" strokeDasharray="6 3" rx={8} className="animate-pulse"
              />
            )}

            {mechImage ? (
              <>
                <rect
                  x={-obj.width / 2 - 2} y={-obj.height / 2 - 2}
                  width={obj.width + 4} height={obj.height + 4}
                  fill="rgba(30, 41, 59, 0.9)"
                  stroke={isSelected ? '#fb923c' : '#ea580c'}
                  strokeWidth={isSelected ? 3 : 2} rx={6}
                />
                <image
                  href={mechImage}
                  x={-obj.width / 2} y={-obj.height / 2}
                  width={obj.width} height={obj.height}
                  preserveAspectRatio="xMidYMid meet"
                  style={{ pointerEvents: 'none' }}
                />
              </>
            ) : (
              <rect
                x={-obj.width / 2} y={-obj.height / 2}
                width={obj.width} height={obj.height}
                fill={isSelected ? 'url(#mech-grad)' : '#ea580c'}
                stroke={isSelected ? '#fdba74' : '#c2410c'}
                strokeWidth={isSelected ? 3 : 2} rx={6}
              />
            )}

            <rect x={-obj.width / 2} y={obj.height / 2 + 4} width={obj.width} height={18} rx={4} fill="rgba(30, 41, 59, 0.95)" />
            <text x={0} y={obj.height / 2 + 16} textAnchor="middle" fill="#fdba74" fontSize="10" fontWeight="600">
              {obj.name}
            </text>

            {/* Category label badge */}
            {(() => {
              const isCameraType = CAMERA_INTERACTION_TYPES.includes(obj.mechanismType || '');
              const isProductType = PRODUCT_INTERACTION_TYPES.includes(obj.mechanismType || '');
              if (!isCameraType && !isProductType) return null;
              const badgeColor = isCameraType ? '#3b82f6' : '#22c55e';
              const badgeBg = isCameraType ? 'rgba(59,130,246,0.2)' : 'rgba(34,197,94,0.2)';
              const badgeIcon = isCameraType ? '📷' : '📦';
              const badgeLabel = isCameraType ? '相机' : '产品';
              return (
                <g transform={`translate(${-obj.width / 2 + 2}, ${-obj.height / 2 - 4})`}>
                  <rect x={0} y={-10} width={36} height={14} rx={7} fill={badgeBg} stroke={badgeColor} strokeWidth={1} />
                  <text x={4} y={0} fill={badgeColor} fontSize="8" fontWeight="600">
                    {badgeIcon} {badgeLabel}
                  </text>
                </g>
              );
            })()}

            {/* Incompatibility warning when dragging */}
            {isDragging && draggingObject && (() => {
              const mechType = obj.mechanismType || '';
              const isCameraMech = CAMERA_INTERACTION_TYPES.includes(mechType);
              const isProductMech = PRODUCT_INTERACTION_TYPES.includes(mechType);
              const draggingCamera = draggingObject.type === 'camera';
              const draggingProduct = draggingObject.type === 'product';

              const dx = draggingObject.x - obj.x;
              const dy = draggingObject.y - obj.y;
              const distance = Math.sqrt(dx * dx + dy * dy);

              const isIncompatible = (draggingCamera && isProductMech) || (draggingProduct && isCameraMech);
              if (!isIncompatible || distance > 120) return null;

              return (
                <g>
                  <rect
                    x={-obj.width / 2 - 3} y={-obj.height / 2 - 3}
                    width={obj.width + 6} height={obj.height + 6}
                    fill="rgba(239,68,68,0.15)" stroke="#ef4444"
                    strokeWidth={2} strokeDasharray="4 3" rx={6}
                  />
                  <circle cx={0} cy={-obj.height / 2 - 16} r={12} fill="rgba(239,68,68,0.9)" />
                  <line x1={-6} y1={-obj.height / 2 - 16} x2={6} y2={-obj.height / 2 - 16} stroke="#fff" strokeWidth={2.5} />
                  <text x={14} y={-obj.height / 2 - 12} fill="#ef4444" fontSize="8" fontWeight="600">
                    {draggingCamera ? '不支持相机' : '不支持产品'}
                  </text>
                </g>
              );
            })()}

            {obj.locked && (
              <g transform={`translate(${obj.width / 2 - 6}, ${-obj.height / 2 - 6})`}>
                <circle r={10} fill="#1e293b" stroke="#64748b" strokeWidth="1.5" />
                <Lock x={-5} y={-5} width={10} height={10} className="text-amber-400" />
              </g>
            )}

            {isSelected && obj.rotation !== 0 && (
              <text x={obj.width / 2 + 8} y={0} fill="#94a3b8" fontSize="9">
                {obj.rotation}°
              </text>
            )}

            <ResizeHandles object={obj} isSelected={isSelected} onResize={onResize} />
          </g>
        );
      })}
    </>
  );
});
