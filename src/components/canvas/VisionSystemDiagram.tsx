import { Camera, Light, Lens, Controller } from '@/hooks/useHardware';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Check } from 'lucide-react';
import { useState, useCallback } from 'react';

// Hardware image with error handling
function HardwareImage({ 
  url, 
  alt, 
  type,
  className 
}: { 
  url: string | null | undefined; 
  alt: string;
  type: 'camera' | 'lens' | 'light' | 'controller';
  className?: string;
}) {
  const [hasError, setHasError] = useState(false);
  
  const handleError = useCallback(() => {
    setHasError(true);
  }, []);
  
  const emoji = type === 'camera' ? '📷' : type === 'lens' ? '🔭' : type === 'light' ? '💡' : '🖥️';
  
  if (!url || hasError) {
    return <span className="text-2xl">{emoji}</span>;
  }
  
  return (
    <img 
      src={url} 
      alt={alt} 
      className={className || "w-full h-full object-cover"}
      onError={handleError}
    />
  );
}

interface HardwareSelectPopoverProps {
  type: 'camera' | 'lens' | 'light' | 'controller';
  items: (Camera | Lens | Light | Controller)[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  children: React.ReactNode;
  disabled?: boolean;
}

function HardwareSelectPopover({ 
  type, 
  items, 
  selectedId, 
  onSelect, 
  children,
  disabled 
}: HardwareSelectPopoverProps) {
  const [open, setOpen] = useState(false);

  const typeLabels = {
    camera: '选择相机',
    lens: '选择镜头',
    light: '选择光源',
    controller: '选择工控机'
  };

  const getItemDetails = (item: Camera | Lens | Light | Controller) => {
    if ('resolution' in item && 'frame_rate' in item) {
      const camera = item as Camera;
      return `${camera.resolution} @ ${camera.frame_rate}fps`;
    }
    if ('focal_length' in item) {
      const lens = item as Lens;
      return `${lens.focal_length} · ${lens.aperture}`;
    }
    if ('color' in item && 'power' in item) {
      const light = item as Light;
      return `${light.color}${light.type} · ${light.power}`;
    }
    if ('cpu' in item) {
      const controller = item as Controller;
      return `${controller.cpu} · ${controller.memory}`;
    }
    return '';
  };

  if (disabled) {
    return <>{children}</>;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="px-3 py-2 border-b border-border">
          <h4 className="font-semibold text-sm">{typeLabels[type]}</h4>
          <p className="text-xs text-muted-foreground">点击选择硬件设备</p>
        </div>
        <ScrollArea className="h-64">
          <div className="p-2 space-y-1">
            {items.filter(i => i.enabled).map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onSelect(item.id);
                  setOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors",
                  "hover:bg-accent",
                  selectedId === item.id && "bg-primary/10 border border-primary/30"
                )}
              >
                <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                  <HardwareImage url={item.image_url} alt={item.model} type={type} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">{item.brand}</span>
                    {selectedId === item.id && (
                      <Check className="h-4 w-4 text-primary flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{item.model}</p>
                  <p className="text-xs text-muted-foreground">{getItemDetails(item)}</p>
                </div>
              </button>
            ))}
            {items.filter(i => i.enabled).length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm">
                暂无可用{typeLabels[type].replace('选择', '')}
              </div>
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

// --- Systematic Cartography: Constants ---
const SC = {
  navy: '#1A1A2E',
  slate: '#334155',
  cyan: '#0891B2',
  cyanLight: '#06B6D4',
  gridTertiary: '#94A3B8',
  textPrimary: '#1A1A2E',
  textSecondary: '#475569',
  textTertiary: '#94A3B8',
  cardBg: '#F8FAFC',
  cardBorder: '#CBD5E1',
  white: '#FFFFFF',
  mono: "'Geist Mono', 'JetBrains Mono', 'SF Mono', 'Consolas', monospace",
  sans: "'Inter', 'Jura', sans-serif",
};

// Registration corner marks
function RegistrationMarks({ x, y, w, h, size = 12 }: { x: number; y: number; w: number; h: number; size?: number }) {
  const s = size;
  return (
    <g stroke={SC.navy} strokeWidth="1.5" fill="none" opacity="0.4">
      {/* Top-left */}
      <path d={`M${x},${y + s} L${x},${y} L${x + s},${y}`} />
      {/* Top-right */}
      <path d={`M${x + w - s},${y} L${x + w},${y} L${x + w},${y + s}`} />
      {/* Bottom-left */}
      <path d={`M${x},${y + h - s} L${x},${y + h} L${x + s},${y + h}`} />
      {/* Bottom-right */}
      <path d={`M${x + w - s},${y + h} L${x + w},${y + h} L${x + w},${y + h - s}`} />
    </g>
  );
}

// Precision tick ruler along edge
function TickRuler({ x1, y1, x2, y2, count, tickLen = 4, label = true }: { x1: number; y1: number; x2: number; y2: number; count: number; tickLen?: number; label?: boolean }) {
  const isHorizontal = y1 === y2;
  const ticks = [];
  for (let i = 0; i <= count; i++) {
    const t = i / count;
    const isMajor = i % 5 === 0;
    const len = isMajor ? tickLen * 2 : tickLen;
    if (isHorizontal) {
      const cx = x1 + (x2 - x1) * t;
      ticks.push(
        <g key={i}>
          <line x1={cx} y1={y1} x2={cx} y2={y1 - len} stroke={SC.gridTertiary} strokeWidth={isMajor ? 0.8 : 0.4} opacity={isMajor ? 0.5 : 0.3} />
          {label && isMajor && (
            <text x={cx} y={y1 - len - 2} textAnchor="middle" fill={SC.textTertiary} style={{ fontSize: '6px', fontFamily: SC.mono }}>{Math.round(cx)}</text>
          )}
        </g>
      );
    } else {
      const cy = y1 + (y2 - y1) * t;
      ticks.push(
        <g key={i}>
          <line x1={x1} y1={cy} x2={x1 - len} y2={cy} stroke={SC.gridTertiary} strokeWidth={isMajor ? 0.8 : 0.4} opacity={isMajor ? 0.5 : 0.3} />
          {label && isMajor && (
            <text x={x1 - len - 2} y={cy + 2} textAnchor="end" fill={SC.textTertiary} style={{ fontSize: '6px', fontFamily: SC.mono }}>{Math.round(cy)}</text>
          )}
        </g>
      );
    }
  }
  return <g>{ticks}</g>;
}

// Annotation card for export mode (pure SVG)
function AnnotationCard({ x, y, w, h, refId, title, lines, accentLine = false }: {
  x: number; y: number; w: number; h: number;
  refId: string; title: string;
  lines: { text: string; secondary?: boolean }[];
  accentLine?: boolean;
}) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <rect width={w} height={h} rx="2" fill={SC.cardBg} stroke={SC.cardBorder} strokeWidth="0.5" />
      {accentLine && <line x1="0" y1="0" x2="0" y2={h} stroke={SC.cyan} strokeWidth="2" />}
      {/* REF ID */}
      <text x={w - 8} y="12" textAnchor="end" fill={SC.textTertiary} style={{ fontSize: '7px', fontFamily: SC.mono, letterSpacing: '0.08em' }}>{refId}</text>
      {/* Title */}
      <text x="10" y="14" fill={SC.textPrimary} style={{ fontSize: '10px', fontFamily: SC.mono, fontWeight: 600, letterSpacing: '0.1em' }}>{title}</text>
      {/* Separator */}
      <line x1="10" y1="19" x2={w - 10} y2="19" stroke={SC.cardBorder} strokeWidth="0.5" />
      {/* Data lines */}
      {lines.map((line, i) => (
        <text key={i} x="10" y={30 + i * 12} fill={line.secondary ? SC.textSecondary : SC.textPrimary} style={{ fontSize: '9px', fontFamily: SC.mono }}>
          {line.text}
        </text>
      ))}
    </g>
  );
}

interface VisionSystemDiagramProps {
  camera: Camera | null;
  lens: Lens | null;
  light: Light | null;
  controller?: Controller | null;
  cameras?: Camera[];
  lenses?: Lens[];
  lights?: Light[];
  controllers?: Controller[];
  onCameraSelect?: (id: string) => void;
  onLensSelect?: (id: string) => void;
  onLightSelect?: (id: string) => void;
  onControllerSelect?: (id: string) => void;
  lightDistance?: number;
  fovAngle?: number;
  onFovAngleChange?: (angle: number) => void;
  onLightDistanceChange?: (distance: number) => void;
  roiStrategy?: string;
  moduleType?: string;
  interactive?: boolean;
  className?: string;
}

export function VisionSystemDiagram({ 
  camera, 
  lens, 
  light,
  controller,
  cameras = [],
  lenses = [],
  lights = [],
  controllers = [],
  onCameraSelect,
  onLensSelect,
  onLightSelect,
  onControllerSelect,
  lightDistance = 335,
  fovAngle = 45,
  onFovAngleChange,
  onLightDistanceChange,
  roiStrategy = 'full',
  moduleType = 'defect',
  interactive = true,
  className
}: VisionSystemDiagramProps) {
  const hasCamera = !!camera;
  const hasLens = !!lens;
  const hasLight = !!light;
  const hasController = !!controller;

  const fovRadians = (fovAngle / 2) * (Math.PI / 180);
  const fovLength = 250;
  const fovOffsetX = Math.tan(fovRadians) * fovLength;

  const interactiveClass = interactive ? "cursor-pointer hover:opacity-80 transition-opacity" : "";

  return (
    <div className={cn("relative w-full h-full min-h-[700px]", className)} style={{ backgroundColor: SC.white, contain: 'layout style paint', ...(interactive ? { willChange: 'transform' } : {}) }}>
      <svg 
        viewBox="0 0 800 750"
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
        shapeRendering="geometricPrecision"
        style={{ maxHeight: '100%', ...(interactive ? { transform: 'translateZ(0)' } : {}) }}
      >
        <defs>
          {/* FOV gradient — precision cyan */}
          <linearGradient id="fovGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={SC.cyan} stopOpacity="0.20" />
            <stop offset="40%" stopColor={SC.cyan} stopOpacity="0.10" />
            <stop offset="100%" stopColor={SC.cyan} stopOpacity="0.02" />
          </linearGradient>

          {/* Camera body gradient — navy instrument */}
          <linearGradient id="cameraBody" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(220, 40%, 32%)" />
            <stop offset="50%" stopColor="hsl(220, 40%, 24%)" />
            <stop offset="100%" stopColor="hsl(220, 40%, 18%)" />
          </linearGradient>
          <linearGradient id="cameraBodyHover" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(220, 45%, 40%)" />
            <stop offset="100%" stopColor="hsl(220, 45%, 28%)" />
          </linearGradient>

          {/* Lens gradient — dark instrument */}
          <linearGradient id="lensBody" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(220, 15%, 35%)" />
            <stop offset="50%" stopColor="hsl(220, 15%, 25%)" />
            <stop offset="100%" stopColor="hsl(220, 15%, 18%)" />
          </linearGradient>
          <radialGradient id="lensGlass" cx="50%" cy="30%" r="60%">
            <stop offset="0%" stopColor={SC.cyanLight} stopOpacity="0.6" />
            <stop offset="100%" stopColor={SC.cyan} stopOpacity="0.25" />
          </radialGradient>

          {/* Product — light slate */}
          <linearGradient id="productBody" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(220, 15%, 88%)" />
            <stop offset="100%" stopColor="hsl(220, 15%, 82%)" />
          </linearGradient>

          {/* Glow filters */}
          <filter id="lightGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="selectGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>

          {/* Arrow markers — cyan */}
          <marker id="arrowUp" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
            <path d="M1,7 L4,1 L7,7" fill="none" stroke={SC.cyan} strokeWidth="1.5" />
          </marker>
          <marker id="arrowDown" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
            <path d="M1,1 L4,7 L7,1" fill="none" stroke={SC.cyan} strokeWidth="1.5" />
          </marker>
          <marker id="arrowLeft" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
            <path d="M7,1 L1,4 L7,7" fill="none" stroke={SC.cyan} strokeWidth="1.5" />
          </marker>
          <marker id="arrowRight" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
            <path d="M1,1 L7,4 L1,7" fill="none" stroke={SC.cyan} strokeWidth="1.5" />
          </marker>
        </defs>

        {/* ===== SYSTEMATIC CARTOGRAPHY FRAME ===== */}
        
        {/* Outer border — thin precision line */}
        <rect x="40" y="10" width="450" height="510" fill="none" stroke={SC.navy} strokeWidth="0.8" opacity="0.25" />

        {/* Registration corner marks */}
        <RegistrationMarks x={40} y={10} w={450} h={510} size={14} />

        {/* Tick rulers along diagram edge */}
        <TickRuler x1={40} y1={520} x2={490} y2={520} count={45} tickLen={3} label={false} />
        <TickRuler x1={40} y1={10} x2={40} y2={520} count={50} tickLen={3} label={false} />

        {/* Coordinate reference labels */}
        <text x="44" y="8" fill={SC.textTertiary} style={{ fontSize: '6px', fontFamily: SC.mono, letterSpacing: '0.15em' }}>X:040</text>
        <text x="484" y="8" fill={SC.textTertiary} style={{ fontSize: '6px', fontFamily: SC.mono, letterSpacing: '0.15em' }} textAnchor="end">X:490</text>
        <text x="36" y="16" fill={SC.textTertiary} style={{ fontSize: '6px', fontFamily: SC.mono, letterSpacing: '0.15em' }} textAnchor="end" transform="rotate(-90, 36, 16)">Y:010</text>

        {/* Precision grid — fine instrument lines */}
        <g opacity="0.04">
          {Array.from({ length: 26 }).map((_, i) => (
            <line key={`h${i}`} x1="40" y1={10 + i * 20} x2="490" y2={10 + i * 20} stroke={SC.navy} strokeWidth="0.5" />
          ))}
          {Array.from({ length: 23 }).map((_, i) => (
            <line key={`v${i}`} x1={40 + i * 20} y1="10" x2={40 + i * 20} y2="520" stroke={SC.navy} strokeWidth="0.5" />
          ))}
        </g>
        {/* Major grid — every 100px */}
        <g opacity="0.08">
          {Array.from({ length: 6 }).map((_, i) => (
            <line key={`mh${i}`} x1="40" y1={10 + i * 100} x2="490" y2={10 + i * 100} stroke={SC.navy} strokeWidth="0.8" />
          ))}
          {Array.from({ length: 5 }).map((_, i) => (
            <line key={`mv${i}`} x1={40 + i * 100} y1="10" x2={40 + i * 100} y2="520" stroke={SC.navy} strokeWidth="0.8" />
          ))}
        </g>

        {/* Center crosshair — calibration reference */}
        <g opacity="0.12" stroke={SC.cyan} strokeWidth="0.5">
          <line x1="265" y1="255" x2="265" y2="275" />
          <line x1="255" y1="265" x2="275" y2="265" />
          <circle cx="265" cy="265" r="6" fill="none" />
        </g>

        {/* Title block — bottom-left engineering ref */}
        <g>
          <line x1="40" y1="530" x2="490" y2="530" stroke={SC.navy} strokeWidth="0.5" opacity="0.15" />
          <text x="44" y="542" fill={SC.textTertiary} style={{ fontSize: '7px', fontFamily: SC.mono, letterSpacing: '0.15em' }}>OPTICAL CONFIGURATION · SYSTEMATIC CARTOGRAPHY</text>
          <text x="486" y="542" textAnchor="end" fill={SC.textTertiary} style={{ fontSize: '6px', fontFamily: SC.mono, letterSpacing: '0.1em' }}>REF.OPT-001</text>
        </g>

        {/* ===== FOV Cone — cyan optical path ===== */}
        <polygon 
          points={`275,175 ${275 - fovOffsetX},420 ${275 + fovOffsetX},420`}
          fill="url(#fovGradient)"
        />
        <line 
          x1="275" y1="175" x2={275 - fovOffsetX} y2="420" 
          stroke={SC.cyan} strokeWidth="1" strokeDasharray="6,4" opacity="0.45"
        />
        <line 
          x1="275" y1="175" x2={275 + fovOffsetX} y2="420" 
          stroke={SC.cyan} strokeWidth="1" strokeDasharray="6,4" opacity="0.45"
        />
        {/* FOV angle arc */}
        <path 
          d={`M ${275 - 15} 190 A 20 20 0 0 1 ${275 + 15} 190`}
          fill="none" stroke={SC.cyan} strokeWidth="1"
        />
        <text x="300" y="187" textAnchor="start" fill={SC.textPrimary} style={{ fontSize: '10px', fontFamily: SC.mono, fontWeight: 500 }}>
          {fovAngle}°
        </text>

        {/* ===== Camera Mounting Bracket ===== */}
        <g>
          <rect x="195" y="260" width="160" height="10" rx="1" fill="hsl(220, 15%, 55%)" />
          <rect x="265" y="253" width="20" height="24" rx="1" fill="hsl(220, 15%, 55%)" />
          {/* Mounting holes — precision circles */}
          <circle cx="215" cy="265" r="3" fill="none" stroke={SC.slate} strokeWidth="0.8" />
          <circle cx="215" cy="265" r="1" fill={SC.slate} />
          <circle cx="335" cy="265" r="3" fill="none" stroke={SC.slate} strokeWidth="0.8" />
          <circle cx="335" cy="265" r="1" fill={SC.slate} />
        </g>

        {/* ===== Detection point — cyan crosshair ===== */}
        <g>
          <circle cx="275" cy="435" r="5" fill={SC.cyan} opacity="0.8" />
          <circle cx="275" cy="435" r="9" fill="none" stroke={SC.cyan} strokeWidth="0.8" opacity="0.4" />
          <circle cx="275" cy="435" r="13" fill="none" stroke={SC.cyan} strokeWidth="0.5" strokeDasharray="2,2" opacity="0.25" />
          {/* Leader line */}
          <line x1="288" y1="435" x2="340" y2="435" stroke={SC.cyan} strokeWidth="0.8" strokeDasharray="3,2" opacity="0.5" />
          <text x="345" y="438" fill={SC.cyan} style={{ fontSize: '8px', fontFamily: SC.mono, letterSpacing: '0.1em' }}>DET.POINT</text>
        </g>

        {/* ===== Product ===== */}
        <g>
          <rect x="200" y="420" width="150" height="40" rx="2" fill="url(#productBody)" stroke={SC.cardBorder} strokeWidth="0.5" />
          {/* ROI indicator */}
          <rect 
            x={roiStrategy === 'full' ? 205 : 225} y="424" 
            width={roiStrategy === 'full' ? 140 : 100} height="32" rx="1"
            fill="none" stroke="hsl(160, 70%, 45%)" strokeWidth="1.2" strokeDasharray="4,2" opacity="0.6"
          />
          <text x="275" y="443" textAnchor="middle" fill={SC.textPrimary} style={{ fontSize: '9px', fontFamily: SC.mono, fontWeight: 500, letterSpacing: '0.1em' }}>
            SPECIMEN
          </text>
        </g>

        {/* ===== Dimension line — vertical (working distance) ===== */}
        <g>
          <line x1="100" y1="175" x2="125" y2="175" stroke={SC.cyan} strokeWidth="0.8" strokeDasharray="3,2" opacity="0.5" />
          <line x1="100" y1="420" x2="125" y2="420" stroke={SC.cyan} strokeWidth="0.8" strokeDasharray="3,2" opacity="0.5" />
          <line x1="112" y1="185" x2="112" y2="410" stroke={SC.cyan} strokeWidth="1" markerStart="url(#arrowUp)" markerEnd="url(#arrowDown)" />
          <text x="98" y="310" textAnchor="middle" fill={SC.textPrimary} style={{ fontSize: '9px', fontFamily: SC.mono, fontWeight: 500 }} transform="rotate(-90, 98, 310)">
            WD {lightDistance}±20mm
          </text>
        </g>

        {/* ===== FOV width dimension ===== */}
        <g>
          <line x1={275 - fovOffsetX} y1="465" x2={275 - fovOffsetX} y2="478" stroke={SC.cyan} strokeWidth="0.8" />
          <line x1={275 + fovOffsetX} y1="465" x2={275 + fovOffsetX} y2="478" stroke={SC.cyan} strokeWidth="0.8" />
          <line 
            x1={275 - fovOffsetX + 8} y1="473" x2={275 + fovOffsetX - 8} y2="473"
            stroke={SC.cyan} strokeWidth="1"
            markerStart="url(#arrowLeft)" markerEnd="url(#arrowRight)"
          />
          <text x="275" y="490" textAnchor="middle" fill={SC.textPrimary} style={{ fontSize: '8px', fontFamily: SC.mono, letterSpacing: '0.05em' }}>
            FOV ≈{Math.round(fovOffsetX * 2)}mm
          </text>
        </g>

        {/* Connection lines to annotation panel — thin cyan dashes */}
        <g stroke={SC.cyan} strokeWidth="0.6" strokeDasharray="4,3" opacity="0.3">
          <line x1="320" y1="77" x2="500" y2="55" />
          <line x1="323" y1="151" x2="500" y2="140" />
          <line x1="360" y1="231" x2="500" y2="215" />
        </g>

        {/* ===== Camera Element ===== */}
        {interactive ? (
          <foreignObject x="230" y="35" width="90" height="85">
            <div className="w-full h-full" style={{ transform: 'translateZ(0)' }}>
              <HardwareSelectPopover
                type="camera"
                items={cameras}
                selectedId={camera?.id || null}
                onSelect={onCameraSelect || (() => {})}
                disabled={!onCameraSelect}
              >
                <button className={cn("relative w-full h-full cursor-pointer group bg-transparent border-0 p-0")}>
                  <svg width="90" height="85" viewBox="0 0 90 85">
                    <rect x="0" y="0" width="90" height="72" rx="4" fill="url(#cameraBody)" />
                    <rect x="8" y="5" width="28" height="6" rx="1" fill="hsl(220, 30%, 40%)" opacity="0.5" />
                    <circle cx="76" cy="11" r="3" fill={SC.cyan} />
                    <text x="45" y="48" textAnchor="middle" fill={SC.white} style={{ fontSize: '11px', fontFamily: SC.mono, fontWeight: 600, letterSpacing: '0.15em' }}>CAM-1</text>
                    <rect x="32" y="72" width="26" height="13" fill="hsl(220, 15%, 18%)" />
                  </svg>
                  {onCameraSelect && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <span className="text-primary-foreground text-xs">✎</span>
                    </div>
                  )}
                  {!hasCamera && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded">
                      <span className="text-xs text-muted-foreground font-mono">SELECT</span>
                    </div>
                  )}
                </button>
              </HardwareSelectPopover>
            </div>
          </foreignObject>
        ) : (
          <g transform="translate(230, 35)">
            <rect x="0" y="0" width="90" height="72" rx="4" fill="url(#cameraBody)" />
            <rect x="8" y="5" width="28" height="6" rx="1" fill="hsl(220, 30%, 40%)" opacity="0.5" />
            <circle cx="76" cy="11" r="3" fill={SC.cyan} />
            <text x="45" y="48" textAnchor="middle" fill={SC.white} style={{ fontSize: '11px', fontFamily: SC.mono, fontWeight: 600, letterSpacing: '0.15em' }}>CAM-1</text>
            <rect x="32" y="72" width="26" height="13" fill="hsl(220, 15%, 18%)" />
          </g>
        )}

        {/* ===== Lens Element ===== */}
        {interactive ? (
          <foreignObject x="227" y="120" width="96" height="62">
            <div className="w-full h-full" style={{ transform: 'translateZ(0)' }}>
              <HardwareSelectPopover
                type="lens"
                items={lenses}
                selectedId={lens?.id || null}
                onSelect={onLensSelect || (() => {})}
                disabled={!onLensSelect}
              >
                <button className={cn("relative w-full h-full cursor-pointer group bg-transparent border-0 p-0")}>
                  <svg width="96" height="62" viewBox="0 0 96 62">
                    <rect x="8" y="0" width="80" height="48" rx="2" fill="url(#lensBody)" />
                    <ellipse cx="48" cy="38" rx="22" ry="7" fill="url(#lensGlass)" />
                    <rect x="0" y="44" width="96" height="12" rx="1" fill="hsl(220, 15%, 15%)" />
                    <rect x="13" y="12" width="70" height="2" fill="hsl(220, 10%, 38%)" rx="1" />
                    <rect x="13" y="26" width="70" height="2" fill="hsl(220, 10%, 38%)" rx="1" />
                  </svg>
                  {onLensSelect && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <span className="text-primary-foreground text-xs">✎</span>
                    </div>
                  )}
                  {!hasLens && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded">
                      <span className="text-xs text-muted-foreground font-mono">SELECT</span>
                    </div>
                  )}
                </button>
              </HardwareSelectPopover>
            </div>
          </foreignObject>
        ) : (
          <g transform="translate(227, 120)">
            <rect x="8" y="0" width="80" height="48" rx="2" fill="url(#lensBody)" />
            <ellipse cx="48" cy="38" rx="22" ry="7" fill="url(#lensGlass)" />
            <rect x="0" y="44" width="96" height="12" rx="1" fill="hsl(220, 15%, 15%)" />
            <rect x="13" y="12" width="70" height="2" fill="hsl(220, 10%, 38%)" rx="1" />
            <rect x="13" y="26" width="70" height="2" fill="hsl(220, 10%, 38%)" rx="1" />
          </g>
        )}

        {/* ===== Light Element ===== */}
        {interactive ? (
          <foreignObject x="195" y="215" width="160" height="32">
            <div className="w-full h-full" style={{ transform: 'translateZ(0)' }}>
              <HardwareSelectPopover
                type="light"
                items={lights}
                selectedId={light?.id || null}
                onSelect={onLightSelect || (() => {})}
                disabled={!onLightSelect}
              >
                <button className={cn("relative w-full h-full cursor-pointer group bg-transparent border-0 p-0")}>
                  <svg width="160" height="32" viewBox="0 0 160 32">
                    <rect x="0" y="0" width="160" height="32" rx="2" fill="hsl(220, 15%, 40%)" />
                    <rect x="3" y="3" width="154" height="26" rx="2" fill="hsl(220, 15%, 30%)" />
                    <rect x="45" y="6" width="70" height="20" rx="2" fill="hsl(220, 15%, 12%)" />
                    <rect x="8" y="8" width="32" height="16" rx="1" fill="hsl(0, 65%, 45%)" />
                    <rect x="120" y="8" width="32" height="16" rx="1" fill="hsl(0, 65%, 45%)" />
                  </svg>
                  {onLightSelect && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <span className="text-primary-foreground text-xs">✎</span>
                    </div>
                  )}
                  {!hasLight && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded">
                      <span className="text-xs text-muted-foreground font-mono">SELECT</span>
                    </div>
                  )}
                </button>
              </HardwareSelectPopover>
            </div>
          </foreignObject>
        ) : (
          <g transform="translate(195, 215)">
            <rect x="0" y="0" width="160" height="32" rx="2" fill="hsl(220, 15%, 40%)" />
            <rect x="3" y="3" width="154" height="26" rx="2" fill="hsl(220, 15%, 30%)" />
            <rect x="45" y="6" width="70" height="20" rx="2" fill="hsl(220, 15%, 12%)" />
            <rect x="8" y="8" width="32" height="16" rx="1" fill="hsl(0, 65%, 45%)" />
            <rect x="120" y="8" width="32" height="16" rx="1" fill="hsl(0, 65%, 45%)" />
          </g>
        )}

        {/* ===== Controller Element ===== */}
        {hasController && (interactive ? (
          <foreignObject x="370" y="385" width="140" height="80">
            <div className="w-full h-full" style={{ transform: 'translateZ(0)' }}>
              <HardwareSelectPopover
                type="controller"
                items={controllers}
                selectedId={controller?.id || null}
                onSelect={onControllerSelect || (() => {})}
                disabled={!onControllerSelect}
              >
                <div className="relative w-full h-full cursor-pointer group">
                  <svg width="140" height="80" viewBox="0 0 140 80">
                    <rect x="0" y="5" width="140" height="70" rx="2" fill="hsl(220, 20%, 22%)" />
                    <rect x="4" y="9" width="132" height="62" rx="1" fill="hsl(220, 20%, 17%)" />
                    <rect x="8" y="13" width="124" height="54" rx="1" fill="hsl(220, 20%, 13%)" />
                    <circle cx="20" cy="28" r="5" fill="hsl(220, 15%, 25%)" />
                    <circle cx="20" cy="28" r="3" fill={SC.cyan} />
                    <rect x="32" y="20" width="45" height="12" rx="1" fill="hsl(220, 15%, 20%)" />
                    <circle cx="85" cy="26" r="2" fill={SC.cyan} />
                    <circle cx="93" cy="26" r="2" fill="hsl(40, 70%, 50%)" />
                    <g fill="hsl(220, 15%, 10%)">
                      <rect x="105" y="18" width="22" height="2" rx="1" />
                      <rect x="105" y="23" width="22" height="2" rx="1" />
                      <rect x="105" y="28" width="22" height="2" rx="1" />
                      <rect x="105" y="33" width="22" height="2" rx="1" />
                    </g>
                    <rect x="16" y="50" width="10" height="5" rx="1" fill="hsl(220, 15%, 12%)" stroke="hsl(220, 10%, 35%)" strokeWidth="0.5" />
                    <rect x="30" y="50" width="10" height="5" rx="1" fill="hsl(220, 15%, 12%)" stroke="hsl(220, 10%, 35%)" strokeWidth="0.5" />
                    <rect x="46" y="49" width="16" height="7" rx="1" fill="hsl(220, 15%, 12%)" stroke={SC.cyan} strokeWidth="0.5" />
                    <text x="100" y="58" textAnchor="middle" fill={SC.white} style={{ fontSize: '8px', fontFamily: SC.mono, fontWeight: 500, letterSpacing: '0.15em' }}>IPC</text>
                  </svg>
                  {onControllerSelect && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <span className="text-primary-foreground text-[10px]">✎</span>
                    </div>
                  )}
                </div>
              </HardwareSelectPopover>
            </div>
          </foreignObject>
        ) : (
          <g transform="translate(370, 385)">
            <rect x="0" y="5" width="140" height="70" rx="2" fill="hsl(220, 20%, 22%)" />
            <rect x="4" y="9" width="132" height="62" rx="1" fill="hsl(220, 20%, 17%)" />
            <rect x="8" y="13" width="124" height="54" rx="1" fill="hsl(220, 20%, 13%)" />
            <circle cx="20" cy="28" r="5" fill="hsl(220, 15%, 25%)" />
            <circle cx="20" cy="28" r="3" fill={SC.cyan} />
            <rect x="32" y="20" width="45" height="12" rx="1" fill="hsl(220, 15%, 20%)" />
            <circle cx="85" cy="26" r="2" fill={SC.cyan} />
            <circle cx="93" cy="26" r="2" fill="hsl(40, 70%, 50%)" />
            <g fill="hsl(220, 15%, 10%)">
              <rect x="105" y="18" width="22" height="2" rx="1" />
              <rect x="105" y="23" width="22" height="2" rx="1" />
              <rect x="105" y="28" width="22" height="2" rx="1" />
              <rect x="105" y="33" width="22" height="2" rx="1" />
            </g>
            <rect x="16" y="50" width="10" height="5" rx="1" fill="hsl(220, 15%, 12%)" stroke="hsl(220, 10%, 35%)" strokeWidth="0.5" />
            <rect x="30" y="50" width="10" height="5" rx="1" fill="hsl(220, 15%, 12%)" stroke="hsl(220, 10%, 35%)" strokeWidth="0.5" />
            <rect x="46" y="49" width="16" height="7" rx="1" fill="hsl(220, 15%, 12%)" stroke={SC.cyan} strokeWidth="0.5" />
            <text x="100" y="58" textAnchor="middle" fill={SC.white} style={{ fontSize: '8px', fontFamily: SC.mono, fontWeight: 500, letterSpacing: '0.15em' }}>IPC</text>
          </g>
        ))}

        {/* ===== ANNOTATION PANEL ===== */}
        {interactive ? (
          <foreignObject x="500" y="20" width="290" height="680">
            <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {/* Camera specs */}
              <div style={{ backgroundColor: SC.cardBg, borderRadius: '3px', padding: '8px 10px', border: `0.5px solid ${SC.cardBorder}`, borderLeft: `2px solid ${SC.cyan}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 600, fontSize: '10px', color: SC.textPrimary, fontFamily: SC.mono, letterSpacing: '0.12em' }}>CAMERA</span>
                  <span style={{ fontSize: '7px', color: SC.textTertiary, fontFamily: SC.mono, letterSpacing: '0.1em' }}>REF.CAM</span>
                </div>
                <div style={{ height: '0.5px', background: SC.cardBorder, margin: '0 0 4px 0' }} />
                {hasCamera ? (
                  <>
                     <p style={{ fontSize: '10px', color: SC.textPrimary, margin: 0, fontFamily: SC.mono }}>{camera.resolution} · {camera.sensor_size}</p>
                     <p style={{ fontSize: '9px', color: SC.textSecondary, margin: 0, fontFamily: SC.mono }}>{camera.brand} {camera.model} @ {camera.frame_rate}fps</p>
                  </>
                ) : (
                  <p style={{ fontSize: '9px', color: SC.textTertiary, margin: 0, fontFamily: SC.mono }}>— NOT CONFIGURED —</p>
                )}
              </div>

              {/* Lens specs */}
              <div style={{ backgroundColor: SC.cardBg, borderRadius: '3px', padding: '8px 10px', border: `0.5px solid ${SC.cardBorder}`, borderLeft: `2px solid ${SC.cyan}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 600, fontSize: '10px', color: SC.textPrimary, fontFamily: SC.mono, letterSpacing: '0.12em' }}>LENS</span>
                  <span style={{ fontSize: '7px', color: SC.textTertiary, fontFamily: SC.mono, letterSpacing: '0.1em' }}>REF.LNS</span>
                </div>
                <div style={{ height: '0.5px', background: SC.cardBorder, margin: '0 0 4px 0' }} />
                {hasLens ? (
                  <>
                     <p style={{ fontSize: '10px', color: SC.textPrimary, margin: 0, fontFamily: SC.mono }}>f={lens.focal_length} · {lens.aperture}</p>
                     <p style={{ fontSize: '9px', color: SC.textSecondary, margin: 0, fontFamily: SC.mono }}>{lens.brand} {lens.model}</p>
                  </>
                ) : (
                  <p style={{ fontSize: '9px', color: SC.textTertiary, margin: 0, fontFamily: SC.mono }}>— NOT CONFIGURED —</p>
                )}
              </div>

              {/* Light specs */}
              <div style={{ backgroundColor: SC.cardBg, borderRadius: '3px', padding: '8px 10px', border: `0.5px solid ${SC.cardBorder}`, borderLeft: `2px solid ${SC.cyan}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 600, fontSize: '10px', color: SC.textPrimary, fontFamily: SC.mono, letterSpacing: '0.12em' }}>ILLUMINATION</span>
                  <span style={{ fontSize: '7px', color: SC.textTertiary, fontFamily: SC.mono, letterSpacing: '0.1em' }}>REF.ILL</span>
                </div>
                <div style={{ height: '0.5px', background: SC.cardBorder, margin: '0 0 4px 0' }} />
                {hasLight ? (
                  <>
                     <p style={{ fontSize: '10px', color: SC.textPrimary, margin: 0, fontFamily: SC.mono }}>{light.color}{light.type} · {light.power}</p>
                     <p style={{ fontSize: '9px', color: SC.textSecondary, margin: 0, fontFamily: SC.mono }}>{light.brand} {light.model}</p>
                     <p style={{ fontSize: '9px', color: SC.textSecondary, margin: '2px 0 0 0', fontFamily: SC.mono }}>WD: {lightDistance}±20mm</p>
                  </>
                ) : (
                  <p style={{ fontSize: '9px', color: SC.textTertiary, margin: 0, fontFamily: SC.mono }}>— NOT CONFIGURED —</p>
                )}
              </div>

              {/* FOV info */}
              <div style={{ backgroundColor: SC.cardBg, borderRadius: '3px', padding: '8px 10px', border: `0.5px solid ${SC.cardBorder}`, borderLeft: `2px solid ${SC.cyan}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 600, fontSize: '10px', color: SC.textPrimary, fontFamily: SC.mono, letterSpacing: '0.12em' }}>FIELD OF VIEW</span>
                  <span style={{ fontSize: '7px', color: SC.textTertiary, fontFamily: SC.mono, letterSpacing: '0.1em' }}>REF.FOV</span>
                </div>
                <div style={{ height: '0.5px', background: SC.cardBorder, margin: '0 0 4px 0' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '9px', color: SC.textSecondary, width: '64px', fontFamily: SC.mono }}>ANGLE:</span>
                    {onFovAngleChange ? (
                      <input
                        type="number"
                        value={fovAngle}
                        onChange={(e) => onFovAngleChange(parseFloat(e.target.value) || 45)}
                        style={{ width: '56px', height: '22px', fontSize: '10px', padding: '0 6px', borderRadius: '2px', border: `1px solid ${SC.cardBorder}`, backgroundColor: SC.white, color: SC.textPrimary, fontFamily: SC.mono, outline: 'none' }}
                        min="10" max="120"
                      />
                    ) : (
                      <span style={{ fontSize: '10px', color: SC.textPrimary, fontFamily: SC.mono }}>{fovAngle}</span>
                    )}
                    <span style={{ fontSize: '9px', color: SC.textSecondary, fontFamily: SC.mono }}>°</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '9px', color: SC.textSecondary, width: '64px', fontFamily: SC.mono }}>WD:</span>
                    {onLightDistanceChange ? (
                      <input
                        type="number"
                        value={lightDistance}
                        onChange={(e) => onLightDistanceChange(parseFloat(e.target.value) || 335)}
                        style={{ width: '56px', height: '22px', fontSize: '10px', padding: '0 6px', borderRadius: '2px', border: `1px solid ${SC.cardBorder}`, backgroundColor: SC.white, color: SC.textPrimary, fontFamily: SC.mono, outline: 'none' }}
                        min="50" max="1000"
                      />
                    ) : (
                      <span style={{ fontSize: '10px', color: SC.textPrimary, fontFamily: SC.mono }}>{lightDistance}</span>
                    )}
                    <span style={{ fontSize: '9px', color: SC.textSecondary, fontFamily: SC.mono }}>mm</span>
                  </div>
                  <p style={{ fontSize: '9px', color: SC.textSecondary, margin: 0, fontFamily: SC.mono }}>FOV ≈{Math.round(fovOffsetX * 2)}mm</p>
                </div>
              </div>

              {/* Controller specs */}
              {hasController && (
                <div style={{ backgroundColor: SC.cardBg, borderRadius: '3px', padding: '8px 10px', border: `0.5px solid ${SC.cardBorder}`, borderLeft: `2px solid ${SC.cyan}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600, fontSize: '10px', color: SC.textPrimary, fontFamily: SC.mono, letterSpacing: '0.12em' }}>CONTROLLER</span>
                    <span style={{ fontSize: '7px', color: SC.textTertiary, fontFamily: SC.mono, letterSpacing: '0.1em' }}>REF.IPC</span>
                  </div>
                  <div style={{ height: '0.5px', background: SC.cardBorder, margin: '0 0 4px 0' }} />
                  <p style={{ fontSize: '10px', color: SC.textPrimary, margin: 0, fontFamily: SC.mono }}>{controller.cpu}</p>
                  <p style={{ fontSize: '10px', color: SC.textPrimary, margin: 0, fontFamily: SC.mono }}>{controller.memory} · {controller.storage}</p>
                  <p style={{ fontSize: '9px', color: SC.textSecondary, margin: 0, fontFamily: SC.mono }}>{controller.brand} {controller.model}</p>
                  {controller.gpu && (
                    <p style={{ fontSize: '9px', color: SC.textSecondary, margin: '2px 0 0 0', fontFamily: SC.mono }}>GPU: {controller.gpu}</p>
                  )}
                </div>
              )}
            </div>
          </foreignObject>
        ) : (
          /* Export mode: pure SVG annotation cards */
          <g>
            {(() => {
              const cardX = 508;
              const cardW = 274;
              const cardH = 56;
              const cardGap = 8;
              let yOffset = 28;
              const cards: React.ReactNode[] = [];

              // Camera card
              cards.push(
                <AnnotationCard key="cam" x={cardX} y={yOffset} w={cardW} h={cardH} refId="REF.CAM" title="CAMERA" accentLine
                  lines={hasCamera ? [
                    { text: `${camera.resolution} · ${camera.sensor_size}` },
                    { text: `${camera.brand} ${camera.model} @ ${camera.frame_rate}fps`, secondary: true },
                  ] : [{ text: '— NOT CONFIGURED —', secondary: true }]}
                />
              );
              yOffset += cardH + cardGap;

              // Lens card
              cards.push(
                <AnnotationCard key="lens" x={cardX} y={yOffset} w={cardW} h={cardH} refId="REF.LNS" title="LENS" accentLine
                  lines={hasLens ? [
                    { text: `f=${lens.focal_length} · ${lens.aperture}` },
                    { text: `${lens.brand} ${lens.model}`, secondary: true },
                  ] : [{ text: '— NOT CONFIGURED —', secondary: true }]}
                />
              );
              yOffset += cardH + cardGap;

              // Light card
              const lightCardH = hasLight ? 68 : cardH;
              cards.push(
                <AnnotationCard key="light" x={cardX} y={yOffset} w={cardW} h={lightCardH} refId="REF.ILL" title="ILLUMINATION" accentLine
                  lines={hasLight ? [
                    { text: `${light.color}${light.type} · ${light.power}` },
                    { text: `${light.brand} ${light.model}`, secondary: true },
                    { text: `WD: ${lightDistance}±20mm`, secondary: true },
                  ] : [{ text: '— NOT CONFIGURED —', secondary: true }]}
                />
              );
              yOffset += lightCardH + cardGap;

              // FOV card
              const fovCardH = 68;
              cards.push(
                <AnnotationCard key="fov" x={cardX} y={yOffset} w={cardW} h={fovCardH} refId="REF.FOV" title="FIELD OF VIEW" accentLine
                  lines={[
                    { text: `ANGLE: ${fovAngle}°` },
                    { text: `WD: ${lightDistance}mm` },
                    { text: `FOV ≈${Math.round(fovOffsetX * 2)}mm`, secondary: true },
                  ]}
                />
              );
              yOffset += fovCardH + cardGap;

              // Controller card
              if (hasController) {
                const ctrlCardH = controller.gpu ? 80 : 68;
                cards.push(
                  <AnnotationCard key="ctrl" x={cardX} y={yOffset} w={cardW} h={ctrlCardH} refId="REF.IPC" title="CONTROLLER" accentLine
                    lines={[
                      { text: controller.cpu },
                      { text: `${controller.memory} · ${controller.storage}` },
                      { text: `${controller.brand} ${controller.model}`, secondary: true },
                      ...(controller.gpu ? [{ text: `GPU: ${controller.gpu}`, secondary: true }] : []),
                    ]}
                  />
                );
              }

              return cards;
            })()}
          </g>
        )}
      </svg>
    </div>
  );
}
