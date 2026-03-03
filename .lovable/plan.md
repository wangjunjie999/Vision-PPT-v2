
# 网页流畅度优化方案

## 性能瓶颈分析

经过代码审查，发现以下几个主要性能问题：

### 1. CSS `backdrop-blur` 滥用（最大性能杀手）
- `MainLayout.tsx` 中左右面板和工具栏都使用了 `backdrop-blur-md`，这是一个非常昂贵的 CSS 滤镜
- 每一帧浏览器都需要对模糊区域下方的所有像素做高斯模糊计算
- 共有 **16 个文件**、**120 处** 使用了 `backdrop-blur`，多层叠加时性能急剧下降

### 2. `blur-3xl` 装饰性渐变球
- `MainLayout.tsx` 桌面端有 3 个巨大的 `blur-3xl` 渐变球（最大 96x96rem），平板端也有 3 个
- `blur-3xl` 对应 64px 的模糊半径，在大元素上非常耗 GPU

### 3. Framer Motion 动画过度使用
- 左右面板、中间画布区域都包裹在 `motion.div` 中，但这些动画只在首次加载时播放一次
- `AnimatePresence mode="wait"` 在管理面板和主面板之间切换时会阻塞渲染
- 面板 motion 组件持续监听状态变化，产生不必要的开销

### 4. CSS 网格叠加层
- `MainLayout.tsx` 第 254-260 行有一个覆盖全屏的 CSS 网格背景（`backgroundImage` 用 linear-gradient 生成），虽然 opacity 很低但仍然产生绘制开销

### 5. DraggableLayoutCanvas 巨型组件
- 单个文件 2121 行，包含大量状态和计算逻辑，任何状态变化都可能触发整个组件重渲染

### 6. WebGL 上下文丢失
- 控制台日志显示 `THREE.WebGLRenderer: Context Lost`，说明 GPU 内存不足导致 3D 渲染上下文被浏览器回收

## 优化方案

### 第一步：消除 `backdrop-blur`（效果最显著）

**MainLayout.tsx** - 将面板背景从半透明模糊改为不透明背景：
- `bg-card/90 backdrop-blur-md` 改为 `bg-card`
- `bg-card/95 backdrop-blur-md` 改为 `bg-card`
- 工具栏 `bg-card/95 backdrop-blur-md` 改为 `bg-card border-b`
- 移动端底部导航 `bg-card/95 backdrop-blur-md` 改为 `bg-card`

其他文件中的 `backdrop-blur` 按需保留（如弹出层、浮动面板），但主布局层坚决移除。

### 第二步：移除装饰性模糊球和网格

**MainLayout.tsx**:
- 删除 "Ambient Background Effects" 区块（3 个 blur-3xl 渐变球 + CSS 网格背景）
- 移动端和平板端的渐变球也一并移除
- 用简单的 `bg-background` 替代

### 第三步：简化 Framer Motion 动画

**MainLayout.tsx**:
- 移除左右面板和画布区域的 `motion.aside` / `motion.main` 包裹，改为普通 `aside` / `main`
- 保留管理面板与主面板之间的 `AnimatePresence` 切换动画（这个有意义）
- 面板内部的入场动画（`initial={{ opacity: 0, x: -30 }}`）改为纯 CSS `animate-in` 或直接移除

### 第四步：渐变装饰线简化

- 面板边缘的 `bg-gradient-to-b from-transparent via-primary/20 to-transparent` 装饰线改为简单的 `border-r` / `border-l`
- 画布区域的 vignette 效果（`bg-gradient-to-r from-background/20`）移除

## 涉及文件

| 文件 | 操作 |
|------|------|
| src/components/layout/MainLayout.tsx | 移除 backdrop-blur、模糊球、网格、简化动画 |
| src/components/layout/TopToolbar.tsx | 移除 backdrop-blur |

## 预期效果

- GPU 绘制负荷大幅下降（消除多层 blur 计算）
- 页面滚动和交互时帧率显著提升
- 面板拖拽调整大小时更加流畅
- 整体内存占用降低
