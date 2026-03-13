

# 等轴测视图集成到预览面板和 PPT

## 现状分析

等轴测截图已经在"保存布局"时捕获并存储到 `isometric_view_image_url`，但存在两个断点：
1. **预览面板** (`LayoutViewsPreview.tsx`)：只显示主视图 + 辅视图（2列），不显示等轴测
2. **PPT 生成** (`workstationSlides.ts`, `imagePreloader.ts`, `PPTImagePreviewDialog.tsx`)：只使用主视图 + 辅视图，忽略等轴测

## 方案

### 1. `LayoutViewsPreview.tsx` — 添加等轴测视图显示

在主视图 + 辅视图下方添加第三行，显示等轴测视图（如果已保存）。使用全宽显示，保持 4:3 比例。

```text
┌──────────────┬──────────────┐
│  主视图-正视图  │  辅视图-侧视图  │
├──────────────┴──────────────┤
│       等轴测 3D 视图          │
└─────────────────────────────┘
```

- 从 `layout.isometric_view_image_url` 读取 URL
- 如果 URL 存在则渲染图片，否则不显示该行
- 更新 `bothSaved` / `noneSaved` 逻辑考虑等轴测

### 2. `PPTImagePreviewDialog.tsx` — 添加等轴测到预览列表

在 `layoutImages` 数组中追加等轴测图片项（第 103-106 行），当 `isometric_view_image_url` 存在时加入。

### 3. `workstationSlides.ts` — PPT 布局页添加等轴测

在 Slide 4（机械布局页）中，将 `VIEW_LABELS` 补充 `isometric: '等轴测'`。当等轴测 URL 存在时，将其作为第三个小图显示在布局说明下方区域（调整右侧区域布局）。

### 4. `imagePreloader.ts` — 预加载等轴测图片

在 `collectAllImageUrls` 中追加 `isometric_view_image_url` 到预加载列表。

### 涉及文件

| 文件 | 改动 |
|------|------|
| `src/components/canvas/LayoutViewsPreview.tsx` | 添加等轴测行显示 |
| `src/components/dialogs/PPTImagePreviewDialog.tsx` | layoutImages 添加等轴测 |
| `src/services/pptx/workstationSlides.ts` | 布局页添加等轴测图 + VIEW_LABELS |
| `src/services/pptx/imagePreloader.ts` | 预加载等轴测 URL |

约 40 行改动。

