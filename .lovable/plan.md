

# 主视图/辅视图预览等大显示

## 问题
当前 `LayoutViewsPreview` 中主视图占 2/3（col-span-2），辅视图占 1/3，导致大小不一致。用户要求在 UI 预览中两者等大，大小差异只在 PPT 中体现。

## 修改范围（1个文件）

### `src/components/canvas/LayoutViewsPreview.tsx`

- 将 grid 从 `grid-cols-3` 改为 `grid-cols-2`，移除 `col-span-2`，让两张图等宽等大
- `renderImage` 中移除 `large` 参数差异，统一使用相同的 `aspect-[4/3]`
- PPT 生成逻辑（`workstationSlides.ts`）不变，保持 60/40 的大小差异

