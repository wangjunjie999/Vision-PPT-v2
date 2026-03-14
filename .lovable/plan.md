

# 产品吸附后3D位置精确贴合机构表面

## 问题

2D三视图中产品吸附到机构后，在3D空间中产品位置不正确——要么穿入机构（穿模），要么悬浮在机构上方有缝隙。根因：

1. **缺少表面高度计算**：产品吸附时，只记录了相对机构中心的偏移量，没有根据机构类型计算出产品应该放置的物理表面高度。
2. **productPosition 未同步**：2D 中产品对象的 `posX/Y/Z` 更新了，但驱动 3D 渲染的 `localProductPosition` 没有被同步更新为正确的值。
3. **表面高度因机构类型不同**：传送带皮带面、转盘台面、升降平台面等物理表面高度各不相同，但当前代码没有区分。

## 方案

### 1. 新增机构表面高度函数（`Layout3DPreview.tsx`）

根据 3D 模型中各机构类型的实际建模参数，返回产品应放置的表面 Z 坐标（相对机构底部，单位 mm）：

```typescript
function getMechanismSurfaceHeight(mechType: string, mechHeight: number): number {
  switch (mechType) {
    case 'conveyor': return mechHeight * 0.64;   // 皮带面顶部
    case 'turntable': return mechHeight * 0.50;   // 转盘台面顶部
    case 'lift': return mechHeight * 0.63;        // 升降平台面顶部
    case 'stop': return mechHeight * 0.40;        // 挡停器顶面
    case 'cylinder': return mechHeight * 1.10;    // 活塞杆末端
    case 'gripper': return mechHeight * 0.35;     // 夹持中心
    default: return mechHeight;                    // 默认：机构顶部
  }
}
```

### 2. 修改 2D 产品吸附逻辑（`DraggableLayoutCanvas.tsx`）

在产品吸附成功时（L596-611），除了记录 mount 信息外，同步计算并更新 `localProductPosition`：

```typescript
// 吸附时计算正确的产品Z位置
const mechHeight = nearestProductMount.mechanism.height || 100;
const surfaceZ = getMechanismSurfaceHeight(mechType, mechHeight);
const correctPosZ = mechPosZ + surfaceZ;

// 同步更新 localProductPosition
setLocalProductPosition({
  posX: mechPosX,  // 产品居中对齐机构
  posY: mechPosY,
  posZ: correctPosZ, // 产品底部贴合机构表面
});
```

### 3. 同步 2D 产品对象的 posZ

同时更新 objects 数组中产品对象的 posZ，保持 2D 和 3D 一致。

### 4. 导出表面高度函数

将 `getMechanismSurfaceHeight` 同时在 3D 预览中使用（RelationshipLines 的产品连接线端点也需要用到正确的表面位置）。

## 改动范围

- `src/components/canvas/Layout3DPreview.tsx`：新增 `getMechanismSurfaceHeight` 函数并导出
- `src/components/canvas/DraggableLayoutCanvas.tsx`：在产品吸附逻辑中调用表面高度计算并同步 `localProductPosition`

预计约 30 行改动，2 个文件。

