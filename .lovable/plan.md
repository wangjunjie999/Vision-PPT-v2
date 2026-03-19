

# 连接线实时跟随模型移动

## 问题分析
`RelationshipLines` 组件中的连接线坐标通过 `useMemo([objects, productPosition])` 计算。在拖拽过程中，虽然 `objects` 数据会更新，但 `memo` 包裹的 `Layout3DPreview` 可能在快速拖拽时导致连接线更新滞后或不同步。

## 修改方案

### `src/components/canvas/Layout3DPreview.tsx` — RelationshipLines 组件

1. **移除 `useMemo`**：将 `lines` 的计算从 `useMemo` 改为直接计算（每次渲染都重新计算），确保连接线始终与最新的 `objects` 位置同步
2. **添加 `useFrame` 实时更新**：使用 `useFrame` 钩子在每帧检查是否有拖拽进行中，如果有则强制更新连接线的端点位置，确保拖拽过程中线条平滑跟随
3. **通过 ref 读取实际 Three.js 节点位置**：在 `RelationshipLines` 中引入一个 groupRef map，在 `useFrame` 中读取场景中各个 DraggableGroup 的实际世界坐标来更新线条端点，避免 React 状态更新延迟

### 具体实现
- 在 `RelationshipLines` 中将 `useMemo` 替换为 `useState` + `useFrame` 模式
- `useFrame` 回调中遍历 `objects`，对有 `mountedToMechanismId` 的对象，实时计算连接线起止坐标
- 将计算出的线条数据存入 ref 而非 state（避免触发不必要的 React 重渲染），使用 `useFrame` 直接操作 Three.js Line geometry

共修改 1 个文件。

