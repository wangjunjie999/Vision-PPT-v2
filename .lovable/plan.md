

# 移除相机相关标注（工作距离、相机间距）

## 问题
画布中相机已隐藏，但 `EngineeringAnnotations` 组件仍在渲染相机工作距离线（黄色虚线）和相机间距线（绿色虚线），需要一并清除。

## 修改范围（1个文件）

### `src/components/canvas/DraggableLayoutCanvas.tsx`

**1. 删除相机间距开关和状态**
- 删除 `showCameraSpacing` 和 `showWorkingDistance` 两个 state（第116-117行）
- 删除工具栏中"相机间距"开关（第1414-1417行）

**2. 移除 EngineeringAnnotations 组件渲染**
- 删除整个 `EngineeringAnnotations` 渲染块（第1727-1740行），因为该组件主要用于相机工作距离和相机间距标注，相机隐藏后没有意义
- 保留 `showDistances` 开关和 `DistanceAnnotations`（如果存在），它用于执行机构之间的距离标注
- 删除 `CameraViewRepresentation` 和 `EngineeringAnnotations` 的 import（第36-37行）

**3. 清理相机渲染分支死代码**
- 在对象渲染循环中（第1615-1635行），`obj.type === 'camera'` 分支已被 filter 过滤掉永远不会执行，删除该分支简化代码

**保留不动**：
- `showDistances` 开关 — 保留，可用于执行机构间距标注
- 所有相机数据管理代码（addCamera, mount binding 等）

