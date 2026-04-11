/**
 * 这个文件不是完整替换版，而是需要并入原来的 ProductViewerCanvas.tsx。
 * 这次最关键的不是 Product3DViewer 本身，而是：
 * 不能在截图还没真正加载成功之前，就先 exitViewerMode()。
 *
 * 需要做的事：
 * 1) 引入 validateAnnotationSnapshot
 * 2) 给“截图并标注”按钮的处理函数加异步校验
 * 3) 只有图片真的能加载，才进入标注模式
 * 4) exitViewerMode() 放到最后一帧，而不是最前面
 */

import { useRef } from 'react';
import { toast } from 'sonner';
import { resolveAnnotationSnapshot, validateAnnotationSnapshot } from '@/utils/productViewer';

const captureLockRef = useRef(false);

const handleCaptureAndAnnotate = async () => {
  if (captureLockRef.current) return;
  captureLockRef.current = true;

  try {
    const capturedSnapshot = await viewer3DRef.current?.takeScreenshot?.();
    const snapshot = resolveAnnotationSnapshot(capturedSnapshot, viewerAssetData.imageUrls ?? []);

    if (!snapshot) {
      toast.error('没有拿到可用截图，请调整视角后重试');
      return;
    }

    const ok = await validateAnnotationSnapshot(snapshot);
    if (!ok) {
      toast.error('截图生成失败，图片未真正加载成功');
      return;
    }

    // 关键点：不要先关 3D 查看器
    // 先把 snapshot 送进标注态，等下一帧稳定后再退出查看器
    enterAnnotationMode(
      snapshot,
      // 这里保留原先你项目里的其他参数；如果原来有第二、第三个参数，照旧带上
    );

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        exitViewerMode();
      });
    });

    toast.success('已进入标注模式');
  } catch (error) {
    console.error('capture annotate failed:', error);
    toast.error('截图进入标注失败，请重试');
  } finally {
    captureLockRef.current = false;
  }
};

/**
 * 如果原文件里已经有同名方法，就把里面的逻辑替换成上面这一版。
 *
 * 同时检查原文件里是不是有这种顺序：
 *   exitViewerMode();
 *   enterAnnotationMode(snapshot);
 *
 * 如果有，必须改成：
 *   enterAnnotationMode(snapshot);
 *   requestAnimationFrame(() => requestAnimationFrame(exitViewerMode));
 */
