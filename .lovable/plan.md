

# PPT 字体改版：微软雅黑

## 变更范围

当前所有 PPT 文本使用 `Arial` 字体。需要统一改为：
- **一级标题**（fontSize ≥ 14 的 `addText`）：`fontFace: 'Microsoft YaHei'`，加粗 + 阴影（`shadow` 属性）
- **正文**（表格、说明文字等）：`fontFace: 'Microsoft YaHei'`

## 修改文件

### 1. `src/services/pptx/slideLabels.ts`
新增字体常量，统一引用：
```typescript
export const FONTS = {
  heading: 'Microsoft YaHei',
  body: 'Microsoft YaHei',
};
export const HEADING_SHADOW = {
  type: 'outer', blur: 3, offset: 2, angle: 45, color: '000000', opacity: 0.4,
};
```

### 2. `src/services/pptxGenerator.ts`（25 处）
- 所有 `addText` 的标题类调用（fontSize ≥ 14）加上 `fontFace: FONTS.heading, shadow: HEADING_SHADOW`
- 所有 `addTable` 的 `fontFace: 'Arial'` 改为 `fontFace: FONTS.body`
- 其他正文 `addText` 加上 `fontFace: FONTS.body`

### 3. `src/services/pptx/workstationSlides.ts`（85 处）
- 同上规则：标题用 `FONTS.heading` + shadow，表格和正文用 `FONTS.body`
- 所有 `fontFace: 'Arial'` → `fontFace: FONTS.body`

## 不变项
- 字号、颜色、布局位置不变
- SimpleLayoutDiagram（SVG）不受影响

