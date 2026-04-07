import { useState, useCallback, useRef } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Product3DViewer } from '@/components/product/Product3DViewer';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Camera, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

/** Validate that a URL can be decoded as an image by the browser */
function validateImageUrl(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img.naturalWidth > 0 && img.naturalHeight > 0);
    img.onerror = () => resolve(false);
    img.src = url;
  });
}

export function ProductViewerCanvas() {
  const { viewerAssetData, exitViewerMode, switchViewerToAnnotation, selectedWorkstationId } = useAppStore();
  const [viewerRef, setViewerRef] = useState<{
    takeScreenshot: () => string | null;
    takeScreenshotBlob: () => Promise<Blob | null>;
  } | null>(null);
  const [capturing, setCapturing] = useState(false);

  const handleScreenshot = useCallback(async () => {
    if (!viewerAssetData || !viewerRef) return;
    setCapturing(true);

    try {
      let imageUrl: string | null = null;
      let isObjectUrl = false;

      // Attempt 1: blob capture
      const blob = await viewerRef.takeScreenshotBlob();
      if (blob && blob.size > 100) {
        const objUrl = URL.createObjectURL(blob);
        const valid = await validateImageUrl(objUrl);
        if (valid) {
          imageUrl = objUrl;
          isObjectUrl = true;
        } else {
          URL.revokeObjectURL(objUrl);
        }
      }

      // Attempt 2: retry with delay
      if (!imageUrl) {
        await new Promise(r => setTimeout(r, 800));
        const blob2 = await viewerRef.takeScreenshotBlob();
        if (blob2 && blob2.size > 100) {
          const objUrl2 = URL.createObjectURL(blob2);
          const valid2 = await validateImageUrl(objUrl2);
          if (valid2) {
            imageUrl = objUrl2;
            isObjectUrl = true;
          } else {
            URL.revokeObjectURL(objUrl2);
          }
        }
      }

      // Attempt 3: sync data URL fallback
      if (!imageUrl) {
        const dataUrl = viewerRef.takeScreenshot();
        if (dataUrl && dataUrl.startsWith('data:image')) {
          const valid3 = await validateImageUrl(dataUrl);
          if (valid3) {
            imageUrl = dataUrl;
            isObjectUrl = false;
          }
        }
      }

      // Attempt 4: fallback to first product image
      if (!imageUrl && viewerAssetData.imageUrls.length > 0) {
        imageUrl = viewerAssetData.imageUrls[0];
        isObjectUrl = false;
      }

      if (imageUrl) {
        // Use atomic switch — store takes ownership of the objectURL
        // No revoking here; store will revoke on exitAnnotationMode
        switchViewerToAnnotation(
          imageUrl,
          isObjectUrl,
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
  }, [viewerRef, viewerAssetData, switchViewerToAnnotation, selectedWorkstationId]);

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
          onReady={setViewerRef}
          fillContainer
        />
      </div>
    </div>
  );
}
