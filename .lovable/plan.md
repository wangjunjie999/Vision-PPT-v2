

# 修复光学方案图截图白块残影

## 根因

`VisionSystemDiagram.tsx` 中的4个 `foreignObject` 元素（相机、镜头、光源、工控机）内部使用了 Tailwind CSS 类名（`bg-transparent`、`bg-background/50`等）和 Radix Popover 组件。

`html-to-image`（`toPng`）截图时会克隆 DOM 并序列化为内联 SVG。在克隆环境中，CSS 自定义变量（`var(--background)` 等）不可用，导致依赖这些变量的元素背景回退为白色，产生白块。

右侧标注面板（第593行 `foreignObject`）已全部使用内联样式，所以没有问题。

## 修复方案

**文件：`src/components/canvas/VisionSystemDiagram.tsx`**

当 `interactive={false}`（截图模式）时，跳过 `foreignObject` + `Popover` + `button` 的包装层，直接渲染纯 SVG 元素（相机、镜头、光源、工控机的 SVG 图形已经在 `<button>` 内部定义好了）。

具体改动：

1. **提取4个硬件 SVG 图形为独立函数**（CameraSVG、LensSVG、LightSVG、ControllerSVG），返回纯 `<g>` 元素
2. **条件渲染**：
   - `interactive={true}`：保持现有 `foreignObject` + Popover 逻辑不变
   - `interactive={false}`：直接用 `<g transform="translate(x,y)">` 包裹纯 SVG 图形，完全不使用 `foreignObject`

```text
interactive=true:  foreignObject → div → Popover → button → <svg>硬件图形</svg>
interactive=false: <g transform>  → 硬件图形（纯SVG，无foreignObject）
```

3. **删除截图路径中所有 Tailwind 类名依赖**，消除白块来源

约 80 行改动，仅重构渲染分支，不影响交互功能。

