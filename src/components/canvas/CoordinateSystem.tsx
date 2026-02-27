import { memo } from 'react';

type ViewType = 'front' | 'side' | 'top';

interface CoordinateSystemProps {
  centerX: number;
  centerY: number;
  canvasWidth: number;
  canvasHeight: number;
  scale: number; // pixels per mm
  currentView: ViewType;
  gridSize: number;
}

// Get axis labels based on view type
const getAxisLabels = (view: ViewType) => {
  switch (view) {
    case 'front': // XZ plane
      return { horizontal: 'X', vertical: 'Z', unit: 'mm' };
    case 'side': // YZ plane  
      return { horizontal: 'Y', vertical: 'Z', unit: 'mm' };
    case 'top': // XY plane
      return { horizontal: 'X', vertical: 'Y', unit: 'mm' };
    default:
      return { horizontal: 'X', vertical: 'Z', unit: 'mm' };
  }
};

export const CoordinateSystem = memo(function CoordinateSystem({
  centerX,
  centerY,
  canvasWidth,
  canvasHeight,
  scale,
  currentView,
  gridSize,
}: CoordinateSystemProps) {
  const axisLabels = getAxisLabels(currentView);
  
  // Scale ruler settings
  const rulerTickInterval = 100; // mm
  const tickPixels = rulerTickInterval * scale;
  const majorTickLength = 16;
  const minorTickLength = 10;
  
  // Generate ruler ticks
  const horizontalTicks: { pos: number; value: number; isMajor: boolean }[] = [];
  const verticalTicks: { pos: number; value: number; isMajor: boolean }[] = [];
  
  // Horizontal axis ticks (from center going both directions)
  for (let mm = 0; mm <= canvasWidth / scale / 2 + rulerTickInterval; mm += rulerTickInterval / 2) {
    if (mm > 0) {
      const posRight = centerX + mm * scale;
      const posLeft = centerX - mm * scale;
      const isMajor = mm % rulerTickInterval === 0;
      
      if (posRight < canvasWidth) {
        horizontalTicks.push({ pos: posRight, value: mm, isMajor });
      }
      if (posLeft > 0) {
        horizontalTicks.push({ pos: posLeft, value: -mm, isMajor });
      }
    }
  }
  
  // Vertical axis ticks (from center going both directions)
  for (let mm = 0; mm <= canvasHeight / scale / 2 + rulerTickInterval; mm += rulerTickInterval / 2) {
    if (mm > 0) {
      const posDown = centerY + mm * scale;
      const posUp = centerY - mm * scale;
      const isMajor = mm % rulerTickInterval === 0;
      
      // For Z axis (front/side view), up is positive
      // For Y axis (top view), could be either direction
      if (posUp > 0) {
        verticalTicks.push({ 
          pos: posUp, 
          value: currentView === 'top' ? -mm : mm, 
          isMajor 
        });
      }
      if (posDown < canvasHeight) {
        verticalTicks.push({ 
          pos: posDown, 
          value: currentView === 'top' ? mm : -mm, 
          isMajor 
        });
      }
    }
  }

  return (
    <g className="coordinate-system">
      {/* Axis lines with enhanced styling */}
      <line 
        x1={40} 
        y1={centerY} 
        x2={canvasWidth - 20} 
        y2={centerY} 
        stroke="hsl(var(--primary))" 
        strokeWidth="1.5" 
        opacity="0.6"
        markerEnd="url(#arrowhead-h)"
      />
      <line 
        x1={centerX} 
        y1={canvasHeight - 40} 
        x2={centerX} 
        y2={20} 
        stroke="hsl(var(--primary))" 
        strokeWidth="1.5" 
        opacity="0.6"
        markerEnd="url(#arrowhead-v)"
      />
      
      {/* Arrow markers */}
      <defs>
        <marker 
          id="arrowhead-h" 
          markerWidth="8" 
          markerHeight="6" 
          refX="8" 
          refY="3" 
          orient="auto"
        >
          <polygon points="0 0, 8 3, 0 6" fill="hsl(var(--primary))" opacity="0.6" />
        </marker>
        <marker 
          id="arrowhead-v" 
          markerWidth="8" 
          markerHeight="6" 
          refX="8" 
          refY="3" 
          orient="auto"
        >
          <polygon points="0 0, 8 3, 0 6" fill="hsl(var(--primary))" opacity="0.6" />
        </marker>
      </defs>
      
      {/* Horizontal axis label */}
      <g transform={`translate(${canvasWidth - 35}, ${centerY + 28})`}>
        <rect x="-18" y="-14" width="36" height="28" rx="5" fill="hsl(220 60% 50%)" opacity="0.9" />
        <text 
          textAnchor="middle" 
          fill="white" 
          fontSize="15" 
          fontWeight="700"
          y="6"
        >
          {axisLabels.horizontal}
        </text>
      </g>
      
      {/* Vertical axis label */}
      <g transform={`translate(${centerX - 32}, 35)`}>
        <rect x="-18" y="-14" width="36" height="28" rx="5" fill="hsl(142 60% 45%)" opacity="0.9" />
        <text 
          textAnchor="middle" 
          fill="white" 
          fontSize="15" 
          fontWeight="700"
          y="6"
        >
          {axisLabels.vertical}
        </text>
      </g>
      
      {/* Origin label */}
      <g transform={`translate(${centerX + 22}, ${centerY + 22})`}>
        <rect x="-15" y="-13" width="30" height="26" rx="5" fill="hsl(var(--muted))" opacity="0.9" />
        <text 
          textAnchor="middle" 
          fill="hsl(var(--muted-foreground))" 
          fontSize="13" 
          fontWeight="600"
          y="5"
        >
          O
        </text>
      </g>
      
      {/* Horizontal ruler ticks */}
      {horizontalTicks.map((tick, i) => (
        <g key={`h-${i}`}>
          <line
            x1={tick.pos}
            y1={centerY - (tick.isMajor ? majorTickLength : minorTickLength)}
            x2={tick.pos}
            y2={centerY + (tick.isMajor ? majorTickLength : minorTickLength)}
            stroke="hsl(var(--muted-foreground))"
            strokeWidth={tick.isMajor ? 1 : 0.5}
            opacity={tick.isMajor ? 0.5 : 0.3}
          />
          {tick.isMajor && tick.value !== 0 && (
            <text
              x={tick.pos}
              y={centerY + majorTickLength + 14}
              textAnchor="middle"
              fill="hsl(var(--muted-foreground))"
              fontSize="9"
              fontWeight="500"
            >
              {tick.value}
            </text>
          )}
        </g>
      ))}
      
      {/* Vertical ruler ticks */}
      {verticalTicks.map((tick, i) => (
        <g key={`v-${i}`}>
          <line
            x1={centerX - (tick.isMajor ? majorTickLength : minorTickLength)}
            y1={tick.pos}
            x2={centerX + (tick.isMajor ? majorTickLength : minorTickLength)}
            y2={tick.pos}
            stroke="hsl(var(--muted-foreground))"
            strokeWidth={tick.isMajor ? 1 : 0.5}
            opacity={tick.isMajor ? 0.5 : 0.3}
          />
          {tick.isMajor && tick.value !== 0 && (
            <text
              x={centerX - majorTickLength - 8}
              y={tick.pos + 3}
              textAnchor="end"
              fill="hsl(var(--muted-foreground))"
              fontSize="9"
              fontWeight="500"
            >
              {tick.value}
            </text>
          )}
        </g>
      ))}
      
      {/* Scale bar and plane indicator moved to viewport-fixed overlay */}
    </g>
  );
});
