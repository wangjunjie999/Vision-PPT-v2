import { useState, useRef, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

const ASPECT_PRESETS = [
  { label: '1:1', value: 1 },
  { label: '4:3', value: 4 / 3 },
  { label: '3:4', value: 3 / 4 },
  { label: '自由', value: 0 },
];

interface ImageCropDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageFile: File | null;
  onCropComplete: (croppedBlob: Blob) => void;
  recommendedSize?: { width: number; height: number };
  title?: string;
}

export function ImageCropDialog({
  open,
  onOpenChange,
  imageFile,
  onCropComplete,
  recommendedSize = { width: 400, height: 400 },
  title = '裁剪图片',
}: ImageCropDialogProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [crop, setCrop] = useState<CropArea>({ x: 0, y: 0, width: 0, height: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragType, setDragType] = useState<'move' | 'resize' | null>(null);
  const [aspectRatio, setAspectRatio] = useState(1);
  const [processing, setProcessing] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [scale, setScale] = useState(1);

  // Load image when file changes
  useEffect(() => {
    if (!imageFile) return;
    const img = new Image();
    img.onload = () => {
      setImage(img);
      // Fit image into canvas area (max 500x400)
      const maxW = 500, maxH = 400;
      const s = Math.min(maxW / img.width, maxH / img.height, 1);
      setScale(s);
      const cw = Math.round(img.width * s);
      const ch = Math.round(img.height * s);
      setCanvasSize({ width: cw, height: ch });

      // Default crop: centered square or ratio-based
      const ratio = aspectRatio || 1;
      let cropW: number, cropH: number;
      if (ratio > 0) {
        cropW = Math.min(cw, ch * ratio);
        cropH = cropW / ratio;
      } else {
        cropW = cw * 0.8;
        cropH = ch * 0.8;
      }
      setCrop({
        x: (cw - cropW) / 2,
        y: (ch - cropH) / 2,
        width: cropW,
        height: cropH,
      });
    };
    img.src = URL.createObjectURL(imageFile);
    return () => URL.revokeObjectURL(img.src);
  }, [imageFile, aspectRatio]);

  // Draw canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;

    // Draw image
    ctx.drawImage(image, 0, 0, canvasSize.width, canvasSize.height);

    // Draw overlay (darkened area outside crop)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);

    // Clear crop area to show original image
    ctx.clearRect(crop.x, crop.y, crop.width, crop.height);
    ctx.drawImage(
      image,
      crop.x / scale, crop.y / scale, crop.width / scale, crop.height / scale,
      crop.x, crop.y, crop.width, crop.height
    );

    // Draw crop border
    ctx.strokeStyle = 'hsl(var(--primary))';
    ctx.lineWidth = 2;
    ctx.strokeRect(crop.x, crop.y, crop.width, crop.height);

    // Draw corner handles
    const handleSize = 8;
    ctx.fillStyle = 'hsl(var(--primary))';
    const corners = [
      [crop.x, crop.y],
      [crop.x + crop.width, crop.y],
      [crop.x, crop.y + crop.height],
      [crop.x + crop.width, crop.y + crop.height],
    ];
    corners.forEach(([cx, cy]) => {
      ctx.fillRect(cx - handleSize / 2, cy - handleSize / 2, handleSize, handleSize);
    });

    // Draw grid lines (rule of thirds)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 3; i++) {
      const gx = crop.x + (crop.width * i) / 3;
      const gy = crop.y + (crop.height * i) / 3;
      ctx.beginPath();
      ctx.moveTo(gx, crop.y);
      ctx.lineTo(gx, crop.y + crop.height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(crop.x, gy);
      ctx.lineTo(crop.x + crop.width, gy);
      ctx.stroke();
    }
  }, [image, crop, canvasSize, scale]);

  const getCanvasPos = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }, []);

  const isNearCorner = useCallback((pos: { x: number; y: number }) => {
    const threshold = 12;
    const corners = [
      { x: crop.x + crop.width, y: crop.y + crop.height },
    ];
    return corners.some(c => Math.abs(pos.x - c.x) < threshold && Math.abs(pos.y - c.y) < threshold);
  }, [crop]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getCanvasPos(e);
    setDragging(true);
    setDragStart(pos);
    if (isNearCorner(pos)) {
      setDragType('resize');
    } else if (
      pos.x >= crop.x && pos.x <= crop.x + crop.width &&
      pos.y >= crop.y && pos.y <= crop.y + crop.height
    ) {
      setDragType('move');
    } else {
      setDragType(null);
      setDragging(false);
    }
  }, [getCanvasPos, isNearCorner, crop]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!dragging || !dragType) return;
    const pos = getCanvasPos(e);
    const dx = pos.x - dragStart.x;
    const dy = pos.y - dragStart.y;
    setDragStart(pos);

    setCrop(prev => {
      if (dragType === 'move') {
        let nx = prev.x + dx;
        let ny = prev.y + dy;
        nx = Math.max(0, Math.min(canvasSize.width - prev.width, nx));
        ny = Math.max(0, Math.min(canvasSize.height - prev.height, ny));
        return { ...prev, x: nx, y: ny };
      } else {
        let nw = Math.max(30, prev.width + dx);
        let nh: number;
        if (aspectRatio > 0) {
          nh = nw / aspectRatio;
        } else {
          nh = Math.max(30, prev.height + dy);
        }
        nw = Math.min(nw, canvasSize.width - prev.x);
        nh = Math.min(nh, canvasSize.height - prev.y);
        if (aspectRatio > 0) {
          nw = nh * aspectRatio;
        }
        return { ...prev, width: nw, height: nh };
      }
    });
  }, [dragging, dragType, dragStart, getCanvasPos, canvasSize, aspectRatio]);

  const handleMouseUp = useCallback(() => {
    setDragging(false);
    setDragType(null);
  }, []);

  const handleReset = useCallback(() => {
    if (!image) return;
    const ratio = aspectRatio || 1;
    let cropW: number, cropH: number;
    if (ratio > 0) {
      cropW = Math.min(canvasSize.width, canvasSize.height * ratio);
      cropH = cropW / ratio;
    } else {
      cropW = canvasSize.width * 0.8;
      cropH = canvasSize.height * 0.8;
    }
    setCrop({
      x: (canvasSize.width - cropW) / 2,
      y: (canvasSize.height - cropH) / 2,
      width: cropW,
      height: cropH,
    });
  }, [image, canvasSize, aspectRatio]);

  const handleCrop = useCallback(async () => {
    if (!image) return;
    setProcessing(true);
    try {
      const outputCanvas = document.createElement('canvas');
      // Use original image coordinates
      const sx = crop.x / scale;
      const sy = crop.y / scale;
      const sw = crop.width / scale;
      const sh = crop.height / scale;

      // Output at recommended size or original crop size
      const outputW = Math.min(recommendedSize.width, sw);
      const outputH = Math.min(recommendedSize.height, sh);
      outputCanvas.width = outputW;
      outputCanvas.height = outputH;

      const ctx = outputCanvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context failed');

      ctx.drawImage(image, sx, sy, sw, sh, 0, 0, outputW, outputH);

      const blob = await new Promise<Blob>((resolve, reject) => {
        outputCanvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error('Blob creation failed'))),
          'image/png',
          0.92
        );
      });

      onCropComplete(blob);
      onOpenChange(false);
    } catch (error) {
      console.error('Crop error:', error);
    } finally {
      setProcessing(false);
    }
  }, [image, crop, scale, recommendedSize, onCropComplete, onOpenChange]);

  const handleSkipCrop = useCallback(() => {
    if (!imageFile) return;
    onCropComplete(imageFile);
    onOpenChange(false);
  }, [imageFile, onCropComplete, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[580px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {/* Aspect ratio presets */}
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground">比例：</Label>
            {ASPECT_PRESETS.map((preset) => (
              <Button
                key={preset.label}
                variant={aspectRatio === preset.value ? 'default' : 'outline'}
                size="sm"
                className="h-7 text-xs px-2"
                onClick={() => setAspectRatio(preset.value)}
              >
                {preset.label}
              </Button>
            ))}
            <div className="ml-auto">
              <Button variant="ghost" size="sm" className="h-7" onClick={handleReset}>
                <RotateCcw className="h-3.5 w-3.5 mr-1" />
                重置
              </Button>
            </div>
          </div>

          {/* Canvas */}
          <div className="flex justify-center bg-muted/30 rounded-lg p-2 min-h-[200px]">
            {canvasSize.width > 0 && (
              <canvas
                ref={canvasRef}
                width={canvasSize.width}
                height={canvasSize.height}
                className="cursor-crosshair rounded"
                style={{ width: canvasSize.width, height: canvasSize.height }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              />
            )}
          </div>

          {/* Info */}
          <div className="text-xs text-muted-foreground text-center">
            推荐尺寸：{recommendedSize.width}×{recommendedSize.height}px · 拖拽移动裁剪区域，拖拽右下角调整大小
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={handleSkipCrop}>
              跳过裁剪，直接上传
            </Button>
            <Button size="sm" onClick={handleCrop} disabled={processing}>
              {processing && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              确认裁剪并上传
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
