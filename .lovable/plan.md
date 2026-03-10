

# 将 2.5D 等轴测预览替换为真正的 3D 视图

## 现状

- 当前 isometric 视图是 SVG 内的 30° 投影模拟，只读，不可旋转
- 项目已安装 `@react-three/fiber@^8.18`、`@react-three/drei@^9.122`、`three@^0.169`
- `Product3DViewer.tsx` 已有 Three.js + OrbitControls 的使用模式可参考

## 方案

当用户切换到「3D 预览」视图时，隐藏 SVG 画布，改为渲染一个 Three.js `<Canvas>` 组件，用户可自由拖拽旋转视角。

## 改动清单

### 1. 新建 `src/components/canvas/Layout3DPreview.tsx`

Three.js 场景，读取 `objects` 数组渲染：
- **机构** → `<Box>` 几何体（橙色），尺寸取自 `obj.width/height`，位置取自 `posX/posY/posZ`
- **产品** → `<Box>` 几何体（青色），尺寸取自 `productDimensions`
- **相机** → 小型锥体 `<Cone>`（蓝色），位置取自 `posX/posY/posZ`
- 已挂载的对象用绿色显示 + 虚线连接父机构
- 地面网格 `<gridHelper>`、XYZ 坐标轴 `<axesHelper>`
- `<OrbitControls>` 支持拖拽旋转、缩放、平移
- 右上角视角预设按钮（正视/侧视/俯视/等轴测）
- 场景只读，不支持编辑

### 2. 修改 `DraggableLayoutCanvas.tsx`

- 当 `currentView === 'isometric'` 时，用 `<Layout3DPreview>` 替换 SVG 区域
- 传入 `objects`、`productDimensions` 等数据
- 保留工具栏和侧面板

### 3. 修改 `CanvasToolbar.tsx`

- 按钮文字从「🧊 2.5D 预览」改为「🧊 3D 预览」

### 4. 清理

- `IsometricGrid.tsx` 不再在主画布使用（保留文件，避免破坏引用）
- `ProductRenderer` 和 `CameraRenderer` 中的 isometric 分支代码保留但不再触发

## 文件变更

| 文件 | 操作 |
|------|------|
| `src/components/canvas/Layout3DPreview.tsx` | 新建 |
| `src/components/canvas/DraggableLayoutCanvas.tsx` | 条件渲染 3D 视图 |
| `src/components/canvas/CanvasToolbar.tsx` | 更新按钮标签 |

