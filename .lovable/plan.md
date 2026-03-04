

# 画布改造：移除三合一概览 & 隐藏相机

## 问题
1. "三合一概览" 按钮和功能需要删除
2. 单视图画布中仍显示相机图标，需要隐藏（只保留执行机构）

## 修改范围（1个文件）

### `src/components/canvas/DraggableLayoutCanvas.tsx`

**1. 删除三合一概览相关代码**
- 删除 `OverviewZoomContainer` 组件（约第65-212行）
- 删除 `overviewMode` state（第230行）
- 删除三合一按钮（第1368-1379行）
- 删除 `overviewMode` 条件渲染分支（第1614-1620行），只保留正常画布
- 移除 `ThreeViewLayout`、`ThreeViewOverlay`、`getViewTransforms` 的 import（如果仅在概览中使用）

**2. 单视图画布中隐藏相机**
- 在 SVG 渲染对象的循环中（约第1780行附近），过滤掉 `type === 'camera'` 的对象不渲染
- 隐藏 `CameraMountPoints` 组件的渲染
- 隐藏 "mounted camera connection lines"（约第1952行）
- 保留所有相机相关的 state、函数（`addCamera` 等）和工具栏按钮代码不删除，仅不在画布中绘制

**保留不动的代码**：
- `addCamera`、camera 拖拽逻辑、mount binding 逻辑 — 全部保留
- 工具栏中的"添加相机"按钮和相机计数 Badge — 保留（用户仍可管理相机数据）
- `ObjectPropertyPanel`、`ObjectListPanel` 中的相机条目 — 保留

