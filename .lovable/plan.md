

# 页面风格改进实施计划（除第8点外的9项）

## 需要修改的文件

### 1. `src/index.css` — 暗色模式对比度 + 滚动条 + 表单标题
- **#6 暗色模式对比度**: 将 `--card` 从 `230 22% 10%` 调整为 `230 22% 12%`，`--background` 保持 `230 25% 6%`，拉开 6% 亮度差；同步调整 `--border` 从 `230 20% 18%` 到 `230 20% 20%` 增强边框可见度
- **#7 滚动条**: `.scrollbar-thin::-webkit-scrollbar-thumb` 从 `bg-border` 改为 `bg-muted-foreground/30`，hover 态改为 `bg-muted-foreground/60`
- **#5 表单分区标题**: 已有 `w-1 h-4 bg-xxx rounded-full` 竖条装饰，进一步增强：将竖条宽度从 `w-1` 改为 `w-1.5`，在 CSS 中为 `.form-section-title` 添加底部细线分隔 `border-b border-border/50 pb-2`

### 2. `src/components/ui/button.tsx` — 按钮 hover 分级 (#4)
- 移除 `hover:-translate-y-0.5` 和 `active:scale-[0.97]` 从基础 cva 字符串
- 仅在 `default`、`destructive`、`secondary`、`glow`、`accent`、`premium`、`success` 变体中添加 `hover:-translate-y-0.5 active:scale-[0.97]`
- `ghost`、`link`、`outline` 不添加上浮/缩放效果

### 3. `src/components/layout/TopToolbar.tsx` — 工具栏层次 + 搜索框 (#1, #9)
- **#1**: 为 header 添加 `shadow-sm` 阴影，底部渐变线加粗为 `h-[2px]` 并增强不透明度
- **#9**: 搜索框改为固定宽度 `w-64`，移除 focus 时的宽度变化，避免布局抖动

### 4. `src/components/canvas/EmptyState.tsx` — 空状态增强 (#2)
- 添加引导步骤卡片：3个步骤（创建项目 → 配置工位 → 生成PPT），每个带编号圆圈和简短描述
- 用简洁的 SVG/图标组合替代单一 FolderOpen 图标，添加浅色装饰线条

### 5. `src/components/layout/ProjectTree.tsx` — 层级视觉 + 骨架屏 (#3, #10)
- **#3**: 为 depth 1/2 节点添加左侧竖线连接符（`border-l-2 border-border` 在缩进区域）；不同层级使用不同图标颜色（项目=primary，工位=accent，模块=保持现有颜色映射）
- **#10**: loading 状态从单一 Loader 改为骨架屏：3-4 行 Skeleton 条模拟树节点形状

### 6. `src/components/canvas/ProjectDashboard.tsx` — 骨架屏 (#10)
- 如果有 loading 状态，添加卡片形式的 Skeleton 占位

## 涉及文件总计：6个

