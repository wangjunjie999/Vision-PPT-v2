

# 截图标注界面 -- 中间画布区域展示

## 概述

点击"截图并标注"按钮后，中间画布区域切换为标注编辑界面（替换当前布局图），右侧面板显示标注记录列表。完成标注后可返回布局图视图。

## 交互流程

```text
当前状态:  [项目树] | [布局图画布] | [表单面板(含产品3D)]
                              |
           点击 "截图并标注" 按钮
                              |
标注状态:  [项目树] | [标注画布(大画面)] | [表单面板(标注记录列表)]
                              |
           点击 "完成/返回" 按钮
                              |
恢复状态:  [项目树] | [布局图画布] | [表单面板(含产品3D)]
```

## 修改方案

### 1. 全局状态 -- 新增标注模式标志

在 `useAppStore` (Zustand store) 中添加：
- `annotationMode: boolean` -- 是否处于标注模式
- `annotationSnapshot: string | null` -- 截图数据 URL
- `annotationAssetId: string | null` -- 关联的产品素材 ID
- `annotationScope: 'workstation' | 'module'` -- 标注作用域
- `enterAnnotationMode(snapshot, assetId, scope)` -- 进入标注
- `exitAnnotationMode()` -- 退出标注

### 2. 中间画布区域 -- 标注编辑视图

修改 `CanvasArea.tsx`，当 `annotationMode === true` 时渲染全尺寸 `AnnotationCanvas`：
- 顶部工具栏：标注工具（点/矩形/箭头/文本/编号）+ 返回按钮 + 保存按钮
- 中间区域：`AnnotationCanvas` 组件充满画布，利用更大的操作空间
- 底部状态栏：当前标注数量、提示信息

### 3. 右侧面板 -- 标注记录列表

修改 `FormPanel.tsx`，当 `annotationMode === true` 时渲染标注记录面板：
- 显示已保存的标注记录列表（缩略图 + 版本号 + 时间）
- 支持查看、设为默认、删除等操作
- 保存成功后自动刷新列表

### 4. 触发入口

在 `ProductAnnotationPanel` 和 `ModuleAnnotationPanel` 中，"截图并标注"按钮改为调用 `enterAnnotationMode()`，将截图数据传入全局状态，不再在右侧面板内切换 Tab。

### 5. 新建组件

| 组件 | 用途 |
|------|------|
| `src/components/canvas/AnnotationEditor.tsx` | 中间画布区的标注编辑器，包装 AnnotationCanvas + 工具栏 + 保存逻辑 |
| `src/components/forms/AnnotationRecordsPanel.tsx` | 右侧面板的标注记录列表 |

## 技术细节

### Store 变更 (useAppStore.ts)

```typescript
// 新增状态
annotationMode: false,
annotationSnapshot: null as string | null,
annotationAssetId: null as string | null,
annotationScope: 'workstation' as 'workstation' | 'module',

enterAnnotationMode: (snapshot, assetId, scope) => set({
  annotationMode: true,
  annotationSnapshot: snapshot,
  annotationAssetId: assetId,
  annotationScope: scope,
}),

exitAnnotationMode: () => set({
  annotationMode: false,
  annotationSnapshot: null,
  annotationAssetId: null,
}),
```

### CanvasArea.tsx 变更

```typescript
// 新增判断
const { annotationMode } = useAppStore();

if (annotationMode) {
  return <AnnotationEditor />;
}
// ... 原有逻辑
```

### FormPanel.tsx 变更

```typescript
const { annotationMode } = useAppStore();

if (annotationMode) {
  return <AnnotationRecordsPanel />;
}
// ... 原有逻辑
```

### AnnotationEditor 组件

- 全屏利用画布区域渲染 `AnnotationCanvas`（aspect-ratio 改为自适应容器高度）
- 顶部：返回按钮 + 标注工具栏 + 保存按钮
- 保存时上传截图到 storage，创建 product_annotations 记录
- 保存成功后自动退出标注模式

### AnnotationRecordsPanel 组件

- 从 `product_annotations` 表查询当前 asset 的记录
- 以列表/网格形式显示缩略图、版本号、备注、时间
- 支持：查看详情、设为 PPT 默认、删除
- 实时监听保存事件刷新列表

## 涉及文件

| 文件 | 操作 |
|------|------|
| src/store/useAppStore.ts | 新增标注模式状态和方法 |
| src/components/canvas/AnnotationEditor.tsx | 新建 - 画布区标注编辑器 |
| src/components/forms/AnnotationRecordsPanel.tsx | 新建 - 右侧标注记录面板 |
| src/components/layout/CanvasArea.tsx | 修改 - 标注模式分支 |
| src/components/layout/FormPanel.tsx | 修改 - 标注模式分支 |
| src/components/product/ProductAnnotationPanel.tsx | 修改 - 截图按钮调用全局 store |
| src/components/product/ModuleAnnotationPanel.tsx | 修改 - 截图按钮调用全局 store |
| src/components/product/AnnotationCanvas.tsx | 修改 - 移除固定 aspect-ratio，支持自适应容器 |

