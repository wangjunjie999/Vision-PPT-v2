

# 3D 产品位置调整功能

## 概述

当前 3D 预览中的产品固定在原点 `[0,0,0]`，无法拖拽或用键盘移动。需要让产品像机构/相机一样支持拖拽移动和方向键调整。

## 改动

### 文件：`src/components/canvas/Layout3DPreview.tsx`

1. **新增 `productPosition` prop 和 `onUpdateProductPosition` 回调**：
   - 接口增加 `productPosition?: { posX: number; posY: number; posZ: number }`
   - 接口增加 `onUpdateProductPosition?: (pos: { posX: number; posY: number; posZ: number }) => void`

2. **产品可拖拽**（约第 1559-1572 行）：
   - 将产品的 `<group position={[0,0,0]}>` 替换为 `<DraggableGroup>`，使用 `productPosition` 计算位置
   - 拖拽 ID 使用 `'__product__'`

3. **修改拖拽处理逻辑**（`handleDragStart`/`handleDragMove`）：
   - `handleDragStart`：当 ID 为 `__product__` 时，从 `productPosition` 读取起始位置
   - `handleDragMove`：当 ID 为 `__product__` 时，调用 `onUpdateProductPosition` 而非 `onUpdateObject`

4. **修改键盘移动**（约第 1453-1455 行）：
   - 移除 `if (id === '__product__') return` 限制
   - 当 ID 为 `__product__` 时，从 `productPosition` 读取当前位置，调用 `onUpdateProductPosition` 更新

5. **SelectedInfoPanel**（约第 1509-1510 行）：
   - 当 `activeSelectedId === '__product__'` 时，构建虚拟 obj 传入面板，显示位置信息
   - 增加产品的 posX/posY/posZ 输入框

6. **RelationshipLines**（约第 1055 行）：
   - 产品连线的 `productPos` 从 `[0,0,0]` 改为基于 `productPosition` 计算

7. **键盘提示**（约第 1686 行）：
   - 移除 `activeSelectedId !== '__product__'` 条件，产品选中时也显示移动提示

### 文件：`src/components/canvas/DraggableLayoutCanvas.tsx`（约第 904-914 行）

- 传入 `productPosition` 和 `onUpdateProductPosition` 到 `Layout3DPreview`
- 产品位置从 workstation 数据中的 `product_position` 字段读取（默认 `{posX:0, posY:0, posZ:0}`）
- `onUpdateProductPosition` 调用 `updateWorkstation` 保存

### 数据库迁移

在 `workstations` 表添加 `product_position` 字段：

```sql
ALTER TABLE public.workstations
ADD COLUMN product_position jsonb DEFAULT '{"posX": 0, "posY": 0, "posZ": 0}'::jsonb;
```

