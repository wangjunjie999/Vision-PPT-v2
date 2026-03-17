

# 修复光学方案图导出残留问题

## 已修复 vs 未修复

前几轮已修复：
- 离屏容器已改为 `absolute + -20000px` ✓
- 4个硬件元素已有 `interactive` 条件分支（纯SVG） ✓
- 外层 `willChange` / `translateZ(0)` 已条件化 ✓

**仍未修复的关键问题：**

### 问题 1：右侧标注面板（第614-727行）始终是 foreignObject + HTML

这是当前白色残影的最大来源。即使硬件元素已改为纯SVG，右侧标注面板在导出模式下仍然渲染为 `foreignObject` 内嵌 5 个 HTML div 卡片。`html-to-image` 序列化这些 HTML 时会产生边缘伪影。

### 问题 2：第615行 `transform: 'translateZ(0)'` 无条件应用

标注面板容器 div 无论是否为导出模式都带 GPU 提升样式。

### 问题 3：SVG 滤镜 `lightGlow` / `selectGlow` 在导出模式下仍存在

`feGaussianBlur` 滤镜在 `html-to-image` 导出时可能产生模糊边缘伪影。

### 问题 4：`batchImageSaver.ts` 缺少光学方案图专用导出参数

当前 schematic 导出使用通用 `format: 'png'`，但没有强制 `backgroundColor` 和优化的 `pixelRatio`。

## 修改方案

### 文件 1：`src/components/canvas/VisionSystemDiagram.tsx`

**改动 A**：导出模式下将右侧标注面板从 `foreignObject + HTML` 改为纯 SVG `<g>` + `<rect>` + `<text>`。

逻辑：
```
{interactive ? (
  <foreignObject x="500" ...> /* 现有 HTML 卡片 */ </foreignObject>
) : (
  <g> /* 纯 SVG rect + text 绘制 5 个标注卡片 */ </g>
)}
```

每个卡片用：
- `<rect>` 做背景（填充 `hsl(220, 15%, 18%)`，圆角，描边）
- `<text>` 做文字（内联 fill="#ffffff"）
- 不用 foreignObject、不用 div、不用 CSS

**改动 B**：导出模式下移除 `lightGlow` 和 `selectGlow` 滤镜的引用（保留 defs 但不 apply）。

**改动 C**：标注面板容器 div 的 `translateZ(0)` 改为条件应用。

### 文件 2：`src/services/batchImageSaver.ts`

增加光学方案图专用导出函数 `generateSchematicImage`：
- 固定 `backgroundColor: '#1a1a2e'`
- `pixelRatio: 2`（清晰但不过高）
- `format: 'png'`
- `skipFonts: true`
- 不做二次压缩（避免 JPEG 伪影）

### 文件 3：`src/components/canvas/BatchImageSaveButton.tsx`

调用新的 `generateSchematicImage` 替代通用 `generateImageFromElement` 用于光学方案图导出。

约 120 行改动，3 个文件。

