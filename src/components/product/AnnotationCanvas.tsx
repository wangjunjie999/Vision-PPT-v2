/**
 * Rebuilt AnnotationCanvas — img + SVG overlay.
 * Image is rendered as a plain <img>, annotations drawn in an <svg> with
 * viewBox matching the image's natural dimensions.  Coordinates stored as
 * percentages (0-100) of image size.
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import {
  Circle, Square, ArrowRight, Type, Hash, Trash2, Edit3,
  MousePointer, ZoomIn, ZoomOut, Maximize, Loader2,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export interface Annotation {
  id: string;
  type: 'point' | 'rect' | 'arrow' | 'text' | 'number';
  x: number; y: number;
  width?: number; height?: number;
  endX?: number; endY?: number;
  number?: number;
  name: string;
  description: string;
  category: string;
  dimension?: string;
  tolerance?: string;
}

export interface ImageTransform {
  rotation: number;
  flipH: boolean;
  flipV: boolean;
}

interface AnnotationCanvasProps {
  imageUrl: string;
  annotations: Annotation[];
  onChange: (annotations: Annotation[]) => void;
  readOnly?: boolean;
  fillContainer?: boolean;
  highlightId?: string | null;
  onTransformChange?: (transform: ImageTransform) => void;
}

type Tool = 'select' | 'point' | 'rect' | 'arrow' | 'text' | 'number';

const TOOLS: { value: Tool; label: string; icon: React.ReactNode }[] = [
  { value: 'select', label: '选择', icon: <MousePointer className="h-4 w-4" /> },
  { value: 'point', label: '点', icon: <Circle className="h-4 w-4" /> },
  { value: 'rect', label: '矩形', icon: <Square className="h-4 w-4" /> },
  { value: 'arrow', label: '箭头', icon: <ArrowRight className="h-4 w-4" /> },
  { value: 'text', label: '文本', icon: <Type className="h-4 w-4" /> },
  { value: 'number', label: '编号', icon: <Hash className="h-4 w-4" /> },
];

const CATEGORIES = [
  { value: 'mark', label: 'Mark点' },
  { value: 'qrcode', label: '二维码' },
  { value: 'hole', label: '定位孔' },
  { value: 'pole', label: '极柱' },
  { value: 'edge', label: '边缘' },
  { value: 'surface', label: '表面' },
  { value: 'defect', label: '缺陷检测区' },
  { value: 'other', label: '其他' },
];

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 5;

export function AnnotationCanvas({
  imageUrl, annotations, onChange,
  readOnly = false, fillContainer = false,
  highlightId = null, onTransformChange,
}: AnnotationCanvasProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [tool, setTool] = useState<Tool>('point');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingAnnotation, setEditingAnnotation] = useState<Annotation | null>(null);

  // Image state
  const [imgNatW, setImgNatW] = useState(0);
  const [imgNatH, setImgNatH] = useState(0);
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  // Zoom & pan
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isPanning, setIsPanning] = useState(false);
  const panRef = useRef({ startX: 0, startY: 0, startPanX: 0, startPanY: 0 });
  const [spaceHeld, setSpaceHeld] = useState(false);

  // Drawing
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [tempAnnotation, setTempAnnotation] = useState<Partial<Annotation> | null>(null);
  const [nextNumber, setNextNumber] = useState(1);
  const [dragging, setDragging] = useState<{ id: string; ox: number; oy: number; orig: Annotation } | null>(null);

  // Always report identity transform (rotation/flip removed for stability)
  useEffect(() => {
    onTransformChange?.({ rotation: 0, flipH: false, flipV: false });
  }, [onTransformChange]);

  useEffect(() => {
    const maxN = annotations.filter(a => a.type === 'number').reduce((m, a) => Math.max(m, a.number || 0), 0);
    setNextNumber(maxN + 1);
  }, [annotations]);

  // Space key
  useEffect(() => {
    const down = (e: KeyboardEvent) => { if (e.code === 'Space' && !e.repeat) { e.preventDefault(); setSpaceHeld(true); } };
    const up = (e: KeyboardEvent) => { if (e.code === 'Space') { setSpaceHeld(false); setIsPanning(false); } };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);

  // Delete key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (readOnly || !selectedId || editDialogOpen) return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        onChange(annotations.filter(a => a.id !== selectedId));
        setSelectedId(null);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [readOnly, selectedId, editDialogOpen, annotations, onChange]);

  // Convert mouse event to percentage coords on image
  const toImageCoords = useCallback((e: React.MouseEvent): { x: number; y: number } | null => {
    if (!wrapperRef.current || !imgNatW || !imgNatH) return null;
    const rect = wrapperRef.current.getBoundingClientRect();

    // The img is object-contain inside wrapper; compute rendered size
    const wrapW = rect.width;
    const wrapH = rect.height;
    const imgAspect = imgNatW / imgNatH;
    const wrapAspect = wrapW / wrapH;
    let rendW: number, rendH: number, offX: number, offY: number;
    if (imgAspect > wrapAspect) {
      rendW = wrapW; rendH = wrapW / imgAspect;
      offX = 0; offY = (wrapH - rendH) / 2;
    } else {
      rendH = wrapH; rendW = wrapH * imgAspect;
      offX = (wrapW - rendW) / 2; offY = 0;
    }

    // Mouse relative to wrapper center
    const cx = wrapW / 2;
    const cy = wrapH / 2;
    let mx = (e.clientX - rect.left) - cx;
    let my = (e.clientY - rect.top) - cy;
    // Reverse pan & zoom
    mx = (mx - panX) / zoom;
    my = (my - panY) / zoom;
    mx += cx;
    my += cy;
    // Relative to rendered image
    const px = ((mx - offX) / rendW) * 100;
    const py = ((my - offY) / rendH) * 100;
    return { x: px, y: py };
  }, [imgNatW, imgNatH, zoom, panX, panY]);

  const hitTest = useCallback((c: { x: number; y: number }) => {
    for (let i = annotations.length - 1; i >= 0; i--) {
      const a = annotations[i];
      if (a.type === 'point' || a.type === 'number' || a.type === 'text') {
        if (Math.abs(a.x - c.x) < 3 && Math.abs(a.y - c.y) < 3) return a;
      } else if (a.type === 'rect') {
        if (c.x >= a.x && c.x <= a.x + (a.width || 0) && c.y >= a.y && c.y <= a.y + (a.height || 0)) return a;
      } else if (a.type === 'arrow') {
        if (Math.abs(a.x - c.x) < 3 && Math.abs(a.y - c.y) < 3) return a;
      }
    }
    return null;
  }, [annotations]);

  // Mouse handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || (spaceHeld && e.button === 0)) {
      e.preventDefault();
      setIsPanning(true);
      panRef.current = { startX: e.clientX, startY: e.clientY, startPanX: panX, startPanY: panY };
      return;
    }
    if (readOnly) return;
    const coords = toImageCoords(e);
    if (!coords) return;
    const clicked = hitTest(coords);

    if (tool === 'select') {
      if (clicked) {
        setSelectedId(clicked.id);
        setDragging({ id: clicked.id, ox: coords.x - clicked.x, oy: coords.y - clicked.y, orig: { ...clicked } });
      } else { setSelectedId(null); }
      return;
    }
    if (clicked) {
      setSelectedId(clicked.id);
      setDragging({ id: clicked.id, ox: coords.x - clicked.x, oy: coords.y - clicked.y, orig: { ...clicked } });
      return;
    }
    setSelectedId(null);
    if (tool === 'point' || tool === 'text' || tool === 'number') {
      onChange([...annotations, {
        id: `ann_${Date.now()}`, type: tool,
        x: coords.x, y: coords.y,
        number: tool === 'number' ? nextNumber : undefined,
        name: '', description: '', category: 'other',
      }]);
    } else {
      setIsDrawing(true);
      setDrawStart(coords);
    }
  }, [tool, annotations, readOnly, toImageCoords, nextNumber, onChange, hitTest, spaceHeld, panX, panY]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      setPanX(panRef.current.startPanX + e.clientX - panRef.current.startX);
      setPanY(panRef.current.startPanY + e.clientY - panRef.current.startY);
      return;
    }
    if (readOnly) return;
    const coords = toImageCoords(e);
    if (!coords) return;
    if (dragging) {
      const nx = coords.x - dragging.ox;
      const ny = coords.y - dragging.oy;
      const o = dragging.orig;
      onChange(annotations.map(a => a.id === dragging.id ? {
        ...a, x: nx, y: ny,
        endX: a.endX !== undefined ? nx + ((o.endX || 0) - o.x) : undefined,
        endY: a.endY !== undefined ? ny + ((o.endY || 0) - o.y) : undefined,
      } : a));
      return;
    }
    if (!isDrawing || !drawStart) return;
    if (tool === 'rect') {
      setTempAnnotation({ type: 'rect', x: Math.min(drawStart.x, coords.x), y: Math.min(drawStart.y, coords.y), width: Math.abs(coords.x - drawStart.x), height: Math.abs(coords.y - drawStart.y) });
    } else if (tool === 'arrow') {
      setTempAnnotation({ type: 'arrow', x: drawStart.x, y: drawStart.y, endX: coords.x, endY: coords.y });
    }
  }, [isPanning, readOnly, toImageCoords, dragging, isDrawing, drawStart, tool, annotations, onChange]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (isPanning) { setIsPanning(false); return; }
    if (dragging) { setDragging(null); return; }
    if (!isDrawing || !drawStart || readOnly) return;
    const coords = toImageCoords(e);
    if (!coords) return;
    setIsDrawing(false);
    if (tool === 'rect' || tool === 'arrow') {
      onChange([...annotations, {
        id: `ann_${Date.now()}`, type: tool,
        x: tool === 'rect' ? Math.min(drawStart.x, coords.x) : drawStart.x,
        y: tool === 'rect' ? Math.min(drawStart.y, coords.y) : drawStart.y,
        width: tool === 'rect' ? Math.abs(coords.x - drawStart.x) : undefined,
        height: tool === 'rect' ? Math.abs(coords.y - drawStart.y) : undefined,
        endX: tool === 'arrow' ? coords.x : undefined,
        endY: tool === 'arrow' ? coords.y : undefined,
        name: '', description: '', category: 'other',
      }]);
    }
    setTempAnnotation(null);
    setDrawStart(null);
  }, [isDrawing, drawStart, tool, readOnly, toImageCoords, dragging, annotations, onChange, isPanning]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setZoom(prev => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prev + (e.deltaY > 0 ? -0.15 : 0.15))));
  }, []);

  const handleEdit = () => {
    const sel = annotations.find(a => a.id === selectedId);
    if (sel) { setEditingAnnotation({ ...sel }); setEditDialogOpen(true); }
  };
  const handleDoubleClick = (id: string) => {
    const ann = annotations.find(a => a.id === id);
    if (ann && !readOnly) { setSelectedId(id); setEditingAnnotation({ ...ann }); setEditDialogOpen(true); }
  };
  const handleSaveAnnotation = () => {
    if (!editingAnnotation) return;
    const exists = annotations.find(a => a.id === editingAnnotation.id);
    onChange(exists ? annotations.map(a => a.id === editingAnnotation.id ? editingAnnotation : a) : [...annotations, editingAnnotation]);
    setEditDialogOpen(false); setEditingAnnotation(null);
  };
  const handleDelete = () => { if (selectedId) { onChange(annotations.filter(a => a.id !== selectedId)); setSelectedId(null); } };

  // SVG helpers
  const renderSvgAnnotation = (ann: Annotation) => {
    const isSelected = selectedId === ann.id;
    const isHighlighted = highlightId === ann.id;
    const stroke = isSelected || isHighlighted ? '#3b82f6' : '#2563eb';
    const sw = isSelected || isHighlighted ? 3 : 2;
    // Scale coords from percentage to image natural pixels for viewBox
    const px = (ann.x / 100) * imgNatW;
    const py = (ann.y / 100) * imgNatH;

    switch (ann.type) {
      case 'point':
        return (
          <g key={ann.id} onClick={() => setSelectedId(ann.id)} onDoubleClick={() => handleDoubleClick(ann.id)} style={{ cursor: 'pointer' }}>
            <circle cx={px} cy={py} r={8} fill="#3b82f6" stroke="#fff" strokeWidth={3} />
          </g>
        );
      case 'number':
        return (
          <g key={ann.id} onClick={() => setSelectedId(ann.id)} onDoubleClick={() => handleDoubleClick(ann.id)} style={{ cursor: 'pointer' }}>
            <circle cx={px} cy={py} r={14} fill="#3b82f6" stroke="#fff" strokeWidth={3} />
            <text x={px} y={py} textAnchor="middle" dominantBaseline="central" fill="#fff" fontSize={14} fontWeight="bold">{ann.number}</text>
          </g>
        );
      case 'rect': {
        const rw = ((ann.width || 0) / 100) * imgNatW;
        const rh = ((ann.height || 0) / 100) * imgNatH;
        return (
          <g key={ann.id} onClick={() => setSelectedId(ann.id)} onDoubleClick={() => handleDoubleClick(ann.id)} style={{ cursor: 'pointer' }}>
            <rect x={px} y={py} width={rw} height={rh} fill="rgba(59,130,246,0.15)" stroke={stroke} strokeWidth={sw} />
          </g>
        );
      }
      case 'arrow': {
        const ex = ((ann.endX || ann.x) / 100) * imgNatW;
        const ey = ((ann.endY || ann.y) / 100) * imgNatH;
        return (
          <g key={ann.id} onClick={() => setSelectedId(ann.id)} onDoubleClick={() => handleDoubleClick(ann.id)} style={{ cursor: 'pointer' }}>
            <defs><marker id={`ah-${ann.id}`} markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill={stroke} /></marker></defs>
            <line x1={px} y1={py} x2={ex} y2={ey} stroke={stroke} strokeWidth={sw} markerEnd={`url(#ah-${ann.id})`} />
          </g>
        );
      }
      case 'text':
        return (
          <g key={ann.id} onClick={() => setSelectedId(ann.id)} onDoubleClick={() => handleDoubleClick(ann.id)} style={{ cursor: 'pointer' }}>
            <rect x={px} y={py - 18} width={Math.max(60, (ann.name || '文本').length * 14)} height={24} rx={4} fill="rgba(0,0,0,0.75)" />
            <text x={px + 4} y={py - 2} fill="#fff" fontSize={14}>{ann.name || '文本'}</text>
          </g>
        );
      default: return null;
    }
  };

  const renderTempSvg = () => {
    if (!tempAnnotation) return null;
    if (tempAnnotation.type === 'rect') {
      const px = ((tempAnnotation.x || 0) / 100) * imgNatW;
      const py = ((tempAnnotation.y || 0) / 100) * imgNatH;
      const rw = ((tempAnnotation.width || 0) / 100) * imgNatW;
      const rh = ((tempAnnotation.height || 0) / 100) * imgNatH;
      return <rect x={px} y={py} width={rw} height={rh} fill="rgba(59,130,246,0.1)" stroke="#3b82f6" strokeWidth={2} strokeDasharray="6 3" />;
    }
    if (tempAnnotation.type === 'arrow') {
      const px = ((tempAnnotation.x || 0) / 100) * imgNatW;
      const py = ((tempAnnotation.y || 0) / 100) * imgNatH;
      const ex = ((tempAnnotation.endX || 0) / 100) * imgNatW;
      const ey = ((tempAnnotation.endY || 0) / 100) * imgNatH;
      return <line x1={px} y1={py} x2={ex} y2={ey} stroke="#3b82f6" strokeWidth={2} strokeDasharray="6 3" />;
    }
    return null;
  };

  return (
    <div className="space-y-2">
      {/* Toolbar */}
      {!readOnly && (
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex gap-1 p-1 bg-muted rounded-lg">
            {TOOLS.map(t => (
              <Button key={t.value} variant={tool === t.value ? 'default' : 'ghost'} size="sm" className="h-8 w-8 p-0" onClick={() => setTool(t.value)} title={t.label}>{t.icon}</Button>
            ))}
          </div>
          <div className="w-px h-6 bg-border" />
          <div className="flex gap-1 p-1 bg-muted rounded-lg items-center">
            <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setZoom(z => Math.max(MIN_ZOOM, z - 0.25))}><ZoomOut className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>缩小</TooltipContent></Tooltip>
            <span className="text-xs font-mono w-10 text-center text-muted-foreground">{Math.round(zoom * 100)}%</span>
            <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setZoom(z => Math.min(MAX_ZOOM, z + 0.25))}><ZoomIn className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>放大</TooltipContent></Tooltip>
            <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => { setZoom(1); setPanX(0); setPanY(0); }}><Maximize className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>重置视图</TooltipContent></Tooltip>
          </div>
          {selectedId && (
            <div className="flex gap-1">
              <Button variant="outline" size="sm" className="h-8" onClick={handleEdit}><Edit3 className="h-3 w-3 mr-1" />编辑</Button>
              <Button variant="destructive" size="sm" className="h-8" onClick={handleDelete}><Trash2 className="h-3 w-3 mr-1" />删除</Button>
            </div>
          )}
        </div>
      )}

      {/* Canvas wrapper */}
      <div
        ref={wrapperRef}
        className={cn(
          "relative bg-muted rounded-lg overflow-hidden select-none",
          (spaceHeld || isPanning) ? "cursor-grab" : "cursor-crosshair",
          isPanning && "cursor-grabbing",
          fillContainer ? "h-full" : "aspect-video",
        )}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        onMouseLeave={() => { setIsDrawing(false); setTempAnnotation(null); setDrawStart(null); setDragging(null); if (isPanning) setIsPanning(false); }}
      >
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
            transformOrigin: 'center center',
            transition: isPanning ? 'none' : 'transform 0.2s ease',
          }}
        >
          {/* Loading */}
          {!imgLoaded && !imgError && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">加载截图中...</span>
            </div>
          )}

          {/* Error */}
          {imgError && (
            <div className="text-center space-y-2">
              <p className="text-sm text-destructive font-medium">截图加载失败</p>
              <p className="text-xs text-muted-foreground">请返回重新截图</p>
            </div>
          )}

          {/* Image + SVG overlay */}
          <div className="relative" style={{ display: imgLoaded ? 'block' : 'none' }}>
            <img
              src={imageUrl}
              alt="标注图片"
              className="max-w-full max-h-full object-contain pointer-events-none"
              onLoad={(e) => {
                const img = e.target as HTMLImageElement;
                console.log('[AnnotationCanvas] image loaded:', img.naturalWidth, 'x', img.naturalHeight);
                setImgNatW(img.naturalWidth);
                setImgNatH(img.naturalHeight);
                setImgError(false);
                setImgLoaded(true);
              }}
              onError={() => { console.error('[AnnotationCanvas] image load error'); setImgError(true); }}
            />
            {imgLoaded && imgNatW > 0 && imgNatH > 0 && (
              <svg
                className="absolute inset-0 w-full h-full"
                viewBox={`0 0 ${imgNatW} ${imgNatH}`}
                preserveAspectRatio="xMidYMid meet"
                style={{ pointerEvents: 'none' }}
              >
                <g style={{ pointerEvents: 'auto' }}>
                  {annotations.map(renderSvgAnnotation)}
                  {renderTempSvg()}
                </g>
              </svg>
            )}
          </div>
        </div>

        {zoom !== 1 && (
          <div className="absolute bottom-2 right-2 bg-background/80 text-foreground text-xs px-2 py-1 rounded-md pointer-events-none">{Math.round(zoom * 100)}%</div>
        )}
        {spaceHeld && !isPanning && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-background/80 text-foreground text-xs px-3 py-1 rounded-md pointer-events-none">拖拽平移图片</div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>编辑标注</DialogTitle></DialogHeader>
          {editingAnnotation && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>名称 *</Label>
                  <Input value={editingAnnotation.name} onChange={(e) => setEditingAnnotation({ ...editingAnnotation, name: e.target.value })} placeholder="例如：Mark点1" />
                </div>
                <div className="space-y-2">
                  <Label>类型</Label>
                  <Select value={editingAnnotation.category} onValueChange={(v) => setEditingAnnotation({ ...editingAnnotation, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>说明</Label>
                <Textarea value={editingAnnotation.description} onChange={(e) => setEditingAnnotation({ ...editingAnnotation, description: e.target.value })} placeholder="详细说明..." rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>尺寸（可选）</Label>
                  <Input value={editingAnnotation.dimension || ''} onChange={(e) => setEditingAnnotation({ ...editingAnnotation, dimension: e.target.value })} placeholder="例如：Φ3mm" />
                </div>
                <div className="space-y-2">
                  <Label>公差（可选）</Label>
                  <Input value={editingAnnotation.tolerance || ''} onChange={(e) => setEditingAnnotation({ ...editingAnnotation, tolerance: e.target.value })} placeholder="例如：±0.1mm" />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>取消</Button>
            <Button onClick={handleSaveAnnotation} disabled={!editingAnnotation?.name}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
