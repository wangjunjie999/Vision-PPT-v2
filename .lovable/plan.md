

# 修复 GLB 截图后标注页面不显示图片

## 问题根因

从截图看，标注页面已进入但画布区域全黑。分析代码发现两个关键问题：

1. **DPR 过高导致 WebGL 上下文丢失**：`fillContainer` 模式下 DPR 设为 `[2, 3]`，在 1610px 宽的视口中，Canvas 实际像素宽度可达 ~4830px。如此大的 WebGL 缓冲区容易触发 GPU 内存不足 → context lost → `toDataURL()` 输出全黑帧。

2. **截图函数闭包问题**：`ScreenshotHelper` 通过 `useEffect` 在组件挂载时注册截图函数，但 `onReady` 回调（即 `setViewerRef`）每次调用都创建新的 ref 对象。而 `Product3DViewer` 中的 `useEffect` 依赖 `[onReady, hasModel, ...]`，`onReady` 是 `setViewerRef`（稳定引用），所以 `screenshotFnRef.current` 只在首次设置。如果 `ScreenshotHelper` 的 `onReady` prop 变化（比如 re-render），可能导致引用丢失。

## 修复方案

### 文件：`src/components/product/Product3DViewer.tsx`

1. **降低 DPR**：将 `fillContainer` 模式的 DPR 从 `[2, 3]` 改为 `[1, 2]`，避免超大缓冲区导致 context lost
2. **ScreenshotHelper 使用 useRef 而非闭包**：改用 `useFrame` 钩子在每帧更新 `gl/scene/camera` 引用到 ref 中，确保截图时总是使用最新的渲染器引用
3. **截图前多帧渲染**：在 `takeScreenshot` 中调用 `gl.render` 两次（确保双缓冲都有内容），再执行 `toDataURL`

### 文件：`src/components/canvas/ProductViewerCanvas.tsx`

4. **增加重试间隔**：将重试等待从 500ms 增加到 800ms，给 WebGL 上下文恢复更多时间
5. **最终兜底**：如果两次截图都失败，toast 提示但仍然用黑帧进入标注模式（总比卡住好）

### 改动范围
约 15 行代码，涉及 2 个文件。

