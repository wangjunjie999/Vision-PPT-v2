

# 特定面板比例下光学方案图闪动问题

## 问题根因

SVG 使用 `viewBox="0 0 800 750"` 配合 `className="w-full h-full"` 实现自适应缩放。当拖拽 ResizablePanel 改变容器宽度时，SVG 内部坐标系按比例缩放。在某些特定容器尺寸下，SVG 坐标映射到屏幕像素时产生**亚像素（sub-pixel）**对齐问题：

- `foreignObject` 内的 DOM 内容按 CSS 像素渲染，而 SVG 按 viewBox 比例缩放
- 当容器尺寸导致 `foreignObject` 的 x/y/width/height 映射到非整数屏幕像素时，浏览器在相邻帧间对位置进行不同方向的四舍五入，产生 ±1px 的闪动
- 拖拽面板时每帧都触发重新计算，使闪动持续可见

## 修复方案

### 文件：`src/components/canvas/VisionSystemDiagram.tsx`

1. **SVG 元素强制 GPU 合成层**：给 `<svg>` 标签添加 `style={{ transform: 'translateZ(0)' }}`，将 SVG 渲染提升到独立 GPU 层，消除与父容器的亚像素同步问题

2. **禁用 SVG 亚像素抗锯齿**：在 SVG 上添加 `shapeRendering="geometricPrecision"`，确保几何图形在缩放时保持稳定的像素对齐

3. **固定宽高比**：显式设置 `preserveAspectRatio="xMidYMid meet"`（虽然是默认值，但显式声明避免浏览器差异）并添加 `aspect-ratio: 800/750` CSS，让容器在 resize 时保持固定比例，减少 viewBox 映射的变化

4. **foreignObject 隔离**：给每个 `foreignObject` 内的顶层 `<div>` 添加 `style={{ transform: 'translateZ(0)' }}`，使 DOM 内容渲染与 SVG 坐标系解耦

修改集中在 `VisionSystemDiagram.tsx` 一个文件，共约 6 处小改动。

