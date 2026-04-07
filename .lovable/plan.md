

## 修复截图标注黑屏问题

### 问题根因

经过分析，标注页确实进入了（工具栏正常显示），`annotationSnapshot` 不为空（否则会显示"没有截图数据"），也没有触发图片加载失败（否则会显示"截图加载失败"错误提示）。

这意味着截图产生了一个**有效但内容全黑的 PNG**。

`ScreenshotHelper` 中的 `renderOnce()` 在调用 `gl.render()` 后立即调用 `canvas.toBlob()`，但 WebGL 的渲染管线可能还没有完成合成（compositing）。`preserveDrawingBuffer: true` 只保证 buffer 不被清空，但不能保证 `toBlob` 调用时帧已经完整输出到画布。

### 修复方案

**文件 1: `src/components/product/Product3DViewer.tsx`**

修改 `ScreenshotHelper` 的截图逻辑：
- 在 `gl.render()` 之后，插入一帧 `requestAnimationFrame` 等待，确保 GPU 完成合成
- 将 `blob()` 改为先等一帧再 `toBlob`
- 增加像素检测：读取 canvas 中心 1x1 像素，如果 RGBA 全为 0 则判定为黑帧，自动重试（最多 3 次，每次间隔一帧）

**文件 2: `src/components/canvas/ProductViewerCanvas.tsx`**

- 在截图前增加 500ms 延迟，确保 WebGL 至少渲染了几帧
- 增加 `console.log` 输出 blob 大小和验证结果，方便调试
- 简化重试逻辑：失败后等 1 秒再重试一次

**文件 3: `src/components/product/AnnotationCanvas.tsx`**

- 在图片加载前显示"加载中"占位
- 增加 `console.log` 确认收到的 imageUrl 是否有效

### 技术细节

核心修复在 `ScreenshotHelper`：

```typescript
blob: () => new Promise<Blob | null>((resolve) => {
  const canvas = renderOnce();
  // Wait one frame for GPU compositing to complete
  requestAnimationFrame(() => {
    // Check if frame is black
    const ctx = canvas.getContext('2d'); // won't work for WebGL
    // Instead, re-render and use readPixels or just wait
    requestAnimationFrame(() => {
      canvas.toBlob((b) => resolve(b), 'image/png');
    });
  });
})
```

由于 WebGL canvas 不能用 `getContext('2d')`，黑帧检测改用 `gl.readPixels` 读取中心像素。

### 改动范围

3 个文件：
- `src/components/product/Product3DViewer.tsx` — 核心：修复截图时序
- `src/components/canvas/ProductViewerCanvas.tsx` — 增加截图前延迟和调试日志
- `src/components/product/AnnotationCanvas.tsx` — 增加加载中状态

