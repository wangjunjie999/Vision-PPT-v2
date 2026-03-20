

# 移除 PPT 机械布局幻灯片中多余的等轴测图

## 问题

当前逻辑：辅视图下方有等轴测 URL 时显示等轴测 3D 图，没有时才显示布局说明。这导致：
1. 如果主视图已选"等轴测"，则等轴测图重复出现两次
2. 布局说明被挤掉不显示

## 方案

**移除右下角的等轴测 3D 图区块**，改为**始终显示布局说明**。等轴测视图已可作为主视图显示，无需单独再放。

### 修改文件

| 文件 | 操作 |
|------|------|
| `src/services/pptx/workstationSlides.ts` | 删除 line 747-763 的等轴测判断分支，保留 else 中的布局说明逻辑作为默认渲染 |

### 具体改动（~line 746-780）

删除 `if (isometricUrl) { ... }` 分支，只保留布局说明区域，且不再用 `else` 包裹：

```typescript
// Right bottom: Layout description (always shown)
slide.addShape('rect', {
  x: 5.9, y: 3.9, w: 3.6, h: 1.2,
  fill: { color: 'F8F9FA' },
  line: { color: COLORS.border, width: 0.5 },
});
slide.addText(ctx.isZh ? '布局说明' : 'Layout Description', {
  x: 6.0, y: 3.95, w: 3.4, h: 0.25,
  fontSize: 10, fontFace: FONTS.body, color: COLORS.primary, bold: true,
});
slide.addText(layoutDescription || (ctx.isZh ? '（未填写布局说明）' : '(No description)'), {
  x: 6.0, y: 4.2, w: 3.4, h: 0.85,
  fontSize: 9, fontFace: FONTS.body, color: layoutDescription ? COLORS.dark : COLORS.secondary,
  valign: 'top',
});
```

同时可移除 `isometricUrl` 变量声明（line 686）。

