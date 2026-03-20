

# 修复 PPT 等轴测主视图不显示 3D 截图

## 问题根因

`PPTGenerationDialog.tsx` 中将 `reportData.layouts` 转换为 `layoutData` 时，**丢失了关键字段**：

- `isometric_view_image_url` — 等轴测截图 URL（完全未传递）
- `primary_view` — 主视图选择（未传递，PPT 默认回退到 'front'）
- `auxiliary_view` — 辅视图选择（未传递）
- `layout_description` — 布局说明（未传递）

当用户设置主视图为"等轴测"并保存后，PPT 生成时 `primary_view` 始终为 `'front'`，所以 PPT 机械布局幻灯片始终显示正视图而非等轴测截图。

同时 `reportDataBuilder.ts` 也缺少 `isometric_view_image_url` 字段。

## 修改方案

### 1. `src/services/reportDataBuilder.ts`

在 `LAYOUT_DISPLAYED_FIELDS` 中添加 `isometric_view_image_url` 和 `isometric_view_saved`。

在 layout 返回对象中添加：
```typescript
isometric_view_image_url: (layout as any).isometric_view_image_url || null,
isometric_view_saved: (layout as any).isometric_view_saved || false,
```

### 2. `src/components/dialogs/PPTGenerationDialog.tsx`

在三个 layoutData 映射位置补充缺失字段：

**PPT 路径（~line 714-720）** 添加：
```typescript
isometric_view_image_url: l.isometric_view_image_url || (l as any).isometric_view_image_url || null,
primary_view: l.primary_view || (l as any).primary_view || 'front',
auxiliary_view: l.auxiliary_view || (l as any).auxiliary_view || 'side',
layout_description: l.layout_description || (l as any).layout_description || '',
```

**Word 路径（~line 797-800）** 和 **PDF 路径（~line 929-931）** 同样添加这四个字段。

| 文件 | 操作 |
|------|------|
| `src/services/reportDataBuilder.ts` | 添加 isometric_view_image_url 到 layout 数据 |
| `src/components/dialogs/PPTGenerationDialog.tsx` | 三处 layoutData 映射补充四个缺失字段 |

