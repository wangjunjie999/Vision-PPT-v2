

# 更新 PPT 封面背景图片

## 目标

将 PPT 生成的封面页背景替换为用户上传的新图片（德星云智能公司最新封面设计）。

## 修改方案

### 1. 替换封面背景图片文件

将用户上传的图片 `user-uploads://image-55.png` 复制到 `public/ppt-covers/tech-shine-cover.png`，覆盖原有封面图片。

### 2. 无需修改代码

当前 `src/services/pptxGenerator.ts` 第 803 行已经从 `public/ppt-covers/tech-shine-cover.png` 加载封面背景并以全屏 cover 模式显示，逻辑完全不需要改动。替换图片文件后，所有 PPT 生成都会自动使用新封面。

## 涉及文件

| 文件 | 操作 |
|------|------|
| public/ppt-covers/tech-shine-cover.png | 替换为用户上传的新封面图片 |

