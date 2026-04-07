
## 方案：用 `toDataURL` 直接从可见画布截图

### 问题本质

之前的方案用独立的 off-screen WebGLRenderer 重新加载模型再截图，但始终产生黑帧。根本原因是离屏 WebGL 上下文在浏览器中不稳定。

### 新技术路线

**直接从用户正在看的那个 `<canvas>` 元素上调用 `toDataURL()`**。

用户能看到 3D 模型说明画布渲染是正常的。`preserveDrawingBuffer: true` 已经设置好了（line 171），所以可以直接读取像素。返回的是 data URL 字符串，没有 ObjectURL 生命周期问题，没有 Blob，没有 revoke 时序问题。

```text
现在的链路（失败）:
  创建新 WebGLRenderer -> 重新加载模型 -> 渲染 -> toBlob -> objectURL -> 黑帧

新链路:
  找到页面上已有的 canvas 元素 -> toDataURL() -> data URL 字符串 -> 直接传给标注页
```

### 具体改动

**1. `src/components/canvas/ProductViewerCanvas.tsx`** — 重写截图逻辑

- 删除对 `ProductSnapshotRenderer` 的依赖
- 点击"截图并标注"时：
  - 用 `document.querySelector('canvas')` 或 ref 找到 Product3DViewer 内部的 canvas 元素
  - 调用 `canvas.toDataURL('image/png')`
  - 得到的是纯字符串（`data:image/png;base64,...`），不需要 Blob 也不需要 ObjectURL
  - 直接传给 `switchViewerToAnnotation`，`isObjectUrl` 设为 `false`
- 对于纯图片模式（无 GLB），直接用图片 URL 进入标注
- 整个函数不超过 50 行

**2. `src/store/useAppStore.ts`** — 简化清理逻辑

- `switchViewerToAnnotation` 中 `isObjectUrl` 为 `false` 时不需要 revoke
- 其余不变

**3. 删除 `src/components/product/ProductSnapshotRenderer.ts`**

- 不再需要离屏渲染器

**4. `src/components/product/AnnotationCanvas.tsx`** — 无需改动

- 当前实现已经能正确处理 data URL（`<img src="data:image/png;base64,...">` 天然支持）

### 为什么这次一定能成功

1. 用户已经能看到 3D 模型 = 画布像素数据是正确的
2. `preserveDrawingBuffer: true` 已设置 = `toDataURL` 可以读取
3. 返回的是 data URL 字符串 = 没有 ObjectURL 生命周期问题
4. 不创建新的 WebGL 上下文 = 没有 GPU 资源竞争

### 改动范围

- 重写 `src/components/canvas/ProductViewerCanvas.tsx`（简化）
- 微调 `src/store/useAppStore.ts`（可选）
- 删除 `src/components/product/ProductSnapshotRenderer.ts`
