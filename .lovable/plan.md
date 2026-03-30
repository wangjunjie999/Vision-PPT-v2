

# 根据2D/3D模式切换表单旋转区块

## 问题

`ObjectPropertyPanel` 始终同时显示"2D 旋转角度"和"3D 旋转 (X/Y/Z)"两个区块。在3D预览模式下，用户操作"2D 旋转角度"会产生混淆——因为2D旋转只控制单一的 `rotation` 属性，与3D的三轴旋转逻辑不同。

## 修复方案

将 `isIsometric`（是否3D模式）传入 `ObjectPropertyPanel`，根据模式只显示对应的旋转控件：

- **2D模式**：只显示"2D 旋转角度"（单轴滑块 + 快捷角度按钮）
- **3D模式**：只显示"3D 旋转 (X/Y/Z)"（三轴滑块）

### 文件修改

**1. `src/components/canvas/ObjectPropertyPanel.tsx`**
- Props 新增 `isIsometric?: boolean`
- 2D旋转区块（~L494-540）用 `{!isIsometric && ...}` 包裹
- 3D旋转区块（~L544-583）用 `{isIsometric && ...}` 包裹

**2. `src/components/canvas/DraggableLayoutCanvas.tsx`**
- 在 `<ObjectPropertyPanel>` 调用处（~L1214-1219）传入 `isIsometric={isIsometric}`

