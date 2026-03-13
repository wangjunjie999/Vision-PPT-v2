

# 优化主视图/辅视图保存工作流

## 现状

当前流程已基本具备：
1. WorkstationForm 中有主视图/辅视图下拉选择（正视图/侧视图/俯视图/等轴测）
2. `LayoutViewsPreview` 在表单底部显示已保存的截图
3. 画布中 `handleSaveAll` 会截取所有视图并上传
4. PPT 生成直接从 `layout.primary_view` / `auxiliary_view` 读取对应的 `*_view_image_url`

**问题**：LayoutViewsPreview 没有 `onOpenCanvas` 回调，用户看不到"打开画布去保存"的入口；且视图选择和截图预览分散在表单末尾，不够醒目。

## 方案

### 1. `WorkstationForm.tsx` — 传入 `onOpenCanvas` 回调

给 `LayoutViewsPreview` 组件传入 `onOpenCanvas` 回调，点击后自动切换到画布视图（通过 `selectWorkstation` 触发右侧画布显示）。这样用户在预览区域可以直接跳转到画布去截图保存。

### 2. `LayoutViewsPreview.tsx` — 增强交互

- 添加「保存视图截图」按钮提示，引导用户到画布保存
- 当视图已保存时，显示保存时间戳
- 视图选择信息（主视图=正视图，辅视图=侧视图）直接显示在预览标题中

### 3. 确认 PPT 生成不需要额外选择

当前 PPT 生成已直接使用 `layout.primary_view` / `auxiliary_view` 对应的截图 URL，无需在生成界面再选。确认 `PPTImagePreviewDialog` 和 `workstationSlides.ts` 都直接读取这些字段 — 已验证，无需改动。

### 涉及文件

| 文件 | 改动 |
|------|------|
| `WorkstationForm.tsx` | 给 LayoutViewsPreview 传入 onOpenCanvas 回调 |
| `LayoutViewsPreview.tsx` | 增强状态显示，添加保存引导按钮 |

约 15 行改动。

