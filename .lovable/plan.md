

# 主视图/辅视图增加等轴测 3D 选项

## 概述

在工位表单的主视图/辅视图选择器中增加"等轴测"选项，保存时自动截取 3D 预览画面并存储到数据库，供预览和 PPT 导出使用。

## 数据库迁移

新增两个字段到 `mechanical_layouts` 表：

```sql
ALTER TABLE public.mechanical_layouts
ADD COLUMN isometric_view_image_url text,
ADD COLUMN isometric_view_saved boolean DEFAULT false;
```

## 代码改动

### 1. `src/components/canvas/Layout3DPreview.tsx`
- 新增 `onScreenshotReady` prop，通过回调暴露截图函数
- 在 Canvas 内添加 `ScreenshotHelper` 组件（类似 Product3DViewer 中已有的模式），利用 `gl.domElement.toDataURL()` 获取截图

### 2. `src/components/canvas/DraggableLayoutCanvas.tsx`
- 持有 `isometricScreenshotFn` ref，从 Layout3DPreview 的 `onScreenshotReady` 回调获取
- 修改 `handleSaveAll`：在保存 front/side/top 三视图之外，额外切换到 isometric 模式并调用截图函数，上传到 `workstation-views` 存储桶，字段名 `isometric_view_image_url`
- 更新 `viewSaveStatus` 以包含 isometric 状态

### 3. `src/components/forms/WorkstationForm.tsx`（第 876-895 行）
- 在主视图和辅视图的 `<SelectContent>` 中各增加一项：
  ```tsx
  <SelectItem value="isometric">等轴测</SelectItem>
  ```

### 4. `src/components/canvas/LayoutViewsPreview.tsx`
- `ViewType` 类型扩展为 `'front' | 'side' | 'top' | 'isometric'`
- `VIEW_LABELS` 增加 `isometric: '等轴测'`
- `viewUrl` 函数已使用模板字符串 `` `${view}_view_image_url` ``，自动兼容

### 5. `src/components/dialogs/PPTImagePreviewDialog.tsx`
- `VIEW_LABELS` 增加 `isometric: '等轴测'`

## 截图流程

保存时流程：
1. 先保存 front/side/top（现有逻辑不变，通过 SVG toPng）
2. 切换到 isometric 模式，等待 400ms 渲染完成
3. 调用 3D Canvas 的 `gl.domElement.toDataURL()` 获取截图
4. 压缩后上传到存储桶
5. 恢复原始视图

