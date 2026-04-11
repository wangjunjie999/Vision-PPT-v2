

## 硬件详情滚动条 + 删除 3D 网格

### 改动 1：硬件详情面板滚动优化

**文件**: `src/components/admin/HardwareDetailView.tsx`

当前 `DialogContent` 已有 `max-h-[90vh]` 和 `ScrollArea`，但 `ScrollArea` 没有明确的最大高度约束，在部分情况下内容超出后无法正常滚动。

修复方式：给 `ScrollArea` 添加明确的 `max-h` 限制（如 `max-h-[calc(90vh-120px)]`），确保内容区域在对话框头部之下正确滚动。同时优化 `overflow` 样式确保滚动条始终可见。

### 改动 2：删除 3D 预览中的网格

**文件**: `src/components/product/Product3DViewer.tsx`

删除第 310 行的 `<gridHelper args={[10, 10, '#666', '#444']} />`，使 3D 预览背景干净，只显示模型本身。

### 改动范围

- `src/components/admin/HardwareDetailView.tsx` — ScrollArea 高度约束
- `src/components/product/Product3DViewer.tsx` — 删除 gridHelper

