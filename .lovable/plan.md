

# 修复 HEADING_SHADOW 被 PptxGenJS 原地修改导致阴影参数指数膨胀

## 根因

PptxGenJS 在处理 `shadow` 对象时会**原地修改**（mutate）其 `blur`/`offset`/`angle`/`opacity` 值，转换为内部单位。由于 `HEADING_SHADOW` 是共享常量对象，每次复用都会在已转换的值上再乘一遍，导致后续幻灯片的阴影参数指数级增长，PowerPoint 编辑模式渲染失败。

## 修复方案

### 文件：`src/services/pptx/slideLabels.ts`

将 `HEADING_SHADOW` 常量改为工厂函数：

```typescript
// 删除:
export const HEADING_SHADOW = { type: 'outer' as const, blur: 3, offset: 2, angle: 45, color: '000000', opacity: 0.4 };

// 替换为:
export const createHeadingShadow = () => ({
  type: 'outer' as const,
  blur: 3,
  offset: 2,
  angle: 45,
  color: '000000',
  opacity: 0.4,
});
```

### 文件：`src/services/pptxGenerator.ts`

- 将 import 从 `HEADING_SHADOW` 改为 `createHeadingShadow`
- 将所有 `shadow: HEADING_SHADOW` (4处) 改为 `shadow: createHeadingShadow()`

### 文件：`src/services/pptx/workstationSlides.ts`

- 将 import 从 `HEADING_SHADOW` 改为 `createHeadingShadow`
- 将所有 `shadow: HEADING_SHADOW` (4处) 改为 `shadow: createHeadingShadow()`

共 3 个文件，约 12 处改动，每次调用都返回全新对象，彻底避免 mutation 问题。

