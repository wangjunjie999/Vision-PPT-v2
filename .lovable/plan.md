

# 吸附相机变绿 + 画布图例说明

## 改动

### 1. 相机颜色根据挂载状态切换（`DraggableLayoutCanvas.tsx` 第 1750-1837 行）

**未挂载相机**（蓝色，现有样式不变）：
- 填充 `#2563eb`，边框 `#3b82f6`，镜头 `#60a5fa`，标签 `#93c5fd`

**已挂载相机**（绿色 + 半透明）：
- 填充 `#16a34a`，边框 `#22c55e`，镜头 `#4ade80`，标签 `#86efac`
- 保持 `opacity={0.7}`

通过 `isMounted` 变量选择颜色组：
```typescript
const bodyFill = isMounted ? '#16a34a' : '#2563eb';
const bodyStroke = isMounted ? '#22c55e' : '#3b82f6';
const lensStroke = isMounted ? '#4ade80' : '#93c5fd';
const lensInner = isMounted ? '#4ade80' : '#60a5fa';
const labelFill = isMounted ? '#86efac' : '#93c5fd';
```

### 2. 画布右下角添加图例说明（SVG 内，坐标系附近）

在 `CoordinateSystem` 组件之后添加一个固定位置的图例面板：

```text
┌─────────────────┐
│ ■ 蓝色 = 未吸附  │
│ ■ 绿色 = 已吸附  │
│ ■ 橙色 = 执行机构 │
└─────────────────┘
```

使用 SVG `<g>` 定位在画布右下角，背景半透明深色，不随缩放变化（通过 `transform` 反向补偿 `scale`）。

