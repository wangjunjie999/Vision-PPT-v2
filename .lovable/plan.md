

# 优化三视图布局图比例与图标显示

## 问题分析

当前三视图中图符占比过小，原因有二：
1. **缩放因子过保守**：`computeViewTransform` 中 `scale` 计算使用了 `* 0.7` 的缩减系数，且最大比例限制为 `1.5`，导致图标只占面板可用区域的约 50%
2. **图标尺寸固定且偏小**：机构图标（MechanismShape）和相机图标（CameraShape）使用固定像素尺寸（约 14-18px），不随缩放变化

用户期望：放大图符占比，简化机构为小图标，突出相机安装位置。

## 修改方案

### 1. 调整缩放参数，放大图符占比

在 `ThreeViewLayout.tsx` 的 `computeViewTransform` 和 `getViewTransforms` 中：
- 将 `* 0.7` 缩减系数改为 `* 0.88`
- 将最大比例从 `1.5` 提高到 `2.5`
- 将对象边界扩展从 `±40` 缩小到 `±25`，让内容更紧凑

### 2. 简化机构图标，缩小尺寸

重构 `MechanismShape` 组件：
- 缩小机构图形尺寸约 40%（线条更细、形状更紧凑）
- 标签改为小号编号标签（如 M1），不再默认显示全名
- 使用更淡的颜色，降低视觉权重

### 3. 突出相机安装位置

增强 `CameraShape` 组件：
- 放大相机图标约 50%（矩形 + 镜头圆圈更大）
- 添加脉冲动画光环（橙色虚线圆圈）
- 标签使用醒目的蓝色背景 + 白色文字
- 相机到产品的连接线加粗（从 1.2 改为 1.8），使用蓝色

### 4. 调整产品图标

- 产品矩形改为按实际比例缩放（使用 `productDimensions`），而非固定 60x36
- 保持虚线边框样式但加粗边框

## 技术细节

### 涉及文件

| 文件 | 变更 |
|------|------|
| src/components/canvas/ThreeViewLayout.tsx | 修改缩放参数、重构图标组件、调整连接线样式 |

### 缩放参数对比

```text
修改前:
  boundingBox: ±40px
  scaleFactor: min(availW/rangeX, availH/rangeY, 1.5) * 0.7
  => 图符约占面板 40-50%

修改后:
  boundingBox: ±25px
  scaleFactor: min(availW/rangeX, availH/rangeY, 2.5) * 0.88
  => 图符约占面板 70-80%
```

### 图标尺寸对比

```text
CameraShape (相机):
  修改前: rect 28x22, 镜头 r=7, 标签 r=14
  修改后: rect 36x28, 镜头 r=10, 标签 r=16, 添加脉冲光环 r=24

MechanismShape (机构):
  修改前: 各种形状 ~28px, 全名标签
  修改后: 各种形状 ~18px, 仅显示编号标签(M1), 线条更细(1px)

ProductShape (产品):
  修改前: 固定 60x36
  修改后: 保持固定但稍大 70x42, 十字线更明显
```

### 连接线样式

```text
修改前: stroke="#475569" strokeWidth=1.2 opacity=0.5
修改后: stroke="#3b82f6" strokeWidth=1.8 opacity=0.6, 终点加小箭头
```

