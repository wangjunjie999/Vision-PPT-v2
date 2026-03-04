

# 恢复三视图导航 + 保存仅限主视图/辅视图

## 问题理解
用户的需求是：
1. **画布中始终显示三个视图切换按钮**（正视图、左视图、俯视图），因为不同视图看到的内容不同，都需要用来编辑
2. **三个视图共享同一份3D数据**——在一个视图中拖动对象，其他视图自动更新（这个功能已有，是3D投影系统）
3. **保存视图截图时**只保存 primary_view + auxiliary_view 两个（用于PPT），这个逻辑保留
4. 之前把视图导航限制为 `activeViews` 是错误的，导致俯视图等被隐藏

## 修改范围（1个文件）

### `src/components/canvas/DraggableLayoutCanvas.tsx`

**1. 视图导航恢复为三个视图**
- 第1208行：`activeViews.map(view =>` → `(['front', 'side', 'top'] as ViewType[]).map(view =>`

**2. 保存逻辑保持不变**
- `saveAllViewSnapshots` 中的 `const views = activeViews` 保持原样——只保存主视图+辅视图用于报告
- 按钮文案"保存视图"保持不变

**3. 移除 currentView 强制同步到 primaryView 的 useEffect**
- 第400行：删除 `setCurrentView(layout?.primary_view || 'front')` — 让用户自由切换，不要每次 layout 更新都跳回主视图

总结：导航三个全开，保存只存两个。

