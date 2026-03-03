
# 取消母版上传功能 + 硬编码 PPT 企业风格

## 概述

根据参考截图，将 PPT 生成样式完全硬编码为固定的企业 VI 风格，同时移除模板上传/选择功能（保留接口代码以便未来恢复）。

## 参考样式详细分析（来自截图）

```text
+========================================================+
| [深蓝底色页眉条] 变更履历              TECH-SHINE LOGO  |
|   [蓝色副标题条] 变更表                                  |
|--------------------------------------------------------|
|                                                        |
|    +--[蓝色表头]发行/变更履历表--+                      |
|    | 编号 | 版本 | 发行/变更描述 | 客户规格书版本 | ... |
|    | 1    | V1.0 | 原始版本发行  | ——           | ... |
|    | 2    |      |              |              | ... |
|    | 3    |      |              |              | ... |
|    +------+------+--------------+--------------+-----+  |
|                                                        |
| [底部蓝色细线] ====================================== |
+========================================================+
```

关键样式要素：
- **页眉**: 全宽深蓝色 (#003D7A) 粗条（约 0.45 英寸高），白色粗体标题文字靠左
- **TECH-SHINE Logo**: 页眉右上角
- **副标题条**: 页眉下方全宽蓝色细条（约 0.22 英寸高），白色居中文字
- **表格表头**: 蓝色填充 (#2E75B6 或类似蓝色)，白色文字
- **表格内容行**: 白色底色，浅灰色边框
- **页面背景**: 纯白色
- **底部**: 全宽深蓝色细线

## 修改内容

### 1. PPTGenerationDialog.tsx — 移除模板选择 UI

- 移除"选择PPT母版"下拉框及相关 UI（约第 1273-1324 行）
- 移除模板样式提取逻辑（第 1022-1039 行的 extractTemplateStyles 调用）
- 移除 `generationMethod` 状态和模板生成分支（第 975-1016 行）
- 保留 `usePPTTemplates` hook 的 import 和相关类型定义（留好接口）
- 始终使用 `scratch` 方式生成，不再传入 `extractedStyles`

### 2. pptxGenerator.ts — 硬编码企业页眉风格

修改 MASTER_SLIDE 定义（约第 710-791 行）：

**当前**: 顶部仅 0.04 英寸蓝线 + 白色页眉区域
**修改为**:
- **页眉深蓝粗条**: `rect x:0, y:0, w:'100%', h:0.45, fill:#003D7A` — 全宽深蓝色
- **TECH-SHINE Logo**: 在深蓝色页眉条内右侧显示（白底 logo 或使用现有 logo）
- **底部蓝色线**: 保持现有的底部细线
- 移除所有 `extractedStyles` / `templateBackground` 条件分支，只保留硬编码样式
- 移除 `templateLogo` / `templateFooter` 的条件渲染代码

**变更履历页**改造（约第 922-961 行）：
- 页标题 "变更履历" 改为在深蓝页眉条内白色文字显示（已由 master 处理）
- 添加蓝色副标题条 "变更表"，全宽，约 y:0.45, h:0.22
- 表格：添加蓝色表头行 "发行/变更履历表"（合并标题），下方为列标题行
- 列调整为6列：编号, 版本, 发行/变更描述, 客户规格书版本, 日期, 发行/变更人
- 表头行使用蓝色填充白色文字
- 数据行保持白色底色
- 默认3行空行（编号1已填数据，2、3空行待填）

### 3. slideLabels.ts — 无需修改

现有 COLORS 定义已正确：`primary: '003D7A'`, `background: 'FFFFFF'`, `dark: '000000'`

### 4. workstationSlides.ts — 统一页眉风格

所有工位页面的 `addSlideTitle` 函数（约第 115-131 行）需要适配新的页眉布局：
- 当前：左侧蓝色竖条 + 深灰色文字
- 修改为：标题文字直接显示在 master 的深蓝色页眉条内（白色文字），或在页眉条下方显示

但由于 master slide 的页眉是全局的（不包含每页不同的标题），实际做法是：
- Master: 只有深蓝色背景条和 logo
- 每页：在页眉条上叠加白色标题文字（覆盖在深蓝条上）

修改 `addSlideTitle`：
- 移除左侧竖条装饰
- 标题文字颜色改为白色，位置在 y:0.05, h:0.38（在深蓝条内）
- 添加副标题蓝色条（如果需要）

### 5. 清理 extractedStyles 相关代码

在 `pptxGenerator.ts` 中：
- 移除 `ExtractedTemplateStyles` 接口定义
- `GenerationOptions` 中移除 `extractedStyles` 字段
- 移除 `activeColors` 合并逻辑（直接使用 COLORS）
- 移除 `templateBackground` / `templateLogo` / `templateFooter` 变量和条件
- 移除 `options.template?.background_image_url` 加载逻辑

## 涉及文件

| 文件 | 修改内容 |
|------|----------|
| `src/components/dialogs/PPTGenerationDialog.tsx` | 移除模板选择UI、模板样式提取逻辑、模板生成分支 |
| `src/services/pptxGenerator.ts` | 硬编码页眉风格、移除 extractedStyles、修改变更履历页布局 |
| `src/services/pptx/workstationSlides.ts` | 修改 addSlideTitle 适配深蓝页眉条 |

## 不修改的文件（保留接口）

- `src/hooks/usePPTTemplates.ts` — 保留，未来恢复用
- `src/services/pptTemplateService.ts` — 保留
- `src/services/pptTemplateParser.ts` — 保留
- `src/services/templateStyleExtractor.ts` — 保留
- `src/services/templateBasedGenerator.ts` — 保留
- `src/components/admin/PPTTemplateManager.tsx` — 保留但入口可隐藏
