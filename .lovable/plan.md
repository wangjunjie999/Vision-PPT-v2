

# 修复打光照片页面位置偏移

## 问题分析

从截图看，打光照片标签页的内容（上传区域+照片网格）在垂直方向上没有被正确约束在画布区域内，导致内容溢出。

根本原因：Radix `TabsContent` 默认不参与 flex 布局（它渲染为普通 `div`），因此 `flex-1` 无法正确撑满剩余空间。需要确保 `TabsContent` 在激活时具有正确的 flex 布局属性。

## 改动

### `src/components/canvas/ModuleSchematic.tsx`

1. 给两个 `TabsContent` 添加 `data-[state=active]:flex data-[state=active]:flex-col` 确保激活时参与 flex 布局
2. 给打光照片的 `TabsContent` 内部添加一层容器，确保 `overflow-auto` 正确工作在受约束的高度内
3. 确保 `LightingPhotosPanel` 内容不会超出可视区域

涉及文件仅 `ModuleSchematic.tsx`，约 3-4 行 className 调整。

