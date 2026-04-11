

## 根据相机品牌/型号定制正视图 SVG 外形

### 当前状态
`CameraSVGShape` 组件只接收 `hasImage` 和 `imageUrl`，没有上传图片时所有相机都显示同一个紫色矩形 + "Cam" 文字。用户希望即使没有上传正视图，不同品牌/型号的相机也能在图中呈现贴近真实外形的区别。

### 改动方案

**文件**: `src/components/canvas/VisionSystemDiagram.tsx`

#### 1. 扩展 `CameraSVGShape` 接口
传入 `brand` 和 `model` 信息：
```ts
function CameraSVGShape({ hasImage, imageUrl, brand, model }: {
  hasImage: boolean; imageUrl?: string | null;
  brand?: string; model?: string;
})
```

#### 2. 为主流工业相机品牌创建差异化 SVG 外形
根据 `brand` 渲染不同外轮廓和配色，涵盖常见品牌：

- **海康 (Hikvision)** — 紫色方体、绿色指示灯、前面板散热格栅
- **巴斯勒 (Basler)** — 灰黑扁平体、圆形镜头口、蓝色标识条
- **大恒 (Daheng)** — 深灰窄体、红色LED指示灯
- **康耐视 (Cognex)** — 银色紧凑体、橙色logo标识
- **堡盟 (Baumer)** — 黑色长方体、白色前面板
- **通用默认** — 保留当前样式作为未匹配品牌的回退

每个品牌外形包含：机身轮廓（圆角/直角）、镜头安装面、指示灯、品牌文字标识，尺寸比例尽量贴近真实产品。

#### 3. 同样扩展 `LensSVGShape` 和 `LightSVGShape`
传入品牌信息，为不同品牌的镜头和光源也提供差异化外形。

#### 4. 调用处传入品牌数据
在两处渲染 `CameraSVGShape` 的地方（交互模式和静态模式）补充 `brand={camera?.brand}` `model={camera?.model}`。

### 影响范围
- 仅 `VisionSystemDiagram.tsx` 一个文件
- 新增品牌判断逻辑和对应 SVG 图形约 120 行
- 不影响已上传正视图的情况（有图片时仍优先显示图片）

