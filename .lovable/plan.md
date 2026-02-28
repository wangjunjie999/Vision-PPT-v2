

# 修复标注位置偏差 + 优化标注工具交互

## 问题分析

### 1. 位置偏差根因

`AnnotationCanvas` 使用 `containerRef.getBoundingClientRect()` 计算相对坐标（占容器宽高的百分比），但图片使用了 `object-contain` 模式——图片实际渲染区域小于容器，两侧/上下有留白。标注坐标是相对于容器算的，但标注层覆盖整个容器，导致标注偏离图片上的实际位置。

```text
容器:     [  留白  |  实际图片  |  留白  ]
点击位置:           ↓ (图片上某点)
计算坐标: ← 基于容器宽度算百分比 (包含了留白，所以偏了)
```

### 2. 点击立即弹窗问题

当前代码中，点/文本/编号工具在 `mouseDown` 时就创建标注并立即打开编辑 Dialog；矩形/箭头工具在 `mouseUp` 时也立即弹出 Dialog。用户期望的流程是：先把所有框和点都画好，最后统一填写信息。

## 修复方案

### 1. AnnotationCanvas.tsx -- 修复坐标计算

关键修改：计算图片在容器中的实际渲染区域（考虑 `object-contain` 的留白），坐标相对于图片实际区域计算。

```typescript
// 计算 object-contain 模式下图片的实际渲染区域
const getImageBounds = useCallback(() => {
  if (!containerRef.current || !imageSize.width || !imageSize.height) return null;
  const container = containerRef.current.getBoundingClientRect();
  const containerAspect = container.width / container.height;
  const imageAspect = imageSize.width / imageSize.height;
  
  let renderWidth, renderHeight, offsetX, offsetY;
  if (imageAspect > containerAspect) {
    // 图片更宽，上下留白
    renderWidth = container.width;
    renderHeight = container.width / imageAspect;
    offsetX = 0;
    offsetY = (container.height - renderHeight) / 2;
  } else {
    // 图片更高，左右留白
    renderHeight = container.height;
    renderWidth = container.height * imageAspect;
    offsetX = (container.width - renderWidth) / 2;
    offsetY = 0;
  }
  return { renderWidth, renderHeight, offsetX, offsetY, container };
}, [imageSize]);

// 修正后的坐标计算
const getRelativeCoords = useCallback((e: React.MouseEvent) => {
  const bounds = getImageBounds();
  if (!bounds) return { x: 0, y: 0 };
  const { renderWidth, renderHeight, offsetX, offsetY, container } = bounds;
  const mouseX = e.clientX - container.left - offsetX;
  const mouseY = e.clientY - container.top - offsetY;
  return {
    x: (mouseX / renderWidth) * 100,
    y: (mouseY / renderHeight) * 100,
  };
}, [getImageBounds]);
```

同时，标注的渲染层也需要调整为仅覆盖图片实际区域（而非整个容器），确保百分比坐标与渲染位置一致。

### 2. AnnotationCanvas.tsx -- 取消即时弹窗

改为"画完即添加、不弹窗"模式：
- 点/编号工具：点击后直接添加标注到列表（默认空名称），不弹 Dialog
- 矩形/箭头工具：松开鼠标后直接添加标注，不弹 Dialog
- 删除原有的自动弹出编辑 Dialog 的逻辑
- 保留手动双击或选择后点"编辑"按钮打开 Dialog 的能力

```typescript
// 之前：
if (tool === 'point') {
  setEditingAnnotation(newAnnotation);
  setEditDialogOpen(true);  // ← 立即弹窗
}

// 之后：
if (tool === 'point') {
  onChange([...annotations, newAnnotation]);  // ← 直接添加，不弹窗
}
```

### 3. AnnotationCanvas.tsx -- 标注渲染层对齐

将标注层从 `absolute inset-0` 改为动态计算的偏移和尺寸，与图片实际渲染区域对齐：

```typescript
<div 
  className="absolute pointer-events-none"
  style={{
    left: `${imageBounds.offsetX}px`,
    top: `${imageBounds.offsetY}px`,
    width: `${imageBounds.renderWidth}px`,
    height: `${imageBounds.renderHeight}px`,
  }}
>
  {annotations.map(renderAnnotation)}
</div>
```

### 4. 添加窗口 resize 监听

容器大小变化时重新计算 imageBounds，确保标注始终与图片对齐。

## 涉及文件

| 文件 | 变更 |
|------|------|
| src/components/product/AnnotationCanvas.tsx | 修复坐标计算、标注层对齐、取消即时弹窗 |

## 预期效果

- 标注精确落在图片上鼠标点击的位置，无偏差
- 画矩形/点/箭头时不再弹出编辑窗口，可以连续绘制多个标注
- 所有标注画完后，通过 AnnotationEditor 的"保存标注"按钮触发逐个填写流程
- 双击已有标注或选中后点"编辑"仍可单独修改

