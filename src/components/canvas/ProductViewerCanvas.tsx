import { useState, useCallback, useRef } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Product3DViewer } from '@/components/product/Product3DViewer';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Camera, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function ProductViewerCanvas() {
  const { viewerAssetData, exitViewerMode, switchViewerToAnnotation, selectedWorkstationId } = useAppStore();
  const [capturing, setCapturing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleScreenshot = useCallback(async () => {
    if (!viewerAssetData) return;
    setCapturing(true);

    try {
      let dataUrl: string | null = null;

      // For 3D models: grab the visible canvas directly
      if (viewerAssetData.modelUrl && containerRef.current) {
        const canvas = containerRef.current.querySelector('canvas');
        if (canvas && canvas.width > 0 && canvas.height > 0) {
          dataUrl = canvas.toDataURL('image/png');
        }
      }

      // For plain images (no model): use the image URL directly
      if (!dataUrl && viewerAssetData.imageUrls.length > 0) {
        dataUrl = viewerAssetData.imageUrls[0];
      }

      if (dataUrl && dataUrl.length > 100) {
        switchViewerToAnnotation(
          dataUrl,
          false, // data URL, no need to revoke
          viewerAssetData.assetId,
          viewerAssetData.scope,
          selectedWorkstationId || undefined,
        );
        toast.success('已进入标注模式');
      } else {
        toast.error('截图失败，请稍后重试');
      }
    } catch (e) {
      console.error('Screenshot error:', e);
      toast.error('截图过程出错');
    } finally {
      setCapturing(false);
    }
  }, [viewerAssetData, switchViewerToAnnotation, selectedWorkstationId]);

  if (!viewerAssetData) return null;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden" ref={containerRef}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-background/80 backdrop-blur-sm shrink-0">
        <Button variant="ghost" size="sm" onClick={exitViewerMode} className="gap-1">
          <ArrowLeft className="h-4 w-4" />
          返回布局图
        </Button>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={handleScreenshot} disabled={capturing} className="gap-1">
            {capturing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
            {capturing ? '截图中...' : '截图并标注'}
          </Button>
        </div>
      </div>

      {/* Full-size viewer */}
      <div className="flex-1 min-h-0">
        <Product3DViewer
          modelUrl={viewerAssetData.modelUrl}
          imageUrls={viewerAssetData.imageUrls}
          fillContainer
        />
      </div>
    </div>
  );
}
