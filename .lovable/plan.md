

# 统一表单填写内容风格

## 现状问题

经过全面审查，各表单在以下方面存在不一致：

| 维度 | ProjectForm | WorkstationForm / ModuleStep | DefectForm 等子表单 | Dialog 表单 |
|------|-------------|------------------------------|---------------------|-------------|
| Label 间距 | `space-y-1.5` | `space-y-1` | 混用 `space-y-3` | `space-y-2` |
| Label 大小 | `text-xs` | `text-xs` | `text-sm font-medium` | 无统一 class |
| 必填标记 | `*` 纯文本 | `*` 纯文本 | `<span className="text-destructive">` | `<span className="text-destructive">*</span>` |
| Input 高度 | `className="h-9"` | `className="h-9"` | 有的有 `h-9`，有的默认 `h-10` | 默认 `h-10` |
| Section 标题 | `form-section-title` + 彩色圆点 | 用 `h4` + `text-xs font-semibold` | `form-section-title` + 彩色圆点 | 无 section 概念 |
| 字段容器间距 | `space-y-4` | `space-y-4` | 混用 `space-y-3` / `space-y-4` | `space-y-4` |

## 统一规范

确定以下统一标准，应用到所有表单：

- **Label**: 统一 `text-xs font-medium`，与字段间距 `space-y-1.5`
- **必填标记**: 统一 `<span className="text-destructive ml-0.5">*</span>`
- **Input 高度**: 统一 `h-9`（紧凑适合侧面板）
- **字段间距**: 统一 `space-y-4`（字段组之间）
- **Grid 间距**: 统一 `gap-3`
- **Section 子标题**: 在 Step 内部的子标题统一用 `text-xs font-semibold text-muted-foreground uppercase tracking-wide`（不再用 `form-section-title`，因为 Step 内不需要重复边框和大标题样式）

## 改动文件

### 1. `src/components/forms/module/ModuleStep1Basic.tsx`
- Label 间距从 `space-y-1` 改为 `space-y-1.5`

### 2. `src/components/forms/module/DefectForm.tsx`
- Label `text-sm font-medium` → `text-xs font-medium`
- 子标题 Label 统一为 `text-xs font-medium`
- 间距 `space-y-3` → `space-y-4`（与其他表单一致）

### 3. `src/components/forms/module/ModuleStep3Imaging.tsx`
- 确认已统一的 `space-y-1` → `space-y-1.5`

### 4. `src/components/forms/module/PositioningForm.tsx`、`OCRForm.tsx`、`MeasurementForm.tsx`、`DeepLearningForm.tsx`
- 同样统一 Label 大小和间距规范

### 5. `src/components/forms/WorkstationForm.tsx`
- Step 内字段容器 `space-y-1` → `space-y-1.5`

### 6. `src/components/forms/ProjectForm.tsx`
- 已基本符合规范，微调必填标记格式统一

### 7. Dialog 表单（`NewProjectDialog.tsx`、`NewWorkstationDialog.tsx`、`NewModuleDialog.tsx`）
- Label 统一加 `text-xs font-medium`
- Input 统一加 `className="h-9"`
- 必填标记统一格式
- 字段间距从 `space-y-2` 改为 `space-y-1.5`

所有改动仅涉及 className 微调，不影响逻辑和数据流。

