

# 打光照片紧跟光学方案幻灯片

## 问题

当前 `pptxGenerator.ts` 中，光学方案和打光照片分在两个独立循环中生成：
- 循环 d：所有模块的光学方案
- 循环 e：所有模块的打光照片

导致打光照片被集中放在所有光学方案之后，而不是每个模块的光学方案紧跟其打光照片。

## 方案

**文件：`src/services/pptxGenerator.ts`**

将两个循环合并为一个：每个模块先生成光学方案幻灯片，紧接着生成该模块的打光照片幻灯片。

```typescript
// d. 光学方案 × N + 打光照片 (Each module's optical followed by its lighting photos)
for (let mi = 0; mi < wsModules.length; mi++) {
  step++;
  const modName = wsModules[mi].name;
  onProgress(..., `光学方案: ${modName}`);
  await generateModuleOpticalSlide(ctx, slideData, mi);

  // 紧跟该模块的打光照片
  const photos = (wsModules[mi] as any).lighting_photos || [];
  if (photos.length > 0) {
    step++;
    onProgress(..., `打光照片: ${modName}`);
    await generateLightingPhotosSlide(ctx, slideData, mi);
  }
}
```

删除原来的独立循环 e。

| 文件 | 操作 |
|------|------|
| `src/services/pptxGenerator.ts` | 合并光学方案和打光照片循环，~line 1030-1047 |

