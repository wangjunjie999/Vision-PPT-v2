

# 修复等轴测截图问题：挂载时序 + 相机适配

## 问题分析

从截图可以看到两个问题：

1. **部分工位无法保存等轴测**：保存时从 2D 切换到等轴测视图，`Layout3DPreview` 需要挂载 → Canvas 初始化 → `ScreenshotHelper` 注册回调。当前仅等待 400ms，3D 场景可能尚未完成初始化，导致 `isometricScreenshotFnRef.current` 为 null。

2. **内容太小**：`FitAllHelper` 的距离计算未考虑画布宽高比。当前公式 `distance = maxExtent / 2 / tan(fov/2) * 1.4` 只用了垂直 FOV 和最大维度，没有检查水平方向是否溢出或留白过多。对于宽屏画布，内容在垂直方向被缩得很小。

## 修复方案

### 文件 1：`src/components/canvas/Layout3DPreview.tsx`

**改进 FitAllHelper 的相机距离计算**：

- 获取 `camera.aspect`（宽高比）
- 分别计算垂直和水平方向所需距离
- 取两者中较大值，确保所有内容在任意宽高比下都能完整显示
- 降低 margin 从 1.4x 到 1.2x，让内容更紧凑

```text
verticalDistance = boxHeight / (2 * tan(vFov/2))
horizontalDistance = boxWidth / (2 * tan(hFov/2))
  其中 hFov = 2 * atan(tan(vFov/2) * aspect)
distance = max(verticalDistance, horizontalDistance) * 1.2
```

还需要将包围盒投影到等轴测视平面上计算投影宽度和高度，而非直接使用世界坐标的 width/height/depth。

### 文件 2：`src/components/canvas/DraggableLayoutCanvas.tsx`

**修复挂载时序**：

- 将 `isometricScreenshotFnRef` 和 `fitAllFnRef` 的就绪检测改为轮询等待（最多 3 秒），而非固定 400ms 延时
- 确保 3D 场景完全初始化后再执行 fitAll 和截图

```text
// 替换固定等待
setCurrentView('isometric');
// 轮询等待 ref 就绪，最多 3s
await waitForRef(isometricScreenshotFnRef, 3000);
await waitForRef(fitAllFnRef, 1000);
fitAllFnRef.current?.();
await new Promise(r => setTimeout(r, 500));
const isoDataUrl = isometricScreenshotFnRef.current();
```

### 修改量

- `Layout3DPreview.tsx`：FitAllHelper 约 15 行改动
- `DraggableLayoutCanvas.tsx`：保存流程约 15 行改动

