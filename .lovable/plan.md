

# 修复 3D 视图单击选中相机后立即取消选中

## 原因

Three.js 的射线检测同时命中了相机对象和背后的不可见地面 `Plane`。事件序列：

1. `DraggableGroup.onPointerDown` → `e.stopPropagation()` ✓
2. `DraggableGroup.onPointerUp` → 检测到 click（位移 < 5px）→ 调用 `onClick(objectId)` **选中** → 但没有 `e.stopPropagation()`
3. `Plane.onClick` → 条件满足（`!isDragging && !dragMovedRef && delta < 3`）→ 调用 `onDeselect()` **取消选中**

## 修复

### `src/components/canvas/Layout3DPreview.tsx` — `DraggableGroup.onPointerUp`

在检测到 click 时添加 `e.stopPropagation()`，阻止事件传播到地面 Plane：

```typescript
onPointerUp={(e: ThreeEvent<PointerEvent>) => {
  if (pointerDownPos.current) {
    const dx = Math.abs(e.clientX - pointerDownPos.current.x);
    const dy = Math.abs(e.clientY - pointerDownPos.current.y);
    if (dx < 5 && dy < 5) {
      e.stopPropagation(); // ← 新增：阻止地面 Plane 接收事件
      onClick(objectId);
    }
    pointerDownPos.current = null;
  }
}}
```

改动量：1 行。

