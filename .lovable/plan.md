

# 简化 CanvasHUD：仅保留图例

## 改动

**文件：`src/components/canvas/CanvasHUD.tsx`**

移除底部的「当前平面」指示器（第 40-48 行），仅保留图例说明面板。同时将图例位置从 `bottom-20` 调整为 `bottom-4`，填充移除后的空间。

组件将不再需要 `currentView` prop，可简化接口。

