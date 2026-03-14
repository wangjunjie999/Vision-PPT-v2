

# 光学方案图显示验证与修复

## 发现的问题

### 1. 控制台 ref 警告
`HardwareSelectPopover` 中 `PopoverTrigger asChild` 尝试向子元素传递 ref，但子 `div` 嵌套在函数组件结构中导致 React 发出 "Function components cannot be given refs" 警告。需要确保 PopoverTrigger 的直接子元素能正确接收 ref。

### 2. 光源条与安装支架重叠
- 光源 foreignObject: y=215, h=32 → 结束于 y=247
- 安装支架: y=240-270
- 两者有 7px 重叠，支架被光源的 foreignObject 遮挡

### 3. 连接引线指向偏移
L414-418 的三条虚线连接线指向的 y 坐标与重构后的元素位置不完全匹配（相机中心约 y=77，镜头中心约 y=151，光源中心约 y=231）。

## 修复方案

### 文件: `src/components/canvas/VisionSystemDiagram.tsx`

1. **修复 ref 传递** — 将 `HardwareSelectPopover` 内部的触发 `div` 改用 `React.forwardRef` 包装，或在 `PopoverTrigger` 内直接使用 `button` 元素（原生 HTML 元素天然接受 ref）。

2. **调整安装支架位置** — 将支架 y 坐标从 240/250 下移至 260/265，避免与光源 foreignObject 重叠：
   ```
   // 水平杆: y=250→265
   // 垂直杆: y=240→258
   // 安装孔: cy=255→270
   ```

3. **修正连接引线坐标** — 更新三条虚线的起点 y 坐标，使其准确指向相机、镜头、光源的中心位置：
   ```
   相机线: y1=70 → y1=77
   镜头线: y1=170 → y1=151
   光源线: y1=235 → y1=231
   ```

## 改动范围

- `src/components/canvas/VisionSystemDiagram.tsx`：约 15 行调整（支架坐标、引线坐标、ref 修复）

