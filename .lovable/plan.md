

# 添加德星云品牌Logo到界面

## 现状
- 顶部工具栏使用 `Zap` 图标 + "视觉方案配置系统" 文字作为Logo区域
- 项目中已有德星云Logo文件：`public/ppt-covers/tech-shine-logo.png`

## 修改内容

### `src/components/layout/TopToolbar.tsx`
- 将Logo区域的 `Zap` 图标（第145-151行的渐变方块）替换为 `<img src="/ppt-covers/tech-shine-logo.png" />` 
- 保持圆角容器样式，调整尺寸适配Logo图片（移动端 32px，桌面端 40px）
- 副标题 "Vision Solution Studio" 可改为 "DXY Intelligent Solution"

### `src/pages/Auth.tsx`（登录页）
- 检查是否有Logo区域，如有也替换为德星云Logo

共 1-2 个文件，纯UI替换。

