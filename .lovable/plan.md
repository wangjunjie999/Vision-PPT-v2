

# 层级设置弹窗内添加保存按钮

## 方案

使用 `localStorage` 按工位ID持久化 `layerOrder`，无需数据库迁移。

### 改动文件：`src/components/canvas/DraggableLayoutCanvas.tsx`

1. **初始化时从 localStorage 读取**：`layerOrder` 的 `useState` 初始值改为从 `localStorage.getItem('layerOrder_' + workstationId)` 读取，不存在则用默认值 `['mechanism', 'product', 'camera']`。

2. **在层级设置 Popover 底部添加保存按钮**：在 "上方的对象会显示在最前面" 提示文字下方，添加一个 `<Button>` 保存按钮，点击后将当前 `layerOrder` 写入 `localStorage`，并显示 toast 提示"层级设置已保存"。

3. **保存按钮样式**：使用 `size="sm"` + `className="w-full mt-2"`，带 Save 图标，与弹窗宽度一致。

