

# 机械臂法兰跟随产品位置

## 当前状态
机械臂的法兰标记位置是固定的（由 `getMechanismMountPoints` 返回的静态坐标，如正视图 `{x: 0.75, y: -0.55}`）。法兰不会根据场景中产品的位置调整方向，无法直观表达"臂伸向产品"的空间关系。

## 改进方案

### 核心思路
当场景中存在产品对象时，机械臂的法兰标记位置根据产品相对方向动态偏移，使法兰"指向"最近的产品。无产品时保持默认位置。

### 修改文件

**1. `src/components/canvas/MechanismSVG.tsx`**
- `getMechanismMountPoints` 增加可选参数 `targetPosition?: {x: number, y: number}` 和 `mechPosition?: {x: number, y: number}`
- 当 `robot_arm` 类型传入目标位置时，根据产品相对于机械臂的角度，动态计算法兰的 `position.x/y`（在合理范围内钳位，如 x: -0.8~0.8, y: -0.7~0.3），模拟臂末端朝向产品

**2. `src/components/canvas/MechanismRenderer.tsx`**
- 法兰标记渲染部分（约第 140-167 行）：查找场景中最近的产品对象，将产品位置传入计算法兰坐标
- 法兰标记根据产品方向旋转，添加指向产品的方向指示

**3. `src/components/canvas/ConnectionLines.tsx`**
- 机械臂的相机连接线起点也改为使用动态法兰位置（如果有产品，法兰指向产品方向）
- 新增机械臂 → 产品的特殊连接线样式（从法兰到最近产品，用虚线+🤖图标）

**4. `src/components/canvas/DraggableLayoutCanvas.tsx`**
- 将产品对象列表传递给 `MechanismRenderer`（当前已有 `objects` prop，无需额外传递）

### 技术细节
- 法兰位置计算：`atan2(productY - armY, productX - armX)` 得到角度，映射到法兰可达范围的归一化坐标
- 可达范围用椭圆弧约束：x ∈ [-0.8, 0.8], y ∈ [-0.7, 0.3]，模拟真实臂展
- 多个产品时取最近的一个
- 法兰标记添加小箭头指示产品方向

