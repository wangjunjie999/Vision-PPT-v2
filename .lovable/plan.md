

# 添加 2.5D 等轴测视图

## 概述
在画布视图标签栏中添加第4个「2.5D 预览」标签。该视图以等轴测投影（isometric projection）方式渲染所有对象和产品，用于快速验证三视图定义的空间位置是否正确。此视图为只读，不可拖拽编辑。

## 改动

### 1. 扩展投影函数（`project3DTo2D`）
添加 `isometric` 视图类型的投影逻辑：
```typescript
case 'isometric':
  // 标准等轴测投影: 30° 角
  const isoX = (posX - posY) * Math.cos(Math.PI / 6);
  const isoY = -(posX + posY) * Math.sin(Math.PI / 6) - posZ;
  return { x: centerX + isoX * scale, y: centerY + isoY * scale };
```

### 2. 视图标签栏添加「2.5D」按钮（约第 1282 行）
在 `['front', 'side', 'top']` 后面追加 `'isometric'`，标签显示为「2.5D 预览」。

### 3. 等轴测视图下禁用拖拽
当 `currentView === 'isometric'` 时：
- `handleMouseDown` 中跳过对象选择/拖拽逻辑
- 显示「只读预览」提示标签
- 隐藏编辑工具（添加相机/机构按钮、属性面板等）

### 4. 产品块的等轴测渲染
将产品区域从矩形改为等轴测的立方体轮廓（3个可见面），使用半透明填充区分顶面、正面、侧面。

### 5. 相机和机构的等轴测渲染
复用现有图标，但在等轴测坐标下定位。标签保持不变。

### 文件改动
- `src/components/canvas/DraggableLayoutCanvas.tsx` — 所有改动集中在此文件
  - 类型 `ViewType` 扩展为 `'front' | 'side' | 'top' | 'isometric'`
  - 投影函数添加 isometric 分支
  - 工具栏添加第4个标签
  - 等轴测模式下禁用编辑交互
  - 产品区域渲染等轴测立体形状
  - 保存逻辑排除 isometric 视图（不保存截图）

