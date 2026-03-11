

# 支持单个对象级别的层级排序

## 现状

当前层级系统只支持 3 个**分类级别**的排序（相机、执行机构、产品），无法调整同一分类内各个对象的前后遮挡关系。例如两个不同的执行机构永远按数组顺序渲染，无法指定谁在前谁在后。

## 方案

将层级系统从"分类级"升级为"对象级"——保留分类分组的 UI 结构，但在每个分组内支持拖拽调整单个对象的渲染顺序。

### 数据结构变更

新增 `objectOrder` 状态，存储每个对象的渲染顺序：

```text
layerOrder: ['mechanism', 'product', 'camera']     ← 保留，控制分类间顺序
objectOrder: { [objectId]: number }                 ← 新增，控制分类内对象排序
```

持久化方式与 `layerOrder` 一致，存入 `localStorage`（key: `objectOrder_${workstationId}`）。

### 文件改动

**`src/components/canvas/DraggableLayoutCanvas.tsx`**
- 新增 `objectOrder` state，从 localStorage 初始化
- 新增 `handleObjectReorder(id, direction)` 和 `handleSaveObjectOrder` 回调
- 在 `MechanismRenderer`、`CameraRenderer`、`ProductRenderer` 渲染前，按 `objectOrder` 对 objects 排序

**`src/components/canvas/MechanismRenderer.tsx`**（及 CameraRenderer、ProductRenderer）
- 无需改动，它们已经按 `objects` 数组顺序渲染

**`src/components/canvas/CanvasToolbar.tsx`**
- 层级设置弹窗改为两级结构：分类可拖拽排序（现有），分类展开后显示该类下的具体对象列表，支持拖拽排序
- 使用 Collapsible 组件展开/收起每个分类下的对象

**`src/components/canvas/canvasTypes.ts`**
- 导出 `ObjectOrderMap` 类型

### UI 设计

```text
┌─ 层级设置 ──────────────┐
│ 渲染层级（上方 = 最前）    │
│                          │
│ ⋮ 📷 相机 ▸              │  ← 分类可拖拽，点击展开
│   ⋮ 相机1                │  ← 展开后显示对象列表
│   ⋮ 相机2                │
│                          │
│ ⋮ 🔧 执行机构 ▸          │
│   ⋮ 传送带               │
│   ⋮ 机械臂               │
│   ⋮ 转盘                 │
│                          │
│ ⋮ 📦 产品 ▸              │
│                          │
│ [💾 保存层级设置]          │
└──────────────────────────┘
```

### 涉及文件
- `src/components/canvas/canvasTypes.ts` — 新增类型
- `src/components/canvas/DraggableLayoutCanvas.tsx` — 对象排序状态与逻辑
- `src/components/canvas/CanvasToolbar.tsx` — UI 支持对象级拖拽
- `src/components/canvas/ObjectListPanel.tsx` — 同步排序（已有 reorder 按钮）

