

# 机械臂3D模型改为三节臂 + 连接线从末端法兰出发

## 问题

1. **3D 机械臂模型只有两节臂**（大臂 + 小臂），不够真实，应改为三节（大臂 + 小臂 + 腕部/末端段）
2. **3D 连接线从机械臂底座中心出发**，而非从末端法兰盘位置出发，无法体现末端与相机的物理关系

## 方案

### 1. 重构 `RobotArmModel`（Layout3DPreview.tsx 第 140-235 行）

将当前两节臂改为三节结构：

```text
底座 → 腰部转台 → 关节1(肩) → 大臂 → 关节2(肘) → 小臂 → 关节3(腕) → 末端段 → 法兰盘(黄色)
```

- 大臂（arm1）：占高度 30%，向后倾斜 30°
- 小臂（arm2）：占高度 25%，向前弯折
- 末端段（arm3）：占高度 15%，再次弯折向下/前方
- 每节之间有球形关节，末端保留黄色法兰盘
- xray 模式同步更新

### 2. 修改 `RelationshipLines`（Layout3DPreview.tsx 第 896-1003 行）

当父级机构类型为 `robot_arm` 时，连接线终点从底座中心偏移到法兰盘的世界坐标位置。根据机械臂的几何结构计算末端法兰盘在3D空间中的实际位置：

```typescript
// 根据臂段角度和长度计算法兰盘世界位置
function getRobotArmFlangePosition(parent: LayoutObject): [number, number, number] {
  // 沿各关节角度累加计算末端位置
  const baseY = h * 0.08 + waistH;
  // ... 经过 arm1 → arm2 → arm3 各段旋转/偏移后得到末端坐标
}
```

连接线从法兰盘位置画到相机位置，使用实线 + 粗线宽表示物理连接。

### 涉及文件

- **`src/components/canvas/Layout3DPreview.tsx`**
  - 重写 `RobotArmModel` 函数：三节臂 + 三个关节 + 法兰盘
  - 重写其 xray 版本
  - 修改 `RelationshipLines`：robot_arm 的连接线终点改为法兰盘位置

