

# 3D查看器添加 Space+左键 平移功能

## 问题
当前 Product3DViewer 使用 Shift+左键 平移，与布局编辑器的 Space+左键 不一致。用户希望统一为 Space+左键。

## 方案

**文件：`src/components/product/Product3DViewer.tsx`**

将 `CameraController` 中的按键监听从 `Shift` 改为 `Space`（空格键）：
- `onKeyDown`: 检测 `e.code === 'Space'`，设 `spaceHeld = true`，并 `e.preventDefault()` 防止页面滚动
- `onKeyUp`: 检测 `e.code === 'Space'`，设 `spaceHeld = false`
- `mouseButtons.LEFT`: `spaceHeld ? THREE.MOUSE.PAN : THREE.MOUSE.ROTATE`

同时更新底部操作提示文案：`鼠标拖拽旋转 | 滚轮缩放 | 空格+拖拽平移`（已有类似文案，只需将 "Shift" 改为 "空格"）。

改动约 5 行，仅影响 1 个文件。

