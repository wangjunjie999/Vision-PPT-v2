

# 修复等轴测截图保存不更新的问题

## 根因分析

保存流程中的 Bug：

1. 用户在等轴测视图移动了物体后点击保存
2. 保存函数切换到 `front` 视图来截取 2D 截图 → `Layout3DPreview` **卸载**
3. 但 `isometricScreenshotFnRef.current` **没有被清空**，仍指向已卸载的旧 GL 上下文
4. 切换回 `isometric` 后，轮询检测 `while (!isometricScreenshotFnRef.current)` **立即通过**（因为旧引用非空）
5. 调用 `fitAllFnRef.current?.()` 也是旧引用，无效操作
6. 截图函数使用旧的、已分离的 WebGL 上下文，返回的是旧画面

同样，新挂载的 `Layout3DPreview` 虽然注册了新的截图函数，但因为轮询已经跳过，新函数来不及被使用。

## 修复方案

### 文件：`src/components/canvas/DraggableLayoutCanvas.tsx`

**改动 1 — 切换离开 isometric 时清空 refs（约第 793 行）**

在 `setCurrentView('front')` 之前，手动清空两个 ref：
```typescript
isometricScreenshotFnRef.current = null;
fitAllFnRef.current = null;
```

这样当后续切换回 isometric 时，轮询会正确等待新挂载的 `Layout3DPreview` 注册新的截图函数。

**改动 2 — 增加额外的渲染等待（约第 828-831 行）**

在 `fitAllFnRef.current?.()` 之后，除了已有的 1500ms 等待，再添加一个显式的 `gl.render()` 调用等待。将延迟从 1500ms 增加到 2000ms，确保复杂几何体完全渲染：

```typescript
fitAllFnRef.current?.();
await new Promise(r => setTimeout(r, 2000));
await new Promise(r => requestAnimationFrame(() => 
  requestAnimationFrame(() => 
    requestAnimationFrame(r)
  )
));
```

这两处改动确保截图函数始终指向当前活跃的 3D 场景，且场景在截图前完全渲染。

