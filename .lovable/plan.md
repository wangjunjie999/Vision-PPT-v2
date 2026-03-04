

# 添加"强制重新生成所有图片"功能

## 问题
当前"一键保存所有图片"按钮只处理**缺失**图片的工位/模块（检查 `front_view_image_url` 和 `schematic_image_url` 是否为空）。已有旧截图的模块不会被重新生成。

## 方案

修改 `src/components/canvas/BatchImageSaveButton.tsx` 一个文件：

### 1. 新增"强制重新生成"按钮
在现有按钮旁添加一个"重新生成所有图片"按钮（或改为下拉菜单，包含"保存缺失图片"和"重新生成全部"两个选项）。

### 2. 新增 `allImages` 计算逻辑
与 `missingImages` 类似，但不检查 URL 是否为空——遍历所有有 layout 的工位和所有模块，生成完整列表。

### 3. 复用 `handleBatchSave`
添加 `force: boolean` 参数：
- `force = false`：使用 `missingImages`（现有行为）
- `force = true`：使用 `allImages`（全部重新截图并上传覆盖）

### 4. UI 改动
将按钮改为 `DropdownMenu`，提供两个选项：
- **保存缺失图片**（原功能，badge 显示缺失数量）
- **重新生成全部图片**（强制模式，badge 显示总数量）

| 修改文件 | 改动内容 |
|----------|----------|
| `BatchImageSaveButton.tsx` | 添加 allImages 计算、force 参数、下拉菜单 UI |

