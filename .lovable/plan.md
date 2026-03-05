

# 统一 PPT 内页背景（排除封面）

## 参考图分析

上传的图片（image-97）显示内页标准背景模板：
1. **深蓝色页眉条** — 顶部全宽，高约 0.45"
2. **蓝色副标题线** — 紧接页眉下方，高约 0.02"（细线）
3. **内容区域深色边框** — 在白色内容区四周有一个深蓝色细线矩形边框（约 0.5pt），形成一个"画框"效果，大约从 x: 0.3, y: 0.55 到 x: 9.7, y: 5.35
4. **底部细线** — 页脚分隔线

## 当前差异

当前母版（`MASTER_SLIDE`）缺少**内容区域的矩形边框**。页眉和页脚线已有，但没有围绕内容区的"画框"轮廓线。

## 修改方案

### 文件：`src/services/pptxGenerator.ts`（约第 682-693 行）

在 `masterObjects` 数组中添加一个**内容区域边框矩形**（无填充，仅描边）：

```typescript
masterObjects.push(
  // 现有的 header bar、footer bar、footer line...
  
  // 内容区域边框 — 深蓝色细线矩形（与参考图一致）
  { rect: { 
    x: 0.25, y: 0.52, 
    w: SLIDE_LAYOUT.width - 0.5,  // 9.5"
    h: footerY - 0.57,            // ≈4.83"
    fill: { type: 'none' },       // 透明填充
    line: { color: activeColors.primary, width: 0.75 },
  }},
);
```

这样所有使用 `MASTER_SLIDE` 的内页自动获得统一的边框背景，封面页（`addSlide()` 无 masterName）不受影响。

