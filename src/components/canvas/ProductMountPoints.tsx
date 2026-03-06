import React, { useMemo } from 'react';
import { type LayoutObject } from './ObjectPropertyPanel';
import { getProductMountPoints, type ProductMountPoint, PRODUCT_INTERACTION_TYPES } from './MechanismSVG';

interface ProductMountPointsProps {
  mechanismObject: LayoutObject;
  currentView: 'front' | 'side' | 'top';
  productObject?: LayoutObject | null;
  draggingProductId?: string | null;
  scale: number;
}

export function ProductMountPoints({
  mechanismObject,
  currentView,
  productObject,
  draggingProductId,
  scale,
}: ProductMountPointsProps) {
  const mechanismType = mechanismObject.mechanismType || '';
  const mountPoints = useMemo(
    () => getProductMountPoints(mechanismType, currentView),
    [mechanismType, currentView]
  );

  // Check if dragging product is near any mount point
  const nearbyMounts = useMemo(() => {
    if (!draggingProductId || !productObject) return [];
    
    const snapThreshold = 80;
    
    return mountPoints.map(mp => {
      const mountWorldX = mechanismObject.x + mp.position.x * (mechanismObject.width / 2);
      const mountWorldY = mechanismObject.y + mp.position.y * (mechanismObject.height / 2);
      
      const dx = productObject.x - mountWorldX;
      const dy = productObject.y - mountWorldY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      return {
        mountPoint: mp,
        distance,
        isNear: distance < snapThreshold,
        worldX: mountWorldX,
        worldY: mountWorldY,
      };
    }).filter(m => m.isNear);
  }, [draggingProductId, productObject, mountPoints, mechanismObject]);

  if (mountPoints.length === 0) return null;

  return (
    <g>
      {mountPoints.map(mp => {
        const mpX = mp.position.x * (mechanismObject.width / 2);
        const mpY = mp.position.y * (mechanismObject.height / 2);
        const isNearby = nearbyMounts.some(n => n.mountPoint.id === mp.id);
        const isMounted = productObject?.mountedToMechanismId === mechanismObject.id;
        
        return (
          <g
            key={mp.id}
            transform={`translate(${mpX}, ${mpY})`}
          >
            {/* Click area */}
            <circle r={40} fill="transparent" />
            
            {/* Outer ring */}
            <circle
              r={isNearby ? 38 : 26}
              fill="none"
              stroke={isNearby ? '#22c55e' : '#06b6d4'}
              strokeWidth={2}
              strokeDasharray="8 4"
              opacity={isNearby ? 0.8 : 0.4}
            />
            
            {/* Main mount point */}
            <circle
              r={isNearby ? 26 : isMounted ? 18 : 14}
              fill={isNearby ? 'rgba(34, 197, 94, 0.4)' : isMounted ? 'rgba(6, 182, 212, 0.3)' : 'rgba(6, 182, 212, 0.2)'}
              stroke={isNearby ? '#22c55e' : isMounted ? '#06b6d4' : '#22d3ee'}
              strokeWidth={isNearby ? 4 : 3}
              strokeDasharray={isMounted ? 'none' : '6 3'}
              className={isNearby ? 'animate-pulse' : ''}
              style={{
                filter: isNearby ? 'drop-shadow(0 0 12px rgba(34, 197, 94, 0.7))' : 
                        isMounted ? 'drop-shadow(0 0 8px rgba(6, 182, 212, 0.5))' : 
                        'drop-shadow(0 0 6px rgba(6, 182, 212, 0.4))'
              }}
            />
            
            {/* Icon */}
            <text
              textAnchor="middle"
              dy={6}
              fill={isNearby ? '#22c55e' : isMounted ? '#06b6d4' : '#22d3ee'}
              fontSize={16}
              style={{ pointerEvents: 'none' }}
            >
              {isMounted ? '🔗' : '📦'}
            </text>
            
            {/* Snap hint */}
            {isNearby && (
              <g transform="translate(0, -36)">
                <rect 
                  x={-55} y={-14} width={110} height={26} rx={6} 
                  fill="rgba(34, 197, 94, 0.95)"
                  style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))' }}
                />
                <text x={0} y={2} textAnchor="middle" fill="#fff" fontSize={12} fontWeight="bold">
                  释放吸附产品
                </text>
              </g>
            )}
            
            {/* Description label */}
            {!isNearby && !isMounted && (
              <text
                y={24}
                textAnchor="middle"
                fill="#94a3b8"
                fontSize={9}
                style={{ pointerEvents: 'none' }}
              >
                {mp.description}
              </text>
            )}
          </g>
        );
      })}
    </g>
  );
}

// Helper: find nearest product mount point among product-interaction mechanisms
export function findNearestProductMountPoint(
  productX: number,
  productY: number,
  mechanisms: LayoutObject[],
  currentView: 'front' | 'side' | 'top',
  snapThreshold: number = 80
): { mechanism: LayoutObject; mountPoint: ProductMountPoint; distance: number } | null {
  let nearest: { mechanism: LayoutObject; mountPoint: ProductMountPoint; distance: number } | null = null;
  
  mechanisms.forEach(mech => {
    if (mech.type !== 'mechanism') return;
    if (!PRODUCT_INTERACTION_TYPES.includes(mech.mechanismType || '')) return;
    
    const mountPoints = getProductMountPoints(mech.mechanismType || '', currentView);
    
    mountPoints.forEach(mp => {
      const mountWorldX = mech.x + mp.position.x * (mech.width / 2);
      const mountWorldY = mech.y + mp.position.y * (mech.height / 2);
      
      const dx = productX - mountWorldX;
      const dy = productY - mountWorldY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < snapThreshold) {
        if (!nearest || distance < nearest.distance) {
          nearest = { mechanism: mech, mountPoint: mp, distance };
        }
      }
    });
  });
  
  return nearest;
}

// Get world position for a product mount point
export function getProductMountPointWorldPosition(
  mechanism: LayoutObject,
  mountPointId: string,
  currentView: 'front' | 'side' | 'top'
): { x: number; y: number } | null {
  const mechanismType = mechanism.mechanismType || '';
  const mountPoints = getProductMountPoints(mechanismType, currentView);
  const mp = mountPoints.find(p => p.id === mountPointId);
  
  if (!mp) return null;
  
  return {
    x: mechanism.x + mp.position.x * (mechanism.width / 2),
    y: mechanism.y + mp.position.y * (mechanism.height / 2),
  };
}

export default ProductMountPoints;
