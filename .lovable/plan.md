

# 修复硬件选中与拖拽交互逻辑

## 问题

当前 `handleMouseDown` 同时执行选中和准备拖拽（记录 `mouseDownPos`），导致首次点击选中后鼠标稍微移动就触发拖拽，松开后因拖拽结束逻辑而"脱离选中"的感觉。

## 修改方案

### 文件：`src/components/canvas/DraggableLayoutCanvas.tsx`

修改 `handleMouseDown`（~L487-500）的逻辑：

1. **首次点击未选中的对象**：仅执行选中（`setSelectedIds`），**不记录** `mouseDownPos`，因此不会触发拖拽
2. **点击已选中的对象**：记录 `mouseDownPos` 和 `dragOffset`，允许拖拽移动
3. 键盘方向键移动已有实现，无需改动

```typescript
const handleMouseDown = useCallback((e: React.MouseEvent, obj: LayoutObject) => {
  if (obj.locked || panMode || isIsometric) return;
  e.stopPropagation();
  
  if (e.shiftKey && selectedId && selectedId !== obj.id) {
    setSelectedIds(prev => prev.includes(obj.id) ? prev : [...prev, obj.id]);
    return;
  }
  
  const alreadySelected = selectedId === obj.id;
  
  if (!alreadySelected) {
    // 首次点击：仅选中，不启动拖拽
    setSelectedIds([obj.id]);
    setShowPropertyPanel(true);
    return;
  }
  
  // 已选中状态下再次按下：准备拖拽
  const pos = screenToSvg(e.clientX, e.clientY);
  mouseDownPos.current = { x: e.clientX, y: e.clientY, objId: obj.id };
  setDragOffset({ x: pos.x - obj.x, y: pos.y - obj.y });
}, [panMode, isIsometric, selectedId, screenToSvg]);
```

共修改 1 个函数（约 8 行），1 个文件。

