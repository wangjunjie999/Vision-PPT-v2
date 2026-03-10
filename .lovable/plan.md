

# 修复光学方案图残余CSS动画导致的抖动

## 问题根因

在 `VisionSystemDiagram.tsx` 中，4个 `foreignObject` 内嵌的硬件选择器SVG存在以下CSS动画/滤镜问题：

| 位置 | 问题CSS | 影响 |
|------|---------|------|
| 行 500, 535, 570, 604 | `transition-all` | 在foreignObject内过渡ALL属性，触发SVG容器持续重排 |
| 行 501, 536, 571, 606 | `group-hover:brightness-110` | CSS滤镜在foreignObject/SVG混合渲染中引发重绘抖动 |
| 行 500, 535, 570, 604 | `group-hover:drop-shadow-lg` | CSS阴影滤镜同样触发foreignObject重绘 |

核心问题：`foreignObject` 内嵌DOM元素使用CSS `transition-all` + `filter`（brightness/drop-shadow），浏览器需要在SVG坐标系和DOM坐标系之间反复计算布局，导致整个SVG容器抖动。

## 修复方案

### 文件：`src/components/canvas/VisionSystemDiagram.tsx`

1. **移除 `transition-all` 和 `drop-shadow-lg`**：将4处嵌套SVG的 `className="group-hover:drop-shadow-lg transition-all"` 全部移除，改为无过渡
2. **移除 `brightness-110`**：将4处SVG rect的 `className="group-hover:brightness-110"` 移除
3. **保留安全的过渡**：`transition-opacity`（编辑按钮淡入）和 `transition-colors`（popover列表项）不在foreignObject的SVG渲染路径中，可保留

共修改8处className，均在同一文件中。

