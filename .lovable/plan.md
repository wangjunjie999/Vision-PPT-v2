

# 删除技术要求页面的"产品示意图"副标题

## 问题

技术要求页面的分栏副标题右侧显示"产品示意图"，用户不需要这几个字。

## 修改方案

### `src/services/pptx/workstationSlides.ts`（第 1151-1155 行）

将分栏副标题改为单一副标题，只保留"技术要求"：

```typescript
// 之前：
addSlideTitle(slide, ctx, '', {
  left: ctx.isZh ? '技术要求' : 'Technical Requirements',
  right: ctx.isZh ? '产品示意图' : 'Product Schematic',
});

// 之后：
addSlideTitle(slide, ctx, ctx.isZh ? '技术要求' : 'Technical Requirements');
```

只改这一处，产品示意图的独立页面（Slide 2）不受影响。

