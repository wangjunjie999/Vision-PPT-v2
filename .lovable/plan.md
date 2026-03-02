
# 修复标注截图不显示标注信息 + 确保工位级标注隔离

## 问题分析

### 问题1：保存后截图不显示标注信息（主要问题）

当前 `AnnotationEditor.tsx` 的 `handleSave` 函数（第118行）直接上传的是原始截图（`annotationSnapshot`），标注信息仅以 JSON 存储在 `annotations_json` 字段中。右侧"标注记录"面板中的缩略图展示的是原始图片，没有标注覆盖。

**根因**: 标注是 DOM 元素叠加在图片上的，保存时只上传了原始图片 blob，没有将标注合成到图片上。

### 问题2：工位级标注隔离

经数据库查询确认，标注已通过 `asset_id`（对应 `product_assets.id`，每个工位有独立的 `product_asset`）实现工位级隔离。但为了更明确和安全，增加 `workstation_id` 列作为冗余索引，便于查询和管理。

## 修改方案

### 1. AnnotationEditor.tsx -- 保存前合成标注到图片上

在 `handleSave` 中，不再直接上传原始截图，而是：

1. 创建一个 HTML Canvas
2. 将原始图片绘制到 Canvas 上
3. 遍历 `annotations` 数组，根据每个标注的类型（point/rect/arrow/text/number）在 Canvas 上绘制对应的图形和文字
4. 将 Canvas 导出为 PNG blob
5. 上传合成后的图片

合成绘制逻辑：
- **point**: 绘制实心圆 + 白色边框
- **number**: 绘制带编号的圆形标签
- **rect**: 绘制矩形框（半透明填充 + 边框）
- **arrow**: 绘制带箭头的线段
- **text**: 绘制文本标签（带背景）
- 每个标注旁显示名称标签（如果有 name）

### 2. 数据库 -- product_annotations 表增加 workstation_id 列

增加可选的 `workstation_id` 列，方便按工位查询。同时在保存时写入当前选中的工位 ID。

### 3. AnnotationRecordsPanel.tsx -- 增加工位级过滤

在加载记录时，除了按 `asset_id` 过滤外，也支持按 `workstation_id` 过滤，确保切换工位时只显示当前工位的标注记录。

### 4. Store -- 传递 workstation_id 到标注模式

在 `enterAnnotationMode` 中增加 `workstationId` 参数，保存时写入到 `product_annotations` 记录。

## 技术细节

### Canvas 合成函数（新建工具函数）

```text
renderAnnotationsToCanvas(imageUrl, annotations) -> Promise<Blob>

步骤:
1. 加载图片到 Image 对象
2. 创建 Canvas，尺寸与图片一致
3. 绘制图片到 Canvas
4. 遍历 annotations:
   - 将百分比坐标转为像素坐标
   - 按 type 绘制图形
   - 绘制名称标签
5. canvas.toBlob() 返回 PNG
```

### 数据库迁移

```text
ALTER TABLE product_annotations ADD COLUMN workstation_id uuid;
```

## 涉及文件

| 文件 | 操作 |
|------|------|
| src/components/canvas/AnnotationEditor.tsx | 修改 handleSave，使用 Canvas 合成标注图 |
| src/utils/annotationRenderer.ts | 新建，Canvas 合成标注的工具函数 |
| src/store/useAppStore.ts | enterAnnotationMode 增加 workstationId 参数 |
| src/components/product/ProductAnnotationPanel.tsx | 传入 workstationId |
| src/components/canvas/ProductViewerCanvas.tsx | 传入 workstationId |
| 数据库迁移 | product_annotations 增加 workstation_id 列 |

## 实施步骤

1. 新建 `annotationRenderer.ts` 工具函数，实现 Canvas 合成逻辑
2. 修改 `AnnotationEditor.tsx` 的 `handleSave`，用合成后的图片替换原始截图上传
3. 数据库增加 `workstation_id` 列
4. 在 store 和调用方传递 `workstationId`，保存时写入记录
