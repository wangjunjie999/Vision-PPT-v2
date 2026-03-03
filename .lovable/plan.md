
# 为测试项目生成模拟图片

## 问题

测试项目 DB260301 的 5 个工位目前缺少所有图片数据：
- 15 张三视图（5 工位 x 正视图/侧视图/俯视图）
- 5 张光学方案示意图（每个模块的 schematic_image_url）
- 没有产品标注图

PPT 生成器在没有图片时只会显示占位框，无法验证图片布局、缩放和居中是否正确。

## 解决方案

创建一个临时边缘函数 `generate-test-images`，用 SVG 生成简单但有意义的工程示意图，转换为 PNG 后上传到对应的存储桶，并更新数据库记录。

### 生成的图片内容

**三视图（workstation-views 桶）**：
- 正视图：绘制相机、光源、待测件的正面布局示意
- 侧视图：绘制侧面视角的设备排列
- 俯视图：绘制俯视角度的设备分布
- 每张图包含工位名称、坐标轴标注、设备轮廓

**光学方案图（module-schematics 桶）**：
- 绘制视觉系统示意图：相机+镜头在上方，光源在侧面，待测件在中央
- 标注检测类型（定位/缺陷/OCR/测量/深度学习）
- 包含光路示意线

### 实现步骤

1. **创建边缘函数** `supabase/functions/generate-test-images/index.ts`
   - 接收 project_code 参数
   - 查询该项目的所有工位、布局和模块
   - 为每个布局生成 3 张三视图 SVG（使用纯 SVG 字符串，含设备图标和标注）
   - 为每个模块生成 1 张光学方案 SVG
   - 将 SVG 直接上传为 SVG 文件（PPT 的 `fetchImageAsDataUri` 支持 SVG）
   - 更新 `mechanical_layouts` 表的 `front/side/top_view_image_url` 和 `*_view_saved` 字段
   - 更新 `function_modules` 表的 `schematic_image_url` 字段

2. **SVG 设计**（每张约 800x600 尺寸）
   - 深色工业风背景（#0f172a），与画布截图风格一致
   - 设备用简单几何图形表示（矩形=相机, 圆形=镜头, 三角=光源）
   - 包含坐标轴、尺寸标注、设备标签
   - 每个工位根据其 mechanisms 配置生成不同的布局

3. **部署并调用**
   - 部署边缘函数
   - 通过 curl 调用一次完成所有图片生成
   - 验证数据库记录已更新

### 技术细节

- SVG 字符串在边缘函数中用模板字符串拼接，无需额外依赖
- 上传到 `workstation-views` 和 `module-schematics` 桶，文件名格式与现有代码一致
- 使用 service_role_key 绕过 RLS 进行数据库更新
- 函数执行完毕后可删除，仅用于一次性测试数据生成

## 涉及文件

| 文件 | 操作 |
|------|------|
| `supabase/functions/generate-test-images/index.ts` | 新建 - 生成 SVG 并上传到存储桶 |

## 预期结果

执行后：
- 5 个工位各有 3 张三视图 URL（共 15 张）
- 5 个模块各有 1 张光学方案图 URL（共 5 张）
- PPT 生成时将加载这些真实图片，验证布局、缩放、居中是否正确
