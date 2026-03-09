

# 打光照片功能 — 实现计划

## 需求确认

打光照片插入位置：**光学方案示意图之后、BOM清单之前**。

当前 PPT 工位页面顺序：
```text
a. 基本信息+检测要求
b. 产品示意图
c. 机械布局
d. 光学方案 × N（每模块一页）
e. BOM清单
```

目标顺序：
```text
a. 基本信息+检测要求
b. 产品示意图
c. 机械布局
d. 光学方案 × N
e. 打光照片 × N  ← 新增
f. BOM清单
```

## 数据存储建议

打光照片属于**模块级别**数据（每个模块有独立的光源配置，打光效果不同）。

- 在 `function_modules` 表新增 `lighting_photos jsonb default '[]'` 字段
- 结构：`[{ url: string, remark?: string, created_at: string }]`
- 每模块支持 1-4 张照片
- 图片文件上传到已有的 `module-schematics` 存储桶（复用，无需新建）

## 改动范围

### 1. 数据库迁移
- `ALTER TABLE function_modules ADD COLUMN lighting_photos jsonb DEFAULT '[]'`

### 2. 前端 UI — 打光照片上传面板
- 新建 `src/components/canvas/LightingPhotosPanel.tsx`
- 放在模块编辑区域，与 ModuleSchematic（光学示意图）同级切换或作为子面板
- 功能：拖拽上传、预览缩略图、删除、添加备注
- 通过 `api.modules.update()` 和 `api.storage.upload()` 保存

### 3. PPT 生成
- `workstationSlides.ts`：新增 `generateLightingPhotosSlide()` 函数
- `pptxGenerator.ts`：在光学方案循环之后、BOM之前插入打光照片幻灯片
- 布局：1张居中大图，2张左右并排，3-4张 2×2 网格，每图下方显示备注

### 4. API 适配层
- 无需新增接口，`api.modules.update()` 已支持 JSONB 字段更新
- `api.storage` 已有上传能力

### 5. PPT 图片预检
- `PPTImagePreviewDialog.tsx` 中增加打光照片检查项

