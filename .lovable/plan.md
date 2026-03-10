

# 3D 模式下保存按钮同步保存三视图

## 问题

当前在 3D（等轴测）视图下点击保存按钮时，`handleSaveAll` 尝试从 SVG canvas 截图，但此时渲染的是 Three.js Canvas，SVG 元素不可见，导致三视图截图无法正确生成。

## 修复方案

**文件：`src/components/canvas/DraggableLayoutCanvas.tsx`**

修改 `handleSaveAll` 函数（第636行），使其在 3D 模式下也能正确保存三视图：

1. **保存布局数据** — 与当前逻辑一致，先保存 objects 等数据到数据库
2. **临时切换到 2D 视图截图** — 如果当前是 isometric 模式，依次将 `currentView` 切换为 front/side/top，等待 SVG 渲染完成后截图，截图完成后切回 isometric
3. **上传截图** — 与现有逻辑一致

核心改动：
- 在 `handleSaveAll` 开头记录 `originalView = currentView`
- 截图循环前，如果 `originalView === 'isometric'`，先切到第一个标准视图并等待渲染
- 截图循环中照常依次切换 front → side → top 截图
- 全部完成后，恢复 `setCurrentView(originalView)`
- 增加渲染等待时间（从200ms提升到400ms），确保从 3D 切换到 2D 后 SVG 完全渲染

