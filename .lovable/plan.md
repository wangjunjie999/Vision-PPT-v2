

# 统一画布交互：取消模式切换 + 左键选中/拖拽 + 右键旋转视角

## 问题总结

1. **3D 视图**：点击对象短暂选中后又脱离 — 因为 `onPointerMissed`（Canvas 级别事件）和 `DragPlane.onClick` 在对象点击后仍然触发，导致立即取消选中
2. **3D 视图**：需要切换"旋转视角/拖拽移动"模式才能拖拽，不直观
3. **对象粘在鼠标上**：`onPointerDown` 立即调用 `onDragStart` 设置 `isDragging = true`，鼠标一按下就进入拖拽

## 方案

### 1. `Layout3DPreview.tsx` — 取消模式切换，统一交互

**移除 `dragMode` 状态和相关 UI 按钮**（工具栏中的"旋转视角/拖拽移动"切换）

**OrbitControls 改为右键旋转**：
```typescript
<OrbitControls mouseButtons={{
  LEFT: undefined,        // 左键不控制视角
  MIDDLE: THREE.MOUSE.DOLLY,
  RIGHT: THREE.MOUSE.ROTATE,
}} />
```
`enabled` 始终为 `true`（不再受 `dragMode` 控制）

**修复 `DraggableGroup` — 拖拽阈值**：
- `onPointerDown`：只记录位置 + 选中对象，不调用 `onDragStart`
- 新增 `onPointerMove`：检测移动 > 5px 后才调 `onDragStart` 进入拖拽
- `onPointerUp`：如果没超过阈值，仅选中

**修复连续脱选**：
- 添加 `objectClickedRef` 标记，在 `DraggableGroup` 的 pointerDown/pointerUp 中设为 `true`
- `onPointerMissed` 和 `DragPlane.onClick` 中检查此标记，若为 `true` 则跳过取消选中
- 用 `setTimeout(() => objectClickedRef.current = false, 0)` 在事件循环结束后重置

**移除 `handleDragStart` 中的 `if (!dragMode) return`**

**更新底部提示文字**，移除模式切换相关说明

### 2. `DraggableLayoutCanvas.tsx` — 2D 视图确认一致性

2D 视图已有 5px 阈值逻辑，基本正确。确认 `mouseDownPos` 在 `handleMouseUp` 中清理干净，防止残留状态。

### 涉及文件

| 文件 | 改动 |
|------|------|
| `Layout3DPreview.tsx` | 移除 dragMode + 修复 DraggableGroup 拖拽阈值 + 修复脱选 + OrbitControls 右键 |
| `DraggableLayoutCanvas.tsx` | 微调确保 2D mouseUp 清理完整 |

约 80 行修改。

