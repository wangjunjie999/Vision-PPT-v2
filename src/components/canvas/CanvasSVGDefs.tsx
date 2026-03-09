import { memo } from 'react';

interface CanvasSVGDefsProps {
  gridSize: number;
}

export const CanvasSVGDefs = memo(function CanvasSVGDefs({ gridSize }: CanvasSVGDefsProps) {
  return (
    <defs>
      {/* Grid pattern */}
      <pattern id="grid-pattern" width={gridSize} height={gridSize} patternUnits="userSpaceOnUse">
        <path
          d={`M ${gridSize} 0 L 0 0 0 ${gridSize}`}
          fill="none"
          stroke="rgba(148, 163, 184, 0.15)"
          strokeWidth="0.5"
        />
      </pattern>
      <pattern id="grid-pattern-major" width={gridSize * 5} height={gridSize * 5} patternUnits="userSpaceOnUse">
        <path
          d={`M ${gridSize * 5} 0 L 0 0 0 ${gridSize * 5}`}
          fill="none"
          stroke="rgba(148, 163, 184, 0.3)"
          strokeWidth="1"
        />
      </pattern>

      {/* Product gradient */}
      <linearGradient id="product-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
        <stop offset="100%" stopColor="#0891b2" stopOpacity="0.6" />
      </linearGradient>

      {/* Camera gradient */}
      <linearGradient id="camera-grad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#3b82f6" />
        <stop offset="100%" stopColor="#1d4ed8" />
      </linearGradient>

      {/* Selected camera gradient */}
      <linearGradient id="camera-selected-grad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#60a5fa" />
        <stop offset="100%" stopColor="#3b82f6" />
      </linearGradient>

      {/* Mechanism gradient */}
      <linearGradient id="mech-grad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#f97316" />
        <stop offset="100%" stopColor="#ea580c" />
      </linearGradient>

      {/* Shadow filter */}
      <filter id="drop-shadow" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow dx="2" dy="4" stdDeviation="4" floodColor="#000" floodOpacity="0.3" />
      </filter>

      {/* Glow filter for selected */}
      <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="3" result="coloredBlur" />
        <feMerge>
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
  );
});
