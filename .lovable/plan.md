

# 修复相机安装方向说明页在PPT编辑模式不显示的问题

## 原因

`pptxGenerator.ts` 第 912-927 行，相机照片使用了 `sizing: { type: 'contain', w: 3.5, h: 3.5 }` 属性。这个属性在部分 PPT 客户端（WPS、旧版 PowerPoint）中仅在放映模式下渲染，编辑模式显示空白。

## 修复方案

**文件：`src/services/pptxGenerator.ts`（第 912-927 行）**

移除 `sizing` 属性，直接使用 `w` 和 `h` 设置图片尺寸。图片会被拉伸到指定区域，但因为是正方形区域放正方形照片，视觉效果基本一致。

```typescript
// Before
mountGuideSlide.addImage({
  data: frontPhoto,
  x: 1.0, y: 1.5, w: 3.5, h: 3.5,
  sizing: { type: 'contain', w: 3.5, h: 3.5 },  // ← 问题所在
});

// After
mountGuideSlide.addImage({
  data: frontPhoto,
  x: 1.0, y: 1.5, w: 3.5, h: 3.5,
  // 不使用 sizing，直接设置尺寸，确保编辑模式可见
});
```

同样修复 `backPhoto` 的 `sizing` 属性。

改动仅 2 行，删除两个 `sizing` 配置即可。

