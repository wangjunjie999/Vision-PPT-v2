

# 修复等轴测截图功能

## 问题根因

`ScreenshotHelper` 中的 `gl.render(gl.domElement, gl.domElement)` 调用错误——传入的是 DOM 元素而非 Three.js 的 `scene` 和 `camera` 对象，导致渲染帧未正确刷新，`toDataURL()` 返回空白或旧画面。

## 改动

### 文件：`src/components/canvas/Layout3DPreview.tsx`（第 20-33 行）

修复 `ScreenshotHelper`，从 `useThree()` 获取 `scene` 和 `camera`，在截图前正确执行一次渲染：

```typescript
function ScreenshotHelper({ onScreenshotReady }: { onScreenshotReady: (fn: () => string | null) => void }) {
  const { gl, scene, camera } = useThree();
  useEffect(() => {
    onScreenshotReady(() => {
      try {
        gl.render(scene, camera);
        return gl.domElement.toDataURL('image/png');
      } catch {
        return null;
      }
    });
  }, [gl, scene, camera, onScreenshotReady]);
  return null;
}
```

单文件修改，约 5 行变更。

