

# 相机安装说明页添加文字 + 副标题位置下调

## 两个问题

1. **相机安装说明页缺少文字说明**：参考图中有"如何区分芯片的长短边?"文字和"长边"标注，当前代码只放了两张图片没有文字
2. **副标题位置偏上**：所有页面的副标题 `y: 0.45` 没对齐背景图的蓝色条，需要下调

## 修改方案

### 1. `src/services/pptxGenerator.ts`（第 887-914 行）— 相机安装说明页添加文字

在两张图片之前添加说明文字，按参考图布局：

```typescript
// 说明文字（参考图中"如何区分芯片的长短边?"）
mountGuideSlide.addText(isZh ? '如何区分芯片的长短边?' : 'How to identify the long/short side of the sensor?', {
  x: 0.4, y: 1.0, w: 9, h: 0.3,
  fontSize: 14, color: '333333', bold: true,
});

// 左图下方/旁边标注"长边"
mountGuideSlide.addText(isZh ? '长边' : 'Long side', {
  x: 0.3, y: 3.2, w: 1.0, h: 0.25,
  fontSize: 11, color: '333333',
});

// 右图下方/旁边标注"长边"  
mountGuideSlide.addText(isZh ? '长边' : 'Long side', {
  x: 8.7, y: 3.2, w: 1.0, h: 0.25,
  fontSize: 11, color: '333333',
});
```

图片位置也微调为与参考图一致（两图居中偏上，留出底部空间）：
- 左图 `x: 1.0, y: 1.5, w: 3.5, h: 3.5`
- 右图 `x: 5.5, y: 1.5, w: 3.5, h: 3.5`

### 2. 所有副标题 y 值下调 — 对齐背景图蓝色条

将 `y: 0.45` 调整为 `y: 0.48`（约下移 0.03"），涉及：

- **`src/services/pptxGenerator.ts`**：
  - 第 740-742 行：项目说明副标题
  - 第 830 行：变更履历副标题
  - 第 1063 行：硬件清单副标题

- **`src/services/pptx/workstationSlides.ts`**：
  - 第 130-136 行：split subtitle（左右）
  - 第 140-142 行：single subtitle

所有 `y: 0.45` → `y: 0.48`

