

# 按分工分类吸附：相机吸附 vs 产品吸附

## 概述
当前所有执行机构都有相机安装点（CameraMountPoint），相机可以吸附到任何机构上。这不合理——产品交互类机构（传送带、转盘、挡停等）应该吸附**产品**而非相机，只有相机交互类机构（视觉支架、机械臂）才应吸附相机。

## 改动

### 1. 新增产品安装点定义（`MechanismSVG.tsx`）
- 新增 `ProductMountPoint` 接口和 `getProductMountPoints()` 函数
- 为产品交互类机构定义产品安装位置（如传送带的产品承载面中心、夹爪的夹持位置等）
- 移除产品交互类机构（conveyor、turntable、lift、stop、cylinder、gripper）的 `CameraMountPoint`，仅保留 camera_mount 和 robot_arm 的相机安装点

### 2. 新增 `ProductMountPoints.tsx` 组件
- 类似 `CameraMountPoints.tsx`，但用于产品区域与机构的吸附
- 当拖拽产品区域靠近产品交互类机构时，显示产品安装点指示器（📦 图标，绿色吸附提示）
- 吸附后产品跟随机构移动

### 3. 扩展 `LayoutObject` 类型（`ObjectPropertyPanel.tsx`）
- 产品区域增加 `mountedToMechanismId` 支持（复用现有字段）
- 产品区域目前是固定渲染的背景矩形，需改为可选的可拖拽对象

### 4. 修改拖拽吸附逻辑（`DraggableLayoutCanvas.tsx`）
- **相机拖拽时**：只检测相机交互类机构（camera_mount、robot_arm）的安装点
- **产品拖拽时**：只检测产品交互类机构（conveyor、turntable 等）的安装点
- 更新 `findNearestMountPoint` 调用，增加机构类型过滤
- 拖拽相机时只显示相机交互类机构的 CameraMountPoints
- 产品区域改为可拖拽对象，靠近产品交互类机构时显示 ProductMountPoints

### 5. 2.5D 预览中体现绑定关系
- 产品吸附到机构后，在 2.5D 视图中显示产品贴合机构的位置

## 文件改动
| 文件 | 改动 |
|------|------|
| `src/components/canvas/MechanismSVG.tsx` | 移除产品类机构的相机安装点；新增 `ProductMountPoint` 和 `getProductMountPoints()` |
| `src/components/canvas/ProductMountPoints.tsx` | **新建**，产品吸附点渲染组件 |
| `src/components/canvas/CameraMountPoints.tsx` | 更新 `findNearestMountPoint` 增加类型过滤参数 |
| `src/components/canvas/ObjectPropertyPanel.tsx` | 产品对象支持显示挂载状态 |
| `src/components/canvas/DraggableLayoutCanvas.tsx` | 拖拽逻辑按对象类型分别匹配不同类型机构；产品区域改为可拖拽对象 |

