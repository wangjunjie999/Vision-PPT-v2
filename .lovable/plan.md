

# 优化三视图：统一图标尺寸 + 扩大概览 + 增强尺寸表

## 问题分析

从截图可以看到三个主要问题：

1. **图标尺寸不一致** - 机构（M1、M2）使用了原始对象尺寸缩放后的矩形（`size.w * 0.3`），导致不同机构大小差异很大，视觉混乱
2. **概览图太小** - 固定 1200x700 的 SVG 嵌入在容器中，没有自适应容器大小，导致图太小看不清
3. **空间关系不清晰** - 缺少坐标轴参考线、网格底图和距离标注，难以直观理解硬件间的相对位置

## 修改方案

### 1. ThreeViewLayout.tsx - 统一图标尺寸 + 增强信息

**核心改动：所有对象使用固定尺寸图标，不再按真实尺寸缩放**

- 相机：固定 28x22 矩形 + 镜头圆
- 机构：固定 36x28 矩形 + 类型特征线条（与 SimpleLayoutDiagram 的 MechanismIcon 风格一致）
- 产品：固定 60x36 虚线矩形 + 十字线
- 标签圆圈加大到 r=11，字号加大到 9px

**增强尺寸说明表：**
- 增加"尺寸 (W x H x D)"列，显示每个对象的实际物理尺寸
- 增加"到产品距离"列
- 表格列宽自适应视图宽度
- 字号从 8px 提升到 9px

**增强空间参考：**
- 在每个视图中绘制淡色坐标轴（原点十字线）
- 投影对齐线改为始终显示（去掉 30px 偏差限制）

### 2. DraggableLayoutCanvas.tsx - 概览图自适应大小

**改动：**
- 概览模式下，SVG 的 width/height 改为容器的 100%，使用 `viewBox` 保持比例但填满可用空间
- 使用 `preserveAspectRatio="xMidYMid meet"` 确保等比缩放
- 将 ThreeViewLayout 的固定 1200x700 改为更大的画布（如 1600x900），配合容器自适应

### 3. SimpleLayoutDiagram.tsx - 同步修改

保持与 ThreeViewLayout 一致的图标风格，PPT 导出也使用统一固定尺寸图标。

## 需要修改的文件

1. **`src/components/canvas/ThreeViewLayout.tsx`**
   - ObjectShape 组件：去掉 `size.w * 0.3` 缩放，改为固定尺寸图标
   - 使用 SimpleLayoutDiagram 中已有的 MechanismIcon 风格（按类型绘制特征线条）
   - 增强尺寸表：增加"尺寸"和"距离"列
   - 标签圆圈和字号加大
   - 增加坐标轴参考线
   - 投影对齐线始终显示

2. **`src/components/canvas/DraggableLayoutCanvas.tsx`**
   - 概览模式容器：SVG 改为 `width="100%" height="100%"` + `viewBox`
   - ThreeViewLayout 传入更大的 width/height（1600x900）

