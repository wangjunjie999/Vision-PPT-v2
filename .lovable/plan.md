

# 修复 3D 相机选中后偶发无法脱选

## 根因

当前 `objectClickedRef` 的清理依赖对象自身的 `onPointerUp`（L125-132），通过 `setTimeout(() => { objectClickedRef.current = false }, 0)` 延迟清零。但 Three.js 的事件冒泡与 DOM 不同——如果 pointerup 时鼠标微移偏离了相机的 mesh（相机体积小，更容易偏出），对象的 `onPointerUp` 不触发，`objectClickedRef` 卡在 `true`，后续点击背景的 `onClick` 和 `onPointerMissed` 都被 guard 拦截。

虽然上一轮在 `DragPlane.onPointerUp` 和 `handleDragEnd` 加了兜底清理，但 `DragPlane` 的 `onPointerUp` 只在点击命中这个隐形平面时触发——如果点击位置在平面之外（如天空/远处），它也不会触发。

## 方案

**用全局 DOM `pointerup` 监听做最终兜底**，确保无论 Three.js 内部事件如何传播，每次鼠标抬起都会清理 guard。

### 改动（`Layout3DPreview.tsx`，约 10 行）

1. 在主组件中添加一个 `useEffect`，监听 `window` 的 `pointerup` 事件：
```typescript
useEffect(() => {
  const resetGuard = () => {
    objectClickedRef.current = false;
  };
  window.addEventListener('pointerup', resetGuard);
  return () => window.removeEventListener('pointerup', resetGuard);
}, []);
```

2. 简化 `DraggableGroup.onPointerUp`（L125-132）：移除 `setTimeout` 延迟清理，改为直接清零（因为全局监听已经兜底）。

3. `DragPlane.onClick` 的 guard 条件（L1330）保持 `e.delta < 3` 检查，但移除 `objectClickedRef` 检查——改为仅依赖 `dragMovedRef`：
```typescript
onClick={(e) => {
  if (!dragStateRef.current.isDragging && !dragMovedRef.current && e.delta < 3) {
    e.stopPropagation();
    onDeselect();
  }
}}
```

这样脱选逻辑不再依赖 `objectClickedRef`（它只用于防止 `onPointerMissed` 在对象点击时误触发），`DragPlane.onClick` 靠 `stopPropagation` 和 `e.delta` 自行防误触。

