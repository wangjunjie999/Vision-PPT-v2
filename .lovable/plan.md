

# PPT 页眉样式严格对齐参考图

## 参考图分析

三张参考图显示统一的页眉风格：
1. **主页眉栏**：深蓝色全宽条，高度约 0.45"，白色粗体标题左对齐 (x≈0.4)，右侧 TECH-SHINE Logo
2. **副标题栏**：紧接主页眉下方，中蓝色 (`2E75B6`) 全宽条，高度约 0.22"，白色居中文字
   - 图91（变更履历）：副栏文字 "变更表"
   - 图92（相机安装说明）：副栏无文字（纯色装饰条）
   - 图93（工位页）：副栏分为左右两段 "技术要求" | "产品示意图"

## 现状差异

- **变更履历页**：已有副标题栏 ✓
- **相机安装说明页**：无副标题栏 ✗
- **工位子页面**（`addSlideTitle`）：无副标题栏 ✗
- **项目说明页**：无副标题栏 ✗
- **硬件清单页**：无副标题栏 ✗

## 修改方案

### 文件1：`src/services/pptx/workstationSlides.ts`

**修改 `addSlideTitle` 函数**：在主标题下方统一添加中蓝色副标题栏

```typescript
function addSlideTitle(slide, ctx, subtitle: string) {
  // 主标题（白色文字，覆盖在深蓝色母版页眉条上）
  slide.addText(`${ctx.wsCode} ${ctx.wsName}`, {
    x: 0.4, y: 0.05, w: 7.5, h: 0.38,
    fontSize: 16, color: COLORS.white, bold: true,
  });
  // 副标题栏（中蓝色条 + 白色居中文字）
  slide.addShape('rect', {
    x: 0, y: 0.45, w: '100%', h: 0.22,
    fill: { color: '2E75B6' },
  });
  slide.addText(subtitle, {
    x: 0, y: 0.45, w: '100%', h: 0.22,
    fontSize: 10, color: COLORS.white, align: 'center', valign: 'middle',
  });
}
```

同步调整所有工位子页面的内容起始 y 坐标，从当前约 1.1" 下移到约 1.2" 以避免与副标题栏重叠。

### 文件2：`src/services/pptxGenerator.ts`

对以下页面统一添加副标题栏：

1. **项目说明页** (~行764)：主标题 "项目说明"，副栏可用空串或 "项目基本信息"
2. **相机安装说明页** (~行916)：主标题 "相机安装方向说明"，副栏为空装饰条（如图92）
3. **硬件清单汇总页** (~行1132)：添加副栏 "设备清单"

格式统一：
```typescript
// 副标题栏模板（每个页面复用）
slide.addShape('rect', {
  x: 0, y: 0.45, w: '100%', h: 0.22,
  fill: { color: '2E75B6' },
});
slide.addText(subTitle, {
  x: 0, y: 0.45, w: '100%', h: 0.22,
  fontSize: 10, color: COLORS.white, align: 'center', valign: 'middle',
});
```

### 特殊处理：工位基本信息+技术要求页（图93风格）

对 `generateBasicInfoSlide` 或合并页面，副栏改为左右分栏：
- 左半 "技术要求"，右半 "产品示意图"
- 使用两个并列的 shape+text，各占 50% 宽度

## 影响范围

- 所有内页统一增加副标题栏，视觉风格严格一致
- 内容区域 y 坐标统一下移 0.22" 以腾出副栏空间

