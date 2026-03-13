

# 修复上传 GLB 后选中对象自动变化的问题

## 问题分析

经过代码排查，发现两个可能导致"选中对象自动变化"的原因：

1. **2D 视图**：`ObjectPropertyPanel` 容器没有阻止 `mouseDown` 事件冒泡。当用户在属性面板内点击文件上传控件时，事件可能穿透到底层 SVG 画布的 `handleCanvasMouseDown` 处理器（第 611 行），该处理器会执行 `setSelectedIds([])`，导致取消选中。

2. **3D 视图**：GLB 模型通过 `Suspense` 异步加载时，Three.js 场景的几何体发生切换（从程序化模型 → GLB 模型），这可能导致不可见地面 `Plane`（第 1222 行）的 `onClick` 事件被触发，调用 `onDeselect()`。

## 修复方案

### 1. `src/components/canvas/ObjectPropertyPanel.tsx`
- 在属性面板容器 `<div>` 上添加 `onMouseDown={e => e.stopPropagation()}`，阻止点击事件向画布传播

### 2. `src/components/canvas/DraggableLayoutCanvas.tsx`
- 在 `handleCanvasMouseDown` 中检查点击目标是否来自 SVG 本身（`e.target === e.currentTarget`），避免子元素冒泡触发取消选中

### 3. `src/components/canvas/Layout3DPreview.tsx`
- 在地面 Plane 的 `onClick` 中添加时间戳保护：记录最后一次对象更新的时间，若距离更新不到 500ms 则忽略取消选中事件，防止 GLB 加载时的瞬间事件穿透

改动量：约 10 行代码，涉及 3 个文件。

