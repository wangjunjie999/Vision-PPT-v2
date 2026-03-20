

# 统一 PPT 副标题字体并下移主标题

## 现状

`addSlideTitle` 函数中：
- 主标题（工位编号+名称）：`y: 0.08`，`fontSize: 16`，`fontFace: FONTS.heading`（微软雅黑）
- 副标题（蓝色横条上的白字）：`y: 0.52`，`fontSize: 16`，`fontFace: FONTS.heading`（微软雅黑）

字体和大小已统一为微软雅黑 16pt。需要调整的是主标题的 Y 位置往下移 3 个字符高度。

## 修改方案

**文件：`src/services/pptx/workstationSlides.ts`**

将 `addSlideTitle` 中主标题的 `y: 0.08` 改为 `y: 0.14`（下移约 3 个字符的间距，16pt 字符高 ≈ 0.022 英寸/pt，3 字符 ≈ 0.06 英寸）。

```typescript
// Line 126: y 从 0.08 → 0.14
slide.addText(`${ctx.wsCode} ${ctx.wsName}`, {
  x: 0.4, y: 0.14, w: 7.5, h: 0.38,
  fontSize: 16, fontFace: FONTS.body, color: COLORS.primary,
  bold: false, italic: false,
});
```

同时将所有副标题的 `fontFace` 从 `FONTS.heading` 统一为 `FONTS.body`（两者当前值相同，均为 Microsoft YaHei，但语义上副标题应使用 body 字体以保持一致性）。

| 文件 | 操作 |
|------|------|
| `src/services/pptx/workstationSlides.ts` | 主标题 y: 0.08 → 0.14，确认副标题均为微软雅黑 16pt |

