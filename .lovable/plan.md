

# 3D 文字始终面向相机（Billboard）

## 问题

当前所有 `<Text>` 组件（机构名称、产品标签、相机名称、连接线标签）都是固定朝向，旋转视角后文字会侧面或背面显示，难以阅读。

## 方案

从 `@react-three/drei` 导入 `Billboard` 组件，将所有 `<Text>` 包裹在 `<Billboard>` 中。`Billboard` 会自动让其子元素始终面向相机。

需要修改的位置（`Layout3DPreview.tsx`）：

1. **导入** `Billboard`
2. **机构标签**（约 L828-866）：3-4 个 `<Text>` → 用 `<Billboard>` 包裹
3. **产品标签**（约 L927-935）：`<Text>` → 用 `<Billboard>` 包裹
4. **相机标签**（约 L1020-1028）：`<Text>` → 用 `<Billboard>` 包裹
5. **连接线标签**（约 L1224-1234）：`<Text>` → 用 `<Billboard>` 包裹

改动模式统一：
```tsx
// 改前
<Text position={[0, h, 0]} ...>标签</Text>

// 改后
<Billboard position={[0, h, 0]}>
  <Text fontSize={0.16} ...>标签</Text>
</Billboard>
```

约 20 行改动，1 个文件。

