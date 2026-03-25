

# 修复等轴测截图 + 移除画布 GLB 导出按钮

## 问题

1. **等轴测截图不正确**：点击"保存"后，切换到 isometric 视图等待 600ms 后截图，但新的高保真机械臂模型渲染时间更长（可能需要 1-2 秒），导致截图时模型尚未完全加载
2. **GLB 导出按钮位置不对**：画布底部的"下载 GLB / 上传到存储"按钮应该移除，GLB 上传功能已在对象属性面板（`ObjectPropertyPanel`）中通过 `GLBUploadField` 提供

## 修改

### 1. `src/components/canvas/DraggableLayoutCanvas.tsx` — 增加等轴测截图等待时间

- 将 fitAll 后的等待时间从 600ms 增加到 1500ms，确保 3D 模型完全渲染
- 增加一个额外的渲染帧等待：在截图前执行两次 `requestAnimationFrame` 等效延迟
- 移除 `RobotArmGLBExporter` 相关 import（如果仅在 Layout3DPreview 中使用）

### 2. `src/components/canvas/Layout3DPreview.tsx` — 移除画布中的 GLB 导出按钮

- 删除 `import RobotArmGLBExporter` (第 6 行)
- 删除第 2535-2545 行的 robot arm GLB export 区块（条件渲染 `RobotArmGLBExporter` 的部分）
- 移除未使用的 `Download` 图标导入

### 3. 不变的部分

- `ObjectPropertyPanel` 中的 `GLBUploadField` 组件保持不变（用户通过点击机构详情面板上传 GLB）
- `RobotArmGLBExporter.tsx` 文件保留，以备将来其他地方引用

## 涉及文件

| 文件 | 操作 |
|------|------|
| `src/components/canvas/Layout3DPreview.tsx` | 移除 RobotArmGLBExporter 导入和渲染 |
| `src/components/canvas/DraggableLayoutCanvas.tsx` | 增加等轴测截图等待时间 |

