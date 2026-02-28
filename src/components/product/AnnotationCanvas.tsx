import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import {
  Circle,
  Square,
  ArrowRight,
  Type,
  Hash,
  Trash2,
  Edit3,
  MousePointer,
} from 'lucide-react';

export interface Annotation {
  id: string;
  type: 'point' | 'rect' | 'arrow' | 'text' | 'number';
  x: number;
  y: number;
  width?: number;
  height?: number;
  endX?: number;
  endY?: number;
  number?: number;
  name: string;
  description: string;
  category: string;
  dimension?: string;
  tolerance?: string;
}

interface AnnotationCanvasProps {
  imageUrl: string;
  annotations: Annotation[];
  onChange: (annotations: Annotation[]) => void;
  readOnly?: boolean;
  fillContainer?: boolean;
  highlightId?: string | null;
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

interface ImageBounds {
  renderWidth: number;
  renderHeight: number;
  offsetX: number;
  offsetY: number;
}

export function AnnotationCanvas({
  imageUrl,
  annotations,
  onChange,
  readOnly = false,
  fillContainer = false,
  highlightId = null,
}: AnnotationCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tool, setTool] = useState<Tool>('point');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingAnnotation, setEditingAnnotation] = useState<Annotation | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [tempAnnotation, setTempAnnotation] = useState<Partial<Annotation> | null>(null);
  const [nextNumber, setNextNumber] = useState(1);
  const [imageSize, setImageSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [imageBounds, setImageBounds] = useState<ImageBounds>({ renderWidth: 0, renderHeight: 0, offsetX: 0, offsetY: 0 });
  const [dragging, setDragging] = useState<{ id: string; offsetX: number; offsetY: number; origAnnotation: Annotation } | null>(null);

  // Calculate next number
  useEffect(() => {
    const maxNumber = annotations
      .filter(a => a.type === 'number')
      .reduce((max, a) => Math.max(max, a.number || 0), 0);
    setNextNumber(maxNumber + 1);
  }, [annotations]);

  // Calculate image bounds for object-contain alignment
  const calcImageBounds = useCallback(() => {
    if (!containerRef.current || !imageSize.width || !imageSize.height) return;
    const container = containerRef.current.getBoundingClientRect();
    const containerAspect = container.width / container.height;
    const imageAspect = imageSize.width / imageSize.height;

    let renderWidth: number, renderHeight: number, offsetX: number, offsetY: number;
    if (imageAspect > containerAspect) {
      renderWidth = container.width;
      renderHeight = container.width / imageAspect;
      offsetX = 0;
      offsetY = (container.height - renderHeight) / 2;
    } else {
      renderHeight = container.height;
      renderWidth = container.height * imageAspect;
      offsetX = (container.width - renderWidth) / 2;
      offsetY = 0;
    }
    setImageBounds({ renderWidth, renderHeight, offsetX, offsetY });
  }, [imageSize]);

  useEffect(() => {
    calcImageBounds();
    window.addEventListener('resize', calcImageBounds);
    return () => window.removeEventListener('resize', calcImageBounds);
  }, [calcImageBounds]);

  // Get coordinates relative to the actual rendered image area
  const getRelativeCoords = useCallback((e: React.MouseEvent): { x: number; y: number } => {
    if (!containerRef.current || !imageBounds.renderWidth || !imageBounds.renderHeight) return { x: 0, y: 0 };
    const container = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - container.left - imageBounds.offsetX;
    const mouseY = e.clientY - container.top - imageBounds.offsetY;
    return {
      x: (mouseX / imageBounds.renderWidth) * 100,
      y: (mouseY / imageBounds.renderHeight) * 100,
    };
  }, [imageBounds]);

  // Hit-test: find annotation under cursor
  const hitTest = useCallback((coords: { x: number; y: number }) => {
    // Search in reverse so top-most (last drawn) annotations are found first
    for (let i = annotations.length - 1; i >= 0; i--) {
      const a = annotations[i];
      if (a.type === 'point' || a.type === 'number') {
        if (Math.abs(a.x - coords.x) < 3 && Math.abs(a.y - coords.y) < 3) return a;
      } else if (a.type === 'rect') {
        if (coords.x >= a.x && coords.x <= a.x + (a.width || 0) &&
            coords.y >= a.y && coords.y <= a.y + (a.height || 0)) return a;
      } else if (a.type === 'arrow' || a.type === 'text') {
        if (Math.abs(a.x - coords.x) < 3 && Math.abs(a.y - coords.y) < 3) return a;
      }
    }
    return null;
  }, [annotations]);

  // Handle mouse down — any tool can select/drag existing annotations
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (readOnly) return;
    const coords = getRelativeCoords(e);

    // Try to hit-test existing annotations first (works in any tool)
    const clicked = hitTest(coords);

    if (tool === 'select') {
      if (clicked) {
        setSelectedId(clicked.id);
        setDragging({
          id: clicked.id,
          offsetX: coords.x - clicked.x,
          offsetY: coords.y - clicked.y,
          origAnnotation: { ...clicked },
        });
      } else {
        setSelectedId(null);
      }
      return;
    }

    // For drawing tools: if clicking on an existing annotation, select it instead of drawing
    if (clicked) {
      setSelectedId(clicked.id);
      setDragging({
        id: clicked.id,
        offsetX: coords.x - clicked.x,
        offsetY: coords.y - clicked.y,
        origAnnotation: { ...clicked },
      });
      return;
    }

    // Not clicking on annotation — start drawing
    setSelectedId(null);
    setIsDrawing(true);
    setDrawStart(coords);

    // For point-based tools: add immediately without opening dialog
    if (tool === 'point' || tool === 'text' || tool === 'number') {
      const newAnnotation: Annotation = {
        id: `ann_${Date.now()}`,
        type: tool,
        x: coords.x,
        y: coords.y,
        number: tool === 'number' ? nextNumber : undefined,
        name: '',
        description: '',
        category: 'other',
      };
      onChange([...annotations, newAnnotation]);
      setIsDrawing(false);
    }
  }, [tool, annotations, readOnly, getRelativeCoords, nextNumber, onChange, hitTest]);

  // Handle mouse move
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (readOnly) return;
    const coords = getRelativeCoords(e);

    if (dragging) {
      const newX = coords.x - dragging.offsetX;
      const newY = coords.y - dragging.offsetY;
      const orig = dragging.origAnnotation;
      onChange(annotations.map(a =>
        a.id === dragging.id
          ? {
              ...a,
              x: newX,
              y: newY,
              endX: a.endX !== undefined ? newX + ((orig.endX || 0) - orig.x) : undefined,
              endY: a.endY !== undefined ? newY + ((orig.endY || 0) - orig.y) : undefined,
            }
          : a
      ));
      return;
    }

    if (!isDrawing || !drawStart) return;

    if (tool === 'rect') {
      setTempAnnotation({
        type: 'rect',
        x: Math.min(drawStart.x, coords.x),
        y: Math.min(drawStart.y, coords.y),
        width: Math.abs(coords.x - drawStart.x),
        height: Math.abs(coords.y - drawStart.y),
      });
    } else if (tool === 'arrow') {
      setTempAnnotation({
        type: 'arrow',
        x: drawStart.x,
        y: drawStart.y,
        endX: coords.x,
        endY: coords.y,
      });
    }
  }, [isDrawing, drawStart, tool, readOnly, getRelativeCoords, dragging, annotations, onChange]);

  // Handle mouse up
  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (dragging) {
      setDragging(null);
      return;
    }
    if (!isDrawing || !drawStart || readOnly) return;
    const coords = getRelativeCoords(e);
    setIsDrawing(false);

    // For rect/arrow: add immediately without opening dialog
    if (tool === 'rect' || tool === 'arrow') {
      const newAnnotation: Annotation = {
        id: `ann_${Date.now()}`,
        type: tool,
        x: tool === 'rect' ? Math.min(drawStart.x, coords.x) : drawStart.x,
        y: tool === 'rect' ? Math.min(drawStart.y, coords.y) : drawStart.y,
        width: tool === 'rect' ? Math.abs(coords.x - drawStart.x) : undefined,
        height: tool === 'rect' ? Math.abs(coords.y - drawStart.y) : undefined,
        endX: tool === 'arrow' ? coords.x : undefined,
        endY: tool === 'arrow' ? coords.y : undefined,
        name: '',
        description: '',
        category: 'other',
      };
      onChange([...annotations, newAnnotation]);
    }

    setTempAnnotation(null);
    setDrawStart(null);
  }, [isDrawing, drawStart, tool, readOnly, getRelativeCoords, dragging, annotations, onChange]);

  // Save annotation from dialog
  const handleSaveAnnotation = () => {
    if (!editingAnnotation) return;

    const existing = annotations.find(a => a.id === editingAnnotation.id);
    if (existing) {
      onChange(annotations.map(a => a.id === editingAnnotation.id ? editingAnnotation : a));
    } else {
      onChange([...annotations, editingAnnotation]);
    }

    setEditDialogOpen(false);
    setEditingAnnotation(null);
  };

  // Delete selected annotation
  const handleDelete = useCallback(() => {
    if (selectedId) {
      onChange(annotations.filter(a => a.id !== selectedId));
      setSelectedId(null);
    }
  }, [selectedId, annotations, onChange]);

  // Keyboard shortcuts: Delete/Backspace to remove selected annotation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (readOnly || !selectedId) return;
      if (editDialogOpen) return; // Don't delete while editing
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        handleDelete();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [readOnly, selectedId, editDialogOpen, handleDelete]);

  // Edit selected annotation (manual trigger only)
  const handleEdit = () => {
    const selected = annotations.find(a => a.id === selectedId);
    if (selected) {
      setEditingAnnotation({ ...selected });
      setEditDialogOpen(true);
    }
  };

  // Double-click to edit
  const handleDoubleClick = useCallback((annId: string) => {
    const ann = annotations.find(a => a.id === annId);
    if (ann && !readOnly) {
      setSelectedId(annId);
      setEditingAnnotation({ ...ann });
      setEditDialogOpen(true);
    }
  }, [annotations, readOnly]);

  // Render annotation
  const renderAnnotation = (ann: Annotation) => {
    const isSelected = selectedId === ann.id;
    const isHighlighted = highlightId === ann.id;
    const baseClass = cn(
      "absolute pointer-events-auto cursor-pointer transition-all",
      isSelected && "ring-2 ring-primary ring-offset-1",
      isHighlighted && "ring-2 ring-primary ring-offset-1 animate-pulse"
    );

    switch (ann.type) {
      case 'point':
        return (
          <div
            key={ann.id}
            className={cn(baseClass, "w-4 h-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary border-2 border-white shadow-lg")}
            style={{ left: `${ann.x}%`, top: `${ann.y}%` }}
            onClick={() => setSelectedId(ann.id)}
            onDoubleClick={() => handleDoubleClick(ann.id)}
            title={ann.name || '标注点'}
          />
        );

      case 'number':
        return (
          <div
            key={ann.id}
            className={cn(baseClass, "w-6 h-6 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold border-2 border-white shadow-lg")}
            style={{ left: `${ann.x}%`, top: `${ann.y}%` }}
            onClick={() => setSelectedId(ann.id)}
            onDoubleClick={() => handleDoubleClick(ann.id)}
            title={ann.name || `标注${ann.number}`}
          >
            {ann.number}
          </div>
        );

      case 'rect':
        return (
          <div
            key={ann.id}
            className={cn(baseClass, "border-2 border-primary bg-primary/20")}
            style={{
              left: `${ann.x}%`,
              top: `${ann.y}%`,
              width: `${ann.width}%`,
              height: `${ann.height}%`,
            }}
            onClick={() => setSelectedId(ann.id)}
            onDoubleClick={() => handleDoubleClick(ann.id)}
            title={ann.name || '区域'}
          />
        );

      case 'arrow': {
        const dx = (ann.endX || ann.x) - ann.x;
        const dy = (ann.endY || ann.y) - ann.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);

        return (
          <div
            key={ann.id}
            className={cn(baseClass, "h-0.5 bg-primary origin-left")}
            style={{
              left: `${ann.x}%`,
              top: `${ann.y}%`,
              width: `${length}%`,
              transform: `rotate(${angle}deg)`,
            }}
            onClick={() => setSelectedId(ann.id)}
            onDoubleClick={() => handleDoubleClick(ann.id)}
            title={ann.name || '箭头'}
          >
            <div
              className="absolute right-0 top-1/2 -translate-y-1/2 border-l-8 border-l-primary border-y-4 border-y-transparent"
            />
          </div>
        );
      }

      case 'text':
        return (
          <div
            key={ann.id}
            className={cn(baseClass, "px-2 py-1 bg-background/90 border border-primary rounded text-xs whitespace-nowrap")}
            style={{ left: `${ann.x}%`, top: `${ann.y}%` }}
            onClick={() => setSelectedId(ann.id)}
            onDoubleClick={() => handleDoubleClick(ann.id)}
          >
            {ann.name || '文本'}
          </div>
        );

      default:
        return null;
    }
  };

  // Render temporary annotation while drawing
  const renderTempAnnotation = () => {
    if (!tempAnnotation) return null;

    if (tempAnnotation.type === 'rect') {
      return (
        <div
          className="absolute border-2 border-primary border-dashed bg-primary/10 pointer-events-none"
          style={{
            left: `${tempAnnotation.x}%`,
            top: `${tempAnnotation.y}%`,
            width: `${tempAnnotation.width}%`,
            height: `${tempAnnotation.height}%`,
          }}
        />
      );
    }

    if (tempAnnotation.type === 'arrow') {
      const dx = (tempAnnotation.endX || 0) - (tempAnnotation.x || 0);
      const dy = (tempAnnotation.endY || 0) - (tempAnnotation.y || 0);
      const length = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);

      return (
        <div
          className="absolute h-0.5 bg-primary/50 origin-left pointer-events-none"
          style={{
            left: `${tempAnnotation.x}%`,
            top: `${tempAnnotation.y}%`,
            width: `${length}%`,
            transform: `rotate(${angle}deg)`,
          }}
        />
      );
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
              <Button
                key={t.value}
                variant={tool === t.value ? 'default' : 'ghost'}
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setTool(t.value)}
                title={t.label}
              >
                {t.icon}
              </Button>
            ))}
          </div>

          {selectedId && (
            <div className="flex gap-1">
              <Button variant="outline" size="sm" className="h-8" onClick={handleEdit}>
                <Edit3 className="h-3 w-3 mr-1" />
                编辑
              </Button>
              <Button variant="destructive" size="sm" className="h-8" onClick={handleDelete}>
                <Trash2 className="h-3 w-3 mr-1" />
                删除
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Canvas */}
      <div
        ref={containerRef}
        className={cn(
          "relative bg-muted rounded-lg overflow-hidden cursor-crosshair select-none",
          fillContainer ? "h-full" : "aspect-video"
        )}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          if (isDrawing) {
            setIsDrawing(false);
            setTempAnnotation(null);
            setDrawStart(null);
          }
          if (dragging) {
            setDragging(null);
          }
        }}
      >
        <img
          src={imageUrl}
          alt="标注图片"
          className="w-full h-full object-contain pointer-events-none"
          onLoad={(e) => {
            const img = e.target as HTMLImageElement;
            setImageSize({ width: img.naturalWidth, height: img.naturalHeight });
          }}
        />

        {/* Annotations layer — aligned to actual rendered image area */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: `${imageBounds.offsetX}px`,
            top: `${imageBounds.offsetY}px`,
            width: `${imageBounds.renderWidth}px`,
            height: `${imageBounds.renderHeight}px`,
          }}
        >
          {annotations.map(renderAnnotation)}
          {renderTempAnnotation()}
        </div>
      </div>

      {/* Edit Dialog — only opened manually via edit button or double-click */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑标注</DialogTitle>
          </DialogHeader>
          {editingAnnotation && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>名称 *</Label>
                  <Input
                    value={editingAnnotation.name}
                    onChange={(e) => setEditingAnnotation({
                      ...editingAnnotation,
                      name: e.target.value,
                    })}
                    placeholder="例如：Mark点1"
                  />
                </div>
                <div className="space-y-2">
                  <Label>类型</Label>
                  <Select
                    value={editingAnnotation.category}
                    onValueChange={(v) => setEditingAnnotation({
                      ...editingAnnotation,
                      category: v,
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(c => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>说明</Label>
                <Textarea
                  value={editingAnnotation.description}
                  onChange={(e) => setEditingAnnotation({
                    ...editingAnnotation,
                    description: e.target.value,
                  })}
                  placeholder="详细说明..."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>尺寸（可选）</Label>
                  <Input
                    value={editingAnnotation.dimension || ''}
                    onChange={(e) => setEditingAnnotation({
                      ...editingAnnotation,
                      dimension: e.target.value,
                    })}
                    placeholder="例如：Φ3mm"
                  />
                </div>
                <div className="space-y-2">
                  <Label>公差（可选）</Label>
                  <Input
                    value={editingAnnotation.tolerance || ''}
                    onChange={(e) => setEditingAnnotation({
                      ...editingAnnotation,
                      tolerance: e.target.value,
                    })}
                    placeholder="例如：±0.1mm"
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSaveAnnotation} disabled={!editingAnnotation?.name}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
