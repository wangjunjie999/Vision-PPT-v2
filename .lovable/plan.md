

# 打光照片功能 — 实现计划

## 需求

在 PPT 报告中，打光照片位于 **光学方案示意图之后、BOM清单之前**。每个模块可上传 1-4 张实拍打光效果照片。

## PPT 页面顺序

```text
d. 光学方案 × N（每模块一页）
e. 打光照片 × N  ← 新增
f. BOM清单
```

## 改动范围

### 1. 数据库迁移
在 `function_modules` 表新增 JSONB 字段：
```sql
ALTER TABLE function_modules ADD COLUMN lighting_photos jsonb DEFAULT '[]';
```
结构：`[{ "url": "...", "remark": "正面环形光", "created_at": "..." }]`

### 2. 前端 UI — 打光照片上传面板
新建 `src/components/canvas/LightingPhotosPanel.tsx`，集成在 `ModuleSchematic` 页面底部或作为侧面板标签页：
- 复用 `DragDropUpload` 组件上传图片到 `module-schematics` 存储桶
- 每张图可添加备注（如"正面环形光"、"侧面条形光"）
- 支持删除、预览，最多 4 张
- 通过 `api.modules.update(id, { lighting_photos: [...] })` 保存

### 3. PPT 生成 — 插入打光照片幻灯片
在 `pptxGenerator.ts` 第 1068-1073 行之间（光学方案循环之后、BOM之前）插入打光照片生成逻辑。

在 `workstationSlides.ts` 新增 `generateLightingPhotosSlide()` 函数：
- 遍历工位下所有模块的 `lighting_photos`
- 布局：1 张居中大图，2 张左右并排，3-4 张 2×2 网格
- 每图下方显示备注文字

### 4. PPT 图片预检
在 `PPTImagePreviewDialog.tsx` 中增加打光照片的可达性检查。

### 5. 不需要改动的部分
- API 适配层：`api.modules.update()` 已支持 JSONB 字段
- 存储桶：复用 `module-schematics`
- RLS 策略：沿用 `function_modules` 现有策略

