
目标：修复“选中硬件后点击背景无法脱选”的问题（重点在 3D 画布交互链路）。

现状定位（基于已读代码）：
- 文件：`src/components/canvas/Layout3DPreview.tsx`
- 当前脱选依赖两处：
  1) `Canvas.onPointerMissed`（约 L1764）
  2) `DragPlane.onClick`（约 L1328）
- 两处都受 `objectClickedRef.current` 保护。
- `objectClickedRef` 在 `DraggableGroup.onPointerDown` 被置为 `true`（约 L110），主要在 `DraggableGroup.onPointerUp` 才异步清零（约 L131）。
- 之前移除了 pointer capture 后，若 pointerup 没回到对象本体（尤其拖拽后在背景抬手），可能导致 `objectClickedRef` 残留为 `true`，从而持续阻断背景脱选。

实施方案：
1) 统一“点击对象保护标记”清理逻辑  
- 在 `Layout3DPreview` 内新增一个小的清理方法（如 `resetObjectClickGuard`），负责将 `objectClickedRef.current` 复位。  
- 由多个路径调用，避免仅依赖对象自身 `onPointerUp`。

2) 在 DragPlane 的 pointerup 路径补充兜底清理  
- 修改 `DragPlane.onPointerUp`（约 L1322）：  
  - 保留“拖拽中则执行 `onDragEnd`”逻辑；  
  - 无论是否拖拽，都执行 guard 清理（确保背景抬手后 guard 不会卡死）。
- 这样即使对象 `onPointerUp` 未触发，下一次背景点击也能正常脱选。

3) 在 `handleDragEnd` 内同步清理 guard  
- 当前 `handleDragEnd` 仅重置 `dragStateRef` 与 `dragMovedRef`（约 L1621）。  
- 增加 `objectClickedRef` 清理，确保“拖拽结束”状态完整回收。

4) 维持现有防误触策略，但收敛为“可恢复”状态机  
- 保留 `dragMovedRef` 与 `e.delta` 判定，避免拖拽后误触发脱选。  
- 重点确保任何一次交互结束后，`objectClickedRef` 一定可恢复为 `false`，不再长期阻塞脱选。

5) 回归验证（实现后执行）  
- 场景 A：单击硬件选中 → 单击空白背景，应立即脱选。  
- 场景 B：拖拽硬件后松开 → 再点背景，应可脱选。  
- 场景 C：右键旋转/中键缩放后单击背景，不应被错误阻断。  
- 场景 D：连续快速点击对象与背景，状态不应“卡住”。

改动范围：
- 主要文件：`src/components/canvas/Layout3DPreview.tsx`
- 预估改动：小范围事件状态修复（不改数据结构，不改后端接口）。
