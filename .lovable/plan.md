

# 添加空格键+鼠标左键平移功能

## 现状

当前 3D 画布的 `OrbitControls` 配置：
- 左键：未绑定（用于选中/拖拽硬件）
- 中键：缩放
- 右键：旋转视角

没有平移（pan）功能绑定。

## 方案

### 文件：`src/components/canvas/Layout3DPreview.tsx`

1. **添加 `spaceHeld` state**：监听全局 `keydown`/`keyup`，追踪空格键按下状态

2. **OrbitControls 动态切换鼠标绑定**：
   - 空格未按下时：`LEFT: undefined`（正常选择/拖拽）
   - 空格按下时：`LEFT: THREE.MOUSE.PAN`（左键平移视角）

3. **阻止空格默认行为**：`e.preventDefault()` 防止页面滚动

4. **拖拽冲突处理**：空格按下时，禁止硬件拖拽（DraggableGroup 的 pointer 事件中检查 spaceHeld）

约 15 行修改，1 个文件。

