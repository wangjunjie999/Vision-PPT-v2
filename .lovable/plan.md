

# 标注画布增加缩放、旋转、平移图片功能

## 问题
1. 上传的产品图片大小不一，标注画布无法缩放适配
2. 产品图片方向可能不对（如放倒了），无法旋转/翻转
3. 图片位置偏移，无法居中对齐以便精确标注

## 方案

### 1. AnnotationCanvas 增加图片变换状态
**文件：`src/components/product/AnnotationCanvas.tsx`**

新增三组状态：
- **缩放**：`imageZoom`（滚轮控制，范围 0.5x - 5x）
- **旋转**：`imageRotation`（0/90/180/270 度）
- **平移**：`imagePanX / imagePanY`（中键拖拽或 Space+左键拖拽偏移）

核心改动：
- 将 `<img>` 包裹在一个 `<div>` 中，用 CSS `transform: translate(panX, panY) rotate(deg) scale(zoom)` 控制变换
- 标注层同步应用相同的 transform，保证标注坐标与图片像素位置一致
- `getRelativeCoords` 函数反算变换：先减去平移，再反旋转，再除以缩放，确保标注坐标在原始图片百分比空间中
- 滚轮事件绑定缩放（Ctrl+滚轮或直接滚轮）
- 旋转后重新计算 `imageBounds`（宽高交换）

### 2. 增加图片变换工具栏
**文件：`src/components/product/AnnotationCanvas.tsx`**

在现有工具栏右侧追加图片操作按钮组：
- 🔄 顺时针旋转90° / 逆时针旋转90°
- ↔️ 水平翻转 / ↕️ 垂直翻转（新增 `flipH / flipV` 状态，通过 `scaleX(-1) / scaleY(-1)` 实现）
- 🔍 放大 / 缩小 / 适配（重置为1x并居中）
- 十字箭头图标提示：滚轮缩放，中键/Space+左键平移

### 3. AnnotationEditor 工具栏同步
**文件：`src/components/canvas/AnnotationEditor.tsx`**

全屏标注编辑器已使用 `fillContainer` 模式，变换工具栏会从 AnnotationCanvas 内部自动继承，无需额外改动。

### 4. 坐标反算逻辑（技术细节）

```text
getRelativeCoords(mouseEvent):
  1. mouseXY = 鼠标相对容器位置
  2. 减去容器中心 → 相对中心坐标
  3. 减去 panX/panY
  4. 除以 zoom
  5. 反旋转 (-rotation)
  6. 反翻转 (flipH/flipV)
  7. 加回容器中心
  8. 减去 imageBounds.offset
  9. 转为百分比
```

标注渲染时正向变换与图片一致，因此视觉位置始终对齐。

### 5. renderAnnotationsToCanvas 同步
**文件：`src/utils/annotationRenderer.ts`**

保存时需要将图片变换（旋转/翻转）烘焙到最终输出中：
- 新增可选参数 `transform?: { rotation, flipH, flipV }`
- 在 canvas 绘制时先应用 `ctx.translate + ctx.rotate + ctx.scale` 再画图片和标注
- 确保导出的 PNG 与用户在屏幕上看到的完全一致

### 影响范围
- `AnnotationCanvas`：核心改动（缩放/旋转/平移/翻转 + 坐标反算）
- `annotationRenderer.ts`：保存时烘焙变换
- `AnnotationEditor`：无需改动，自动继承
- 不影响3D预览、2D布局等其他功能

