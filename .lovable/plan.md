

# 修复 PPT 图片预览 — 显示产品3D截图

## 问题

当前 `PPTImagePreviewDialog` 只显示三类图片：三视图、模块光学方案图、产品标注截图（`product_annotations`）。但产品的3D预览图存储在 `product_assets.preview_images`（JSON数组，包含上传的产品图片URL），这部分数据完全没有被加载和展示。

## 修改方案

### `src/components/dialogs/PPTImagePreviewDialog.tsx`

1. **新增数据获取**：在现有 `useEffect` 中同时查询 `product_assets` 表，按 `workstation_id` 和 `module_id` 获取 `preview_images` 字段
2. **按工位分组展示**：在每个工位的"产品标注截图"上方，新增"产品预览图"区域，展示 `preview_images` 中的所有图片缩略图
3. **计入统计**：将产品预览图数量计入"已保存"总数

**UI 结构（每个工位下）**：
```
三视图: [正视图] [侧视图] [俯视图]
模块光学方案图: [模块1] [模块2] ...
产品预览图: [图片1] [图片2] ...    ← 新增
产品标注截图: [标注1] [标注2] ...
```

### 涉及文件

| 文件 | 修改 |
|------|------|
| `src/components/dialogs/PPTImagePreviewDialog.tsx` | 新增 product_assets 查询和产品预览图展示区域 |

