

# 修改二级标题样式：微软雅黑16号、不加粗不斜体、下移3像素

## 当前状态

`src/services/pptx/workstationSlides.ts` 第 125-129 行，`addSlideTitle` 函数中的主标题：

```typescript
slide.addText(`${ctx.wsCode} ${ctx.wsName}`, {
  x: 0.4, y: 0.05, w: 7.5, h: 0.38,
  fontSize: 16, fontFace: FONTS.heading, color: COLORS.primary, bold: true,
  shadow: createHeadingShadow(),
});
```

问题：
- `bold: true` → 需要去掉
- 缺少 `italic: false` 显式声明
- `y: 0.05` → 需要下移约 3px（PPT 中 3px ≈ 0.03 英寸）
- `shadow` → 去掉阴影（不加粗的标题不需要阴影效果）

## 改动

### 文件：`src/services/pptx/workstationSlides.ts`

修改 `addSlideTitle` 函数（第 125-129 行）：

```typescript
slide.addText(`${ctx.wsCode} ${ctx.wsName}`, {
  x: 0.4, y: 0.08, w: 7.5, h: 0.38,        // y: 0.05 → 0.08 (下移约3px)
  fontSize: 16, fontFace: FONTS.heading,      // 微软雅黑16号 (不变)
  color: COLORS.primary,
  bold: false,                                // 不加粗
  italic: false,                              // 不斜体
});
// 移除 shadow: createHeadingShadow()
```

仅改动 1 处，约 5 行。

