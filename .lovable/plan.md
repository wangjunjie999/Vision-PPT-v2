

# 修复 2D 画布点击空白区域取消选中

## 问题

`handleCanvasMouseDown` 中 `e.target !== e.currentTarget` 阻止了取消选中。因为 SVG 内有大量子元素（网格 rect、坐标轴 line、标签 text 等），点击"空白"区域实际命中的是这些背景子元素，而非 SVG 本身，导致 `return` 提前退出。

## 修复方案

在 `handleCanvasMouseDown` 中，将严格的 `target === currentTarget` 检查改为：检查点击目标是否是一个可交互对象（带有特定 `data-` 属性的元素），如果不是，则视为点击背景，执行取消选中。

具体做法：给所有可交互对象（MechanismRenderer、CameraRenderer、ProductRenderer 中的顶层 `<g>`）添加 `data-interactive="true"` 属性，`handleCanvasMouseDown` 检查 `e.target` 最近的 `[data-interactive]` 祖先，如果没有则取消选中。

**更简单的替代方案**：不检查 target，改为在对象的 `onMouseDown` 中 `e.stopPropagation()`，这样点击对象时事件不会冒泡到 SVG，而点击背景元素（grid/axis）时事件正常冒泡到 SVG。当前对象的 `handleMouseDown` 已经在处理选中逻辑，只需确保它调用 `e.stopPropagation()`。然后把 `handleCanvasMouseDown` 中的 `e.target !== e.currentTarget` 检查去掉即可。

### 文件改动

**`DraggableLayoutCanvas.tsx`**：
1. `handleCanvasMouseDown`（~行 628-637）：移除 `if (e.target !== e.currentTarget) return;`，改为检查事件是否来自可交互对象（通过 `closest('[data-object-id]')` 判断）
2. `handleMouseDown`（对象拖拽处理函数）：确保调用 `e.stopPropagation()` 阻止冒泡到画布

约 5 行改动。

