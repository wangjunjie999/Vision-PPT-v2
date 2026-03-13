

# 硬件 3D 旋转 + 点击选中与拖拽分离

## 需求

1. **3D 旋转调整**：每个硬件对象（相机、机构）可以绕 X/Y/Z 三轴旋转，支持任意角度摆放
2. **点击只选中**：第一次单击只选中对象，不产生任何位移。之后才能通过拖拽或方向键移动

## 问题分析

### 旋转
- `LayoutObject` 目前只有 `rotation`（单轴，用于 2D 视图）
- 3D 渲染中完全没有应用对象级旋转（`DraggableGroup` 的 `position` 直接使用，无 rotation prop）
- 属性面板 `ObjectPropertyPanel` 的旋转滑块只控制 2D 单轴旋转

### 点击 vs 拖拽
- **3D 视图**：`DraggableGroup.onPointerDown` 直接调用 `onDragStart`，即使在 dragMode 下，pointerDown 就开始拖拽准备，可能导致微小位移
- **2D 视图**：`handleMouseDown` 同时设置 `setIsDragging(true)` 和 `setDragOffset`，意味着 mouseDown 即刻进入拖拽状态

## 修复方案

### 1. `LayoutObject` 类型扩展 — `ObjectPropertyPanel.tsx`
添加 3 个可选字段：
```typescript
rotX?: number;  // X轴旋转角度(度)
rotY?: number;  // Y轴旋转角度(度) 
rotZ?: number;  // Z轴旋转角度(度)
```

### 2. 属性面板添加 3D 旋转控件 — `ObjectPropertyPanel.tsx`
在现有旋转滑块下方，新增 X/Y/Z 三轴旋转滑块（0-360度），带快捷按钮（0°/90°/180°/270°）。仅在 3D 视图相关场景显示。

### 3. 3D 渲染应用旋转 — `Layout3DPreview.tsx`
- `DraggableGroup` 新增 `rotation` prop，将 `rotX/rotY/rotZ` 转为弧度应用到 `<group rotation={[rx, ry, rz]}>`
- 机构和相机渲染时传入旋转值

### 4. 3D 信息面板添加旋转输入 — `Layout3DPreview.tsx`
`SelectedInfoPanel` 中增加 rotX/rotY/rotZ 的 `DimInput`，允许直接输入精确角度。

### 5. 点击与拖拽分离 — 2D + 3D

**2D（`DraggableLayoutCanvas.tsx`）**：
- `handleMouseDown` 不再立即 `setIsDragging(true)`
- 改为记录 `mouseDownPos`，在 `handleMouseMove` 中检测位移超过阈值(5px)后才进入拖拽
- 若未超过阈值直接 mouseUp，则仅选中

**3D（`Layout3DPreview.tsx`）**：
- `DraggableGroup.onPointerDown` 记录 pointer 位置但不立即 `onDragStart`
- 在 `onPointerMove` 中检测位移超过阈值后才触发 `onDragStart`
- 若 pointerUp 时未移动过，仅触发 `onClick` 选中

### 6. 键盘旋转支持 — `Layout3DPreview.tsx`
在已有的方向键处理中增加：
- `R` + 方向键：旋转选中对象（左右=Y轴，上下=X轴，Shift=Z轴），步进15度

## 涉及文件

| 文件 | 改动 |
|------|------|
| `ObjectPropertyPanel.tsx` | 类型扩展 + 3D 旋转 UI |
| `Layout3DPreview.tsx` | 旋转渲染 + 信息面板 + 点击分离 + 键盘旋转 |
| `DraggableLayoutCanvas.tsx` | 2D 点击与拖拽分离 |

约 120 行新增/修改。

