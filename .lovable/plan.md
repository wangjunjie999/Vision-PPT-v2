

# 让相机在 3D 画布中显示 GLB 模型

## 当前问题

代码已经实现了相机 GLB 渲染逻辑（`CameraObject` 组件会检查 `model3dUrl`），但数据流中有一个断点：

`HardwareConfigPanel.tsx` 第 472 行的 `notifyParent` 函数在向父组件传递选中的相机数据时，只保留了 `id`、`brand`、`model`、`image_url` 四个字段，**丢弃了 `model_3d_url`**。

```text
数据流:
  DB cameras 表 (有 model_3d_url)
    → HardwareSelectionDialog (select * 获取全部字段 ✅)
      → handleSelect (用 ...item 保留了全部字段 ✅)
        → notifyParent (❌ 只传 id/brand/model/image_url, model_3d_url 丢失)
          → WorkstationForm → 写入 layout.selected_cameras (无 model_3d_url)
            → DraggableLayoutCanvas.addCamera (读 model_3d_url → null)
              → LayoutObject.model3dUrl = null → 3D 用程序化几何体
```

## 修复方案

### 1. `src/components/hardware/HardwareConfigPanel.tsx`

- `HardwareItemData` 接口添加 `model_3d_url?: string | null`
- `notifyParent` 函数中为 cameras 的 map 添加 `model_3d_url: c.model_3d_url`，确保该字段透传到父组件

### 2. 使用步骤

修复后，完整流程为：

1. **管理中心** → 硬件资源管理 → 相机管理 → 编辑某个相机 → 上传 GLB 3D 模型文件
2. **工位配置** → 硬件选配面板 → 选择已上传 GLB 的相机
3. **布局画布** → 点击"添加相机"按钮，相机会带上 `model3dUrl`
4. **切换到 3D 预览** → 可以看到自定义的 GLB 模型替代默认方块

改动量：约 3 行代码。

