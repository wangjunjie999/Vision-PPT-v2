

# 挂载相机显示在执行机构上方 + 半透明效果

## 问题分析

从截图和代码看，当前画布中所有对象（相机 + 机构）在同一个 `objects.map()` 循环中渲染（第 1615 行），渲染顺序取决于数组顺序而非类型。这导致挂载后的相机可能被机构遮挡，而不是显示在机构上层。

## 改动方案

**文件**：`src/components/canvas/DraggableLayoutCanvas.tsx`

### 1. 拆分渲染顺序（第 1614-1748 行）

将单个 `objects.map()` 拆为两轮渲染：
- **第一轮**：渲染所有**非相机**对象（机构、产品等）
- **第二轮**：渲染所有**相机**对象

这样相机始终在 SVG 中处于更高图层，视觉上覆盖在机构之上。

### 2. 挂载相机半透明效果

对已挂载的相机（`mountedToMechanismId` 存在），在其 `<g>` 元素上添加 `opacity={0.7}`，使其呈现半透明效果，既能看到下方的机构，又能区分挂载状态。

### 关键代码变更

```typescript
// 第一轮：先渲染机构
{objects.filter(obj => obj.type !== 'camera').map(obj => {
  // ... 现有机构渲染逻辑不变
})}

// 第二轮：再渲染相机（始终在最上层）
{objects.filter(obj => obj.type === 'camera').map(obj => {
  const isMounted = !!obj.mountedToMechanismId;
  return (
    <g opacity={isMounted ? 0.7 : 1} ...>
      {/* 现有相机渲染逻辑不变 */}
    </g>
  );
})}
```

