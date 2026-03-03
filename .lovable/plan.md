

# 修复光学方案图截取偏移 + 添加PPT图片预览界面

## 问题分析

光学方案示意图的保存流程：
1. 用户在 `ModuleSchematic` 组件中编辑 `VisionSystemDiagram`（SVG viewBox `0 0 800 550`）
2. 点击"保存示意图"按钮 → `handleSaveSchematic` 调用 `toPng(diagramRef.current)` 截取整个 `diagramRef` DOM 元素
3. 截图上传到 `module-schematics` 存储桶 → URL 写入 `function_modules.schematic_image_url`

**偏移原因**：`diagramRef` 指向的容器是 `max-w-5xl mx-auto` 响应式布局，实际渲染尺寸取决于浏览器窗口宽度。`toPng` 截取的是 DOM 元素的实际渲染区域——如果用户浏览器窗口较窄或滚动位置不对，SVG 内容可能偏移，导致右侧硬件参数标签被截断。同理，三视图（`DraggableLayoutCanvas`）也有类似问题。

## 修复方案

### 1. 修复 `ModuleSchematic.tsx` 截图偏移

在 `toPng` 调用前，给截取元素设置固定宽高，确保每次截图结果一致：

```typescript
// 截图前：临时设置固定尺寸确保完整截取
const el = diagramRef.current;
const originalStyle = el.style.cssText;
el.style.width = '1200px';
el.style.height = '750px';
el.style.maxWidth = 'none';

const dataUrl = await toPng(el, {
  width: 1200,
  height: 750,
  quality: 1,
  pixelRatio,
  backgroundColor: '#1a1a2e',
  skipFonts: true,
});

// 截图后恢复
el.style.cssText = originalStyle;
```

同时给 `toPng` 传入明确的 `width` 和 `height` 参数，避免因容器尺寸不确定而截取不完整。

### 2. 新建 PPT 图片预览组件 `PPTImagePreview.tsx`

在 `src/components/dialogs/` 下新建 `PPTImagePreviewDialog.tsx`，提供一个按工位/模块分组的图片预览界面：

**功能设计**：
- 按工位分组，每个工位显示：
  - 三视图（正视图、侧视图、俯视图）缩略图
  - 该工位下每个模块的光学方案示意图缩略图
- 每张图片显示状态标签：✅ 已保存 / ❌ 未保存
- 点击缩略图可放大查看完整图片（Dialog 内嵌大图预览）
- 底部汇总：X 张完整 / Y 张缺失

### 3. 在 `PPTGenerationDialog.tsx` 中集成预览入口

在生成对话框中添加"查看已保存图片"按钮，点击后打开预览 Dialog，让用户在生成 PPT 前确认所有图片是否完整。

## 涉及文件

| 文件 | 修改 |
|------|------|
| `src/components/canvas/ModuleSchematic.tsx` | 修复 `handleSaveSchematic`，截图前设置固定尺寸 |
| `src/components/dialogs/PPTImagePreviewDialog.tsx` | **新建** — 按工位/模块分组的图片预览组件 |
| `src/components/dialogs/PPTGenerationDialog.tsx` | 添加"查看已保存图片"按钮入口 |

