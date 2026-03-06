

# 合并保存流程：布局数据 + 三视图截图一键保存

## 当前情况分析

### 三视图联动（已正常工作）
当前系统使用统一的 3D 坐标系（`posX`, `posY`, `posZ`），在不同视图中拖拽对象时只修改对应的两个轴：
- 正视图拖拽 → 更新 X, Z（Y 不变）
- 侧视图拖拽 → 更新 Y, Z（X 不变）  
- 俯视图拖拽 → 更新 X, Y（Z 不变）

切换视图时会重新投影所有对象（`useEffect` 第 410-415 行），所以**修改一个视图后切换到其他视图，位置会自动同步**。这部分逻辑已经正确实现。

### 保存流程的问题
当前工具栏有两个独立按钮：
1. **「保存布局」** — 只保存对象位置数据到数据库
2. **「保存三视图」** — 只保存三个视图的截图到存储

用户需要点击两次才能完成完整保存，增加了操作步骤。

## 改动方案

**文件**：`src/components/canvas/DraggableLayoutCanvas.tsx`

### 1. 合并为一个「保存」按钮
将 `handleSave`（保存布局数据）和 `saveAllViewSnapshots`（保存截图）合并为一个 `handleSaveAll` 函数：

```typescript
const handleSaveAll = async () => {
  setIsSaving(true);
  setSaveProgress(0);
  try {
    // Step 1: 先保存布局数据
    const updates = {
      layout_objects: objects,
      grid_enabled: gridEnabled,
      snap_enabled: snapEnabled,
      show_distances: showDistances,
    };
    if (layout?.id) {
      await updateLayout(layout.id, updates);
    } else {
      await addLayout({ workstation_id: workstationId, name: workstation?.name || 'Layout', ...updates });
    }
    
    // Step 2: 再保存三视图截图
    // (复用现有 saveAllViewSnapshots 的截图+上传逻辑)
    ...
    
    toast.success('布局和视图已保存');
  } finally {
    setIsSaving(false);
    setSaveProgress(0);
  }
};
```

### 2. 简化工具栏按钮
- 移除单独的「保存布局」和「保存三视图」两个按钮
- 替换为一个「保存」按钮，带进度条显示截图保存进度
- 保留质量选择下拉菜单

### 3. 移除单视图保存功能
`saveCurrentViewSnapshot` 函数不再需要暴露，因为保存操作统一为一次性保存全部。

