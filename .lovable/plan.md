

## 修复：切换功能模块时光学方案图布局互相影响

### 问题原因

`VisionSystemDiagram` 组件内部的拖拽位置（`camLensDrag`、`lightDrag`）和旋转角度（`camRotation`、`lightRotation`）都是用 `useState` 存储的，且没有绑定到具体的模块 ID。当用户在不同功能模块之间切换时，React 复用了同一个组件实例，导致上一个模块中拖拽/旋转的状态"泄漏"到其他模块。

### 修复方案

**文件**: `src/components/canvas/VisionSystemDiagram.tsx`

1. **新增 `moduleId` prop**，用于标识当前模块
2. **用 `key={moduleId}` 包裹或在 props 变化时重置状态**：当 `moduleId` 变化时，将拖拽位置和旋转角度重置为初始默认值

**文件**: `src/components/canvas/ModuleSchematic.tsx`

3. 在两处渲染 `VisionSystemDiagram` 的地方传入 `moduleId={selectedModuleId}`

### 具体做法

最简洁的方案是在 `ModuleSchematic` 中给 `VisionSystemDiagram` 加上 `key={module?.id}`，这样切换模块时 React 会销毁旧实例并创建新实例，所有内部状态自然重置为默认值。无需修改 `VisionSystemDiagram` 内部代码。

### 影响范围
- `ModuleSchematic.tsx`：两处 `<VisionSystemDiagram` 各加一个 `key` prop
- 不影响任何其他功能

