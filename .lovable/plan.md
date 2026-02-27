

# 优化单视图布局图比例

## 问题分析

从截图可以看到，单视图模式下：
- 相机位于 Z=300 位置（画面上方），机构在 Z=0 位置（中心），大量空间在下方浪费
- 比例因子固定为 `scale = 1.0` 像素/mm，不会根据内容自适应
- 画布固定 1200x800，中心在 (600, 400)，对象分布在中心偏上区域
- 机构图标尺寸过大（140x110 像素），相机图标也偏大（70x80），导致图标重叠且视觉杂乱

## 修改方案

### 1. 自适应缩放 -- 根据内容自动调整比例

新增 `computeAutoScale` 函数，根据所有对象的 3D 坐标范围计算最优比例因子：

```text
计算逻辑:
  1. 遍历所有对象，找出当前视图投影后的坐标范围（含产品尺寸）
  2. 在坐标范围两侧留出 padding（80px）
  3. scale = min(可用宽度 / 坐标范围X, 可用高度 / 坐标范围Y)
  4. 限制 scale 在 0.3 ~ 2.0 之间
  5. 重新计算 centerX/centerY 使内容居中
```

这样无论对象分布在 300mm 还是 3000mm 范围内，都能自动适配画布。

### 2. 缩小图标默认尺寸

- 相机图标：从 70x80 缩小到 50x55
- 机构图标：从 `defaultWidth * scale` 改为固定合理值 80x60（不再乘以 scale，因为 scale 现在是动态的）
- 产品矩形也使用 scale 动态调整

### 3. 视图切换时重新计算

当 `currentView` 或 `objects` 变化时，重新计算自适应缩放参数，确保每个视图都有最佳布局。

## 技术细节

### 涉及文件

| 文件 | 变更 |
|------|------|
| src/components/canvas/DraggableLayoutCanvas.tsx | 添加自适应缩放逻辑、调整图标默认尺寸、动态居中 |

### 缩放计算（伪代码）

```text
function computeAutoScale(objects, currentView, canvasWidth, canvasHeight):
  // 收集所有对象在当前视图下的投影坐标
  points = objects.map(obj => project3DTo2D_mm(obj, currentView))
  // 加入产品尺寸
  points.push(产品边界点)

  // 计算坐标范围（mm 单位）
  rangeX_mm = max(points.x) - min(points.x) + 图标尺寸余量
  rangeY_mm = max(points.y) - min(points.y) + 图标尺寸余量

  // 计算最优比例（像素/mm）
  padding = 120  // 两侧各60px
  scale = min(
    (canvasWidth - padding) / rangeX_mm,
    (canvasHeight - padding) / rangeY_mm,
    2.0  // 上限
  )
  scale = max(scale, 0.3)  // 下限

  // 计算居中偏移
  centerX_mm = (min_x + max_x) / 2
  centerY_mm = (min_y + max_y) / 2
  return { scale, centerOffsetX, centerOffsetY }
```

### 图标尺寸对比

```text
相机图标:
  修改前: width=70, height=80 (固定)
  修改后: width=50, height=55 (固定，更紧凑)

机构图标:
  修改前: width = (defaultWidth || 140) * scale  // scale=1.0 时为 140
  修改后: width = 80, height = 60 (固定合理值，不随 scale 变化)

产品矩形:
  修改前: productDimensions * scale (scale=1.0)
  修改后: productDimensions * autoScale (动态缩放)
```

### 预期效果

- 对象自动居中显示，充分利用画布空间
- 缩放适配：少量对象时放大显示，大量分散对象时缩小
- 图标比例更合理，不再出现大面积空白
- 切换视图时自动重新适配

