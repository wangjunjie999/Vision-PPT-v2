

# 为相机添加 GLB 3D 模型上传功能

## 概述

将已有的机构 GLB 模型上传能力扩展到相机，允许用户在相机管理和布局属性面板中上传自定义 `.glb` 模型替换默认的程序化几何体。

## 数据库迁移

为 `cameras` 表添加 `model_3d_url` 字段：

```sql
ALTER TABLE public.cameras ADD COLUMN model_3d_url text;
```

## 文件改动

### 1. `src/contexts/HardwareContext.tsx`
- `Camera` 接口添加 `model_3d_url: string | null`

### 2. `src/components/canvas/ObjectPropertyPanel.tsx`
- 将 GLB 上传区域的条件从 `object.type === 'mechanism'` 改为 `(object.type === 'mechanism' || object.type === 'camera')`，使相机对象也能在属性面板中上传/替换 GLB 模型

### 3. `src/components/canvas/Layout3DPreview.tsx`
- 修改 `CameraObject` 组件：优先检查 `obj.model3dUrl`，有则用 `GLBModelRenderer` 渲染（已存在），否则走现有程序化模型
- 用 `Suspense` 包裹，fallback 为当前程序化相机模型

### 4. `src/components/canvas/DraggableLayoutCanvas.tsx`
- 添加相机时，从 `selectedCameras` 或硬件数据中读取 `model_3d_url`，写入 `LayoutObject.model3dUrl`

### 5. 相机管理 UI（复用 HardwareResourceManager 或 HardwareDetailView）
- 在相机编辑表单中添加 GLB 上传区域，与机构管理中的实现一致

约 30 行变更，涉及 5 个文件 + 1 条迁移。

