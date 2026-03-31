

# 修复截图进入标注页面黑屏问题

## 问题分析

两个原因导致黑屏：

1. **AnnotationCanvas 图片初始尺寸为 0×0**：`imageBounds` 初始值为 `{renderWidth: 0, renderHeight: 0}`，图片元素被设置为 `width: 0px; height: 0px`，即使图片加载成功也可能因为 0 尺寸无法正常显示或触发布局。

2. **3D 截图可能捕获黑帧**：`ScreenshotHelper` 在组件挂载时就注册截图函数，但模型可能尚未完全加载到场景中。点击截图时如果模型渲染未完成，WebGL canvas 输出的是黑色图像。

## 修复方案

### 文件：`src/components/product/AnnotationCanvas.tsx`

- 当 `imageBounds.renderWidth === 0` 时，不设置显式的 `width/height` 样式，让图片用 `max-w-full max-h-full object-contain` 自然渲染
- 这样图片加载后立即可见，`onLoad` 触发后再切换到精确尺寸

### 文件：`src/components/product/Product3DViewer.tsx`

- 在 `ScreenshotHelper` 中，截图前先等待一帧（`requestAnimationFrame`）再执行 `gl.render` + `toDataURL`，确保场景已完成渲染
- 对 3D 模式截图增加一个 fallback：如果截图结果全黑（检查像素），尝试延迟再截一次

### 文件：`src/components/canvas/ProductViewerCanvas.tsx`

- `handleScreenshot` 中对 3D 截图结果做简单验证，如果是 null 或极小的 data URL（表示空白），给用户提示"模型尚未加载完成"

