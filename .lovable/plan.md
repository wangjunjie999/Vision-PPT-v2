

# 为 3D 布局添加 GLB 模型上传功能

## 概述

允许用户为机构上传 `.glb` 3D 模型文件，替换默认的程序化几何体。支持两个层级：
- **机构库级别**：在机构管理中为某类机构上传默认 GLB 模型，所有使用该机构的布局自动生效
- **布局对象级别**：在 3D 预览的属性面板中为单个对象覆盖上传自定义模型

## 数据库迁移

```sql
-- 机构表添加 3D 模型字段
ALTER TABLE public.mechanisms ADD COLUMN model_3d_url text;

-- 创建 3D 模型存储桶
INSERT INTO storage.buckets (id, name, public) VALUES ('3d-models', '3d-models', true);

-- 存储桶 RLS
CREATE POLICY "Authenticated users can upload 3d models"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = '3d-models');

CREATE POLICY "Anyone can view 3d models"
ON storage.objects FOR SELECT TO public
USING (bucket_id = '3d-models');

CREATE POLICY "Authenticated users can delete own 3d models"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = '3d-models' AND auth.uid()::text = (storage.foldername(name))[1]);
```

## 文件改动

### 1. `src/components/canvas/ObjectPropertyPanel.tsx`
- `LayoutObject` 接口新增 `model3dUrl?: string`
- 当选中机构对象时，在属性面板底部添加"3D 模型"区域：上传 GLB 按钮 + 当前模型预览/移除

### 2. `src/components/canvas/Layout3DPreview.tsx`
- 新增 `GLBModel` 组件：使用 `useGLTF` 加载 GLB，自动缩放适配对象尺寸
- 修改 `Mechanism3DModel`（约第 732 行 switch 之前）：
  - 优先检查 `obj.model3dUrl`，有则渲染 `<GLBModel>`
  - 否则走现有 switch-case 程序化模型

### 3. `src/components/canvas/DraggableLayoutCanvas.tsx`
- 在添加机构对象时，从 `mechanisms` 表读取 `model_3d_url`，写入 `LayoutObject.model3dUrl`
- `onUpdateObject` 支持更新 `model3dUrl` 字段

### 4. `src/components/admin/MechanismResourceManager.tsx`
- 在机构编辑表单中添加"3D 模型（GLB）"上传区域
- 上传到 `3d-models` 桶，保存 URL 到 `mechanisms.model_3d_url`

### 5. 新增 `src/utils/glbUpload.ts`
- 封装 GLB 文件上传逻辑：验证文件类型/大小 → 上传到存储桶 → 返回公开 URL
- 复用已有的 `validate3DModelFile` 验证函数

## 技术要点

- 使用 `@react-three/drei` 的 `useGLTF` 加载模型（已安装）
- GLB 模型自动按 `boundingBox` 缩放到对象的 `width/height/depth` 尺寸
- `Suspense` 包裹 GLB 加载，显示 fallback 程序化模型
- 文件大小限制 50MB，仅接受 `.glb` 格式

