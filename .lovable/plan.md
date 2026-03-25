

# 将机械臂 3D 模型导出为 GLB 文件

## 背景

项目中已有一个高精度的程序化机械臂 3D 模型（`RobotArmModel`，定义在 `Layout3DPreview.tsx` 第 236-563 行），包含双层底座、关节球体、臂段、法兰盘等完整结构。目标是将这个模型导出为 `.glb` 文件，以便在机械布局图中作为独立资产复用。

## 方案

在 3D 预览界面中添加一个"导出 GLB"按钮，利用 Three.js 的 `GLTFExporter` 将当前程序化生成的机械臂模型序列化为 GLB 二进制格式并下载。

## 实现步骤

### 1. 安装 GLTFExporter

`three` 包自带 `GLTFExporter`，无需额外安装。从 `three/addons/exporters/GLTFExporter.js` 导入即可。

### 2. 创建 `src/utils/glbExporter.ts`

- 封装导出逻辑：接收一个 `THREE.Object3D`，调用 `GLTFExporter.parse()` 生成 ArrayBuffer
- 触发浏览器下载 `.glb` 文件
- 支持传入文件名参数

### 3. 创建独立的机械臂导出组件 `src/components/canvas/RobotArmGLBExporter.tsx`

- 渲染一个隐藏的 offscreen `<Canvas>`，内部只放置 `RobotArmModel`
- 提供"导出机械臂 GLB"按钮
- 点击后：
  1. 从 Canvas scene 中获取机械臂 group
  2. 调用 `GLTFExporter` 导出为 `.glb`
  3. 自动下载文件，或上传到存储桶供布局系统使用

### 4. 将导出按钮集成到 Layout3DPreview

在 3D 预览的工具栏区域添加一个"导出机械臂模型"按钮，用户点击后直接导出当前尺寸的机械臂 GLB。

### 5. 可选：自动上传到存储

导出后可调用已有的 `uploadGLBFile()` 将 GLB 上传到 `3d-models` 存储桶，直接关联到当前机构记录。

## 技术要点

- `GLTFExporter` 支持 `binary: true` 选项直接输出 `.glb` 格式
- 程序化模型使用的 `meshStandardMaterial` 会被正确导出为 PBR 材质
- 模型尺寸基于硬件定义的 `w/h/d` 参数动态生成，导出时使用实际物理尺寸

## 涉及文件

| 文件 | 操作 |
|------|------|
| `src/utils/glbExporter.ts` | 新建 — GLB 导出工具函数 |
| `src/components/canvas/RobotArmGLBExporter.tsx` | 新建 — 独立导出组件 |
| `src/components/canvas/Layout3DPreview.tsx` | 修改 — 添加导出按钮到工具栏 |

