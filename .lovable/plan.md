

# 精细化所有硬件3D模型

## 当前状态

每种机构和硬件的3D模型都比较粗糙——大多只有2-3个基本几何体拼接，缺少细节。需要为每种类型增加更多结构部件、使用金属材质参数（metalness/roughness）、倒角效果和细节零件，使其更逼真。

## 改动方案

### 文件：`src/components/canvas/Layout3DPreview.tsx`

#### 1. 全局材质改进
- `mechMat` 函数增加 `metalness` 和 `roughness` 参数，所有金属部件使用 `metalness: 0.6, roughness: 0.3`
- 增加场景灯光：额外添加 `pointLight` 和 `hemisphereLight` 提升金属反射质感

#### 2. 各模型精细化

| 模型 | 现状 | 改进 |
|------|------|------|
| **RobotArmModel** | 基本关节+臂段 | 增加底座加强筋(4个小Box环绕)、线缆管道(小直径Cylinder沿臂段)、法兰盘改为Cylinder、腕部增加第4关节 |
| **ConveyorModel** | 皮带+2滚轮+4腿 | 增加中间滚轮(3-4个均匀分布)、侧板(两侧薄Box护栏)、横梁连接腿部、皮带纹理用多段Box模拟 |
| **CylinderModel** | 缸体+活塞杆 | 增加端盖(两端薄Cylinder)、安装耳环(两侧小Cylinder)、油口接头(侧面小突起) |
| **GripperModel** | 中心块+两夹爪 | 增加导轨槽(两条细Box)、夹爪指尖(锥形Cone)、安装法兰(顶部Cylinder)、气管接口 |
| **TurntableModel** | 底座+圆盘 | 增加定位销(顶面小Cylinder)、轴承环(中间细Cylinder环)、底座固定孔(4个小Cylinder) |
| **LiftModel** | 两立柱+平台 | 增加交叉剪刀臂结构(两组旋转Box模拟X形)、底座板、导轨槽 |
| **StopModel** | 底座+挡板 | 增加缓冲垫(挡板前面薄Box,橡胶色)、安装螺栓(4个小Cylinder)、气缸驱动杆 |
| **CameraMountModel** | L型两段 | 增加加强肋(对角Box)、调节旋钮(小Sphere)、安装板(底部宽Box)、线槽 |
| **CameraObject** | 方盒+锥形镜头 | 增加散热鳍片(背面多层薄Box)、接口面板(后面板)、镜头环(Cylinder环绕Cone)、指示灯(小Sphere,绿色emissive) |
| **ProductBox** | 半透明方盒 | 增加边缘倒角效果(用12条细Cylinder勾勒棱线)、标记面(正面加一个小方块标识) |

#### 3. 材质细节
- 金属部件: `metalness: 0.5-0.7, roughness: 0.25-0.4`
- 橡胶/塑料: `metalness: 0.05, roughness: 0.8`
- 铝合金: `color: #c0c0c0, metalness: 0.6, roughness: 0.3`
- 指示灯: `emissive` 绿色发光

所有改动仅涉及此单一文件。

