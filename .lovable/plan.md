

# 三视图坐标轴和状态栏紧靠窗口边缘

## 问题

当前坐标轴（刻度、轴标签）和状态栏（比例尺、平面指示器）是渲染在 SVG viewBox 内部的固定坐标位置。当用户缩放/平移画布时，这些元素会跟着内容一起移动，导致缩放后它们不再贴合可见窗口的边缘。

用户期望：无论怎么缩放平移，坐标轴始终沿着每个视图面板的可见边缘延伸，HUD 状态栏始终固定在可见区域的角落。

## 解决方案

将坐标轴和 HUD 元素从 SVG 内部移到 `OverviewZoomContainer` 的 HTML 层，作为绝对定位的覆盖层渲染。

### 核心思路

```text
当前架构：
  OverviewZoomContainer (div, CSS transform: scale + translate)
    └── ThreeViewLayout (SVG viewBox 1600x900)
          ├── 视图面板背景 + 内容
          ├── CoordinateAxes (SVG 内，跟随缩放) ← 问题所在
          └── ViewHUD (SVG 内，跟随缩放) ← 问题所在

改为：
  OverviewZoomContainer (div, position: relative)
    ├── 缩放层 (div, CSS transform: scale + translate)
    │     └── ThreeViewLayout (SVG，不含坐标轴和HUD)
    └── 覆盖层 (div, position: absolute, inset: 0, pointer-events: none)
          ├── 左上视图坐标轴 + HUD (根据缩放/平移计算可见区域)
          ├── 右上视图坐标轴 + HUD
          └── 左下视图坐标轴 + HUD
```

### 具体实现

#### 1. ThreeViewLayout.tsx 变更

- 从 `renderView` 中移除 `CoordinateAxes` 和 `ViewHUD` 的调用
- 导出 `computeViewTransform` 函数和相关类型，供外部覆盖层使用
- SVG 只负责渲染内容（对象、对齐线、尺寸表）

#### 2. DraggableLayoutCanvas.tsx 变更（OverviewZoomContainer）

- 在缩放的 div 之后，增加一个 `position: absolute` 的覆盖层 div
- 覆盖层内为每个视图面板渲染独立的坐标轴 SVG 和 HUD
- 坐标轴的位置根据以下公式计算：

```text
面板在屏幕上的可见区域:
  screenLeft  = ovPan.x + panelOriginX * ovZoom
  screenTop   = ovPan.y + panelOriginY * ovZoom
  screenWidth = panelWidth * ovZoom
  screenHeight = panelHeight * ovZoom

坐标原点在屏幕上的位置:
  originScreenX = screenLeft + offsetX * ovZoom
  originScreenY = screenTop + offsetY * ovZoom

裁剪到容器可见范围:
  visibleLeft   = max(0, screenLeft)
  visibleRight  = min(containerWidth, screenLeft + screenWidth)
  visibleTop    = max(0, screenTop)
  visibleBottom = min(containerHeight, screenTop + screenHeight)
```

- 坐标轴线从 visibleLeft 延伸到 visibleRight（水平轴），从 visibleTop 延伸到 visibleBottom（垂直轴）
- 刻度标记根据 `scale * ovZoom` 计算间距
- HUD 元素（比例尺、平面指示器）固定在 visibleLeft+10/visibleBottom-40 和 visibleRight-60/visibleBottom-40

#### 3. 每个视图的覆盖层内容

每个视图面板的覆盖 SVG 包含：
- 沿可见边缘的坐标轴虚线
- 沿轴的 mm 刻度标记和数值
- 轴端的彩色标签（X 蓝色、Y 绿色、Z 黄色）
- 左下角比例尺
- 右下角平面指示器

所有元素使用 `clip-path` 或覆盖 SVG 的边界自动裁剪到各自面板的可见区域。

### 涉及文件

| 文件 | 变更 |
|------|------|
| src/components/canvas/ThreeViewLayout.tsx | 移除 CoordinateAxes 和 ViewHUD 调用；导出 computeViewTransform 等 |
| src/components/canvas/DraggableLayoutCanvas.tsx | 在 OverviewZoomContainer 中添加覆盖层，渲染视口固定的坐标轴和 HUD |

### 视觉效果

- 缩放时：坐标轴始终贴合窗口可见边缘，刻度间距随缩放自动调整
- 平移时：坐标轴跟随面板移动但始终延伸到可见边界
- HUD 比例尺和平面指示器固定在每个面板可见区域的角落
- 面板移出视口时，其坐标轴和 HUD 自动隐藏

