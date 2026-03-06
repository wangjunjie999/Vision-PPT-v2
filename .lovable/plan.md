

# 执行机构下拉菜单分组显示

## 改动

在 `src/components/canvas/DraggableLayoutCanvas.tsx` 的添加机构 Popover 中（约1446-1465行），将 `enabledMechanisms` 按类型分为两组显示：

### 分组定义

```typescript
const CAMERA_INTERACTION_TYPES = ['camera_mount', 'robot_arm'];
const PRODUCT_INTERACTION_TYPES = ['conveyor', 'turntable', 'lift', 'stop', 'cylinder', 'gripper'];
```

- **相机交互类**（📷）：`camera_mount`（视觉支架）、`robot_arm`（机械臂）
- **产品交互类**（📦）：`conveyor`（传送带）、`turntable`（旋转台）、`lift`（顶升机构）、`stop`（定位挡停）、`cylinder`（气缸）、`gripper`（夹爪）

### UI 结构

替换当前的平铺列表为分组列表，每组带一个小标题（如 `📷 相机交互` / `📦 产品交互`），中间用分隔线隔开。未匹配到任何分类的机构归入产品交互类。

### 文件改动
- `src/components/canvas/DraggableLayoutCanvas.tsx` — 仅修改 Popover 内的机构列表渲染逻辑（约1446-1465行）

