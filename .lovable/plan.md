

# 在 3D 画布中添加"暂存"按钮

## 概述

在 3D 预览右侧工具栏区域（视图预设按钮下方）添加一个"暂存"按钮，用户调整完硬件位置后点击暂存，将当前所有对象的位置数据缓存到本地 state，不触发数据库写入。最终点击顶部"保存布局"时才统一持久化。

## 改动

### `src/components/canvas/Layout3DPreview.tsx`

1. **新增 prop**：`onStageLayout?: () => void` — 暂存回调
2. **在右侧视图预设按钮区域**（约第 1776 行分隔线之后）添加"暂存"按钮，样式与重置按钮一致，使用 `Save` 图标 + "暂存布局" 文字
3. 仅在 `onStageLayout` 存在时渲染该按钮

### `src/components/canvas/DraggableLayoutCanvas.tsx`

1. **定义 `handleStageLayout` 回调**：将当前 `objects` 状态和 `localProductPosition` 标记为已暂存（可用 `stagedRef` 或 toast 提示用户"已暂存"）
2. **传入 `onStageLayout={handleStageLayout}` 到 `Layout3DPreview`**
3. 暂存逻辑：调用已有的 `updateLayout`（仅写本地/数据库布局数据）但不截图，或仅标记 dirty flag + toast 提示

考虑到"暂存"的核心诉求是保存坐标数据但不截图，最简方案是：暂存 = 仅调用 `updateLayout` 保存对象坐标 + 产品位置到数据库，跳过三视图截图流程。这样用户可以随时保存位置，最终再点"保存"做完整截图。

约 20 行变更，涉及 2 个文件。

