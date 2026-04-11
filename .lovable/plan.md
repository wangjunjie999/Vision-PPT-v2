

## FOV 锥体随旋转移动 + 硬件图片外形适配

### 当前问题

1. **FOV 锥体不跟随旋转**：相机+镜头组旋转后，FOV 锥体仍然固定朝下（lines 363-377 使用的 `camCenterX` / `lensBottomY` 不受 `camRotation` 影响）
2. **硬件外形已支持图片替换**：`CameraSVGShape` / `LensSVGShape` / `LightSVGShape` 已经在有 `front_view_url` 时用 `<image>` 替代 SVG 矢量图，这部分逻辑已就绪

### 改动

**文件**: `src/components/canvas/VisionSystemDiagram.tsx`

**1. FOV 锥体跟随旋转**

当前 FOV 起点是 `(camCenterX, lensBottomY)`，终点是 `(camCenterX ± fovOffsetX, productY)`。旋转后这些点不变导致锥体不动。

修改方式：将 `camRotation` 应用到 FOV 锥体的起点和方向计算中：
- 镜头出光口位置 = 以相机中心为原点，旋转 `camRotation` 度后的偏移位置
- FOV 两条边线方向 = 原始向下方向 + `camRotation` 旋转
- FOV 终点延伸到产品所在 Y 坐标（或按旋转后的方向延伸固定长度）

具体计算：
```
// 旋转中心 = camLensDrag.pos
// 镜头底部相对于旋转中心的偏移 = (0, 105)
// 旋转后的实际镜头底部位置:
const rotRad = camRotation * Math.PI / 180;
const lensExitX = camCenterX + Math.sin(rotRad) * 105;
const lensExitY = camTopY + Math.cos(rotRad) * 105;
// FOV 边线方向也旋转 camRotation 度
```

**2. 工作距离和视野标注线跟随**

工作距离标注线（lines 394-404）和视野宽度标注线（lines 406-415）也需要根据旋转后的镜头出光口位置重新计算，确保标注始终指向正确位置。

**3. 连接虚线跟随**

右侧标注面板的连接虚线（lines 418-422）已经使用 `camCenterX` / `lightCenterX` 等动态坐标，旋转后需要用旋转后的实际中心点。

### 不需要改动的部分

- 硬件图片替换逻辑（已有 `CameraSVGShape` 等组件，上传 `front_view_url` 后自动显示）
- 拖拽和旋转手柄（已实现）
- 右侧信息面板数据（已动态计算）

### 影响范围

- 仅 `VisionSystemDiagram.tsx` 一个文件
- FOV 锥体绘制逻辑（约 15 行重写）
- 工作距离/视野宽度标注（约 20 行调整）
- 连接虚线坐标（约 5 行调整）

