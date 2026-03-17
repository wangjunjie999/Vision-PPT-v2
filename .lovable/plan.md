

# 在变更履历后添加全页图片幻灯片

## 概述

在 PPT 生成流程中，变更履历（Slide 3）之后、工位循环之前，插入一张新的全页图片幻灯片。图片文件为 `4.jpg`，放置在 `public/ppt-covers/` 目录下。

## 改动

### 1. 放置图片文件

将 `4.jpg` 放到 `public/ppt-covers/4.jpg`（与现有的 `tech-shine-bg.png` 等封面资源同目录）。

### 2. 修改 `src/services/pptxGenerator.ts`

在变更履历表生成代码（约第 886 行 `// (Camera installation guide slide removed)` 注释处）之后、工位循环（第 889 行）之前，插入约 15 行代码：

```typescript
// ========== SLIDE 4: Full-page image ==========
const fullImageSlide = pptx.addSlide({ masterName: undefined });
// 预加载图片
const slide4ImageUrl = `${window.location.origin}/ppt-covers/4.jpg`;
const slide4DataUri = await fetchImageAsDataUri(slide4ImageUrl);
if (slide4DataUri) {
  fullImageSlide.addImage({
    data: slide4DataUri,
    x: 0, y: 0,
    w: SLIDE_LAYOUT.width,    // 10 inches
    h: SLIDE_LAYOUT.height,   // 5.625 inches
  });
} else {
  // 图片加载失败时显示占位文字
  fullImageSlide.addText('（图片未找到）', {
    x: 0, y: 0, w: '100%', h: '100%',
    align: 'center', valign: 'middle',
    fontSize: 24, color: COLORS.textSecondary,
  });
}
```

关键点：
- `masterName: undefined` 避免母版元素遮挡全页图片
- 图片尺寸设为整页 10×5.625 英寸，完全覆盖
- 使用已有的 `fetchImageAsDataUri` 函数处理图片加载

### 文件上传位置

请将 `4.jpg` 上传到项目的 `public/ppt-covers/` 目录。

