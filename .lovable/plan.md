

# 修复 extract-template-styles 边缘函数 404 错误

## 问题

前端 `templateStyleExtractor.ts` 调用 `extract-template-styles` 边缘函数，但该函数从未创建，导致 404 错误。此函数在 PPT 生成流程中被调用（当用户选择了模板时），用于提取模板的样式信息（颜色、字体、Logo、背景等）。

## 解决方案

创建 `extract-template-styles` 边缘函数，实现以下功能：

1. 从 `ppt-templates` 存储桶下载用户的 PPTX 模板文件
2. 解析 PPTX（ZIP 格式）中的 XML 文件，提取：
   - 主题颜色（theme colors）
   - 字体信息（title/body fonts, 东亚字体）
   - 背景类型和颜色
   - Logo 图片
   - 母版/布局数量
3. 返回结构化的样式数据，供前端 `convertStylesToGeneratorFormat` 使用

## 技术细节

### 新建文件

**`supabase/functions/extract-template-styles/index.ts`**

- 使用 CORS headers 处理跨域
- 使用 `getClaims()` 验证用户身份
- 根据 `templateId` 从数据库查询模板记录获取 `file_url`
- 使用 JSZip（`npm:jszip`）解压 PPTX 文件
- 解析以下 XML 文件：
  - `ppt/theme/theme1.xml` - 提取颜色方案和字体
  - `ppt/slideMasters/*.xml` - 提取背景、Logo
  - `ppt/slideLayouts/*.xml` - 提取布局信息
  - `ppt/presentation.xml` - 提取幻灯片尺寸
  - `[Content_Types].xml` - 枚举内容
- 使用简单 XML 解析（正则或轻量 XML 解析器）提取关键属性

**`supabase/config.toml`** 更新

- 添加 `[functions.extract-template-styles]` 配置，设置 `verify_jwt = false`

### 返回数据结构

与前端 `ExtractedStyles` 接口对齐：
- `backgroundType`: solid/gradient/image/none
- `backgroundColor`: hex 颜色
- `themeColors`: primary, secondary, accent 等
- `titleFont` / `bodyFont` / `titleFontEA` / `bodyFontEA`
- `masterCount` / `layoutCount`
- `logo`: base64 数据（如有）
- `slideWidth` / `slideHeight`

### 错误处理

- 模板文件不存在时返回友好错误
- PPTX 解析失败时返回默认样式
- 网络超时保护

