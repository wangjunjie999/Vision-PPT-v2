

# 修复 3D 画布脱选后硬件仍跟随鼠标

## 问题根因

`DraggableGroup` 在 `onPointerDown` 中调用了 `setPointerCapture`，这会将所有后续指针事件（包括点击背景的事件）都路由到该对象。当用户点击背景取消选中后，被捕获的指针仍在对象上，导致后续鼠标移动继续触发 `onPointerMove`，超过 5px 阈值后又进入拖拽状态，对象"粘"在鼠标上。

## 修复方案

**`Layout3DPreview.tsx` — `DraggableGroup` 组件**：

1. **移除 `setPointerCapture` / `releasePointerCapture`**：三维场景中不需要指针捕获，`DragPlane`（一个大的不可见平面）已经负责接收拖拽过程中的 `onPointerMove` 和 `onPointerUp` 事件
2. **在 `onPointerUp` 中额外调用 `handleDragEnd`** 作为安全清理，确保即使 `DragPlane` 的 `onPointerUp` 未触发，拖拽状态也能被正确重置

改动约 4 行，仅在 `DraggableGroup` 的事件处理中删除 `setPointerCapture` 和 `releasePointerCapture` 调用。

