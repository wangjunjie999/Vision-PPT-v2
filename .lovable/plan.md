

# 修复保存图片出现白块问题

## 问题根因

`html-to-image` (`toPng`) 在序列化 SVG 中的 `foreignObject` 时，无法解析 Tailwind CSS 类名（如 `bg-transparent`、`border-0`），导致这些元素渲染为白色矩形块。截图中红框标注的相机区域正是 `foreignObject` 内使用了 Tailwind 类的 `button` 元素。

## 修复方案

### 文件：`src/components/canvas/VisionSystemDiagram.tsx`

将所有 `foreignObject` 内部元素的 Tailwind 类替换为等效的 **内联样式**，确保 `html-to-image` 序列化时样式完整：

1. **相机 button**（L430）：`className="bg-transparent border-0 p-0"` → `style={{ backgroundColor: 'transparent', border: 'none', padding: 0 }}`

2. **镜头 button**（L468）：同上

3. **光源 button**（L505）：同上

4. **工控机 div**（L543）：添加 `style={{ backgroundColor: 'transparent' }}`

5. **所有 foreignObject 内的顶层 div** 添加 `xmlns="http://www.w3.org/1999/xhtml"` 属性，确保 XML 序列化正确

6. **hover overlay div**（"点击选择"提示和编辑图标）：将 `bg-background/50`、`bg-primary` 等类替换为内联样式

共约 30 行样式替换，1 个文件。

