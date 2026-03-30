

# 统一仪表盘圆形进度条颜色

## 问题

项目仪表盘中的圆形进度条颜色不统一：
- 工位数量：**accent（青色）**
- 功能模块：**success（绿色）**
- 布局图：**primary/success（蓝/绿混用）**
- 示意图：**warning/success（橙/绿混用）**
- 配置健康度：**success（绿色）**

截图中可以看到青色和绿色混在一起，视觉上杂乱。

## 修复方案

统一使用 **primary（主色调/精准青色）** 作为所有统计卡片的默认圆环颜色，仅在完成状态时切换为 `success`（绿色），形成清晰的"进行中 → 已完成"视觉语义。

**文件：`src/components/canvas/ProjectDashboard.tsx`**

| 卡片 | 当前 color | 修改后 |
|------|-----------|--------|
| 工位数量 | `accent` | `primary` |
| 功能模块 | `success` | `primary` |
| 布局图 | `primary` / 完成时 `success` | 保持不变（已正确） |
| 示意图 | `warning` / 完成时 `success` | `primary` / 完成时 `success` |

同时统一图标颜色：
- 工位数量图标：`text-accent` → `text-primary`
- 功能模块图标：`text-success` → `text-primary`
- 示意图图标：`text-warning` → `text-primary`

**文件：`src/components/canvas/ConfigHealthCard.tsx`**

配置健康度的 `CircularProgress` 的 `color` 逻辑调整为：
- 健康分 ≥ 80：`success`（绿色 — 表示健康）
- 50-79：`warning`（黄色）
- < 50：`destructive`（红色）

这个逻辑已存在但使用 `as any` 强转，需确认类型正确。

## 效果

所有统计环统一为主色调青色，只有"已完成"状态才变绿色，形成一致的视觉节奏。

