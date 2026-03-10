

# 选中硬件后自动位移问题

## 根因

在 `src/components/canvas/Layout3DPreview.tsx` 第 815 行：

```tsx
const yOffset = selected ? 0.15 : 0;
```

第 818 行将此偏移应用到相机的 group position：

```tsx
<group position={[0, yOffset, 0]}>
```

这意味着每次选中相机时，它会在 Y 轴（垂直方向）向上浮起 0.15 单位。这是之前为"防止选中相机被其他物体遮挡"而添加的效果，但实际体验是选中后硬件会跳动。

## 修复方案

**文件：`src/components/canvas/Layout3DPreview.tsx`**

移除 `yOffset` 逻辑，让选中状态仅通过已有的黄色高亮边框（wireframe）来表示，不改变物体位置：

- 删除第 815 行的 `yOffset` 计算
- 将第 818 行的 `position={[0, yOffset, 0]}` 改为 `position={[0, 0, 0]}`（或直接移除 position 属性）

选中反馈仍然通过第 868-872 行的黄色 wireframe box 和发光材质提供，视觉效果不受影响。

