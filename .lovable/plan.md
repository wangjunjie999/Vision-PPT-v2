

# 修复：拖拽后点击背景无法取消选中

## 根因

`DraggableGroup` 的 `onPointerUp`（第175行）用 `e.stopPropagation()` 阻止了事件冒泡到 `DragPlane`，并且直接重置了 `dragState`，但**没有调用 `handleDragEnd`**。

导致 `dragMovedRef.current` 一直为 `true`，之后点击背景时 `DragPlane` 的 `onClick` 检查 `!dragMovedRef.current` 失败，无法执行取消选中。

```text
拖拽流程：
DraggableGroup.onPointerDown → dragMovedRef = false
DragPlane.onPointerMove → dragMovedRef = true  
DraggableGroup.onPointerUp → dragState 重置，但 dragMovedRef 仍为 true ❌
                            → handleDragEnd 未被调用 ❌
后续点击背景：
DragPlane.onClick → !dragMovedRef.current (=true) → 不执行 onDeselect ❌
```

## 修复方案

### 文件：`src/components/canvas/Layout3DPreview.tsx`

**修改 `DraggableGroup` 的 `onPointerUp`**（第175-180行）：

当检测到之前发生过拖拽（`hasDragStarted.current` 为 true）时，调用 `onDragEnd` 回调（需新增 prop），确保 `dragMovedRef` 被正确重置。如果没有发生拖拽，也主动将 `dragMovedRef` 重置为 false。

具体改动：
1. `DraggableGroup` 新增 `onDragEnd` prop
2. `onPointerUp` 中：若 `hasDragStarted.current` 为 true，调用 `onDragEnd()`
3. 所有 `DraggableGroup` 调用处传入 `onDragEnd={handleDragEnd}`

约 10 行修改。

