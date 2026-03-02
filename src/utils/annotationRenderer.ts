import type { Annotation } from '@/components/product/AnnotationCanvas';

/**
 * Render annotations onto an image and return the composited PNG blob.
 * Coordinates in annotations are percentage-based (0-100).
 */
export async function renderAnnotationsToCanvas(
  imageUrl: string,
  annotations: Annotation[]
): Promise<Blob> {
  const img = await loadImage(imageUrl);
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d')!;

  // Draw the original image
  ctx.drawImage(img, 0, 0);

  const w = canvas.width;
  const h = canvas.height;

  // Scale factor for annotations (relative to image size)
  const scale = Math.max(1, Math.min(w, h) / 800);

  for (const ann of annotations) {
    const px = (ann.x / 100) * w;
    const py = (ann.y / 100) * h;

    switch (ann.type) {
      case 'point': {
        const r = 6 * scale;
        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.fillStyle = 'hsl(221, 83%, 53%)'; // primary blue
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2 * scale;
        ctx.stroke();
        break;
      }

      case 'number': {
        const r = 10 * scale;
        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.fillStyle = 'hsl(221, 83%, 53%)';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2 * scale;
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${10 * scale}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(ann.number || ''), px, py);
        break;
      }

      case 'rect': {
        const rw = ((ann.width || 0) / 100) * w;
        const rh = ((ann.height || 0) / 100) * h;
        ctx.fillStyle = 'rgba(59, 130, 246, 0.15)';
        ctx.fillRect(px, py, rw, rh);
        ctx.strokeStyle = 'hsl(221, 83%, 53%)';
        ctx.lineWidth = 2 * scale;
        ctx.strokeRect(px, py, rw, rh);
        break;
      }

      case 'arrow': {
        const ex = ((ann.endX || ann.x) / 100) * w;
        const ey = ((ann.endY || ann.y) / 100) * h;
        ctx.strokeStyle = 'hsl(221, 83%, 53%)';
        ctx.lineWidth = 2 * scale;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(ex, ey);
        ctx.stroke();
        // Arrowhead
        const angle = Math.atan2(ey - py, ex - px);
        const headLen = 12 * scale;
        ctx.beginPath();
        ctx.moveTo(ex, ey);
        ctx.lineTo(ex - headLen * Math.cos(angle - Math.PI / 6), ey - headLen * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(ex - headLen * Math.cos(angle + Math.PI / 6), ey - headLen * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fillStyle = 'hsl(221, 83%, 53%)';
        ctx.fill();
        break;
      }

      case 'text': {
        const text = ann.name || '文本';
        const fontSize = 12 * scale;
        ctx.font = `${fontSize}px sans-serif`;
        const tm = ctx.measureText(text);
        const pad = 4 * scale;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillRect(px, py - fontSize - pad, tm.width + pad * 2, fontSize + pad * 2);
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(text, px + pad, py - fontSize);
        break;
      }
    }

    // Draw name label next to annotation (if has name and not text type)
    if (ann.name && ann.type !== 'text') {
      const fontSize = 11 * scale;
      ctx.font = `${fontSize}px sans-serif`;
      const tm = ctx.measureText(ann.name);
      const pad = 3 * scale;
      const labelX = px + 10 * scale;
      const labelY = py - 10 * scale;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(labelX, labelY - fontSize, tm.width + pad * 2, fontSize + pad * 2);
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(ann.name, labelX + pad, labelY - fontSize + pad);
    }
  }

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Canvas toBlob failed'))),
      'image/png'
    );
  });
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}
