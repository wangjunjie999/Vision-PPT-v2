

# 添加画布层级设置 — 执行机构/产品/相机渲染顺序控制

## 问题分析
当前渲染顺序是硬编码的：**机构 → 产品 → 相机**（从底到顶）。`objects.filter(obj => obj.type === 'mechanism').map(...)` 这种写法使得即使在对象列表中调整顺序，也无法改变不同类型间的层级关系。`ObjectListPanel` 中的上下移动按钮只在同类型内有效。

## 方案

### 1. 新增层级顺序状态（DraggableLayoutCanvas.tsx）
添加一个 `layerOrder` state，默认值 `['mechanism', 'product', 'camera']`（从底到顶），用户可通过 UI 调整顺序。

### 2. 层级控制 UI（DraggableLayoutCanvas.tsx 工具栏区域）
在画布工具栏添加一个 **"层级设置"** 按钮（Layers 图标），点击弹出 Popover，内含三个可上下移动的条目：
- 🔧 执行机构
- 📦 产品  
- 📷 相机

每个条目有上移/下移按钮，列表从上到下对应渲染顺序从底到顶（底部的先渲染，顶部的后渲染显示在最上面）。

### 3. 渲染逻辑改造（DraggableLayoutCanvas.tsx）
将当前硬编码的三段 `objects.filter(type === 'xxx').map(...)` 改为根据 `layerOrder` 动态渲染：

```typescript
// 当前（硬编码）：
{objects.filter(obj => obj.type === 'mechanism').map(...)}
{objects.filter(obj => obj.type === 'product').map(...)}
{objects.filter(obj => obj.type === 'camera').map(...)}

// 改为（动态）：
{layerOrder.map(layerType => (
  objects.filter(obj => obj.type === layerType).map(obj => renderObject(obj, layerType))
))}
```

需要将各类型的渲染逻辑提取为可复用的渲染函数或内联条件判断。

### 4. 等轴测视图同步
2.5D isometric 视图中的产品和相机渲染也需要遵循 `layerOrder` 顺序，确保一致性。

### 5. ThreeViewLayout 同步
`ThreeViewLayout.tsx` 中的 `LAYER_CONFIG` zIndex 也需要根据 `layerOrder` 动态调整，保持三视图与画布一致。

### 涉及文件
| 文件 | 改动 |
|------|------|
| `DraggableLayoutCanvas.tsx` | 添加 `layerOrder` state、层级控制 Popover UI、改造渲染逻辑为动态顺序 |
| `ThreeViewLayout.tsx` | 接收 `layerOrder` prop，动态调整 zIndex |

