

# 修复 PPT 不显示打光照片

## 问题根因

`lighting_photos` 字段在数据流转过程中被丢弃了。数据链路：

```text
DB (有 lighting_photos) 
  → reportDataBuilder (❌ 未包含) 
    → PPTGenerationDialog moduleData (❌ 未包含) 
      → pptxGenerator (读取为空数组)
```

## 修改方案

### 1. `src/services/reportDataBuilder.ts`

- 在 `ReportModule` 接口中添加 `lighting_photos` 字段（约 line 258）
- 在模块映射函数中传递 `lighting_photos`（约 line 697）
- 在 `MODULE_DISPLAYED_FIELDS` 数组中添加 `lighting_photos`（约 line 345）

### 2. `src/components/dialogs/PPTGenerationDialog.tsx`

- 在 `moduleData` 映射中添加 `lighting_photos` 字段（约 line 755）

```typescript
// 添加到 moduleData mapping:
lighting_photos: (m as any).lighting_photos || [],
```

共 2 个文件，约 4 处改动。

