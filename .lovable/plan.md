

# 旋转控件精简 + 轴向标注

## 问题

1. **旋转控件重复**：ObjectPropertyPanel（侧边栏滑块）和 Layout3DPreview 内的 3D 信息面板（DimInput）都有 X/Y/Z 旋转输入，保留两处造成混乱
2. **GLB 模型上传后 X/Y 轴混淆**：用户无法直观区分哪个方向是 X、Y、Z
3. **AxesHelper 没有文字标注**：当前只有 `<axesHelper args={[3]} />`，没有 X/Y/Z 文字标签

## 修改方案

### 1. 移除 Layout3DPreview 内的旋转输入（保留 ObjectPropertyPanel 的滑块）

**文件：`src/components/canvas/Layout3DPreview.tsx`** ~L1850-1859

删除 3D 信息面板中的 "3D 旋转 (°)" 区块（DimInput Rx/Ry/Rz），只保留侧边栏 ObjectPropertyPanel 中带滑块和快捷按钮的旋转控件作为唯一入口。

### 2. 替换 AxesHelper 为带文字标签的坐标轴指示器

**文件：`src/components/canvas/Layout3DPreview.tsx`** ~L2318

将 `<axesHelper args={[3]} />` 替换为自定义的 `AxisLabels` 组件：
- 三条彩色线段（红=X，绿=Y，蓝=Z）
- 每条轴末端添加 `<Text>` 标签显示 "X"、"Y"、"Z"
- 使用 `<Billboard>` 让文字始终面向相机
- 坐标映射与场景一致：X=左右，Y=前后（深度），Z=上下（高度）
- 注意 Three.js Y 轴是垂直的，但在标签显示时要映射回用户坐标系：
  - Three.js X 轴 → 标注 "X"（红色）
  - Three.js Y 轴 → 标注 "Z（高度）"（蓝色）
  - Three.js Z 轴 → 标注 "Y（深度）"（绿色）

```text
组件结构:
AxisLabels
├── Line X (红) + Billboard Text "X"
├── Line Z→Y (绿) + Billboard Text "Y" (深度方向)
└── Line Y→Z (蓝) + Billboard Text "Z" (高度方向)
```

### 3. ObjectPropertyPanel 旋转滑块标签增强

**文件：`src/components/canvas/ObjectPropertyPanel.tsx`** ~L548

在轴标签后添加方向说明：
- X轴 → "X轴（俯仰）"
- Y轴 → "Y轴（翻滚）"  
- Z轴 → "Z轴（偏航）"

