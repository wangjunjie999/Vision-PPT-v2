

# 保存全部三视图 + 预览随主辅视图选择动态切换

## 问题
1. `saveAllViewSnapshots` 当前只保存 `activeViews`（主视图+辅视图），应改为保存全部三个视图到数据库
2. `LayoutViewsPreview` 组件是静态的，当用户在右侧表单切换主视图/辅视图下拉选择时，预览图应立即切换为对应的已保存图片

## 修改方案

### 文件1：`src/components/canvas/DraggableLayoutCanvas.tsx`

**保存全部三视图**
- 第932行：`const views = activeViews` → `const views: ViewType[] = ['front', 'side', 'top']`
- 第1000-1004行：`activeViews.forEach` → `(['front', 'side', 'top'] as ViewType[]).forEach`
- 第1015行依赖数组：移除 `activeViews`
- 按钮文案改回 "保存三视图"
- 完成判断改为 `viewSaveStatus.front && viewSaveStatus.side && viewSaveStatus.top`

### 文件2：`src/components/canvas/LayoutViewsPreview.tsx`

**预览图随主辅视图选择动态变化**（已经实现）
- 当前代码从 `layout?.primary_view` 和 `layout?.auxiliary_view` 读取视图类型，然后用 `layout?.[${view}_view_image_url]` 获取对应图片
- 因为三张图都已保存在数据库中，用户在表单切换主/辅视图下拉后，`layout` 数据更新，预览自动显示新选择的视图图片
- **无需修改此文件**，逻辑已正确

总结：画布保存时存三张图，预览组件已经能根据 primary_view/auxiliary_view 动态读取对应图片URL，切换即生效。

