

# 优化标注交互流程 + 修复闪烁问题

## 问题分析

1. **上传后自动弹出查看入口**：上传完成后应自动进入画布查看模式，而非手动点击
2. **截图按钮位置**：截图按钮已在中间画布工具栏，但右侧面板的截图按钮需移除
3. **标注框可拖动**：当前 AnnotationCanvas 中标注放置后无法拖动位置，需添加拖拽支持
4. **保存时逐个标注**：保存时弹出逐个特征点标注的流程（依次为每个标注填写名称/类型信息）
5. **记录列表闪烁**：`AnnotationRecordsPanel` 每 3 秒轮询时都执行 `setLoading(true)`，导致整个列表被替换为 loading spinner 再恢复，造成闪烁

## 修改方案

### 1. 上传后自动进入画布查看 (ProductAnnotationPanel.tsx)

上传成功后自动调用 `enterViewerMode()`，用户无需手动点击"在画布中查看"按钮：

```text
上传完成 → loadData() → 检测到 asset 有图片/模型 → 自动 enterViewerMode()
```

同时移除右侧面板中的"截图并标注"按钮（截图功能只在中间画布工具栏提供）。

### 2. 标注框拖拽支持 (AnnotationCanvas.tsx)

在 select 工具模式下，允许用户拖拽已有标注到新位置：
- 鼠标按下选中标注时记录偏移量
- 鼠标移动时实时更新标注坐标
- 鼠标释放时确认新位置
- 矩形标注移动整体位置，箭头标注移动起点和终点

### 3. 保存时逐个特征点标注 (AnnotationEditor.tsx)

点击"保存标注"后，如果存在未命名的标注项，弹出逐个编辑流程：
- 显示当前标注序号/总数（如 "1/5"）
- 高亮当前正在编辑的标注
- 填写名称、类型、说明后点"下一个"
- 全部完成后统一保存到数据库

### 4. 修复记录列表闪烁 (AnnotationRecordsPanel.tsx)

根本原因：每 3 秒轮询调用 `loadRecords()`，每次都 `setLoading(true)` 导致 UI 闪烁。

修复方案：
- 仅首次加载时显示 loading spinner
- 后续轮询静默更新数据，不触发 loading 状态
- 使用 `useRef` 标记是否为首次加载

## 涉及文件

| 文件 | 操作 |
|------|------|
| src/components/product/ProductAnnotationPanel.tsx | 上传后自动进入画布查看；移除截图按钮 |
| src/components/product/ModuleAnnotationPanel.tsx | 同上 |
| src/components/product/AnnotationCanvas.tsx | 添加标注拖拽功能 |
| src/components/canvas/AnnotationEditor.tsx | 保存时逐个特征点标注流程 |
| src/components/forms/AnnotationRecordsPanel.tsx | 修复轮询闪烁问题 |

## 技术细节

### AnnotationCanvas 拖拽实现

```typescript
// 新增状态
const [dragging, setDragging] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);

// select 模式下 mouseDown 时：
if (tool === 'select' && clicked) {
  setDragging({
    id: clicked.id,
    offsetX: coords.x - clicked.x,
    offsetY: coords.y - clicked.y,
  });
}

// mouseMove 时更新位置：
if (dragging) {
  const newX = coords.x - dragging.offsetX;
  const newY = coords.y - dragging.offsetY;
  onChange(annotations.map(a =>
    a.id === dragging.id
      ? { ...a, x: newX, y: newY,
          endX: a.endX !== undefined ? newX + ((a.endX - a.x)) : undefined,
          endY: a.endY !== undefined ? newY + ((a.endY - a.y)) : undefined }
      : a
  ));
}

// mouseUp 时结束拖拽：
setDragging(null);
```

### AnnotationEditor 逐个标注流程

```typescript
// 保存按钮点击后检查未命名标注
const unnamedAnnotations = annotations.filter(a => !a.name);

if (unnamedAnnotations.length > 0) {
  // 进入逐个编辑模式
  setSequentialEditMode(true);
  setCurrentEditIndex(0);
} else {
  // 全部已命名，直接保存
  setSaveDialogOpen(true);
}
```

逐个编辑界面显示在画布底部或作为浮动面板：
- 画布上高亮当前编辑的标注（闪烁边框）
- 右侧显示编辑表单（名称、类型、说明）
- "上一个" / "下一个" / "完成" 按钮

### 闪烁修复

```typescript
const isInitialLoad = useRef(true);

const loadRecords = useCallback(async () => {
  if (!annotationAssetId || !user) return;
  // 仅首次加载显示 loading
  if (isInitialLoad.current) {
    setLoading(true);
  }
  try {
    const { data, error } = await supabase...
    // 更新数据
    setRecords(mapped);
  } finally {
    setLoading(false);
    isInitialLoad.current = false;
  }
}, [...]);
```

