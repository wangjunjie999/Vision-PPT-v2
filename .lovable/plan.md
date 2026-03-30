

# 3D旋转轴映射修复

## 问题根因

坐标系统中，位置做了 Y↔Z 轴交换（用户的 Y=深度 映射到 Three.js Z，用户的 Z=高度 映射到 Three.js Y）：
```text
position={[posX * SCALE, posZ * SCALE, posY * SCALE]}
                         ^^^            ^^^  已交换
```

但旋转没有做同样的交换：
```text
rotation={[rotX, rotY, rotZ]}  // 未交换，物理错误
```

导致：
- rotX 绕 Three.js X 轴旋转 → 正确（X 轴不变）
- rotY 绕 Three.js Y 轴（垂直轴）旋转 → 错误，用户期望绕深度轴旋转
- rotZ 绕 Three.js Z 轴（深度轴）旋转 → 错误，用户期望绕垂直轴旋转
- X 轴和 Z 轴表现一致（都在水平面内倾斜），Y 轴行为不符合直觉

## 修复方案

**文件：`src/components/canvas/Layout3DPreview.tsx`**

将所有 `rotation={[rotX, rotY, rotZ]}` 改为 `rotation={[rotX, rotZ, rotY]}`，与位置的 Y↔Z 交换保持一致。

需修改的位置：
1. **~L2358-2361** — 机构渲染的 rotation
2. **~L2393-2396** — 相机渲染的 rotation
3. **~L1440-1443** — `getConnectionEndpoint3D` 中的 Euler 旋转（连接线端点计算），改为 `new THREE.Euler(rx, rz, ry)`

修复后：
- rotX = 绕用户X轴（左右）旋转 → 俯仰
- rotY = 绕用户Y轴（前后深度）旋转 → 翻滚
- rotZ = 绕用户Z轴（上下垂直）旋转 → 偏航

