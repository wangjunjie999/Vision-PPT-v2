

# 将截图中所有文字改为白色

## 修改范围

只修改 `src/components/canvas/VisionSystemDiagram.tsx` 一个文件。

### 右侧信息卡片文字

将所有 `<p>` 和 `<span>` 中的文字颜色统一改为白色：
- `color: '#f1f5f9'` → `color: '#ffffff'`（约 6 处，主要参数文字）
- `color: '#cbd5e1'` → `color: '#ffffff'`（约 12 处，次要说明文字）
- `color: 'hsl(210, 100%, 75%)'` → `color: '#ffffff'`（3 处，光源距离、GPU、"可编辑"标签）

### SVG 图形区域标注文字

- "待检测产品" 标签：`fill="#cbd5e1"` → `fill="#ffffff"`
- "IPC" 标签：`fill="#cbd5e1"` → `fill="#ffffff"`
- 角度标注 `{fovAngle}°`：`fill="hsl(210, 100%, 75%)"` → `fill="#ffffff"`
- "视野宽度 ~Xmm" 标注：`fill="hsl(210, 100%, 75%)"` → `fill="#ffffff"`
- 工作距离标注 `335±20mm`：`fill="hsl(210, 100%, 75%)"` → `fill="#ffffff"`
- "ROI" 标注：`fill="hsl(120, 70%, 60%)"` → `fill="#ffffff"`

共约 25 处颜色值替换，全部统一为 `#ffffff`。

