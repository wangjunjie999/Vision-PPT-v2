

# 修复 3D 视图中单击选中相机后属性面板不显示的问题

## 问题

在 3D 视图（isometric）中，`onSelectObject` 回调（第 959 行）只调用了 `setSelectedIds`，没有同时设置 `setShowPropertyPanel(true)`。导致点击相机后虽然对象高亮了，但右侧属性面板不会弹出。

对比 2D 视图的 `handleMouseDown`（第 493-494 行）同时设置了 `setSelectedIds` 和 `setShowPropertyPanel(true)`。

## 修复

### `src/components/canvas/DraggableLayoutCanvas.tsx` — 第 959 行

将：
```typescript
onSelectObject={(id) => setSelectedIds(id ? [id] : [])}
```

改为：
```typescript
onSelectObject={(id) => {
  setSelectedIds(id ? [id] : []);
  setShowPropertyPanel(!!id);
}}
```

改动量：1 行 → 4 行。

