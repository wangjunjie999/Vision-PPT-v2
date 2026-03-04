

# 修复保存图片后预览/导出仍显示旧图的问题

## 根因分析

有两个核心原因导致"屏幕上看到的"和"保存/导出的图片"不一致：

### 原因 1：文件名固定 → CDN/浏览器缓存

`ModuleSchematic.tsx` 中保存示意图时使用**固定文件名** `module-schematic-{id}.png`，每次覆盖上传后 URL 不变。浏览器和 CDN 会缓存旧 URL 的图片内容，导致 PPT 预览和导出时拿到的仍是旧图。

对比 `batchImageSaver.ts` 中使用了 `module-schematic-{id}-${Date.now()}.png`（带时间戳），每次生成唯一 URL，不存在缓存问题。

### 原因 2：截图时未包含工控机（foreignObject 和 Module Info Badge）

`ModuleSchematic.tsx` 截图时临时设置容器为 `1200x1000` 并对 `diagramRef.current` 做 `toPng`。但是：

- `diagramRef` 包裹的 div 内有 `VisionSystemDiagram`（SVG）和一个**绝对定位的 Module Info Badge**（`absolute bottom-4 left-4`）
- `toPng` 设置 `overflow: hidden` 后，如果 SVG 的实际渲染高度超过容器，底部的工控机卡片会被裁切
- Module Info Badge 也可能遮挡或与 SVG 内容重叠

## 修改方案

### 1. `ModuleSchematic.tsx` — 文件名加时间戳 + 清理旧文件

将 `handleSaveSchematic` 中的固定文件名改为带时间戳的唯一文件名，同时清理该模块之前的旧文件：

```
const fileName = `module-schematic-${module.id}-${Date.now()}.png`;
// 先用 list 找到旧文件并删除
const { data: oldFiles } = await supabase.storage
  .from('module-schematics')
  .list('', { search: `module-schematic-${module.id}` });
if (oldFiles?.length) {
  await supabase.storage.from('module-schematics')
    .remove(oldFiles.map(f => f.name));
}
```

这样每次保存生成新 URL，PPT 预览和导出不会读到缓存旧图。

### 2. `ModuleSchematic.tsx` — 截图容器高度匹配 SVG

将截图时的容器高度从 `1000px` 增加到 `1100px`，并将 `toPng` 的 height 参数同步调整，确保 viewBox 750 的 SVG 在 1200 宽度下按比例完整显示（750/800*1200 = 1125px）。

### 3. `ModuleSchematic.tsx` — 截图时隐藏 Module Info Badge

在截图前临时隐藏左下角的 Module Info Badge（该 badge 在截图中会遮挡内容且使用 CSS 变量样式），截图后恢复。给 badge div 添加 `data-screenshot-hide` 属性，截图时设置 `display: none`。

### 4. `batchImageSaver.ts` — 清理旧文件的逻辑统一

`saveSchematicToStorage` 中的旧文件清理也改为按前缀搜索删除，而非仅删固定文件名（当前只删 `module-schematic-{id}.png`，不会删带时间戳的旧文件）。

| 文件 | 修改 |
|------|------|
| `ModuleSchematic.tsx` | 文件名加时间戳 + 清理旧文件 + 截图高度 1100 + 隐藏 badge |
| `batchImageSaver.ts` | 旧文件清理改为 list+remove 模式 |

