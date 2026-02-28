
# 修复截图标注功能 -- 点击按钮后中间画布不切换

## 问题根因

`ProductAnnotationPanel` 中的 `handleTakeScreenshot` 函数依赖 `viewerRef.takeScreenshot()` 返回截图数据，但在以下情况下会静默失败：

1. **图片模式下 `viewerRef` 未正确设置**：`Product3DViewer` 的 `useEffect`（调用 `onReady`）在组件挂载时执行，但图片模式下真正的截图函数是在隐藏 canvas 的 `ref` 回调中设置的，两者时序冲突导致 `screenshotFnRef` 为 null。
2. **CORS 导致 `toDataURL` 失败**：即使 canvas 成功渲染了跨域图片，调用 `canvas.toDataURL()` 会因安全策略抛出异常，但没有 try-catch 捕获。
3. **无错误提示**：`handleTakeScreenshot` 在截图失败时不显示任何提示，用户点击按钮后没有任何反馈。

## 修复方案

### 1. Product3DViewer.tsx -- 修复图片模式截图

**图片模式**（无 3D 模型时）：不再依赖隐藏 canvas 的 `toDataURL`，改为直接返回图片 URL。`AnnotationCanvas` 本身支持加载远程图片 URL，所以不需要转为 data URL。

```text
修改前:
  hidden canvas → drawImage → toDataURL (CORS 失败)

修改后:
  直接返回当前显示的 imageUrl 作为截图数据
  同时移除隐藏的 canvas 元素
```

**3D 模式**：添加 try-catch 包裹 `toDataURL` 调用，防止异常。

### 2. Product3DViewer.tsx -- 修复 onReady 时序

将图片模式下的 `onReady` 调用移到 `useEffect` 中（依赖 `hasModel`, `hasImages`, `currentImageIndex`），确保在组件渲染后正确设置截图函数。

### 3. ProductAnnotationPanel.tsx -- 添加失败提示和回退

在 `handleTakeScreenshot` 中：
- 添加 `viewerRef` 为 null 时的错误提示
- 添加 `takeScreenshot()` 返回 null 时的错误提示
- 添加回退逻辑：如果截图失败但有图片 URL，直接使用图片 URL 进入标注模式

### 4. ModuleAnnotationPanel.tsx -- 同样添加失败处理

与 ProductAnnotationPanel 相同的防护逻辑。

## 涉及文件

| 文件 | 变更 |
|------|------|
| src/components/product/Product3DViewer.tsx | 修复图片模式截图逻辑、修复 onReady 时序、添加 try-catch |
| src/components/product/ProductAnnotationPanel.tsx | 添加截图失败提示和回退逻辑 |
| src/components/product/ModuleAnnotationPanel.tsx | 同上 |

## 技术细节

### Product3DViewer 图片模式修复

```typescript
// 图片模式：useEffect 中设置截图函数
useEffect(() => {
  if (!hasModel && hasImages && onReady) {
    onReady({
      takeScreenshot: () => {
        // 直接返回图片 URL，AnnotationCanvas 可以加载远程图片
        return imageUrls[currentImageIndex] || null;
      },
    });
  }
}, [hasModel, hasImages, currentImageIndex, imageUrls, onReady]);
```

### ProductAnnotationPanel 回退逻辑

```typescript
const handleTakeScreenshot = () => {
  if (!asset) {
    toast.error('请先上传产品素材');
    return;
  }

  let dataUrl: string | null = null;

  // 尝试从 viewerRef 获取截图
  if (viewerRef) {
    try {
      dataUrl = viewerRef.takeScreenshot();
    } catch (e) {
      console.warn('Screenshot failed:', e);
    }
  }

  // 回退：直接使用图片 URL
  if (!dataUrl && asset.preview_images?.length > 0) {
    dataUrl = asset.preview_images[0];
  }

  if (dataUrl) {
    useAppStore.getState().enterAnnotationMode(dataUrl, asset.id, 'workstation');
    toast.success('已进入标注模式');
  } else {
    toast.error('截图失败，请确保已上传素材');
  }
};
```

## 预期效果

- 图片模式下点击"截图并标注"能正确进入标注模式，中间画布切换为标注编辑器
- 3D 模型模式下截图功能正常工作
- 截图失败时有明确的错误提示
- 即使截图函数异常，也能通过回退使用原始图片 URL 进入标注
