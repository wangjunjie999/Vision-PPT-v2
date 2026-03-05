

# 按参考图重建相机安装方向说明页

## 理解

- **image-100.png**：布局参考图，规定两张相机图片在幻灯片上的摆放位置
- **image-101.png**：相机正面照片
- **image-102.png**：相机背面照片

需要删除当前程序化绘制的安装说明（三种卡片 + 汇总表格），替换为按参考图精确摆放两张实物照片的幻灯片。

## 修改方案

### 1. 复制图片资源
- `image-101.png` → `public/ppt-covers/camera-front-photo.png`
- `image-102.png` → `public/ppt-covers/camera-back-photo.png`

### 2. 修改 `src/services/pptxGenerator.ts`（第 891-972 行）

删除整个旧版内容（mountTypes 卡片、汇总表格），替换为：

```typescript
// ========== SLIDE 4: Camera Installation Direction Guide ==========
const mountGuideSlide = pptx.addSlide({ masterName: 'MASTER_SLIDE' });

// 标题
mountGuideSlide.addText(isZh ? '相机安装方向说明' : 'Camera Installation Direction Guide', {
  x: 0.4, y: 0.05, w: 7.5, h: 0.38,
  fontSize: 18, color: COLORS.white, bold: true,
});

// 加载两张相机照片
const [frontPhoto, backPhoto] = await Promise.all([
  fetchImageAsDataUri(`${window.location.origin}/ppt-covers/camera-front-photo.png`),
  fetchImageAsDataUri(`${window.location.origin}/ppt-covers/camera-back-photo.png`),
]);

// 按参考图布局：左右并排放置，居中于内容区
// 左图（正面）
if (frontPhoto) {
  mountGuideSlide.addImage({
    data: frontPhoto,
    x: 0.5, y: 0.8,
    w: 4.3, h: 4.0,
    sizing: { type: 'contain', w: 4.3, h: 4.0 },
  });
}
// 右图（背面）
if (backPhoto) {
  mountGuideSlide.addImage({
    data: backPhoto,
    x: 5.2, y: 0.8,
    w: 4.3, h: 4.0,
    sizing: { type: 'contain', w: 4.3, h: 4.0 },
  });
}
```

位置参数（x/y/w/h）按参考图的左右对称布局设置，两张图片等宽并排，位于内容区域中央。具体数值可能需要根据参考图微调。

幻灯片位置不变：变更履历之后、工位循环之前。

