

# 修复保存视图逻辑：适配主视图+辅视图双视图模型

## 问题
1. `saveAllViewSnapshots` 仍然硬编码保存 front/side/top 三个视图，应该只保存 layout 中设定的 primary_view + auxiliary_view
2. 视图切换按钮仍显示三个视图（front/side/top），应只显示 primary + auxiliary 两个
3. 按钮文案仍为"保存三视图"，应改为"保存视图"
4. `viewSaveStatus` 仍跟踪三个视图状态

## 修改范围（1个文件）

### `src/components/canvas/DraggableLayoutCanvas.tsx`

**1. 从 layout 读取 primaryView / auxiliaryView**
- 在组件顶部（约第75行后）添加：
  ```tsx
  const primaryView: ViewType = layout?.primary_view || 'front';
  const auxiliaryView: ViewType = layout?.auxiliary_view || 'side';
  const activeViews: ViewType[] = primaryView === auxiliaryView ? [primaryView] : [primaryView, auxiliaryView];
  ```
- 初始 `currentView` 默认值改为 `primaryView`（用 useEffect 同步）

**2. 视图切换按钮改为只显示 activeViews**
- 第1195行：`(['front', 'side', 'top'] as ViewType[])` → `activeViews`

**3. `saveAllViewSnapshots` 只保存 activeViews**
- 第923行：`const views: ViewType[] = ['front', 'side', 'top']` → `const views = activeViews`

**4. 按钮文案更新**
- "保存三视图" → "保存视图"
- `viewSaveStatus.front && viewSaveStatus.side && viewSaveStatus.top` → `activeViews.every(v => viewSaveStatus[v])`
- toast "三视图已全部保存" → "视图已全部保存"

**5. `viewSaveStatus` 初始化与完成标记**
- 保存完成后只标记 activeViews 对应的 key

