

# 修复截图中卡片间距过大 + 暗背景黑字不可见

## 问题分析

从截图看两个问题：
1. **卡片间距太大**：`<p>` 标签的默认 `margin` 在 `foreignObject` 中不受 Tailwind reset 影响，导致每行文字上下都有浏览器默认 margin（约 16px），使卡片被撑高、间距视觉上很大
2. **暗背景下黑字不可见**：SVG 中部分文字（如 "待检测产品"、"IPC" 标签、角度标注 "45°"）使用了较暗的颜色，在深色背景截图中几乎不可见

## 修改方案

### `src/components/canvas/VisionSystemDiagram.tsx`

**1. 消除 `<p>` 标签默认 margin**

给所有 `<p>` 标签添加 `margin: 0` 内联样式，防止浏览器默认 margin 撑大卡片高度：

```jsx
<p style={{ fontSize: '11px', color: '#f1f5f9', margin: 0 }}>...</p>
<p style={{ fontSize: '10px', color: '#cbd5e1', margin: 0 }}>...</p>
```

约有 15+ 处 `<p>` 标签需要添加。

**2. 进一步压缩间距**

- 卡片容器 `gap` 从 `6px` → `4px`
- 卡片内 `padding` 从 `8px` → `6px 8px`（上下减小）
- 标题行 `marginBottom` 从 `4px` → `2px`

**3. SVG 标注文字颜色提亮**

- "待检测产品" 文字（line 427）：`hsl(220, 15%, 65%)` → `#cbd5e1`
- "IPC" 标签（line 636）：`hsl(0, 0%, 60%)` → `#cbd5e1`
- 角度标注 "45°"：确认颜色为亮色

| 修改点 | 内容 |
|--------|------|
| 所有 `<p>` 标签 | 添加 `margin: 0` |
| 容器 gap | 6px → 4px |
| 卡片 padding | 8px → 6px 8px |
| 标题 marginBottom | 4px → 2px |
| SVG 暗色文字 | 提亮为 #cbd5e1 |

只需修改 `VisionSystemDiagram.tsx` 一个文件。

