

# 修复光学方案图截图文字不清晰

## 问题

1. SVG 中的尺寸标注文字（如 `335±20mm`）使用 `fill-primary`（深蓝色），在深色背景上看不清
2. 右侧参数卡片中的输入框使用 `bg-background text-foreground`，截图时 CSS 变量可能解析不一致，导致白底白字
3. `html-to-image` 截图时 CSS 变量/主题类名可能丢失，造成颜色异常

## 修改方案

### `src/components/canvas/VisionSystemDiagram.tsx`

**SVG 标注文字**：将 `className="fill-primary"` 改为显式浅色 `fill="hsl(210, 100%, 75%)"` （亮蓝色），确保在深色背景上清晰可见

**输入框样式**：将视角/工作距离的 `<input>` className 从 `bg-background text-foreground` 改为显式内联样式 `style={{ backgroundColor: 'hsl(220,15%,20%)', color: '#fff' }}`，确保截图时颜色不丢失

**卡片文字**：右侧 `foreignObject` 内的文字同样改用内联 style 指定颜色，避免 CSS 变量在截图时失效

| 文件 | 修改 |
|------|------|
| `src/components/canvas/VisionSystemDiagram.tsx` | SVG 标注用显式亮色 fill + 输入框/卡片文字用内联 style |

