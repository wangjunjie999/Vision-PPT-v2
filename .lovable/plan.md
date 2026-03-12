

# 修复连接线锚点：从机械臂末端法兰出发

## 问题

`getRobotArmFlangePosition` 函数中 X 坐标符号错误，导致连接线锚定在底座附近而非法兰盘位置。

## 根因

Three.js 绕 Z 轴旋转 θ 将 `[0, L, 0]` 变换为 `[-L*sin(θ), L*cos(θ), 0]`，但当前代码使用了 `+L*sin(θ)`，X 分量符号反了。

## 修复

**文件：`src/components/canvas/Layout3DPreview.tsx`**（第 943-975 行）

修改 `getRobotArmFlangePosition` 中的三段关节坐标计算，将正弦项取反以匹配 Three.js 旋转矩阵：

```typescript
// 修正前（错误）
const elbowX = arm1L * Math.sin(theta1);
const wristX = elbowX + arm2L * Math.sin(theta2);
const flangeX = wristX + flangeLen * Math.sin(theta3);

// 修正后（正确）
const elbowX = -arm1L * Math.sin(theta1);
const wristX = elbowX + (-arm2L * Math.sin(theta2));
const flangeX = wristX + (-flangeLen * Math.sin(theta3));
```

这样连接线终点将精确对准 3D 模型中黄色法兰盘的世界坐标位置。

