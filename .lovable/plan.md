

# 方向键移动 + 高对比度配色 + 透视交互模式

## 1. 方向键移动选中对象

在 `Layout3DPreview` 组件中添加键盘事件监听：

- **←→ 方向键**：移动 posX（水平方向），步进 = `SNAP_GRID`(10mm)
- **↑↓ 方向键**：移动 posY（前后方向），步进 = 10mm
- **Shift + ↑↓**：移动 posZ（高度/垂直方向），步进 = 10mm — 解决当前无法上下移动的核心缺陷
- 仅在 `dragMode` 开启且有选中对象时生效
- 使用 `useEffect` + `window.addEventListener('keydown', ...)` 实现
- 按住方向键连续移动，调用 `onUpdateObject` 更新坐标

## 2. 执行机构高对比度配色

将各机构模型的主色调从暗灰色系调整为高饱和度工业色：

| 机构 | 当前颜色 | 新颜色 |
|------|----------|--------|
| RobotArm | `#ea580c` (暗橙) | `#f97316` 主体 + `#ff6b00` 关节，白色底座 |
| Conveyor | `#4b5563` (暗灰) | `#22c55e` 绿色皮带 + `#e2e8f0` 浅灰框架 |
| Cylinder | `#9ca3af` (灰) | `#0ea5e9` 蓝色缸体 + `#e5e7eb` 银色活塞 |
| Gripper | `#4b5563` (暗灰) | `#8b5cf6` 紫色主体 + `#c4b5fd` 浅紫夹爪 |
| Turntable | `#1e3a5f` (暗蓝) | `#2563eb` 蓝色圆盘 + `#bfdbfe` 浅蓝底座 |
| Lift | `#6b7280` (灰) | `#f59e0b` 黄色框架 + `#fef3c7` 浅黄平台 |
| Stop | `#991b1b` (暗红) | `#ef4444` 鲜红挡板 + `#fca5a5` 浅红底座 |
| CameraMount | `#64748b` (灰) | `#e2e8f0` 银白支架 + `#94a3b8` 细节 |

关键：提高主体与细节之间的**明暗对比**，而非整体变亮。深色部件用 `#1e293b`，亮色用各机构的主题色。

## 3. X-Ray 透视模式

在工具栏添加第三个模式按钮 "透视模式"（`Eye` 图标）：

- 开启后所有机构变为**半透明线框**（`opacity: 0.15` + `wireframe: true`），内部结构和被遮挡的相机/产品清晰可见
- 相机和产品保持不透明，确保可见
- 关系线条加粗并保持不透明
- 通过 `xrayMode` state 控制，传入各模型组件

### 文件修改

仅修改 `src/components/canvas/Layout3DPreview.tsx`：
- 添加 `useEffect` 键盘监听 + `handleKeyMove` 回调
- 更新各 Model 组件的颜色常量
- 添加 `xrayMode` state + 工具栏按钮
- 在各机构模型中根据 `xrayMode` 切换材质

