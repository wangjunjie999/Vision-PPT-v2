

# 修复机械布局图：相机吸附隔离 + 图片实时同步

## 问题分析

1. **SVG 绘图中产品交互机构包含相机标记**：conveyor、turntable、lift、stop、cylinder、gripper 的 SVG 绘图中包含橙色虚线圆圈和 📷 图标（如 conveyor 第 274-277 行、turntable 第 204-206 行、lift 第 245-246 行等），造成视觉误导——这些机构只应与产品交互，不应有相机安装点标记。

2. **图片优先级错误**：`getMechanismImageForObject`（第 783 行）和 `MechanismSVG`（第 451 行）都优先使用本地静态资源，导致管理后台更新图片后画布仍显示旧图。

3. **机械臂相机吸附位置需优化**：末端法兰安装点的坐标位置需要调整以更准确反映实际安装位置。

## 修复方案

### 1. 清理产品交互机构的 SVG 绘图（MechanismSVG.tsx）

从以下机构的 SVG 绘图中删除所有相机相关元素（橙色虚线圆圈 `stroke="#f97316"`、📷 文本）：
- **conveyor** front：删除龙门架及相机安装点（第 269-277 行）
- **turntable** front/side：删除橙色圆圈（第 204-206、213 行）
- **lift** front/side：删除支架和相机点（第 245-246、253 行）
- **cylinder** front：删除活塞杆末端相机点（第 377 行）
- **gripper** front：删除上方相机点（第 410 行）

### 2. 优化机械臂相机吸附位置（MechanismSVG.tsx）

调整 `robot_arm` 的 `getMechanismMountPoints` 配置：
- front 视图 `arm_end`：从 `{x: 0.7, y: -0.4}` 调整为 `{x: 0.75, y: -0.55}`（更靠近末端法兰）
- side 视图 `arm_end`：从 `{x: 0.8, y: -0.3}` 调整为 `{x: 0.85, y: -0.45}`
- top 视图 `arm_end`：从 `{x: 0.6, y: 0}` 调整为 `{x: 0.7, y: -0.1}`

### 3. 修复图片优先级（两处）

**DraggableLayoutCanvas.tsx 第 783-798 行** `getMechanismImageForObject`：
```
改前: localImage 优先 → 数据库 URL 兜底
改后: 数据库 URL 优先 → localImage 兜底
```

**MechanismSVG.tsx 第 451-452 行**：
```
改前: const mechanismImageUrl = localImageUrl || imageUrl;
改后: const mechanismImageUrl = imageUrl || localImageUrl;
```

### 涉及文件
- `src/components/canvas/MechanismSVG.tsx` — 清理 SVG + 调整吸附位置 + 修复图片优先级
- `src/components/canvas/DraggableLayoutCanvas.tsx` — 修复图片优先级

