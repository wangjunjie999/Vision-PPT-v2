

# 3D预览：解决遮挡、交互关系可视化与相机挂载规则

## 问题

1. **硬件遮挡**：多个对象位置重叠时互相遮挡，看不清各部件
2. **交互关系不清晰**：`MountingLines` 只画了简单虚线，看不出哪些是相机挂载、哪些是产品承载
3. **相机挂载规则未在3D中执行**：2D画布已通过 `CAMERA_INTERACTION_TYPES`（仅 `camera_mount`、`robot_arm`）限制相机只能挂到视觉支架和机械臂上，但3D预览中的 `MountingLines` 不区分类型，不做验证

## 方案

### 文件：`src/components/canvas/Layout3DPreview.tsx`

#### 1. 改进 MountingLines → 分类关系线

替换当前的 `MountingLines`，新建 `RelationshipLines` 组件：

- **相机→机构**连线：仅当父机构类型在 `CAMERA_INTERACTION_TYPES` 中时显示。使用蓝色实线 + 相机图标标签
- **产品→机构**连线：仅当父机构类型在 `PRODUCT_INTERACTION_TYPES` 中时显示。使用青色实线 + 产品图标标签
- **非法挂载**（相机挂在了不支持的机构上）：显示红色虚线 + 警告标识，在信息面板中提示"非法挂载"
- 连线端点增加小球标记，线宽加粗到 2.5，提升可读性

#### 2. 解决遮挡问题

- 给每种类型的3D模型增加 **透明度分级**：未选中的对象 `opacity: 0.75`，选中对象 `opacity: 0.95`，使被遮挡物体隐约可见
- 相机对象在选中时增加 **Y轴偏移浮起效果**（+0.15），使其从机构上方浮出
- 在信息面板中增加 **"聚焦模式"**：选中一个对象时，其他不相关对象（无挂载关系）的 opacity 降至 0.3

#### 3. 挂载合法性标记

在 `Mechanism3DModel` 中：
- 从 `MechanismSVG.tsx` 导入 `CAMERA_INTERACTION_TYPES` 和 `PRODUCT_INTERACTION_TYPES`
- 在每个机构名称标签下方增加小型标识文字：
  - 相机交互类：显示 "📷" 蓝色标识
  - 产品交互类：显示 "📦" 绿色标识
- 当有相机非法挂载到产品交互类机构上时，该机构边框变红色警告

#### 4. SelectedInfoPanel 增加挂载信息

选中相机时显示：
- 挂载状态（合法/非法/未挂载）
- 挂载的父机构名称和类型

选中机构时显示：
- 类型标识（📷相机交互 / 📦产品交互）
- 已挂载的子对象列表

## 涉及文件

仅修改 `src/components/canvas/Layout3DPreview.tsx`，从 `MechanismSVG.tsx` 导入常量。

