

# 修复硬件选中后鼠标松开即脱选的问题

## 问题分析

当前 `handleMouseDown` 在 `<g>` 元素上调用 `e.stopPropagation()` 阻止了 `mouseDown` 事件冒泡，但 Radix UI 的 `ContextMenuTrigger`（包裹 SVG）监听的是 **`pointerDown`** 事件，这是独立于 `mouseDown` 的事件类型。`pointerDown` 没有被阻止，会冒泡到 `ContextMenuTrigger`，可能触发内部状态变化导致重渲染/脱选。此外，对象的 `<g>` 元素没有阻止 `pointerUp`/`mouseUp` 冒泡。

## 修改方案

### 1. `DraggableLayoutCanvas.tsx` — `handleMouseDown` 添加 pointer 事件阻止

在 `handleMouseDown` 回调中，除了 `e.stopPropagation()` 外，还需阻止底层 pointer 事件传播。改用 `onPointerDown` 替代 `onMouseDown` 传递给子渲染器，因为 `pointerDown` 先于 `mouseDown` 触发，阻止 `pointerDown` 冒泡即可同时阻止两者到达 SVG。

将 `handleMouseDown` 的事件类型从 `React.MouseEvent` 改为 `React.PointerEvent`，并同时将 SVG 的 `onMouseDown` 改为 `onPointerDown`（`handleCanvasMouseDown` 同理）。

### 2. CameraRenderer / ProductRenderer / MechanismRenderer — 使用 `onPointerDown`

将三个渲染器中 `<g>` 元素的 `onMouseDown` 改为 `onPointerDown`，确保 pointer 事件被正确拦截，不会冒泡到 ContextMenuTrigger。

同时在 `<g>` 元素上添加 `onPointerUp={(e) => e.stopPropagation()}`，防止 pointerUp 冒泡触发 ContextMenu 相关逻辑。

### 3. SVG 元素事件绑定调整

将 SVG 上的 `onMouseDown`、`onMouseMove`、`onMouseUp`、`onMouseLeave` 全部改为对应的 pointer 事件版本（`onPointerDown`、`onPointerMove`、`onPointerUp`、`onPointerLeave`），统一事件模型。

### 涉及文件（4个）

| 文件 | 修改内容 |
|------|----------|
| `DraggableLayoutCanvas.tsx` | 事件处理器改用 PointerEvent；SVG 绑定改为 onPointer* |
| `CameraRenderer.tsx` | `onMouseDown` → `onPointerDown`，添加 `onPointerUp` stopPropagation |
| `ProductRenderer.tsx` | 同上 |
| `MechanismRenderer.tsx` | 同上 |

约 20 行修改，4 个文件。

