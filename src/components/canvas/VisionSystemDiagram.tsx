import { Camera, Light, Lens, Controller } from '@/hooks/useHardware';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
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

  // Calculate FOV line endpoints based on angle
  const fovRadians = (fovAngle / 2) * (Math.PI / 180);
  const fovLength = 250;
  const fovOffsetX = Math.tan(fovRadians) * fovLength;

  const interactiveClass = interactive ? "cursor-pointer hover:opacity-80 transition-opacity" : "";

  return (
    <div className={cn("relative w-full h-full min-h-[500px]", className)} style={{ backgroundColor: '#ffffff', contain: 'layout style paint', ...(interactive ? { willChange: 'transform' } : {}) }}>
      <svg 
        viewBox="0 0 800 540"
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
        shapeRendering="geometricPrecision"
        style={{ maxHeight: '100%', ...(interactive ? { transform: 'translateZ(0)' } : {}) }}
      >
        <defs>
          {/* Camera FOV gradient - lens to product fade */}
          <linearGradient id="fovGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(270, 60%, 55%)" stopOpacity="0.35" />
            <stop offset="40%" stopColor="hsl(270, 55%, 50%)" stopOpacity="0.18" />
            <stop offset="100%" stopColor="hsl(270, 50%, 45%)" stopOpacity="0.04" />
          </linearGradient>

          {/* Light cone gradient */}
          <linearGradient id="lightCone" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(270, 50%, 70%)" stopOpacity="0.5" />
            <stop offset="50%" stopColor="hsl(270, 50%, 70%)" stopOpacity="0.2" />
            <stop offset="100%" stopColor="hsl(270, 50%, 70%)" stopOpacity="0.05" />
          </linearGradient>

          {/* Light illumination zone */}
          <radialGradient id="lightZone" cx="50%" cy="0%" r="100%" fx="50%" fy="0%">
            <stop offset="0%" stopColor="hsl(45, 100%, 70%)" stopOpacity="0.4" />
            <stop offset="40%" stopColor="hsl(45, 100%, 60%)" stopOpacity="0.2" />
            <stop offset="100%" stopColor="hsl(45, 100%, 50%)" stopOpacity="0" />
          </radialGradient>
          
          {/* Camera body gradient */}
          <linearGradient id="cameraBody" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(270, 40%, 55%)" />
            <stop offset="50%" stopColor="hsl(270, 40%, 45%)" />
            <stop offset="100%" stopColor="hsl(270, 40%, 35%)" />
          </linearGradient>

          {/* Camera hover gradient */}
          <linearGradient id="cameraBodyHover" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(270, 50%, 65%)" />
            <stop offset="50%" stopColor="hsl(270, 50%, 55%)" />
            <stop offset="100%" stopColor="hsl(270, 50%, 45%)" />
          </linearGradient>

          {/* Lens gradient */}
          <linearGradient id="lensBody" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(30, 20%, 40%)" />
            <stop offset="50%" stopColor="hsl(30, 20%, 30%)" />
            <stop offset="100%" stopColor="hsl(30, 20%, 20%)" />
          </linearGradient>

          {/* Lens glass gradient */}
          <radialGradient id="lensGlass" cx="50%" cy="30%" r="60%">
            <stop offset="0%" stopColor="hsl(200, 50%, 70%)" stopOpacity="0.8" />
            <stop offset="100%" stopColor="hsl(200, 50%, 40%)" stopOpacity="0.4" />
          </radialGradient>

          {/* Product gradient */}
          <linearGradient id="productBody" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(220, 60%, 40%)" />
            <stop offset="100%" stopColor="hsl(220, 60%, 25%)" />
          </linearGradient>

          {/* Ring light glow */}
          <filter id="lightGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          {/* Selection highlight */}
          <filter id="selectGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          {/* Arrow markers */}
          <marker id="arrowUp" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
            <path d="M1,7 L4,1 L7,7" fill="none" stroke="hsl(220, 80%, 50%)" strokeWidth="1.5" />
          </marker>
          <marker id="arrowDown" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
            <path d="M1,1 L4,7 L7,1" fill="none" stroke="hsl(220, 80%, 50%)" strokeWidth="1.5" />
          </marker>
          <marker id="arrowLeft" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
            <path d="M7,1 L1,4 L7,7" fill="none" stroke="hsl(220, 80%, 50%)" strokeWidth="1.5" />
          </marker>
          <marker id="arrowRight" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
            <path d="M1,1 L7,4 L1,7" fill="none" stroke="hsl(220, 80%, 50%)" strokeWidth="1.5" />
          </marker>
        </defs>

        {/* Blue dashed outer border */}
        <rect 
          x="60" y="20" width="430" height="490" rx="8"
          fill="none" stroke="hsl(220, 80%, 55%)" strokeWidth="1.5" strokeDasharray="8,4"
          opacity="0.5"
        />

        {/* Background grid - subtle */}
        <g opacity="0.06">
          {Array.from({ length: 13 }).map((_, i) => (
            <line key={`h${i}`} x1="60" y1={20 + i * 40} x2="490" y2={20 + i * 40} stroke="#000000" strokeWidth="0.5" />
          ))}
          {Array.from({ length: 12 }).map((_, i) => (
            <line key={`v${i}`} x1={60 + i * 40} y1="20" x2={60 + i * 40} y2="510" stroke="#000000" strokeWidth="0.5" />
          ))}
        </g>

        {/* ===== FOV Cone - saturated purple, from lens bottom through light & bracket to product ===== */}
        <polygon 
          points={`275,175 ${275 - fovOffsetX},420 ${275 + fovOffsetX},420`}
          fill="url(#fovGradient)"
        />
        <line 
          x1="275" y1="175" x2={275 - fovOffsetX} y2="420" 
          stroke="hsl(270, 50%, 60%)" strokeWidth="1.5" strokeDasharray="6,3" opacity="0.6"
        />
        <line 
          x1="275" y1="175" x2={275 + fovOffsetX} y2="420" 
          stroke="hsl(270, 50%, 60%)" strokeWidth="1.5" strokeDasharray="6,3" opacity="0.6"
        />
        {/* FOV angle arc */}
        <path 
          d={`M ${275 - 15} 190 A 20 20 0 0 1 ${275 + 15} 190`}
          fill="none" stroke="hsl(270, 50%, 60%)" strokeWidth="1.5"
        />
        <text x="300" y="187" textAnchor="start" fill="#333333" style={{ fontSize: '11px', fontWeight: 500 }}>
          {fovAngle}°
        </text>

        {/* ===== Camera Mounting Bracket - gray cross shape ===== */}
        <g>
          {/* Horizontal bar */}
          <rect x="195" y="260" width="160" height="10" rx="2" fill="hsl(0, 0%, 50%)" />
          {/* Vertical bar */}
          <rect x="265" y="253" width="20" height="24" rx="2" fill="hsl(0, 0%, 50%)" />
          {/* Mounting holes */}
          <circle cx="215" cy="265" r="3" fill="hsl(0, 0%, 35%)" />
          <circle cx="335" cy="265" r="3" fill="hsl(0, 0%, 35%)" />
        </g>

        {/* ===== Detection point on product surface ===== */}
        <g>
          <circle cx="275" cy="435" r="5" fill="hsl(220, 80%, 55%)" />
          <circle cx="275" cy="435" r="8" fill="none" stroke="hsl(220, 80%, 55%)" strokeWidth="1" opacity="0.5" />
          {/* Leader line */}
          <line x1="283" y1="435" x2="340" y2="435" stroke="hsl(220, 80%, 55%)" strokeWidth="1" strokeDasharray="3,2" />
          <text x="345" y="438" fill="hsl(220, 80%, 45%)" style={{ fontSize: '10px' }}>检测点</text>
        </g>

        {/* ===== Product - gray rectangle ===== */}
        <g>
          <rect x="200" y="420" width="150" height="40" rx="3" fill="hsl(220, 10%, 85%)" />
          <rect x="200" y="420" width="150" height="40" rx="3" fill="none" stroke="hsl(220, 10%, 70%)" strokeWidth="1" />
          {/* ROI indicator */}
          <rect 
            x={roiStrategy === 'full' ? 205 : 225} y="424" 
            width={roiStrategy === 'full' ? 140 : 100} height="32" rx="2"
            fill="none" stroke="hsl(120, 70%, 50%)" strokeWidth="1.5" strokeDasharray="4,2" opacity="0.7"
          />
          <text x="275" y="443" textAnchor="middle" fill="#333333" style={{ fontSize: '10px', fontWeight: 500 }}>
            产品
          </text>
        </g>

        {/* ===== Dimension line - vertical (working distance) ===== */}
        <g>
          {/* Top tick at lens bottom level */}
          <line x1="120" y1="175" x2="150" y2="175" stroke="hsl(220, 80%, 55%)" strokeWidth="1" strokeDasharray="3,2" />
          {/* Bottom tick at product top */}
          <line x1="120" y1="420" x2="150" y2="420" stroke="hsl(220, 80%, 55%)" strokeWidth="1" strokeDasharray="3,2" />
          {/* Vertical line with arrows */}
          <line 
            x1="135" y1="185" x2="135" y2="410" 
            stroke="hsl(220, 80%, 55%)" strokeWidth="1.5"
            markerStart="url(#arrowUp)" markerEnd="url(#arrowDown)"
          />
          {/* Distance label */}
          <text 
            x="118" y="350" textAnchor="middle" fill="#333333"
            style={{ fontSize: '11px', fontWeight: 500 }}
            transform="rotate(-90, 118, 350)"
          >
            {lightDistance}±20mm
          </text>
        </g>

        {/* ===== FOV width dimension ===== */}
        <g>
          <line x1={275 - fovOffsetX} y1="465" x2={275 - fovOffsetX} y2="478" stroke="hsl(220, 80%, 55%)" strokeWidth="1" />
          <line x1={275 + fovOffsetX} y1="465" x2={275 + fovOffsetX} y2="478" stroke="hsl(220, 80%, 55%)" strokeWidth="1" />
          <line 
            x1={275 - fovOffsetX + 8} y1="473" x2={275 + fovOffsetX - 8} y2="473"
            stroke="hsl(220, 80%, 55%)" strokeWidth="1.5"
            markerStart="url(#arrowLeft)" markerEnd="url(#arrowRight)"
          />
          <text x="275" y="492" textAnchor="middle" fill="#333333" style={{ fontSize: '10px' }}>
            视野宽度 ~{Math.round(fovOffsetX * 2)}mm
          </text>
        </g>

        {/* Connection lines to annotation panel */}
        <g stroke="hsl(220, 80%, 50%)" strokeWidth="1" strokeDasharray="4,2" opacity="0.5">
          <line x1="320" y1="77" x2="495" y2="55" />
          <line x1="323" y1="151" x2="495" y2="140" />
          <line x1="360" y1="231" x2="495" y2="210" />
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
                    <rect x="0" y="0" width="90" height="72" rx="6" fill="url(#cameraBody)" />
                    <rect x="8" y="5" width="28" height="8" rx="2" fill="hsl(270, 30%, 60%)" opacity="0.5" />
                    <circle cx="76" cy="11" r="4" fill="hsl(120, 70%, 50%)" />
                    <text x="45" y="48" textAnchor="middle" fill="white" style={{ fontSize: '14px', fontWeight: 600 }}>Cam1</text>
                    <rect x="32" y="72" width="26" height="13" fill="hsl(0, 0%, 22%)" />
                  </svg>
                  {onCameraSelect && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <span className="text-primary-foreground text-xs">✎</span>
                    </div>
                  )}
                  {!hasCamera && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded">
                      <span className="text-xs text-muted-foreground">点击选择</span>
                    </div>
                  )}
                </button>
              </HardwareSelectPopover>
            </div>
          </foreignObject>
        ) : (
          <g transform="translate(230, 35)">
            <rect x="0" y="0" width="90" height="72" rx="6" fill="url(#cameraBody)" />
            <rect x="8" y="5" width="28" height="8" rx="2" fill="hsl(270, 30%, 60%)" opacity="0.5" />
            <circle cx="76" cy="11" r="4" fill="hsl(120, 70%, 50%)" />
            <text x="45" y="48" textAnchor="middle" fill="white" style={{ fontSize: '14px', fontWeight: 600 }}>Cam1</text>
            <rect x="32" y="72" width="26" height="13" fill="hsl(0, 0%, 22%)" />
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
                    <rect x="8" y="0" width="80" height="48" rx="3" fill="url(#lensBody)" />
                    <ellipse cx="48" cy="38" rx="22" ry="7" fill="url(#lensGlass)" />
                    <rect x="0" y="44" width="96" height="12" rx="2" fill="hsl(0, 0%, 18%)" />
                    <rect x="13" y="12" width="70" height="2.5" fill="hsl(30, 15%, 45%)" rx="1" />
                    <rect x="13" y="26" width="70" height="2.5" fill="hsl(30, 15%, 45%)" rx="1" />
                  </svg>
                  {onLensSelect && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <span className="text-primary-foreground text-xs">✎</span>
                    </div>
                  )}
                  {!hasLens && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded">
                      <span className="text-xs text-muted-foreground">点击选择</span>
                    </div>
                  )}
                </button>
              </HardwareSelectPopover>
            </div>
          </foreignObject>
        ) : (
          <g transform="translate(227, 120)">
            <rect x="8" y="0" width="80" height="48" rx="3" fill="url(#lensBody)" />
            <ellipse cx="48" cy="38" rx="22" ry="7" fill="url(#lensGlass)" />
            <rect x="0" y="44" width="96" height="12" rx="2" fill="hsl(0, 0%, 18%)" />
            <rect x="13" y="12" width="70" height="2.5" fill="hsl(30, 15%, 45%)" rx="1" />
            <rect x="13" y="26" width="70" height="2.5" fill="hsl(30, 15%, 45%)" rx="1" />
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
                    <rect x="0" y="0" width="160" height="32" rx="4" fill="hsl(0, 0%, 45%)" />
                    <rect x="3" y="3" width="154" height="26" rx="3" fill="hsl(0, 0%, 35%)" />
                    <rect x="45" y="6" width="70" height="20" rx="3" fill="hsl(0, 0%, 12%)" />
                    <rect x="8" y="8" width="32" height="16" rx="2" fill="hsl(0, 80%, 50%)" />
                    <rect x="120" y="8" width="32" height="16" rx="2" fill="hsl(0, 80%, 50%)" />
                  </svg>
                  {onLightSelect && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <span className="text-primary-foreground text-xs">✎</span>
                    </div>
                  )}
                  {!hasLight && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded">
                      <span className="text-xs text-muted-foreground">点击选择</span>
                    </div>
                  )}
                </button>
              </HardwareSelectPopover>
            </div>
          </foreignObject>
        ) : (
          <g transform="translate(195, 215)">
            <rect x="0" y="0" width="160" height="32" rx="4" fill="hsl(0, 0%, 45%)" />
            <rect x="3" y="3" width="154" height="26" rx="3" fill="hsl(0, 0%, 35%)" />
            <rect x="45" y="6" width="70" height="20" rx="3" fill="hsl(0, 0%, 12%)" />
            <rect x="8" y="8" width="32" height="16" rx="2" fill="hsl(0, 80%, 50%)" />
            <rect x="120" y="8" width="32" height="16" rx="2" fill="hsl(0, 80%, 50%)" />
          </g>
        )}

        {/* Annotations panel - pure SVG for export, foreignObject for interactive */}
        {interactive ? (
          <foreignObject x="500" y="20" width="290" height="680">
            <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {/* Camera specs */}
              <div style={{ backgroundColor: 'hsl(220, 10%, 96%)', borderRadius: '8px', padding: '6px 8px', border: '1px solid hsl(220, 15%, 82%)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                  <span style={{ fontSize: '14px' }}>📷</span>
                  <span style={{ fontWeight: 600, fontSize: '12px', color: '#333333' }}>工业相机</span>
                </div>
                {hasCamera ? (
                  <>
                     <p style={{ fontSize: '11px', color: '#333333', margin: 0 }}>{camera.resolution} · 靶面{camera.sensor_size}</p>
                     <p style={{ fontSize: '10px', color: '#666666', margin: 0 }}>{camera.brand} {camera.model} @ {camera.frame_rate}fps</p>
                  </>
                ) : (
                  <p style={{ fontSize: '10px', color: '#666666', margin: 0 }}>点击左侧相机图标选择</p>
                )}
              </div>

              {/* Lens specs */}
              <div style={{ backgroundColor: 'hsl(220, 10%, 96%)', borderRadius: '8px', padding: '6px 8px', border: '1px solid hsl(220, 15%, 82%)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                  <span style={{ fontSize: '14px' }}>🔭</span>
                  <span style={{ fontWeight: 600, fontSize: '12px', color: '#333333' }}>工业镜头</span>
                </div>
                {hasLens ? (
                  <>
                     <p style={{ fontSize: '11px', color: '#333333', margin: 0 }}>焦距 {lens.focal_length} · 光圈 {lens.aperture}</p>
                     <p style={{ fontSize: '10px', color: '#666666', margin: 0 }}>{lens.brand} {lens.model}</p>
                  </>
                ) : (
                  <p style={{ fontSize: '10px', color: '#666666', margin: 0 }}>点击左侧镜头图标选择</p>
                )}
              </div>

              {/* Light specs */}
              <div style={{ backgroundColor: 'hsl(220, 10%, 96%)', borderRadius: '8px', padding: '6px 8px', border: '1px solid hsl(220, 15%, 82%)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                  <span style={{ fontSize: '14px' }}>💡</span>
                  <span style={{ fontWeight: 600, fontSize: '12px', color: '#333333' }}>光源</span>
                </div>
                {hasLight ? (
                  <>
                     <p style={{ fontSize: '11px', color: '#333333', margin: 0 }}>{light.color}{light.type} · {light.power}</p>
                     <p style={{ fontSize: '10px', color: '#666666', margin: 0 }}>{light.brand} {light.model}</p>
                     <p style={{ fontSize: '10px', color: '#666666', margin: '2px 0 0 0' }}>光源距离产品：{lightDistance}±20mm</p>
                  </>
                ) : (
                  <p style={{ fontSize: '10px', color: '#666666', margin: 0 }}>点击左侧光源图标选择</p>
                )}
              </div>

              {/* FOV info - editable */}
              <div style={{ backgroundColor: 'hsl(220, 10%, 96%)', borderRadius: '8px', padding: '6px 8px', border: '1px solid hsl(220, 15%, 82%)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                  <span style={{ fontSize: '14px' }}>📐</span>
                  <span style={{ fontWeight: 600, fontSize: '12px', color: '#333333' }}>视野参数</span>
                  {(onFovAngleChange || onLightDistanceChange) && (
                    <span style={{ fontSize: '9px', color: '#666666', marginLeft: 'auto' }}>可编辑</span>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '10px', color: '#333333', width: '56px' }}>视角:</span>
                    {onFovAngleChange ? (
                      <input
                        type="number"
                        value={fovAngle}
                        onChange={(e) => onFovAngleChange(parseFloat(e.target.value) || 45)}
                        style={{ width: '56px', height: '24px', fontSize: '11px', padding: '0 6px', borderRadius: '4px', border: '1px solid hsl(220, 15%, 78%)', backgroundColor: 'hsl(220, 10%, 98%)', color: '#333', outline: 'none' }}
                        min="10"
                        max="120"
                      />
                    ) : (
                      <span style={{ fontSize: '11px', color: '#333333' }}>{fovAngle}</span>
                    )}
                    <span style={{ fontSize: '10px', color: '#333333' }}>°</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '10px', color: '#333333', width: '56px' }}>工作距离:</span>
                    {onLightDistanceChange ? (
                      <input
                        type="number"
                        value={lightDistance}
                        onChange={(e) => onLightDistanceChange(parseFloat(e.target.value) || 335)}
                        style={{ width: '56px', height: '24px', fontSize: '11px', padding: '0 6px', borderRadius: '4px', border: '1px solid hsl(220, 15%, 78%)', backgroundColor: 'hsl(220, 10%, 98%)', color: '#333', outline: 'none' }}
                        min="50"
                        max="1000"
                      />
                    ) : (
                      <span style={{ fontSize: '11px', color: '#333333' }}>{lightDistance}</span>
                    )}
                    <span style={{ fontSize: '10px', color: '#333333' }}>mm</span>
                  </div>
                  <p style={{ fontSize: '10px', color: '#666666', margin: 0 }}>视野宽度约 {Math.round(fovOffsetX * 2)}mm</p>
                </div>
              </div>

              {/* Controller specs */}
              {hasController && (
                <div style={{ backgroundColor: 'hsl(220, 10%, 96%)', borderRadius: '8px', padding: '6px 8px', border: '1px solid hsl(220, 15%, 82%)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                    <span style={{ fontSize: '14px' }}>🖥️</span>
                     <span style={{ fontWeight: 600, fontSize: '12px', color: '#333333' }}>工控机</span>
                   </div>
                   <p style={{ fontSize: '11px', color: '#333333', margin: 0 }}>{controller.cpu}</p>
                   <p style={{ fontSize: '11px', color: '#333333', margin: 0 }}>{controller.memory} · {controller.storage}</p>
                   <p style={{ fontSize: '10px', color: '#666666', margin: 0 }}>{controller.brand} {controller.model}</p>
                  {controller.gpu && (
                    <p style={{ fontSize: '10px', color: '#666666', margin: '2px 0 0 0' }}>GPU: {controller.gpu}</p>
                  )}
                </div>
              )}
            </div>
          </foreignObject>
        ) : (
          /* Export mode: pure SVG annotation cards - no foreignObject, no HTML */
          <g>
            {(() => {
              const cardX = 508;
              const cardW = 274;
              const cardH = 52;
              const cardGap = 6;
              const cardBg = 'hsl(220, 10%, 96%)';
              const cardBorder = 'hsl(220, 15%, 82%)';
              const textColor = '#333333';
              const textSecondary = '#666666';
              let yOffset = 28;

              const cards: React.ReactNode[] = [];

              // Camera card
              cards.push(
                <g key="camera-card" transform={`translate(${cardX}, ${yOffset})`}>
                  <rect width={cardW} height={cardH} rx="8" fill={cardBg} stroke={cardBorder} strokeWidth="1" />
                  <text x="12" y="18" fill={textColor} style={{ fontSize: '12px', fontWeight: 600 }}>📷 工业相机</text>
                  {hasCamera ? (
                    <>
                      <text x="12" y="32" fill={textColor} style={{ fontSize: '11px' }}>{camera.resolution} · 靶面{camera.sensor_size}</text>
                      <text x="12" y="45" fill={textSecondary} style={{ fontSize: '10px' }}>{camera.brand} {camera.model} @ {camera.frame_rate}fps</text>
                    </>
                  ) : (
                    <text x="12" y="35" fill={textSecondary} style={{ fontSize: '10px' }}>未选择相机</text>
                  )}
                </g>
              );
              yOffset += cardH + cardGap;

              // Lens card
              cards.push(
                <g key="lens-card" transform={`translate(${cardX}, ${yOffset})`}>
                  <rect width={cardW} height={cardH} rx="8" fill={cardBg} stroke={cardBorder} strokeWidth="1" />
                  <text x="12" y="18" fill={textColor} style={{ fontSize: '12px', fontWeight: 600 }}>🔭 工业镜头</text>
                  {hasLens ? (
                    <>
                      <text x="12" y="32" fill={textColor} style={{ fontSize: '11px' }}>焦距 {lens.focal_length} · 光圈 {lens.aperture}</text>
                      <text x="12" y="45" fill={textSecondary} style={{ fontSize: '10px' }}>{lens.brand} {lens.model}</text>
                    </>
                  ) : (
                    <text x="12" y="35" fill={textSecondary} style={{ fontSize: '10px' }}>未选择镜头</text>
                  )}
                </g>
              );
              yOffset += cardH + cardGap;

              // Light card
              const lightCardH = hasLight ? 62 : cardH;
              cards.push(
                <g key="light-card" transform={`translate(${cardX}, ${yOffset})`}>
                  <rect width={cardW} height={lightCardH} rx="8" fill={cardBg} stroke={cardBorder} strokeWidth="1" />
                  <text x="12" y="18" fill={textColor} style={{ fontSize: '12px', fontWeight: 600 }}>💡 光源</text>
                  {hasLight ? (
                    <>
                      <text x="12" y="32" fill={textColor} style={{ fontSize: '11px' }}>{light.color}{light.type} · {light.power}</text>
                      <text x="12" y="45" fill={textSecondary} style={{ fontSize: '10px' }}>{light.brand} {light.model}</text>
                      <text x="12" y="57" fill={textSecondary} style={{ fontSize: '10px' }}>光源距离产品：{lightDistance}±20mm</text>
                    </>
                  ) : (
                    <text x="12" y="35" fill={textSecondary} style={{ fontSize: '10px' }}>未选择光源</text>
                  )}
                </g>
              );
              yOffset += lightCardH + cardGap;

              // FOV card
              const fovCardH = 62;
              cards.push(
                <g key="fov-card" transform={`translate(${cardX}, ${yOffset})`}>
                  <rect width={cardW} height={fovCardH} rx="8" fill={cardBg} stroke={cardBorder} strokeWidth="1" />
                  <text x="12" y="18" fill={textColor} style={{ fontSize: '12px', fontWeight: 600 }}>📐 视野参数</text>
                  <text x="12" y="34" fill={textColor} style={{ fontSize: '11px' }}>视角: {fovAngle}°</text>
                  <text x="12" y="47" fill={textColor} style={{ fontSize: '11px' }}>工作距离: {lightDistance}mm</text>
                  <text x="12" y="58" fill={textSecondary} style={{ fontSize: '10px' }}>视野宽度约 {Math.round(fovOffsetX * 2)}mm</text>
                </g>
              );
              yOffset += fovCardH + cardGap;

              // Controller card
              if (hasController) {
                const ctrlCardH = controller.gpu ? 72 : 62;
                cards.push(
                  <g key="ctrl-card" transform={`translate(${cardX}, ${yOffset})`}>
                    <rect width={cardW} height={ctrlCardH} rx="8" fill={cardBg} stroke={cardBorder} strokeWidth="1" />
                    <text x="12" y="18" fill={textColor} style={{ fontSize: '12px', fontWeight: 600 }}>🖥️ 工控机</text>
                    <text x="12" y="32" fill={textColor} style={{ fontSize: '11px' }}>{controller.cpu}</text>
                    <text x="12" y="45" fill={textColor} style={{ fontSize: '11px' }}>{controller.memory} · {controller.storage}</text>
                    <text x="12" y="57" fill={textSecondary} style={{ fontSize: '10px' }}>{controller.brand} {controller.model}</text>
                    {controller.gpu && (
                      <text x="12" y="68" fill={textSecondary} style={{ fontSize: '10px' }}>GPU: {controller.gpu}</text>
                    )}
                  </g>
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
