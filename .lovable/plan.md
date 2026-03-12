

# 3D 预览中调整执行机构和产品尺寸

## 改动概述

在 3D 预览的"已选中"信息面板中，增加长/宽/高的编辑输入框。选中机构时可调整机构尺寸（width/height/depth），选中产品时可调整产品尺寸（length/width/height）。

## 详细改动

### 1. `src/components/canvas/Layout3DPreview.tsx`

**Props 扩展**：新增 `onUpdateProductDimensions` 回调

```typescript
interface Layout3DPreviewProps {
  // ...existing
  onUpdateProductDimensions?: (dims: { length: number; width: number; height: number }) => void;
}
```

**SelectedInfoPanel 增强**：
- 当选中对象为**机构**时，显示 3 个数字输入框（宽/高/深），修改后调用 `onUpdateObject(id, { width, height, depth })`
- 当选中对象为**产品**（`__product__`）时，显示 3 个数字输入框（长/宽/高），修改后调用 `onUpdateProductDimensions`
- 为产品选中新增一个独立的 `ProductInfoPanel` 组件，显示在左上角

### 2. `src/components/canvas/DraggableLayoutCanvas.tsx`

- 从 `useData()` 解构 `updateWorkstation`
- 创建 `handleUpdateProductDimensions` 回调，调用 `updateWorkstation(workstationId, { product_dimensions: newDims })`
- 将该回调传入 `<Layout3DPreview onUpdateProductDimensions={...} />`

## 交互设计

- 输入框使用紧凑的行内样式，宽度 60px，带 mm 单位标注
- 输入后失焦或按回车即生效，3D 模型实时更新
- 最小值限制 10mm，防止无效尺寸

