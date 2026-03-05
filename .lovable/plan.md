

# 修复两个问题：布局页面图片不更新 + PPT预览改为主辅视图

## 问题分析

### 问题1：布局页面保存后图片不更新
`LayoutViewsPreview` 从 `layout` 对象中读取 `primary_view` 和 `auxiliary_view` 对应的 `${view}_view_image_url`。但 `saveAllViewSnapshots` 保存后虽然调用了 `updateLayout` 更新数据库，**React Query 可能没有即时刷新**，导致组件仍显示旧图。另外图片URL可能加了时间戳但浏览器仍使用缓存。

需要在 `LayoutViewsPreview` 的 `<img>` 标签上加 cache-busting（如 `?t=timestamp`），确保每次 layout 数据变化后图片刷新。

### 问题2：PPT图片预览仍显示三视图
`PPTImagePreviewDialog.tsx` 第100-104行硬编码了三视图：
```tsx
const layoutImages = [
  { label: '正视图', url: layout?.front_view_image_url || null },
  { label: '侧视图', url: layout?.side_view_image_url || null },
  { label: '俯视图', url: layout?.top_view_image_url || null },
];
```
需要改为只显示 primary_view + auxiliary_view。

## 修改方案

### 文件1：`src/components/dialogs/PPTImagePreviewDialog.tsx`
1. 读取 layout 的 `primary_view` 和 `auxiliary_view`
2. `layoutImages` 改为只包含这两个视图
3. 标题从 "三视图" 改为 "工位布局视图"
4. grid 从 `grid-cols-3` 改为 `grid-cols-2`
5. `DialogDescription` 从 "三视图" 改为 "布局视图"

### 文件2：`src/components/canvas/LayoutViewsPreview.tsx`
1. 在 `<img>` 的 `src` 上追加 cache-busting 参数 `?t=${layout?.updated_at || ''}`，确保 layout 更新后浏览器重新加载图片

