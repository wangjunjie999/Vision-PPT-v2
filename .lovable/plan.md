
## 修正光学方案图旋转方向仍然相反的问题

### 问题定位
当前 `src/components/canvas/VisionSystemDiagram.tsx` 里，FOV 的旋转坐标计算仍然和实际 SVG `rotate(${camRotation})` 的方向不一致，所以会出现：
- 相机/镜头已经朝一个方向旋转
- FOV 锥体、镜头出光口、标注延伸方向却朝相反方向偏转

根因在于这几组公式的符号仍然是镜像的：
- `rotatedLensLocalX / rotatedLensLocalY`
- `fovDirX / fovDirY`
- `fovPerpX / fovPerpY`

### 修改方案
**文件**: `src/components/canvas/VisionSystemDiagram.tsx`

#### 1. 统一为与画面实际旋转一致的坐标公式
把镜头出光口的局部偏移旋转改成与当前 SVG 组旋转同方向的计算：

```ts
const rotatedLensLocalX = localLensX * Math.cos(rotRad) - localLensY * Math.sin(rotRad);
const rotatedLensLocalY = localLensX * Math.sin(rotRad) + localLensY * Math.cos(rotRad);
```

对于当前 `localLensX = 0, localLensY = 55`，等价于：
```ts
const rotatedLensLocalX = -55 * Math.sin(rotRad);
const rotatedLensLocalY =  55 * Math.cos(rotRad);
```

#### 2. 同步修正 FOV 主方向向量
将 FOV 朝向改为和镜头朝向一致：

```ts
const fovDirX = -Math.sin(rotRad);
const fovDirY =  Math.cos(rotRad);
```

#### 3. 同步修正 FOV 宽度的垂直方向向量
保证锥体两侧展开方向也不再镜像：

```ts
const fovPerpX = Math.cos(rotRad);
const fovPerpY = Math.sin(rotRad);
```

### 连带生效的部分
因为下面这些都依赖上述变量，修正后会一起恢复正确：
- FOV 锥体 polygon
- 两条 FOV 边线
- FOV 角度圆弧与角度文字
- 工作距离标注线
- 视野宽度标注线
- 镜头连到右侧说明卡片的虚线锚点

### 预期结果
修复后应表现为：
- 相机顺时针旋转，FOV 也顺时针偏转
- 相机逆时针旋转，FOV 也逆时针偏转
- 锥体起点始终贴合镜头出光口
- 标注线不会再出现“本体往左，FOV 往右”的反向问题

### 改动范围
- 仅 `src/components/canvas/VisionSystemDiagram.tsx`
- 主要是 3 组旋转公式的符号修正，属于小范围定向修复
