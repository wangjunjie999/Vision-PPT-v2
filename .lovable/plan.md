

# 删除标注通道 + 记录点击跳转画布 + PPT包含所有标注图

## 问题分析

从截图可以看到，右侧面板的"产品3D与特征标注"区域有4个Tab：3D查看、产品信息、标注、记录。用户希望：
1. **删除"标注"Tab**：不再在右侧面板内嵌标注画布
2. **记录Tab点击跳转画布**：点击记录后在中间画布区域查看/修改标注
3. **PPT包含所有标注图**：每个工位的所有标注截图都生成到PPT中（当前只取第一张）

## 修改方案

### 1. `src/store/useAppStore.ts` — 扩展标注模式支持加载已有标注

在 store 中增加 `annotationExistingData` 字段，用于传递已有标注记录的 annotations 和 remark，使 `AnnotationEditor` 能以查看/编辑模式打开已有记录：

```
annotationExistingData: { annotations: Annotation[], remark: string | null, recordId: string } | null
```

### 2. `src/components/product/ProductAnnotationPanel.tsx` — 删除"标注"Tab + 修改记录点击行为

- 将 Tabs 从 4 列改为 3 列：`3D查看`、`产品信息`、`记录`
- 删除 `TabsContent value="annotate"` 整个区域
- 修改 `handleViewRecord`：不再设置 `activeTab('annotate')`，而是调用 `enterAnnotationMode(record.snapshot_url, asset.id, 'workstation', workstationId)` 并传入已有标注数据，跳转到中间画布查看
- 保留截图按钮功能（从3D查看截图后进入标注模式）

### 3. `src/components/canvas/AnnotationEditor.tsx` — 支持查看已有记录 + 编辑按钮

- 读取 store 中的 `annotationExistingData`
- 如果存在已有数据，初始化 annotations 为已有标注，默认 `readOnly=true`
- 添加"编辑标注"按钮，点击后切换为可编辑模式
- 保存时如果是编辑已有记录，更新而非新建

### 4. `src/services/pptxGenerator.ts` + `workstationSlides.ts` — PPT包含所有标注图

**`pptxGenerator.ts`**：
- 将 `wsAnnotation = annotations?.find(...)` 改为 `wsAnnotations = annotations?.filter(...)` 获取所有标注
- 将 `annotation` 字段从单个改为数组 `annotations: AnnotationData[]`

**`workstationSlides.ts`**：
- 修改 `generateProductSchematicSlide` 支持多张标注：为每张标注生成一页PPT（标题 "产品示意图 1/N"）
- 如果没有标注则回退到 `productAsset.preview_images[0]`

### 5. `src/components/forms/AnnotationRecordsPanel.tsx` — 同步修改

此组件在 `FormPanel` 中 annotation mode 时显示，需要同步支持查看已有记录的功能。

## 涉及文件

| 文件 | 修改类型 |
|------|----------|
| `src/store/useAppStore.ts` | 增加 `annotationExistingData` 字段 |
| `src/components/product/ProductAnnotationPanel.tsx` | 删除标注Tab，修改记录点击跳转画布 |
| `src/components/canvas/AnnotationEditor.tsx` | 支持加载已有标注 + 编辑按钮 |
| `src/services/pptxGenerator.ts` | 支持多标注传递 |
| `src/services/pptx/workstationSlides.ts` | 多标注生成多页PPT |

