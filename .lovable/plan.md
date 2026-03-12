

# 优化产品位置保存：本地暂存 + 统一保存

## 问题

当前 `onUpdateProductPosition` 每次拖拽移动都调用 `updateWorkstation`，直接写数据库，导致高频网络请求，系统卡顿。而其他布局对象（机构、相机）仅更新本地 `objects` state，在点击"保存布局"时统一持久化。

## 方案

将产品位置改为与其他对象一致的模式：本地 state 暂存，统一在 `handleSaveAll` 中持久化。

## 改动

### `src/components/canvas/DraggableLayoutCanvas.tsx`

1. **新增本地 state**：`localProductPosition`，初始值从 workstation 数据读取
2. **修改 `onUpdateProductPosition` 回调**：改为 `setLocalProductPosition(pos)` 而非 `updateWorkstation(...)`
3. **传入 `Layout3DPreview` 的 `productPosition`**：改用 `localProductPosition`
4. **`handleSaveAll` 中追加保存产品位置**：在已有的 `updateLayout` 之后，调用 `updateWorkstation(workstationId, { product_position: localProductPosition })`

单文件约 15 行变更。

