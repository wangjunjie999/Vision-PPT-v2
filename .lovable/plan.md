

# 修复：点击3D画布背景取消选中

## 问题

`DragPlane` 是一个 200×200 的隐形平面，覆盖整个场景。点击背景时，指针事件被 `DragPlane` 拦截，`Canvas.onPointerMissed` 不会触发，因此无法取消选中。

## 方案

在 `DragPlane` 组件上添加 `onClick` 事件处理：当点击发生且不是拖拽操作时，调用取消选中。

具体修改 `src/components/canvas/Layout3DPreview.tsx`：

1. 给 `DragPlane` 新增 `onDeselect` prop
2. 在 `Plane` 上添加 `onClick` 处理器：如果 `!dragStateRef.current.isDragging && !dragMovedRef.current`，则调用 `onDeselect()`
3. 传入 `dragMovedRef` 引用
4. 在使用 `DragPlane` 的地方传入 `onDeselect={() => handleSelect(null)}` 和 `dragMovedRef`

