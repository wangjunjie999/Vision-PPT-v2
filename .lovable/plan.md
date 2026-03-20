

# 副标题下移 3 像素

## 改动

**文件：`src/services/pptx/workstationSlides.ts`**

`addSlideTitle` 函数中副标题的 `y` 值从 `0.52` 改为 `0.55`（约 3px ≈ 0.03 英寸）。

涉及 3 处：
- Line 134: split subtitle left `y: 0.52` → `y: 0.55`
- Line 139: split subtitle right `y: 0.52` → `y: 0.55`
- Line 146: single subtitle `y: 0.52` → `y: 0.55`

