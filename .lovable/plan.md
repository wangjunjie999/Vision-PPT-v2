

# 用上传图片替换所有内页母版背景

## 方案

将 `image-98.png` 复制到 `public/ppt-covers/` 目录，然后修改 `src/services/pptxGenerator.ts` 中的母版定义：

1. **删除所有 `masterObjects` 中的绘制元素**（页眉条、页脚条、页脚线、公司名文字、客户名文字、内容边框、Logo）
2. **改为加载 `ppt-covers/tech-shine-bg.png` 作为全屏背景图**，覆盖整个幻灯片（10" × 5.625"）
3. 母版 `background` 改为使用该图片的 dataUri

### 文件：复制资源
- `image-98.png` → `public/ppt-covers/tech-shine-bg.png`

### 文件：`src/services/pptxGenerator.ts`（约第 670-714 行）

替换整个母版构建逻辑：

```typescript
// 加载背景底图
let bgImageData: string | null = null;
const bgUrl = `${window.location.origin}/ppt-covers/tech-shine-bg.png`;
try {
  bgImageData = await fetchImageAsDataUri(bgUrl);
} catch (err) {
  console.warn('Failed to load bg image:', err);
}

pptx.defineSlideMaster({
  title: 'MASTER_SLIDE',
  background: bgImageData 
    ? { data: bgImageData } 
    : { color: activeColors.background },
  objects: [], // 所有页眉页脚元素由底图自带
});
```

删除的内容：页眉矩形、页脚矩形、页脚线、公司名文字、客户名文字、内容边框矩形、Logo 图片加载及添加逻辑。

封面页不受影响（使用独立的 `tech-shine-cover.png`）。

