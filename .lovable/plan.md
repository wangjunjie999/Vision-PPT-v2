

# 替换右键旋转为更兼容的交互方式

## 问题
当前 3D 画布（Layout3DPreview + Product3DViewer）使用鼠标右键旋转视角，部分浏览器不支持或会弹出右键菜单导致冲突。

## 方案

将右键旋转改为 **鼠标左键默认旋转**，平移改用 **Shift + 左键拖拽**（替代当前的空格键方案用于 Product3DViewer，Layout3DPreview 保留空格键平移）。

### 具体改动

**`src/components/canvas/Layout3DPreview.tsx`** — CameraController 组件：
- `RIGHT: THREE.MOUSE.ROTATE` → 移除右键绑定
- 改为：左键默认旋转（非拖拽硬件时），空格+左键平移（已有逻辑保留）
- 当前逻辑：`LEFT: spaceHeld ? PAN : undefined`，`RIGHT: ROTATE`
- 新逻辑：`LEFT: spaceHeld ? PAN : ROTATE`，`RIGHT: undefined`
- 这样在编辑模式下：点击硬件=选中/拖拽，点击空白=旋转，空格+拖拽=平移

但这会与硬件拖拽冲突——当前左键在非 spaceHeld 时设为 undefined 是为了让硬件拖拽优先。需要调整为：
- 编辑模式且有选中硬件时：左键由硬件拖拽接管（OrbitControls disabled during drag）
- 其他情况：左键旋转

实际上当前 `enabled={!isDragging}` 已经处理了这个问题。只需把 `LEFT: undefined` 改为 `LEFT: THREE.MOUSE.ROTATE` 即可，因为拖拽时 OrbitControls 已被禁用。

- 修改 mouseButtons: `{ LEFT: spaceHeld ? THREE.MOUSE.PAN : THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: undefined as any }`

**`src/components/product/Product3DViewer.tsx`** — CameraController 组件：
- 默认 OrbitControls 就是左键旋转、右键平移，需要改为左键旋转、中键缩放、Shift+左键平移
- 添加 mouseButtons 配置：`{ LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: undefined }`
- 添加键盘修饰符：按住 Shift 时切换为平移模式（通过 state + keydown 监听）
- 更新提示文字：`鼠标拖拽旋转 | 滚轮缩放 | 右键平移` → `鼠标拖拽旋转 | 滚轮缩放 | Shift+拖拽平移`

### 修改文件

| 文件 | 操作 |
|------|------|
| `src/components/canvas/Layout3DPreview.tsx` | 修改 mouseButtons，左键旋转替代右键 |
| `src/components/product/Product3DViewer.tsx` | 添加 mouseButtons 配置 + Shift 平移 + 更新提示文字 |

