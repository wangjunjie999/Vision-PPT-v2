

# 修复从等轴测视图保存时截图跳过的问题

## 根因

**`canvasRef.current` 在切换视图之前就被捕获了，导致整个截图逻辑被跳过。**

```typescript
// 第 785 行 — 此时还在 isometric 模式，SVG 元素未渲染
const svg = canvasRef.current;  // → null ❌

// 第 793-798 行 — 之后才切换到 front
if (wasIsometric) {
  setCurrentView('front');
  await new Promise(r => setTimeout(r, 400));
}

// 第 786 行 — svg 是 null，整个 if 块被跳过！
if (svg && layoutId) {
  // 所有 2D 截图 + 等轴测截图逻辑都在这里
  // 从 isometric 开始保存时，这段代码完全不执行
}
```

从 2D 视图保存时 `canvasRef.current` 是有值的（SVG 已渲染），所以一切正常。

## 修复方案

### 文件：`src/components/canvas/DraggableLayoutCanvas.tsx`

将 `canvasRef.current` 的获取移到切换视图**之后**：

```typescript
// 改动区域：约第 785-800 行
const wasIsometric = originalView === 'isometric';
if (wasIsometric) {
  isometricScreenshotFnRef.current = null;
  fitAllFnRef.current = null;
  setCurrentView('front');
  await new Promise(r => setTimeout(r, 400));
}

// 移到这里：切换到 front 后 SVG 已经渲染
const svg = canvasRef.current;
if (svg && layoutId) {
  // ... 截图逻辑
}
```

这是唯一需要改动的地方，约 3 行代码调整。

