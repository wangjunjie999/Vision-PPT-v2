

# 修复等轴测截图内容不全 — 自动适配相机

## 问题

等轴测截图使用固定相机位置 `[7, 6, 7]`，FOV 50°。当布局中的硬件分布较大时，相机视野无法覆盖所有对象，导致截图内容不全。

## 方案

### 文件：`src/components/canvas/Layout3DPreview.tsx`

**1. 添加 `fitAll` 函数**（在 `CameraController` 内或作为独立工具函数）

- 遍历所有对象（mechanisms + cameras + product），计算场景包围盒（bounding box）
- 根据包围盒大小 + 相机 FOV，计算等轴测方向上的最佳距离
- 公式：`distance = maxExtent / (2 * tan(fov/2))` 再加 margin（1.3x）
- 更新 `cameraActionRef` 驱动相机平滑移动

**2. 暴露 `fitAll` 给父组件**

- 扩展 `onScreenshotReady` 回调或新增 `onFitAllReady` prop，使 `DraggableLayoutCanvas` 可调用
- 在保存布局截图前（L808-822），先执行 `fitAll()`，等待相机到位后再截图

**3. 截图前自动 fitAll**

修改 `DraggableLayoutCanvas.tsx` 的保存流程（L808）：
```
setCurrentView('isometric');
await new Promise(r => setTimeout(r, 300));
fitAllFnRef.current?.();           // ← 新增：自动适配
await new Promise(r => setTimeout(r, 600));
const isoDataUrl = isometricScreenshotFnRef.current();
```

**4. 工具栏添加"适配全部"按钮**

在 `Layout3DPreview` 右侧视角预设按钮区域，增加一个 `Maximize2` 图标的"适配"按钮，点击执行 fitAll，方便用户手动调整。

### 计算逻辑

```text
所有对象坐标 → 包围盒 (minX, maxX, minY, maxY, minZ, maxZ)
center = 包围盒中心
maxExtent = max(宽, 高, 深)
distance = (maxExtent / 2) / tan(FOV/2) * 1.3
等轴测方向 = normalize([1, 0.85, 1])
cameraPos = center + direction * distance
target = center
```

### 修改文件

- `src/components/canvas/Layout3DPreview.tsx` — fitAll 函数 + 按钮 + 暴露 ref
- `src/components/canvas/DraggableLayoutCanvas.tsx` — 截图前调用 fitAll

约 40 行新增代码。

