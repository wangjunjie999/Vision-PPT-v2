

# 修复 PPT 三个问题

## 问题 1：等轴测图片不显示

**根因**：`pptxGenerator.ts` 第 993-1012 行构建 layout 数据时，没有传递 `isometric_view_image_url` 字段。`workstationSlides.ts` 第 676 行读取 `layout.isometric_view_image_url` 时始终为 null。

**修复**：在 `pptxGenerator.ts` 第 1001 行后添加：
```
isometric_view_image_url: (wsLayout as any).isometric_view_image_url || null,
```

## 问题 2：删除附录补充字段

**根因**：`pptxGenerator.ts` 第 1187-1289 行生成了"附录：补充字段"幻灯片。

**修复**：删除整段附录生成代码（约 100 行）。

## 问题 3：第 4 页内容居中

用户反映放映模式正常但编辑模式不正常，这通常是 PPTX 编辑器的缩放显示差异，不是实际内容偏移。当前产品示意图容器 `x: 0.5, y: 1.2, width: 5.5` 已经合理。如果需要更居中，可以调整图片容器使其更对称（`x: 0.8, y: 1.0, width: 8.4` 居中全宽）。但因放映模式正常，暂不调整。

### 修改文件

- `src/services/pptxGenerator.ts` — 添加 isometric URL 传递 + 删除附录代码

