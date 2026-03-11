

# 机械臂末端执行器连接相机的视觉增强

## 问题

当前机械臂（robot_arm）在画布上渲染时，连接线是从相机中心到机构中心的简单虚线，看不出机械臂"末端"与相机之间的物理连接关系。机械臂应有一个明显的末端执行器（法兰盘），连接线应从这个末端出发指向相机。

## 方案

### 1. 增强 MechanismRenderer 中机械臂的末端执行器视觉

在 `MechanismRenderer.tsx` 中，当机构类型为 `robot_arm` 时，在机构图片/矩形之上叠加一个末端法兰盘标记（橙色圆环 + 安装点指示器），位置对应各视图的 `arm_end` 挂载点。

### 2. 改进 ConnectionLines 中机械臂的连接线

在 `ConnectionLines.tsx` 中，当相机挂载到 `robot_arm` 类型机构时：
- 连接线起点从机构中心改为末端挂载点的实际位置（使用 `getMountPointWorldPosition`）
- 绘制一条从法兰盘到相机的"机械臂连杆"风格连线（实线 + 关节圆点），而非普通虚线
- 在末端法兰盘位置绘制一个法兰盘图标

### 3. 涉及文件

**`src/components/canvas/ConnectionLines.tsx`**
- 导入 `getMountPointWorldPosition` 和 `CAMERA_INTERACTION_TYPES`
- 对 `robot_arm` 类型机构的相机连接，改用末端挂载点坐标作为连线起点
- 渲染法兰盘圆环 + 连杆风格连线（粗实线 + 关节点 + 方向箭头）

**`src/components/canvas/MechanismRenderer.tsx`**
- 当 `mechanismType === 'robot_arm'` 且有已挂载相机时，在末端位置叠加渲染一个高亮法兰盘标记（橙色实心圆环 + 🔗图标）

### UI 效果

```text
机械臂本体          法兰盘         相机
  ┌──────┐     ╭───╮    ═══════  ┌──────┐
  │robot │─────│ ⊕ │────────────→│ cam  │
  │ arm  │     ╰───╯    连杆线   └──────┘
  └──────┘   (橙色圆环)  (蓝色粗线+关节点)
```

连线从末端法兰盘出发而非机构中心，清晰表达机械臂末端与相机的物理安装关系。

