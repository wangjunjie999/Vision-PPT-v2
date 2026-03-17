

# 修复产品示意图幻灯片不显示问题

## 根因分析

在 `src/services/pptx/workstationSlides.ts` 第 409-418 行，`generateProductSchematicSlide` 存在一个代码缺陷：

```typescript
try {
  const dataUri = await fetchImageAsDataUri(annotation.snapshot_url);
  if (dataUri) {
    // 添加图片...
  }
  // ❌ 没有 else 分支！当 dataUri 为空字符串时，既不添加图片也不添加占位符
} catch (e) {
  addImagePlaceholder(...);  // 只有抛异常才会走到这里
}
```

`fetchImageAsDataUri` 在加载失败时返回空字符串 `''`（不抛异常），导致 `if (dataUri)` 为 false，但也不触发 catch 块，最终幻灯片上**完全没有内容**——既没有图片也没有占位符提示。

同样的问题也出现在 fallback 路径（第 450-456 行），当 `productAsset.preview_images` 的 URL 加载失败时同样会导致空白页面。

此外，数据库中所有 `product_assets` 的 `preview_images` 字段都是空数组 `[]`，产品图片只通过 `product_annotations.snapshot_url` 路径获取。如果标注数据的 scope/workstation 匹配失败或图片 URL 加载失败，就会出现灰色占位符或空白幻灯片。

## 修复方案

### 文件：`src/services/pptx/workstationSlides.ts`

**修改1**（第 409-418 行）—— 注解图片加载分支补充 else：

```typescript
try {
  const dataUri = await fetchImageAsDataUri(annotation.snapshot_url);
  if (dataUri) {
    const dims = await getImageDimensions(dataUri).catch(() => ({ width: 800, height: 600 }));
    const fit = calculateContainFit(dims.width, dims.height, container);
    slide.addImage({ data: dataUri, x: fit.x, y: fit.y, w: fit.width, h: fit.height });
  } else {
    // 🆕 图片加载返回空时也显示占位符
    console.warn('[PPT] 标注快照加载失败:', annotation.snapshot_url);
    addImagePlaceholder(slide, container, '图片加载失败', '📷');
  }
} catch (e) {
  addImagePlaceholder(slide, container, '待上传产品图片', '📷');
}
```

**修改2**（第 450-456 行）—— fallback 路径同样补充 else：

```typescript
if (dataUri) {
  // ... add image
} else {
  console.warn('[PPT] 产品预览图加载失败:', imageUrl);
  addImagePlaceholder(slide, container, '图片加载失败', '📷');
}
```

**修改3** —— 添加调试日志，在函数入口处记录数据状态：

```typescript
console.log(`[PPT] 产品示意图: annotations=${annotationsList.length}, hasProductAsset=${!!productAsset}, previewImages=${productAsset?.preview_images?.length || 0}`);
```

共约 10 行代码变更，确保所有分支路径都有正确的视觉反馈（图片或占位符），消除空白幻灯片。

