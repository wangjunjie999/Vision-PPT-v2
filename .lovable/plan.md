
# 修复图例遮挡问题

## 问题

图例面板（第 1639 行）和操作提示文字（第 1664 行）都定位在 `absolute bottom-3 right-3`，完全重叠。

## 改动

**文件：`src/components/canvas/Layout3DPreview.tsx`**

将底部操作提示文字从 `right-3` 改为 `left-3`，移到左下角，避免与右下角图例重叠。
