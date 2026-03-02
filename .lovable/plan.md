
# PPT 生成历史记录与管理功能

## 概述

为生成的文档（PPT/Word/PDF）添加持久化存储，用户可以查看历史生成记录、下载以前的版本、删除不需要的记录。

## 数据库设计

创建新表 `generated_documents`:

| 列名 | 类型 | 说明 |
|------|------|------|
| id | uuid | 主键 |
| project_id | uuid | 关联项目 |
| user_id | uuid | 创建者 |
| file_url | text | Storage 中的文件路径 |
| file_name | text | 文件名（如 DB260101_XXX_方案.pptx）|
| file_size | integer | 文件大小（字节）|
| format | text | 输出格式：ppt / word / pdf |
| generation_method | text | 生成方式：scratch / template |
| template_id | text | 使用的模板ID（可空）|
| page_count | integer | 页数 |
| metadata | jsonb | 生成配置（语言、质量、范围等）|
| created_at | timestamptz | 生成时间 |

RLS 策略：用户只能查看/删除自己的记录。

## 存储桶

创建 `generated-documents` 存储桶（公开），用于存放生成的文件。

## 前端改动

### 1. PPTGenerationDialog.tsx -- 生成后自动保存

在 `handleGenerate` 完成后（`setStage('complete')` 之前），将生成的 Blob 上传到 Storage，并在 `generated_documents` 表中插入一条记录。上传路径格式：`{user_id}/{project_id}/{timestamp}_{filename}`。

### 2. 新增 GenerationHistoryDialog 组件

- 入口放在 ProjectDashboard 的"快捷操作"区域，新增一个"生成历史"按钮
- 对话框内展示当前项目的历史生成记录列表
- 每条记录显示：文件名、格式图标（PPT/Word/PDF）、生成时间、文件大小、页数
- 操作按钮：下载、删除
- 删除时弹出确认对话框（复用 DeleteConfirmDialog）
- 按时间倒序排列
- 空状态提示"暂无生成记录"

### 3. ProjectDashboard.tsx -- 添加入口

在快捷操作区域新增"生成历史"按钮（History 图标），点击打开 GenerationHistoryDialog。

## 技术细节

### 上传流程（在 PPTGenerationDialog 的 handleGenerate 中）

```text
生成完成 -> 上传 Blob 到 Storage -> 插入 generated_documents 记录 -> 显示完成状态
```

上传失败不阻断用户下载（仍保留 blob 在内存中），仅 toast 提示"历史记录保存失败"。

### 查询与删除

- 查询：`supabase.from('generated_documents').select('*').eq('project_id', projectId).order('created_at', { ascending: false })`
- 删除：先删 Storage 文件，再删数据库记录

## 涉及文件

| 文件 | 操作 |
|------|------|
| 数据库迁移 | 新建 `generated_documents` 表 + RLS + `generated-documents` 存储桶 |
| src/components/dialogs/GenerationHistoryDialog.tsx | 新建，历史记录列表UI |
| src/components/dialogs/PPTGenerationDialog.tsx | 修改，生成完成后上传并保存记录 |
| src/components/canvas/ProjectDashboard.tsx | 修改，添加"生成历史"按钮入口 |

## 实施步骤

1. 创建数据库表 `generated_documents` 和存储桶 `generated-documents`，配置 RLS
2. 修改 `PPTGenerationDialog.tsx`，在生成完成后上传文件到 Storage 并插入记录
3. 新建 `GenerationHistoryDialog.tsx`，展示历史记录列表，支持下载和删除
4. 在 `ProjectDashboard.tsx` 添加"生成历史"按钮入口
