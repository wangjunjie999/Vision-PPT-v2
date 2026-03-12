

# 新增机构不显示默认照片 & 验证上传功能

## 问题分析

当前 `ImageUploadArea`（表单中）和 `MechanismImageDisplay`（卡片列表中）都会在用户未上传图片时回退显示本地默认资源图片（`getMechanismImage`）。需要移除这个回退逻辑，仅显示用户实际上传的图片。

## 改动

### 文件：`src/components/admin/MechanismResourceManager.tsx`

1. **`ImageUploadArea` 组件（第 218 行）**：移除 `getMechanismImage` 回退，`displayUrl` 直接使用 `url`，无上传时显示"未上传"占位。同时移除 `mechanismType` 参数及"(默认)"标注。

2. **`MechanismImageDisplay` 组件（第 29 行）**：移除 `getMechanismImage` 回退，`imageUrl` 直接使用 `databaseUrl`，无上传时显示图标占位。

3. **`getMechanismDisplayImage` 函数（第 64-71 行）**：移除本地资源回退，仅返回数据库 URL。

### 验证上传功能

上传流程检查要点：
- 裁剪对话框 → `handleCropComplete` → 上传到 `product-models` 存储桶 → 获取 publicUrl → 写入 form state → 保存到数据库
- 流程代码逻辑正确，无明显问题

