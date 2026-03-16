

# 修复第4页（相机安装方向说明）编辑模式布局问题

## 根因分析

第4页的所有元素使用了硬编码坐标，没有使用 `SLIDE_LAYOUT` 常量：

| 元素 | 当前坐标 | 问题 |
|------|----------|------|
| 标题 | `y: 0.05` | 在母版头部区域之上，被背景遮挡 |
| 副标题 | `y: 1.0` | 位置偏高 |
| 左图 | `x: 1.0, y: 1.5, 3.5×3.5` | 图片过大，底部到 y=5.0 几乎触底 |
| 右图 | `x: 5.5, y: 1.5, 3.5×3.5` | 同上 |
| 标注文字 | `y: 3.2` | 与图片重叠 |

幻灯片内容区实际为 `y: 0.55` 到 `y: 5.325`（高度 4.775 英寸）。当前内容从 `y: 0.05` 开始，不在内容区内，导致编辑模式下与母版背景错位。

## 修复方案

### 文件：`src/services/pptxGenerator.ts`（第 891-939 行）

重写第4页坐标，全部基于 `SLIDE_LAYOUT` 常量：

```text
标题:    x: contentLeft, y: contentTop,       使用 addSlideTitle 统一函数
副标题:  x: contentLeft, y: contentTop + 0.5
左图:    x: contentLeft + 0.4, y: contentTop + 0.9, w: 3.8, h: 3.2  (contain sizing)
右图:    x: contentLeft + 4.8, y: contentTop + 0.9, w: 3.8, h: 3.2  (contain sizing)
标注:    调整到图片下方
```

- 图片缩小为 3.8×3.2，给标注文字留空间
- 两张图水平对称居中于 `contentWidth`
- 使用 `addSlideTitle` 统一标题样式（与其他页面一致）

约 20 行修改，仅涉及坐标数值调整。

