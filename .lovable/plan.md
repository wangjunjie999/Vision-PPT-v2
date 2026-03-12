

# 移除右侧重复图例

## 问题

画布同时显示了两个图例：左下角（Layout3DPreview 内）和右下角（CanvasHUD），内容重复。

## 改动

1. **`src/components/canvas/DraggableLayoutCanvas.tsx`**：移除 `<CanvasHUD />` 的渲染（第 1029 行）和对应的 import（第 36 行）
2. **`src/components/canvas/CanvasHUD.tsx`**：可保留文件但不再被引用，或直接删除

仅保留左下角 Layout3DPreview 中的图例面板。

