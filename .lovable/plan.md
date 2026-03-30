

# 将3D选中信息面板移入右侧表单

## 问题
3D预览中左上角的 `SelectedInfoPanel` 与右侧 `ObjectPropertyPanel` 功能重复（名称、位置、尺寸），且部分3D特有信息（深度D、挂载状态、机构交互类型）仅在左侧显示。用户希望统一到右侧表单。

## 方案

### 1. 移除3D覆盖层的 SelectedInfoPanel
**文件：`src/components/canvas/Layout3DPreview.tsx`**
- 删除 `SelectedInfoPanel` 组件定义（~L1802-1933）
- 删除其渲染调用（~L2461-2470）
- 保留 `DimInput` 组件（其他地方可能用到）

### 2. 在 ObjectPropertyPanel 中补充3D模式下的信息
**文件：`src/components/canvas/ObjectPropertyPanel.tsx`**

在3D模式（`isIsometric`）下追加以下内容：

- **深度(D)输入框**：在尺寸区域追加第三个输入框（深度），仅3D模式显示
- **挂载状态信息**：相机显示挂载到哪个机构 + 合法性判断；未挂载则显示"未挂载"
- **机构交互类型**：机构显示是"相机交互类"还是"产品交互类"，以及已挂载的子设备列表
- **产品尺寸/位置编辑**：当选中产品时，在3D模式下显示 L/W/H 和 posX/posY/posZ 编辑框（需新增 props：`productDimensions`、`onUpdateProductDimensions`、`productPosition`、`onUpdateProductPosition`）

### 3. 传递新 props
**文件：`src/components/canvas/DraggableLayoutCanvas.tsx`**
- 将 `productDimensions`、`onUpdateProductDimensions`、`productPosition`、`onUpdateProductPosition` 传入 `ObjectPropertyPanel`

### 影响范围
- 3D预览画布不再有左上角浮层，视野更清爽
- 所有编辑操作统一在右侧表单完成
- 2D模式不受影响

