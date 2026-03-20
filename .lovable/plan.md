

# 修复 3D 连接线端点不准确

## 问题根因

`getConnectionEndpoint` 和 `getMechMountType` 使用的偏移量与实际 3D 模型几何体不匹配：

1. **机构模型底部对齐**（Y=0 是底部，Y=h 是顶部），但连接端点计算假设模型居中对齐
2. **'center' 挂载**返回 `(0, 0, 0)` 即底部原点，实际视觉中心在 `h/2`
3. **'side' 挂载**返回 `(w*0.5, 0, 0)` 即底部侧面，应在 `(w*0.5, h*0.5, 0)` 即中部侧面
4. **'top' 挂载**返回 `(0, h*0.5, 0)` — 对传送带大致正确（belt at h\*0.5），但转盘表面在 h\*0.50、升降台在 h\*0.63 等各不相同
5. **机械臂法兰**肩部基准 `h*0.08` 与模型中的 `h*0.09` 有偏差

## 修改方案

**仅修改 `src/components/canvas/Layout3DPreview.tsx`**

### 1. 替换 `getMechMountType` + `getConnectionEndpoint` 为精确的 `getMechMountOffset3D`

新函数根据机构类型返回精确的本地坐标偏移，匹配实际 3D 模型几何：

```text
机构类型        挂载点Y偏移            说明
conveyor       h * 0.50              传送带表面
turntable      h * 0.50              转盘圆盘表面
lift           h * 0.63              升降平台表面
stop           (w*0.5, h*0.4, 0)     挡块侧面中心
cylinder       (w*0.5, h*0.5, 0)     气缸侧面中心
gripper        (0, 0, 0)             夹爪底端
camera_mount   (0, h*0.8, 0)        支架顶部
default        (0, h*0.5, 0)         居中
```

### 2. 修复 `getRobotArmFlangePosition`

将肩部基准从 `h * 0.08` 修正为 `h * 0.09` 以匹配模型中 `position={[0, h*0.09 + waistH, 0]}` 的实际位置。

### 3. 更新 `computeRelLines` 中的端点计算

- 相机端使用 'center'（相机模型确实居中于原点，无需改）
- 机构端调用新的 `getMechMountOffset3D(mechType, w, h, d)` 获取精确偏移
- 产品端保持 'center'（ProductBox 也居中于原点）

### 修改文件

| 文件 | 操作 |
|------|------|
| `src/components/canvas/Layout3DPreview.tsx` | 修改 - 替换挂载点计算逻辑，匹配实际3D模型几何 |

