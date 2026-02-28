

# 3D查看器移至中间画布 + 高清截图

## 概述

将产品3D查看器从右侧小面板移至中间画布区域，充分利用大屏空间展示3D模型/图片。截图时使用高分辨率渲染，确保高清输出。

## 交互流程

```text
当前状态:  [项目树] | [布局图画布] | [表单面板(含小3D窗口)]
                              |
           点击 "3D查看" 或自动展示
                              |
3D模式:    [项目树] | [3D大画面(充满画布)] | [表单面板(产品信息/上传)]
                              |
           点击 "截图并标注"
                              |
标注模式:  [项目树] | [标注画布] | [标注记录列表]
                              |
           点击 "返回布局图"
                              |
恢复状态:  [项目树] | [布局图画布] | [表单面板]
```

## 修改方案

### 1. 全局状态扩展 (useAppStore.ts)

新增 3D 查看模式状态：
- `viewerMode: boolean` -- 是否处于3D查看模式
- `viewerAssetData: { modelUrl, imageUrls, assetId }` -- 查看器数据
- `enterViewerMode(modelUrl, imageUrls, assetId)` -- 进入3D查看
- `exitViewerMode()` -- 退出返回布局图

### 2. 中间画布 - 3D查看视图 (新建 ProductViewerCanvas.tsx)

新建 `src/components/canvas/ProductViewerCanvas.tsx`：
- 将 `Product3DViewer` 组件以全画布尺寸渲染（移除 aspect-video 限制，改为 h-full w-full）
- 顶部工具栏：返回按钮 + 视角切换按钮 + 截图并标注按钮
- 图片模式：大尺寸图片展示，支持缩放和切换
- 3D 模式：Canvas 充满整个画布区域

### 3. CanvasArea.tsx 新增 viewerMode 分支

```typescript
if (viewerMode) {
  return <ProductViewerCanvas />;
}
if (annotationMode) {
  return <AnnotationEditor />;
}
// ... 原有逻辑
```

### 4. Product3DViewer.tsx 支持自适应 + 高清

- 新增 `fillContainer` prop，当为 true 时移除 aspect-video，使用 h-full w-full
- 提高 Canvas 的 `dpr` 从 `[1, 2]` 改为 `[2, 3]`（高清模式）
- 截图时使用更高分辨率渲染

### 5. ProductAnnotationPanel.tsx 触发入口

右侧面板中的 3D 查看 Tab 改为：
- 保留上传区域和基本信息
- 添加"在画布中打开"按钮，调用 `enterViewerMode()`
- "截图并标注"按钮保持，但截图数据来自大画布的高清渲染

## 涉及文件

| 文件 | 操作 |
|------|------|
| src/store/useAppStore.ts | 新增 viewerMode 状态和方法 |
| src/components/canvas/ProductViewerCanvas.tsx | 新建 - 画布区3D全屏查看器 |
| src/components/layout/CanvasArea.tsx | 修改 - 新增 viewerMode 分支 |
| src/components/product/Product3DViewer.tsx | 修改 - 支持 fillContainer + 高清 dpr |
| src/components/product/ProductAnnotationPanel.tsx | 修改 - 添加"在画布中打开"入口 |
| src/components/product/ModuleAnnotationPanel.tsx | 修改 - 同上 |

## 技术细节

### Store 新增状态

```typescript
viewerMode: false,
viewerAssetData: null as { modelUrl: string | null; imageUrls: string[]; assetId: string } | null,

enterViewerMode: (modelUrl, imageUrls, assetId) => set({
  viewerMode: true,
  viewerAssetData: { modelUrl, imageUrls, assetId },
}),

exitViewerMode: () => set({
  viewerMode: false,
  viewerAssetData: null,
}),
```

### ProductViewerCanvas 组件

```typescript
// 从 store 读取数据
const { viewerAssetData, exitViewerMode, enterAnnotationMode } = useAppStore();

// 渲染全屏 Product3DViewer
<Product3DViewer
  modelUrl={viewerAssetData.modelUrl}
  imageUrls={viewerAssetData.imageUrls}
  onReady={setViewerRef}
  fillContainer  // 新 prop，充满容器
/>
```

### 高清截图

Product3DViewer 中 Canvas 组件：
- `dpr={[2, 3]}` 提高设备像素比
- 3D 模式截图时先将 renderer 设置为 2x 尺寸再渲染
- 图片模式截图直接返回原始图片 URL（本身就是高清）

### ProductAnnotationPanel 改造

3D 查看 Tab 中：
- 保留上传区域
- 添加按钮"在画布中查看"，点击后调用 `enterViewerMode()`
- 显示小缩略图预览而非完整 3D 查看器
- "截图并标注"按钮在画布模式的工具栏中

