

# 执行机构封面图同步 + 图片裁剪功能

## 问题分析

1. **封面图不更新**：`MechanismImageDisplay`（第28行）和 `getMechanismDisplayImage`（第65行）都优先使用本地静态资源 `getMechanismImage(type, 'front')`，导致即使数据库中已有新上传的正视图 URL，封面仍显示旧的本地默认图片。

2. **缺少图片裁剪**：当前上传逻辑直接将原图上传，没有尺寸校验或裁剪功能。

## 修复方案

### 1. 修改图片优先级（MechanismResourceManager.tsx）

将 `MechanismImageDisplay` 和 `getMechanismDisplayImage` 的优先级改为：**数据库 URL 优先 → 本地资源兜底**

```
// 改前: localImage || databaseUrl
// 改后: databaseUrl || localImage
```

### 2. 添加图片裁剪组件（新建 ImageCropDialog.tsx）

创建 `src/components/admin/ImageCropDialog.tsx`：
- 用户选择图片后，弹出裁剪对话框
- 使用 Canvas API 实现裁剪（无需额外依赖）
- 支持拖拽选择裁剪区域、预设比例（1:1、4:3、16:9）
- 裁剪完成后再上传

### 3. 修改上传流程（MechanismResourceManager.tsx）

- `handleImageUpload` 改为先打开裁剪对话框
- 裁剪确认后再执行上传逻辑
- 推荐目标尺寸：正视图 400×400px，侧/俯视图 400×300px

**涉及文件：**
- `src/components/admin/MechanismResourceManager.tsx` — 修改图片优先级 + 集成裁剪
- `src/components/admin/ImageCropDialog.tsx` — 新建裁剪组件

