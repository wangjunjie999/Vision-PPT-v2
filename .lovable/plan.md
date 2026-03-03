
# 修复：在标注/查看模式下点击工位或模块时自动退出并跳转

## 问题

当前在标注编辑器或产品查看器模式下，用户在左侧项目树中点击其他工位或模块时，`CanvasArea` 仍然显示标注/查看页面，因为这两个模式在渲染优先级上高于正常的工位/模块/项目视图。

**根因**: `DataContext` 中的 `selectProject`、`selectWorkstation`、`selectModule` 函数只更新选中状态，不会退出 `annotationMode` 或 `viewerMode`（这两个状态存储在 `useAppStore` 中）。

## 修改方案

修改 `CanvasArea.tsx`，在选中状态变化时自动退出标注/查看模式：

### CanvasArea.tsx

添加 `useEffect`，监听 `selectedProjectId`、`selectedWorkstationId`、`selectedModuleId` 的变化。当任一值发生改变时，如果当前处于 `annotationMode` 或 `viewerMode`，则自动调用 `exitAnnotationMode()` 或 `exitViewerMode()` 退出。

具体逻辑：
1. 使用 `useRef` 记录前一次的选中 ID
2. 当检测到 ID 变化时，调用退出函数
3. 这样用户点击项目树中的任意节点，画布都会自动切换到对应页面

## 涉及文件

| 文件 | 操作 |
|------|------|
| src/components/layout/CanvasArea.tsx | 添加 useEffect 监听选中变化，自动退出标注/查看模式 |

## 实施步骤

1. 在 `CanvasArea.tsx` 中引入 `useEffect` 和 `useRef`
2. 从 `useAppStore` 获取 `exitAnnotationMode` 和 `exitViewerMode`
3. 添加 effect 监听三个选中 ID 的变化，变化时退出当前模式
