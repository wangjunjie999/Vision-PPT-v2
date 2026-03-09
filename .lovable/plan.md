

# 打光照片功能实现计划

## 现状分析

- `lighting_photos` JSONB 字段**已存在**于数据库 `function_modules` 表中（`DEFAULT '[]'`），但 `types.ts` 尚未反映（需触发一次迁移让类型自动更新）
- `ModuleSchematic.tsx` 当前是纯示意图页面，无标签页结构
- PPT 生成流程在 `pptxGenerator.ts:1062-1068`（光学方案循环）和 `1070-1073`（BOM）之间有明确插入点
- `WorkstationSlideData.modules` 接口需扩展 `lighting_photos` 字段

## 改动清单

### 1. 数据库迁移（触发类型刷新）

运行一个空操作迁移（如添加注释），强制 `types.ts` 重新生成以包含 `lighting_photos` 字段。或者直接在代码中使用 `as any` 过渡——但为了长期正确性，推荐触发一次迁移：

```sql
COMMENT ON COLUMN function_modules.lighting_photos IS 'Array of lighting effect photos [{url, remark, created_at}]';
```

### 2. 前端 UI — `LightingPhotosPanel.tsx`（新建）

路径：`src/components/canvas/LightingPhotosPanel.tsx`

功能：
- 复用 `DragDropUpload` 上传图片到 `module-schematics` 桶
- 每张图带备注输入框（如"正面环形光"、"侧面条形光"）
- 最多 4 张，支持删除、预览
- 保存时调用 `updateModule(id, { lighting_photos: [...] })`

### 3. `ModuleSchematic.tsx` 改造为标签页

将当前页面改为 **Tabs** 布局，两个标签页：
- **光学方案**（默认）— 现有 VisionSystemDiagram 内容
- **打光照片** — 嵌入 `LightingPhotosPanel`

标签页放在 header 区域下方，使入口醒目。

### 4. PPT 生成 — 打光照片幻灯片

#### 4a. `WorkstationSlideData` 接口扩展

在 `workstationSlides.ts` 的 modules 数组项中新增：
```typescript
lighting_photos?: Array<{ url: string; remark?: string; created_at?: string }> | null;
```

#### 4b. `pptxGenerator.ts` 数据传递

在 `modules` 映射中（第 1012-1027 行）加入：
```typescript
lighting_photos: (m as any).lighting_photos || [],
```

#### 4c. `pptxGenerator.ts` 插入幻灯片调用

在光学方案循环（第 1068 行）之后、BOM（第 1070 行）之前插入：
```typescript
// e. 打光照片 × N
for (let mi = 0; mi < wsModules.length; mi++) {
  const photos = (wsModules[mi] as any).lighting_photos || [];
  if (photos.length > 0) {
    step++;
    onProgress(...);
    await generateLightingPhotosSlide(ctx, slideData, mi);
  }
}
```

BOM 的注释标号从 `e` 改为 `f`。

#### 4d. `workstationSlides.ts` 新增 `generateLightingPhotosSlide()`

布局策略：
- 1 张：居中大图（约 7×4 英寸）
- 2 张：左右并排（各约 4.3×3.5 英寸）
- 3-4 张：2×2 网格（各约 4.3×2.2 英寸）
- 每图下方显示备注文字

### 5. PPT 图片预检

在 `PPTImagePreviewDialog.tsx` 的 `imageData` 计算中，为每个模块额外检查 `lighting_photos` 数组中的 URL 可达性，并在 UI 中显示打光照片的保存状态。

### 6. `useModules.ts` 适配

`updateModule` 方法已支持扩展字段（使用 `as ModuleUpdate` 强转），无需改动。

## 文件变更汇总

| 文件 | 操作 |
|------|------|
| 数据库迁移 | COMMENT ON COLUMN（触发类型刷新） |
| `src/components/canvas/LightingPhotosPanel.tsx` | 新建 |
| `src/components/canvas/ModuleSchematic.tsx` | 改造为 Tabs 布局 |
| `src/services/pptx/workstationSlides.ts` | 扩展接口 + 新增 `generateLightingPhotosSlide` |
| `src/services/pptxGenerator.ts` | 传递 `lighting_photos` + 插入幻灯片调用 |
| `src/components/dialogs/PPTImagePreviewDialog.tsx` | 增加打光照片检查 |

