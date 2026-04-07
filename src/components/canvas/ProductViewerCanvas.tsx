import { useState, useCallback } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Product3DViewer } from '@/components/product/Product3DViewer';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Camera, Maximize2 } from 'lucide-react';
import { toast } from 'sonner';

export function ProductViewerCanvas() {
  const { viewerAssetData, exitViewerMode, enterAnnotationMode, selectedWorkstationId } = useAppStore();
  const [viewerRef, setViewerRef] = useState<{ takeScreenshot: () => string | null } | null>(null);

  const handleScreenshot = useCallback(async () => {
    if (!viewerAssetData) return;

    let dataUrl: string | null = null;
    if (viewerRef) {
      try {
        dataUrl = viewerRef.takeScreenshot();
      } catch (e) {
        console.warn('Screenshot failed:', e);
      }
    }

    // If screenshot looks invalid, retry after a short delay
    const isValid = (url: string | null) => !!url && url.startsWith('data:image');
    if (!isValid(dataUrl) && viewerRef) {
      await new Promise(r => setTimeout(r, 500));
      try { dataUrl = viewerRef.takeScreenshot(); } catch {}
    }

    // Fallback: use image URL if available
    if (!isValid(dataUrl) && viewerAssetData.imageUrls.length > 0) {
      dataUrl = viewerAssetData.imageUrls[0];
    }

    if (dataUrl) {
      exitViewerMode();
      enterAnnotationMode(dataUrl, viewerAssetData.assetId, viewerAssetData.scope, selectedWorkstationId || undefined);
      toast.success('已进入标注模式');
    } else {
      toast.error('截图失败，请稍后重试');
    }
  }, [viewerRef, viewerAssetData, exitViewerMode, enterAnnotationMode, selectedWorkstationId]);

  if (!viewerAssetData) return null;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-background/80 backdrop-blur-sm shrink-0">
        <Button variant="ghost" size="sm" onClick={exitViewerMode} className="gap-1">
          <ArrowLeft className="h-4 w-4" />
          返回布局图
        </Button>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={handleScreenshot} className="gap-1">
            <Camera className="h-4 w-4" />
            截图并标注
          </Button>
        </div>
      </div>

      {/* Full-size viewer */}
      <div className="flex-1 min-h-0">
        <Product3DViewer
          modelUrl={viewerAssetData.modelUrl}
          imageUrls={viewerAssetData.imageUrls}
          onReady={setViewerRef}
          fillContainer
        />
      </div>
    </div>
  );
}
