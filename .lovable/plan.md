

# 修改标题样式 + 删除副标题背景矩形

## 理解

1. **删除副标题背景矩形** — 所有 `addShape('rect', { y: 0.45, fill: '2E75B6' })` 要去掉，因为背景图 `tech-shine-bg.png` 已自带蓝色副标题条
2. **大标题用主题蓝色** — 将 `color: COLORS.white` 改为 `color: COLORS.primary`（`003D7A`）
3. **小标题文字保留** — 只去掉矩形底色，文字仍然放在 y:0.45 位置（背景图的蓝色条内），颜色保持白色
4. **背景图位置** — 告知用户上传路径

## 背景图存放位置

`public/ppt-covers/tech-shine-bg.png` — 你可以上传更高清的图片替换这个文件。

## 修改文件

### 1. `src/services/pptxGenerator.ts`

**所有大标题**（项目说明、变更履历、相机安装说明、硬件清单）：
- `color: COLORS.white` → `color: COLORS.primary`

**所有副标题矩形**（3处）删除 `addShape('rect')` 调用，保留 `addText` 调用：
- 第 740-744 行：删除项目说明的副标题矩形
- 第 837-841 行：删除变更履历的副标题矩形  
- 第 1074-1078 行：删除硬件清单的副标题矩形

### 2. `src/services/pptx/workstationSlides.ts`

`addSlideTitle` 函数（第 116-157 行）：
- 第 123-126 行：大标题 `color: COLORS.white` → `color: COLORS.primary`
- 第 130-133 行：删除左半副标题矩形
- 第 138-141 行：删除右半副标题矩形
- 第 148-151 行：删除全宽副标题矩形
- 保留所有 `addText` 调用（小标题文字），颜色保持白色

