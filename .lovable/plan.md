

# 2.5D等轴测中产品渲染在机构上方 + 显示绑定关系

## 问题
当前2.5D isometric视图中，产品3D方块在 line 1872 渲染，**早于**机构（line 1978），导致产品在机构下方。同时产品吸附到机构后，isometric中没有体现绑定关系（位置、颜色）。

## 改动（单文件 `DraggableLayoutCanvas.tsx`）

### 1. 移动产品isometric渲染块到机构之后
将 line 1871-1915 的产品isometric渲染块移到机构渲染循环（line 2065）之后，确保产品在机构上方。

### 2. 吸附后位置跟随
当产品有 `mountedToMechanismId` 时，isometric渲染使用挂载机构的3D坐标作为产品位置基准（产品放在机构顶面上），而非产品自身的 posX/posY/posZ。

### 3. 吸附后颜色变化
- **未吸附**：保持当前青色（`#06b6d4` 系列）
- **已吸附**：改为绿色（`#16a34a` 系列，与2D视图一致），opacity 0.7

### 4. 绑定连线
已吸附产品与机构之间绘制绿色虚线连接（复用现有 connection line 逻辑），在isometric视图中也使用 `isoProject` 投影后的坐标。

