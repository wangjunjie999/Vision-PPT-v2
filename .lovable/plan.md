

# 相机吸附后 3D 位置精确贴合机构安装点

## 问题

当前相机在 2D 三视图吸附到机构后，3D 中位置不准确（穿模或有缝隙）。根因：相机吸附时（L576-583），`mountOffsetX/Y/Z` 直接取相机当前 3D 坐标减去机构坐标，没有根据安装点类型计算物理正确的挂载位置。

与产品吸附已修复的逻辑类似——产品用 `getMechanismSurfaceHeight` 计算表面高度，相机也需要类似的安装点位置计算。

## 方案

### 1. 新增 `getCameraMountPosition` 函数（`Layout3DPreview.tsx`）

根据机构类型和安装点 ID，返回相机相对机构中心的精确 3D 偏移（mm）：

```typescript
export function getCameraMountPosition(
  mechType: string, 
  mountPointId: string, 
  mechDims: { width: number; height: number; depth: number }
): { offsetX: number; offsetY: number; offsetZ: number } {
  switch (mechType) {
    case 'camera_mount':
      return { offsetX: 0, offsetY: 0, offsetZ: mechDims.height * 0.90 }; // 安装板顶部
    case 'robot_arm':
      if (mountPointId === 'arm_end') {
        return { offsetX: mechDims.width * 0.35, offsetY: 0, offsetZ: mechDims.height * 0.80 }; // 法兰末端
      }
      return { offsetX: mechDims.width * 0.25, offsetY: 0, offsetZ: mechDims.height * 0.60 }; // 腕部
    default:
      return { offsetX: 0, offsetY: 0, offsetZ: mechDims.height };
  }
}
```

### 2. 修改相机吸附逻辑（`DraggableLayoutCanvas.tsx` L568-593）

吸附时调用新函数计算精确偏移，并同步更新相机的 `posX/Y/Z`：

```typescript
if (nearestMount) {
  const mechDims = { 
    width: mech.width ?? 100, 
    height: mech.height ?? 100, 
    depth: mech.depth ?? 100 
  };
  const mountOffset = getCameraMountPosition(mechType, nearestMount.mountPoint.id, mechDims);
  
  updateObject(selectedId, {
    mountedToMechanismId: mech.id,
    mountPointId: nearestMount.mountPoint.id,
    mountOffsetX: mountOffset.offsetX,
    mountOffsetY: mountOffset.offsetY,
    mountOffsetZ: mountOffset.offsetZ,
    posX: mechPosX + mountOffset.offsetX,
    posY: mechPosY + mountOffset.offsetY,
    posZ: mechPosZ + mountOffset.offsetZ,
    ...(mountPos ? { x: mountPos.x, y: mountPos.y } : {}),
  });
}
```

## 改动范围

- `src/components/canvas/Layout3DPreview.tsx`：新增并导出 `getCameraMountPosition` 函数
- `src/components/canvas/DraggableLayoutCanvas.tsx`：相机吸附逻辑中调用新函数计算精确 3D 偏移并同步位置

预计约 30 行改动，2 个文件。

