

## 修复构建错误 + 光学方案图增强

### 第一部分：修复构建错误（必须先做）

**1. 修复 4 个 Edge Function 的 `'error' is of type 'unknown'` 错误**

在以下文件的 catch 块中，将 `error.message` / `err.message` 改为 `(error as Error).message`：
- `supabase/functions/admin-users/index.ts` (line 101)
- `supabase/functions/extract-template-styles/index.ts` (line 76)
- `supabase/functions/generate-test-images/index.ts` (line 332)
- `supabase/functions/verify-admin-password/index.ts` (line 69)

**2. 修复测试文件缺少 vitest 导入**

- `src/components/canvas/AnnotationEditor.test.tsx` — 添加 `import { vi, describe, it, expect, beforeEach } from 'vitest'`
- `src/components/canvas/ProductViewerCanvas.test.tsx` — 同上

**3. 修复 `ProductAnnotationPanel.tsx` 的类型转换错误**

将 `latestAsset as ProductAsset` 改为正确的类型断言（根据 Supabase 返回类型适配 `ProductAsset` 接口）。

### 第二部分：光学方案图功能增强

**需求拆解：**

1. **硬件数模（正视图/俯视图）** — 相机和镜头在数据库中添加 `front_view_url` 字段；光源因需区分角度，添加 `front_view_url` 和 `top_view_url` 两个字段。在 VisionSystemDiagram 中用上传的真实图片替代当前的 SVG 矢量图。

2. **拖拽移动** — 相机+镜头组合和光源均可在 SVG 画布内自由拖拽（不限上下），使用 SVG pointer events 实现。

3. **数据随移动更新** — 工作距离（镜头到产品距离）、视野宽度等数据根据硬件实际位置实时计算并显示。

4. **虚线跟随移动** — FOV 锥体线、工作距离标注线、到右侧面板的连接虚线都跟随硬件位置动态更新。

5. **所有硬件可旋转** — 每个硬件元素增加旋转控制（如拖拽旋转手柄或属性面板中的角度输入）。

**具体改动：**

**数据库迁移** — 为 `cameras`、`lenses`、`lights` 表添加视图字段：
```sql
ALTER TABLE cameras ADD COLUMN front_view_url text;
ALTER TABLE lenses ADD COLUMN front_view_url text;
ALTER TABLE lights ADD COLUMN front_view_url text;
ALTER TABLE lights ADD COLUMN top_view_url text;
```

**`src/contexts/HardwareContext.tsx`** — Camera/Lens/Light 类型增加新字段。

**`src/components/canvas/VisionSystemDiagram.tsx`** — 重写为交互式版本：
- 将相机+镜头位置、光源位置存为 state（`{ x, y, rotation }`）
- 实现 SVG `onPointerDown/Move/Up` 拖拽逻辑
- FOV 锥体起点跟随镜头位置
- 工作距离 = 产品 y 坐标 - 镜头底部 y 坐标（按比例换算 mm）
- 视野宽度 = 2 * tan(fovAngle/2) * 工作距离
- 虚线从各硬件中心连到右侧面板对应卡片
- 每个硬件增加旋转手柄或 `transform="rotate(angle, cx, cy)"`
- 硬件显示优先用上传的 `front_view_url` 图片（通过 `<image>` SVG 标签），fallback 到当前的 SVG 矢量图

**`src/components/admin/HardwareResourceManager.tsx`** — 在硬件编辑表单中增加正视图/俯视图上传区域（光源需要两个上传位：正视图和俯视图）。

**`src/components/canvas/ModuleSchematic.tsx`** — 适配 VisionSystemDiagram 新的位置/旋转状态传递。

### 改动范围

- 4 个 Edge Function（构建错误修复）
- 2 个测试文件（vitest 导入）
- 1 个 ProductAnnotationPanel（类型修复）
- 1 次数据库迁移（4 个新字段）
- HardwareContext（类型更新）
- VisionSystemDiagram（核心重写 — 拖拽+旋转+实时数据）
- HardwareResourceManager（视图图片上传 UI）
- ModuleSchematic（适配新接口）

