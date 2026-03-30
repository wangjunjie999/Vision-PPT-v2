

# 修复3D旋转轴混淆：改用世界坐标系旋转

## 问题根因

当前3D旋转使用 Euler 角 `[rotX, rotZ, rotY]`（XYZ顺序）。Euler角是**局部轴**旋转——第一个旋转改变后续旋转的参考轴。

例如截图中 Z轴（偏航）已设为90°时，再调整 Y轴 滑块，由于Euler耦合效应，实际旋转方向看起来像绕X轴转，而非绕场景中标注的 Y 轴转。

## 修复方案

使用**四元数（Quaternion）**组合三个独立的世界轴旋转，使每个滑块始终绕**场景中对应标注的轴**旋转，互不干扰。

### 技术细节

**文件：`src/components/canvas/Layout3DPreview.tsx`**

1. 新增工具函数 `computeWorldRotation(rotX, rotY, rotZ)`：
   - 将每个轴的角度转为绕世界轴的四元数
   - 按顺序组合：`qZ * qY * qX`（先俯仰，再翻滚，最后偏航）
   - 返回 `THREE.Euler`

```text
function computeWorldRotation(rotXDeg, rotYDeg, rotZDeg) → Euler:
  // rotX → 绕 Three.js X 轴（场景X）
  qX = Quaternion.setFromAxisAngle(Vector3(1,0,0), rotX_rad)
  // rotY → 绕 Three.js Z 轴（场景Y/深度）  
  qY = Quaternion.setFromAxisAngle(Vector3(0,0,1), rotY_rad)
  // rotZ → 绕 Three.js Y 轴（场景Z/高度）
  qZ = Quaternion.setFromAxisAngle(Vector3(0,1,0), rotZ_rad)
  
  combined = qZ.multiply(qY).multiply(qX)
  return Euler.setFromQuaternion(combined)
```

2. 替换所有直接使用 `rotation={[rotX, rotZ, rotY]}` 的位置（~L2374、~L2409、~L2445 等 DraggableGroup），改用 `computeWorldRotation()` 的返回值

3. 同步更新连接线端点计算（`getConnectionEndpoint3D` ~L1469、`getRobotArmFlangePosition3D` ~L1418），将 `new THREE.Euler(rx, rz, ry)` 替换为同样的四元数逻辑

### 影响范围

- 机构、相机、产品的3D旋转渲染
- 连接线端点计算
- 不影响2D旋转和表单UI

