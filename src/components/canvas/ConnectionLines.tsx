import { memo } from 'react';
import type { LayoutObject } from './ObjectPropertyPanel';

interface ConnectionLinesProps {
  objects: LayoutObject[];
  isIsometric: boolean;
}

export const ConnectionLines = memo(function ConnectionLines({ objects, isIsometric }: ConnectionLinesProps) {
  return (
    <>
      {/* Camera → mechanism connections (2D only) */}
      {!isIsometric && objects.filter(obj => obj.type === 'camera' && obj.mountedToMechanismId).map(cam => {
        const mech = objects.find(o => o.id === cam.mountedToMechanismId);
        if (!mech) return null;
        return (
          <g key={`conn-${cam.id}`}>
            <line
              x1={cam.x} y1={cam.y} x2={mech.x} y2={mech.y}
              stroke="#3b82f6" strokeWidth={2} strokeDasharray="8 4" opacity={0.6}
            />
            <circle cx={cam.x} cy={cam.y} r={4} fill="#3b82f6" opacity={0.8} />
            <circle cx={mech.x} cy={mech.y} r={4} fill="#ea580c" opacity={0.8} />
            <text
              x={(cam.x + mech.x) / 2} y={(cam.y + mech.y) / 2 - 6}
              textAnchor="middle" fontSize="12" style={{ pointerEvents: 'none' }}
            >🔗</text>
          </g>
        );
      })}

      {/* Product → mechanism connections */}
      {objects.filter(obj => obj.type === 'product' && obj.mountedToMechanismId).map(prod => {
        const mech = objects.find(o => o.id === prod.mountedToMechanismId);
        if (!mech) return null;
        return (
          <g key={`conn-product-${prod.id}`}>
            <line
              x1={prod.x} y1={prod.y} x2={mech.x} y2={mech.y}
              stroke="#22c55e" strokeWidth={2} strokeDasharray="8 4" opacity={0.6}
            />
            <circle cx={prod.x} cy={prod.y} r={4} fill="#06b6d4" opacity={0.8} />
            <circle cx={mech.x} cy={mech.y} r={4} fill="#ea580c" opacity={0.8} />
            <text
              x={(prod.x + mech.x) / 2} y={(prod.y + mech.y) / 2 - 6}
              textAnchor="middle" fontSize="12" style={{ pointerEvents: 'none' }}
            >📦</text>
          </g>
        );
      })}
    </>
  );
});
