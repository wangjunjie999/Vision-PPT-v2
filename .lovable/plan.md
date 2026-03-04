

# 三视图改造为主视图+辅视图 方案

## 概述

将现有的三视图系统（正视图、侧视图、俯视图）改造为**主视图+辅视图**模式。用户选择一个主要视角，再选择一个辅助视角。PPT中按参考图布局：左大右小（主视图占左侧 60%，辅视图占右上，右下为文字描述）。布局图中隐藏相机，只保留执行机构。相机信息通过文字描述区域说明。

## 数据库变更

在 `mechanical_layouts` 表新增 2 个字段：

```sql
ALTER TABLE public.mechanical_layouts 
  ADD COLUMN primary_view text DEFAULT 'front',
  ADD COLUMN auxiliary_view text DEFAULT 'side',
  ADD COLUMN layout_description text DEFAULT '';
```

- `primary_view`: 主视图选择（front/side/top）
- `auxiliary_view`: 辅视图选择（front/side/top）
- `layout_description`: 布局文字说明（用户在工位配置-布局页面编辑）

## 修改文件清单

### 1. `WorkstationForm.tsx` — 布局页面 UI 改造

- 将"布局三视图预览"区域改为**主视图/辅视图选择器**（两个下拉框：主视图、辅视图）
- 在三视图预览下方（红框位置）添加**文字描述 Textarea**，绑定 `layout_description`
- 保存时将 `primary_view`、`auxiliary_view`、`layout_description` 写入 layout
- 表单 state 增加 `primaryView`、`auxiliaryView`、`layoutDescription`

### 2. `LayoutViewsPreview.tsx` — 预览组件改造

- 从显示三张图改为显示两张图（主视图大、辅视图小）
- 读取 layout 的 `primary_view` 和 `auxiliary_view` 字段决定显示哪两个
- 文字描述区域仍然显示 `layout_description`
- 标题从"布局三视图"改为"机械布局视图"

### 3. `ThreeViewLayout.tsx` — 隐藏相机图标

- 在 `assignLabels` 中过滤掉 `type === 'camera'` 的对象（或新增 `hideCameras` prop）
- 移除 connection lines（相机到产品的连线）
- 保留执行机构和产品的完整显示
- 尺寸说明表中仍保留所有对象数据（但相机行可选隐藏）

### 4. `BatchImageSaveButton.tsx` — 批量截图只生成两张

- 从生成三张视图改为只生成用户选择的主视图和辅视图（读取 layout 的 `primary_view` 和 `auxiliary_view`）
- `missingViews` 逻辑改为检查主视图和辅视图对应的 URL 字段

### 5. `workstationSlides.ts` — PPT 三视图页改造

- `generateMechanicalThreeViewSlide` 改为 **主视图+辅视图+文字描述** 布局：
  - 左侧 60%：主视图（大图）
  - 右上 40%：辅视图（小图）
  - 右下 40%：文字描述区域（显示 `layout_description`，包含相机位置信息）
- 标题改为"机械布局"

### 6. `DraggableLayoutCanvas.tsx` — 画布中隐藏相机

- 在三视图渲染时传入 `hideCameras={true}` 参数
- 保留相机在拖拽编辑模式下的完整代码和功能
- 仅在 ThreeViewLayout 渲染时过滤掉相机对象

### 7. 其他文件同步更新

- `reportDataBuilder.ts`: 传递新字段
- `pdfGenerator.ts`: 同步改为主视图+辅视图
- `pptReadiness.ts`: 检查逻辑改为检查主视图和辅视图
- `imagePreloader.ts`: 只预加载主视图和辅视图的 URL

## PPT 页面布局（参考用户上传图）

```text
┌─────────────────────────────────────────────┐
│  TECH-SHINE                    机械布局      │
├──────────────────────┬──────────────────────┤
│                      │                      │
│                      │      辅视图           │
│      主视图           │    (右上, 较小)       │
│    (左侧, 大)        ├──────────────────────┤
│                      │                      │
│                      │    文字描述区域        │
│                      │  (相机位置、安装说明)   │
│                      │                      │
└──────────────────────┴──────────────────────┘
```

## 关键决策

- 相机代码完整保留，仅在 ThreeViewLayout 渲染和截图时隐藏
- 用户在工位配置-布局页面可编辑"布局说明"文本框，描述相机安装角度/位置
- 主视图/辅视图通过下拉框选择，默认主视图=正视图、辅视图=侧视图

