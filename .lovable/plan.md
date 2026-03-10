

# 3D预览：分类机构建模 + 修复视角切换 + 修复取消选中

## 问题清单

1. **所有机构都是同一个方盒子** — 需要根据 `mechanismType` 渲染不同的 3D 模型
2. **视角预设按钮点击无效** — `CameraController` 在渲染函数体内直接设置相机位置，只在首次渲染时生效；需要改为 `useFrame` 循环检测
3. **拖拽后无法取消选中** — `dragMovedRef` 在拖拽结束后未重置为 `false`，导致后续点击空白处 `handleSelect(null)` 被跳过

## 改动

### `src/components/canvas/Layout3DPreview.tsx`

#### A. 按 mechanismType 分类渲染不同 3D 模型

替换统一的 `MechanismBox`，新建 `Mechanism3DModel` 组件，根据 `obj.mechanismType` 分发：

| mechanismType | 3D 形状 | 颜色 |
|---|---|---|
| `robot_arm` | 底座圆柱 + 竖直长臂(Box) + 末端关节(Sphere) | 深灰/橙 |
| `conveyor` | 扁平长方体 + 两端圆柱滚轮 | 灰/绿 |
| `cylinder` | 圆柱体(Cylinder) | 银灰 |
| `gripper` | 中心块 + 两个对称夹爪(Box) | 深灰 |
| `turntable` | 大圆柱底座 + 薄圆盘顶面 | 深蓝 |
| `lift` | 竖直立柱(Box) + 可升降平台(Box) | 灰 |
| `stop` | 小方块 + 顶部挡板 | 红 |
| `camera_mount` | L型支架(两个Box拼接) | 蓝灰 |
| 默认 | 当前方盒子 | 橙 |

每种模型的尺寸均基于 `obj.width/height/depth`，按比例缩放。

#### B. 修复视角预设按钮

`CameraController` 改用 `useFrame` 在每帧检测 `cameraRef.current` 是否有值，有则设置相机并清空，确保点击按钮后相机位置实际更新。

#### C. 修复拖拽后无法取消选中

在 `handleDragEnd` 中延迟重置 `dragMovedRef.current = false`（用 `setTimeout` 0ms，让 click 事件先触发后再重置），同时在 `onPointerMissed` 中也重置 `dragMovedRef`。

### 涉及文件

仅 `src/components/canvas/Layout3DPreview.tsx`

