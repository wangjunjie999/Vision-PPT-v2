

# PPT 风格调整：白色底色 + 深蓝色调

## 问题

用户反馈：
1. PPT 背景应以白色为主（当前代码已是白色背景，无需改动）
2. 蓝色太浅，需要更深的深蓝色

## 修改方案

### 调整蓝色色值（slideLabels.ts）

将当前的 `#0066CC`（科技正蓝，偏亮）改为更深的深蓝 `#003D7A`，视觉上更沉稳、更有科技感。

```
primary:   '003D7A'  （原 0066CC）
secondary: '003D7A'  （原 0066CC）
accent:    '003D7A'  （原 0066CC）
```

其余颜色保持不变：
- background: FFFFFF（白色底色）
- dark/textPrimary: 000000（纯黑文字）
- textSecondary: 333333（深灰辅助文字）
- border: E6E6E6（浅灰线条）

### 无需修改的部分

- Master slide 已使用白色背景（line 784: `activeColors.background` = FFFFFF）
- 页眉为白色底 + 深蓝细线（符合白色为主的要求）
- 封面页使用独立背景图，不受影响

## 涉及文件

| 文件 | 修改 |
|------|------|
| `src/services/pptx/slideLabels.ts` | 将 primary/secondary/accent 从 `0066CC` 改为 `003D7A` |

