

# 修复执行机构编辑对话框图片显示

## 问题分析

编辑对话框中三视图区域显示"正视图"、"侧视图"、"俯视图"的破碎图标，原因是：

1. **编辑对话框的 `ImageUploadArea`** 只使用数据库 URL (`form.front_view_image_url`)，当数据库中没有存储 URL 时就显示为空或破碎图标
2. **卡片列表的 `MechanismImageDisplay`** 正确地优先使用本地资源 (`getMechanismImage`)，所以卡片上图片正常

## 修复方案

### 修改文件：`src/components/admin/MechanismResourceManager.tsx`

**改动 1：** 修改 `ImageUploadArea` 组件，增加本地资源回退逻辑

- 接收当前 `form.type` 参数
- 当 `url` 为空时，调用 `getMechanismImage(type, viewType)` 获取本地资源显示
- 本地资源作为预览展示，不影响上传功能

**改动 2：** 在 `ImageUploadArea` 使用处传入 `type` 参数

修改后效果：
- 编辑对话框中，如果数据库有 URL 就显示数据库图片
- 如果数据库没有 URL，回退显示本地打包的工程图
- 如果本地也没有，显示"未上传"占位
- 用户仍可点击上传新图片覆盖

### 技术细节

```text
图片优先级：
数据库 URL --> 本地 bundled asset --> "未上传" 占位图标
```

`ImageUploadArea` 组件签名变更：
- 增加 `mechanismType: string` 属性
- 内部逻辑：`displayUrl = url || getMechanismImage(mechanismType, viewType) || null`

调用处三处变更（正视图、侧视图、俯视图）：
```
<ImageUploadArea viewType="front" label="正视图" url={form.front_view_image_url} mechanismType={form.type} />
<ImageUploadArea viewType="side" label="侧视图" url={form.side_view_image_url} mechanismType={form.type} />
<ImageUploadArea viewType="top" label="俯视图" url={form.top_view_image_url} mechanismType={form.type} />
```

