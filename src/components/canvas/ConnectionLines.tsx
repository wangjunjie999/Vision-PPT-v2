import { memo, useMemo } from 'react';
import type { LayoutObject } from './ObjectPropertyPanel';
import { getMountPointWorldPosition } from './CameraMountPoints';
import { getMechanismMountPoints } from './MechanismSVG';

interface ConnectionLinesProps {
  objects: LayoutObject[];
  isIsometric: boolean;
  currentView?: 'front' | 'side' | 'top';
}

export const ConnectionLines = memo(function ConnectionLines({ objects, isIsometric, currentView = 'front' }: ConnectionLinesProps) {
  const robotArmIds = useMemo(() => {
    return new Set(
      objects.filter(o => o.type === 'mechanism' && o.mechanismType === 'robot_arm').map(o => o.id)
    );
  }, [objects]);

  const products = useMemo(() => objects.filter(o => o.type === 'product'), [objects]);

  // Find nearest product to a mechanism
  const findNearestProduct = (mech: { x: number; y: number }) => {
    if (products.length === 0) return null;
    let nearest = products[0];
    let minDist = Infinity;
    for (const p of products) {
      const d = Math.sqrt((p.x - mech.x) ** 2 + (p.y - mech.y) ** 2);
      if (d < minDist) { minDist = d; nearest = p; }
    }
    return nearest;
  };

  return (
    <>
      {/* Camera → mechanism connections (2D only) */}
      {!isIsometric && objects.filter(obj => obj.type === 'camera' && obj.mountedToMechanismId).map(cam => {
        const mech = objects.find(o => o.id === cam.mountedToMechanismId);
        if (!mech) return null;

        const isRobotArm = robotArmIds.has(mech.id);

        // For robot_arm, use dynamic arm_end mount point (tracking nearest product)
        let startX = mech.x;
        let startY = mech.y;
        if (isRobotArm) {
          const nearestProduct = findNearestProduct(mech);
          const mountPoints = getMechanismMountPoints(
            'robot_arm', currentView,
            nearestProduct ? { x: nearestProduct.x, y: nearestProduct.y } : undefined,
            { x: mech.x, y: mech.y },
          );
          const armEnd = mountPoints.find(mp => mp.id === 'arm_end');
          if (armEnd) {
            startX = mech.x + armEnd.position.x * (mech.width / 2);
            startY = mech.y + armEnd.position.y * (mech.height / 2);
          }
        }

        if (isRobotArm) {
          // Linkage-style connection for robot arm
          const midX = (startX + cam.x) / 2;
          const midY = (startY + cam.y) / 2;

          return (
            <g key={`conn-${cam.id}`}>
              {/* Flange ring at arm end */}
              <circle cx={startX} cy={startY} r={10} fill="rgba(249,115,22,0.15)" stroke="#f97316" strokeWidth={2.5} />
              <circle cx={startX} cy={startY} r={5} fill="#f97316" opacity={0.6} />
              <text x={startX} y={startY + 4} textAnchor="middle" fontSize="8" fill="#fff" style={{ pointerEvents: 'none' }}>⊕</text>

              {/* Linkage line: solid thick line with joint markers */}
              <line
                x1={startX} y1={startY} x2={midX} y2={midY}
                stroke="#3b82f6" strokeWidth={3} opacity={0.85}
              />
              <line
                x1={midX} y1={midY} x2={cam.x} y2={cam.y}
                stroke="#3b82f6" strokeWidth={3} opacity={0.85}
              />

              {/* Joint marker at midpoint */}
              <circle cx={midX} cy={midY} r={4} fill="#1e293b" stroke="#3b82f6" strokeWidth={2} />

              {/* Arrow at camera end */}
              {(() => {
                const dx = cam.x - midX;
                const dy = cam.y - midY;
                const len = Math.sqrt(dx * dx + dy * dy);
                if (len < 1) return null;
                const ux = dx / len;
                const uy = dy / len;
                const ax = cam.x - ux * 10;
                const ay = cam.y - uy * 10;
                const px = -uy * 5;
                const py = ux * 5;
                return (
                  <polygon
                    points={`${cam.x},${cam.y} ${ax + px},${ay + py} ${ax - px},${ay - py}`}
                    fill="#3b82f6" opacity={0.85}
                  />
                );
              })()}

              {/* Camera end dot */}
              <circle cx={cam.x} cy={cam.y} r={4} fill="#3b82f6" opacity={0.8} />

              {/* Label */}
              <text
                x={midX} y={midY - 10}
                textAnchor="middle" fontSize="9" fill="#93c5fd"
                style={{ pointerEvents: 'none' }}
              >🔗 末端挂载</text>
            </g>
          );
        }

        // Default connection for non-robot-arm mechanisms
        return (
          <g key={`conn-${cam.id}`}>
            <line
              x1={startX} y1={startY} x2={cam.x} y2={cam.y}
              stroke="#3b82f6" strokeWidth={2} strokeDasharray="8 4" opacity={0.6}
            />
            <circle cx={startX} cy={startY} r={4} fill="#ea580c" opacity={0.8} />
            <circle cx={cam.x} cy={cam.y} r={4} fill="#3b82f6" opacity={0.8} />
            <text
              x={(startX + cam.x) / 2} y={(startY + cam.y) / 2 - 6}
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
