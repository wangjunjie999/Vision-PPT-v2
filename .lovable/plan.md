

# 层级设置改为拖拽调整

## 方案

将层级设置弹窗内的上下箭头按钮替换为拖拽排序功能，使用原生 HTML5 拖拽 API。

### 改动文件：`src/components/canvas/DraggableLayoutCanvas.tsx`

1. **添加拖拽状态**：新增 `draggedLayer` 和 `dragOverLayer` 两个状态，分别记录正在拖拽的层和悬停目标层。

2. **替换 UI**：
   - 移除上下箭头按钮
   - 每个层级项添加拖拽手柄图标 (`GripVertical`)
   - 添加 `draggable="true"` 属性
   - 绑定 `onDragStart`、`onDragOver`、`onDragEnd`、`onDrop` 事件

3. **拖拽逻辑**：
   - `onDragStart`: 设置 `draggedLayer`
   - `onDragOver`: 设置 `dragOverLayer`，显示插入位置指示器
   - `onDrop`: 重新排列 `layerOrder` 数组
   - `onDragEnd`: 清空拖拽状态

4. **视觉反馈**：
   - 拖拽中的项半透明
   - 目标位置显示蓝色高亮条
   - 鼠标样式改为 `grab` / `grabbing`

