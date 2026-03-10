

# 特定比例下光学方案图闪动 — 滚动条振荡问题

## 根因分析

这是一个经典的 **滚动条振荡（Scrollbar Oscillation）** 问题。问题出在容器层级结构中：

```text
ModuleSchematic.tsx 第408行:
  <div className="flex-1 p-6 overflow-auto">        ← 父容器：overflow-auto
    <div className="... max-w-5xl mx-auto ...">      ← 子容器：max-w-5xl
      VisionSystemDiagram:
        <div min-h-[700px]>                           ← 最小高度700px
          <svg aspect-ratio: 800/750>                 ← CSS aspect-ratio 强制宽高比
```

振荡循环如下：

1. 面板宽度 → SVG 按 `aspect-ratio: 800/750` 计算高度
2. 计算高度超过父容器可用高度 → **纵向滚动条出现** → 可用宽度减少 ~17px
3. 可用宽度减少 → SVG 重新计算高度（变小）→ 高度不再溢出 → **滚动条消失**
4. 可用宽度恢复 → SVG 高度再次变大 → 回到步骤2

在特定面板比例下，SVG 高度恰好在"刚好溢出"和"刚好不溢出"之间，导致滚动条每帧切换，产生持续闪动。

## 修复方案

### 1. `VisionSystemDiagram.tsx` — 移除 CSS `aspect-ratio`

SVG 的 `viewBox` + `preserveAspectRatio` 已经控制了宽高比，额外的 CSS `aspect-ratio: 800/750` 与 `h-full` 冲突，是导致高度计算不稳定的直接原因。移除它。

### 2. `ModuleSchematic.tsx` — 父容器使用 `overflow-y: scroll`

将第408行的 `overflow-auto` 改为 `overflow-y-scroll`，让滚动条始终存在（占据固定空间），彻底消除宽度跳变。

### 3. `VisionSystemDiagram.tsx` — 移除 SVG `<animate>` 脉冲

第377-380行的焦点指示器 `<animate>` 在 r=4→10 之间脉冲，虽然不是主因，但在滚动条振荡时会放大视觉抖动感。改为静态圆或纯 CSS 动画隔离到 GPU 层。

### 修改文件

1. **`src/components/canvas/VisionSystemDiagram.tsx`** — 移除 SVG 的 `aspectRatio: '800/750'`；移除焦点 `<animate>` 元素
2. **`src/components/canvas/ModuleSchematic.tsx`** — `overflow-auto` → `overflow-y-scroll`

