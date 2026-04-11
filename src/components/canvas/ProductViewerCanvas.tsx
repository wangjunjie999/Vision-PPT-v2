import { useState, useCallback } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useData } from '@/contexts/DataContext';
import {
  Product3DViewer,
  type Product3DViewerHandle,
} from '@/components/product/Product3DViewer';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Camera } from 'lucide-react';
import { toast } from 'sonner';
import {
  getSupportedProductModelHint,
  resolveViewerAnnotationSnapshot,
  validateAnnotationSnapshot,
} from '@/utils/productViewer';

export function ProductViewerCanvas() {
  const { viewerAssetData, exitViewerMode, transitionViewerToAnnotation } = useAppStore();
  const { selectedWorkstationId } = useData();
  const [viewerRef, setViewerRef] = useState<Product3DViewerHandle | null>(null);
  const [capturing, setCapturing] = useState(false);

  const handleScreenshot = useCallback(async () => {
    if (!viewerAssetData || capturing) return;

    const viewerStatus = viewerRef?.getStatus() || 'loading';
    if (viewerStatus === 'unsupported' && viewerAssetData.imageUrls.length === 0) {
      toast.error(getSupportedProductModelHint());
      return;
    }

    if (viewerStatus === 'loading' && viewerAssetData.imageUrls.length === 0) {
      toast.error('3D 模型仍在加载，请稍后再试');
      return;
    }

    let capturedSnapshot: string | null = null;
    setCapturing(true);
    try {
      if (viewerRef?.canTakeScreenshot()) {
        try {
          capturedSnapshot = await viewerRef.takeScreenshot();
        } catch (e) {
          console.warn('Screenshot failed:', e);
        }
      }

      const snapshot = resolveViewerAnnotationSnapshot(capturedSnapshot, viewerAssetData.imageUrls, {
        preferredDisplayMode: viewerAssetData.preferredDisplayMode,
        modelUrl: viewerAssetData.modelUrl,
        imageUrls: viewerAssetData.imageUrls,
      });

      if (!snapshot) {
        toast.error('截图失败，请确认 GLB 模型已完整显示在当前视角');
        return;
      }

      const snapshotOk = await validateAnnotationSnapshot(snapshot);
      if (!snapshotOk) {
        toast.error(
          '截图未生效或图片无法解码，请重试；若模型使用外链贴图，请确认存储服务已正确配置跨域(CORS)。'
        );
        return;
      }

      transitionViewerToAnnotation(
        snapshot,
        viewerAssetData.assetId,
        viewerAssetData.scope,
        selectedWorkstationId || undefined
      );
      toast.success('已进入标注模式');
    } finally {
      setCapturing(false);
    }
  }, [viewerRef, viewerAssetData, transitionViewerToAnnotation, selectedWorkstationId, capturing]);

  if (!viewerAssetData) return null;

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-background/80 backdrop-blur-sm shrink-0">
        <Button variant="ghost" size="sm" onClick={exitViewerMode} className="gap-1">
          <ArrowLeft className="h-4 w-4" />
          返回布局图
        </Button>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={handleScreenshot} className="gap-1" disabled={capturing}>
            <Camera className="h-4 w-4" />
            {capturing ? '截图中...' : '截图并标注'}
          </Button>
        </div>
      </div>

      {/* Full-size viewer */}
      <div className="flex-1 min-h-0">
        <Product3DViewer
          modelUrl={viewerAssetData.modelUrl}
          imageUrls={viewerAssetData.imageUrls}
          preferredDisplayMode={viewerAssetData.preferredDisplayMode}
          onReady={setViewerRef}
          fillContainer
        />
      </div>
    </div>
  );
}
