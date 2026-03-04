

# 修复截图中工控机信息丢失

## 问题根因

右侧标注区域的 `foreignObject` 高度为 620px，5 张信息卡片（相机 + 镜头 + 光源 + 视野参数 + 工控机）的实际内容高度超过 620px，`foreignObject` 会裁切溢出内容。网页上因为有滚动/溢出显示可以看到，但截图时 `overflow: hidden` 导致工控机卡片被完全裁切掉。

## 修改方案

### `src/components/canvas/VisionSystemDiagram.tsx`

1. **SVG viewBox 扩高**：`viewBox="0 0 800 650"` → `viewBox="0 0 800 750"`，为工控机卡片留出更多空间
2. **foreignObject 高度增加**：`height="620"` → `height="720"`，确保 5 张卡片完整显示
3. **容器最小高度**：`min-h-[600px]` → `min-h-[700px]`
4. **减小卡片间距和内边距**：每张卡片 padding 从 `10px` 改为 `8px`，gap 从 `8px` 改为 `6px`，节省垂直空间

### `src/components/canvas/ModuleSchematic.tsx`

5. **截图高度匹配**：三处 `toPng` 调用的 height 从 `900` → `1000`，确保截图容器能完整包含扩高后的 SVG

### `src/components/canvas/BatchImageSaveButton.tsx`

6. **批量截图容器高度**：同步增加容器高度

| 文件 | 修改 |
|------|------|
| `VisionSystemDiagram.tsx` | viewBox 750 + foreignObject 720 + min-h 700 + 紧凑间距 |
| `ModuleSchematic.tsx` | 截图高度 900→1000 |
| `BatchImageSaveButton.tsx` | 批量截图容器同步扩高 |

