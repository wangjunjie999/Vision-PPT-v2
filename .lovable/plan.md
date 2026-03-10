

# 修复光学方案图抖动问题

## 问题根因

在 `VisionSystemDiagram.tsx` 第 375 行，焦点指示器使用了 Tailwind 的 `animate-ping` 动画：

```tsx
<circle r="8" fill="hsl(220, 80%, 50%)" opacity="0.3" className="animate-ping" />
```

`animate-ping` 使用 `transform: scale(2)` + `opacity: 0` 的无限循环动画。在 SVG `foreignObject` 混合渲染的上下文中，这个动画会触发浏览器的持续重绘，导致整个 SVG 容器（包括 foreignObject 内的硬件选择器）产生视觉抖动。

## 修复方案

### 文件：`src/components/canvas/VisionSystemDiagram.tsx`

1. **替换 `animate-ping`**：将焦点指示器的 `animate-ping` 改为纯 SVG `<animate>` 标签实现脉冲效果。SVG 原生动画不会触发 DOM 重排，只影响 GPU 合成层：

```tsx
// 替换 animate-ping circle
<circle r="8" fill="hsl(220, 80%, 50%)" opacity="0.3">
  <animate attributeName="r" values="4;10;4" dur="2s" repeatCount="indefinite" />
  <animate attributeName="opacity" values="0.4;0.1;0.4" dur="2s" repeatCount="indefinite" />
</circle>
```

2. **移除 CSS 动画依赖**：删除 `className="animate-ping"`，消除 CSS transform 对 SVG 布局的影响。

这是一个单行修改，仅涉及 `VisionSystemDiagram.tsx` 第 374-375 行区域。

