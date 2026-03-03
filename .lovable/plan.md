

# 修复 PPT 图片预览对话框

## 修改内容

### `src/components/dialogs/PPTImagePreviewDialog.tsx`

两项改动：

1. **滚动功能修复**：当前 `ScrollArea` 在 `flex-1` 容器内，但 `DialogContent` 使用 `max-h-[85vh]`，需要确保 ScrollArea 有明确高度约束。给 ScrollArea 设置 `className="h-[60vh]"` 替代 `flex-1`，确保内容可滚动。

2. **添加产品标注截图**：
   - 从 DataContext 获取当前项目的 `product_annotations` 数据（通过 supabase 直接查询，因为 DataContext 中没有现成的 annotations 数据）
   - 或者更简单：直接在组件中用 supabase 查询 `product_assets` 和 `product_annotations`
   - 在每个工位分组下，增加"产品标注截图"区域，显示该工位关联的 annotations 的 `snapshot_url`

**数据获取方式**：
- 使用 `useEffect` + supabase 查询 `product_assets`（按 project_id）和 `product_annotations`（按 asset_id）
- 按 workstation_id 分组，在每个工位的模块光学方案图下方添加"产品标注截图"栏

**UI 结构**（每个工位下）：
```
三视图: [正视图] [侧视图] [俯视图]
模块光学方案图: [模块1] [模块2] ...
产品标注截图: [标注1] [标注2] ...   ← 新增
```

### 涉及文件

| 文件 | 修改 |
|------|------|
| `src/components/dialogs/PPTImagePreviewDialog.tsx` | 修复滚动 + 添加产品标注截图区域 |

