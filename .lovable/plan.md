

# 光学方案图背景改为白色

## 概述

将 `VisionSystemDiagram` 的背景从深色（`#1a1a2e`）改为白色，同时调整所有文字和图形颜色以保持可读性。

## 修改文件

### `src/components/canvas/VisionSystemDiagram.tsx`

**1. 背景色** (line 207)
- `backgroundColor: '#1a1a2e'` → `backgroundColor: '#ffffff'`

**2. SVG 网格线** (line 313-316)
- 网格线颜色从 `#ffffff` opacity 0.06 → `#000000` opacity 0.06

**3. 所有 `fill="#ffffff"` 文字改为深色**
涉及约 15 处白色文字，统一改为 `#333333` 或 `#1a1a2e`：
- FOV 角度文字 (line 338)
- 产品文字 (line 372)
- 工作距离标注 (line 391)
- 视野宽度标注 (line 408)
- Cam1 文字保持白色（在紫色相机体上）
- IPC 文字保持白色（在深色工控机上）

**4. 标注卡片颜色调整**（右侧信息面板）

交互模式 (line 618-727 foreignObject)：
- 卡片背景 `hsl(220, 15%, 18%)` → `hsl(220, 10%, 96%)` (浅灰白)
- 卡片边框 `hsl(220, 15%, 28%)` → `hsl(220, 15%, 82%)` (浅灰边框)
- 卡片内所有 `color: '#ffffff'` → `color: '#333333'`
- 输入框背景/边框也做相应浅色化

非交互/导出模式 (line 730-830 纯 SVG)：
- `cardBg` → `hsl(220, 10%, 96%)`
- `cardBorder` → `hsl(220, 15%, 82%)`
- `textColor` → `#333333`
- `textSecondary` → `#666666`

**5. SVG defs 渐变调整**
- FOV 锥体渐变保持紫色（在白色背景上更明显，降低 opacity）
- 尺寸线/箭头保持蓝色 `hsl(220, 80%, 50%)`（白底上清晰）
- 连接线保持蓝色

**6. 产品区域调整**
- 产品矩形 `hsl(0, 0%, 40%)` → `hsl(220, 10%, 85%)` 浅灰
- 产品文字 `#ffffff` → `#333333`
- ROI 边框保持绿色

### `src/components/canvas/BatchImageSaveButton.tsx`

**1 处** (line 384)：
- `backgroundColor: '#1a1a2e'` → `backgroundColor: '#ffffff'`

### `src/components/canvas/ModuleSchematic.tsx`

检查是否有硬编码的深色背景设置，同步修改。

## 不变的元素

以下元素颜色不变（它们本身是彩色/深色背景上的白字）：
- 相机体上的 "Cam1" 白字（紫色背景）
- 工控机上的 "IPC" 白字（深色背景）
- 光源红色 LED 区域
- 相机绿色指示灯

