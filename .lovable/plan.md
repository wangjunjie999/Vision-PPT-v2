

# 3D 画布预览模式 + 修复未选中硬件飘动

## 问题

1. **缺少预览/编辑模式切换**：3D 画布始终允许拖拽硬件，用户希望有预览模式（仅旋转、空格+拖拽平移）
2. **未选中硬件跟随鼠标移动**：`DraggableGroup` 在首次点击时同时执行"选中"和"开始拖拽"，违反"先选中后拖拽"原则

## 修改方案

### 文件：`src/components/canvas/Layout3DPreview.tsx`

**修复1：添加编辑/预览模式切换**
- 新增 `editMode` state（默认 `false`，即预览模式）
- 预览模式下：禁止拖拽（`handleDragStart` 直接 return）、禁止键盘移动/旋转
- 预览模式下：仅允许 OrbitControls 旋转和缩放、点击选中查看信息
- 在工具栏添加"编辑/预览"切换按钮

**修复2：未选中对象不允许拖拽**
- 修改 `DraggableGroup` 组件，新增 `selectedObjectId` 属性
- `onPointerMove` 中增加判断：仅当 `objectId === selectedObjectId`（即对象已被选中）时才触发 `onDragStart`
- 首次点击未选中对象 → 仅选中（高亮），不启动拖拽
- 再次点击已选中对象并拖动 → 才执行移动

**修复3：`handleDragStart` 增加选中状态校验**
- 在 `handleDragStart` 开头增加 `if (id !== activeSelectedId) return;`
- 双重保障：即使 `DraggableGroup` 漏判，主逻辑也不会启动拖拽

### 涉及约 25 行修改，1 个文件

