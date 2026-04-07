

# 修复 GLB 模型截图后不显示标注页面

## 问题分析

当只上传 GLB 文件（无预览图片）时，点击"截图并标注"后无法进入标注页面。原因：

1. **WebGL Context Lost**：控制台显示 `THREE.WebGLRenderer: Context Lost.`，此时 `gl.domElement.toDataURL()` 返回空白/黑色图像
2. **验证逻辑过严**：`handleScreenshot` 验证 `dataUrl.length > 1000`，黑帧被判定为无效
3. **无 fallback**：GLB 模式下 `imageUrls` 为空数组，验证失败后没有备用图片，直接 toast 报错，不进入标注页面

## 修复方案

### 文件：`src/components/product/Product3DViewer.tsx`

1. **防止 WebGL Context Lost**：在 Canvas 上添加 `onCreated` 回调，监听 `webglcontextlost` 事件并尝试恢复
2. **放宽截图验证**：即使 data URL 较短（可能是简单模型），只要是合法的 `data:image` 格式就接受

### 文件：`src/components/canvas/ProductViewerCanvas.tsx`

3. **GLB 无图片时仍允许进入标注**：当截图验证失败且无 fallback 图片时，不直接报错。改为：
   - 先尝试延迟 500ms 重新截图（等待渲染恢复）
   - 如果仍然失败，使用画布导出的任何结果（即使是黑帧）进入标注模式，让用户至少能看到界面
   - 提示用户"截图质量可能不佳，建议返回重试"

### 改动约 20 行，涉及 2 个文件

