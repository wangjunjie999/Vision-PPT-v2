

# PPT 机械布局：三视图改为主辅视图布局

## 现状
当前 PPT 生成流程中，步骤 c 调用 `generateMechanicalThreeViewSlide`，生成三列等宽的正/侧/俯三视图。用户希望改为如图2所示的 **主辅视图布局**：左侧大图（主视图，约60%宽）+ 右上辅视图 + 右下文字描述区域。

## 发现
系统中已存在 `generateLayoutAndOpticalSlide` 函数（第627行），实现了完全匹配图2的布局：
- 左60%：主视图大图
- 右上：辅视图小图  
- 右下：布局说明文字区域

但当前 PPT 生成主流程（`pptxGenerator.ts`）调用的是 `generateMechanicalThreeViewSlide`，且 slideData 中缺少 `primary_view`、`auxiliary_view`、`layout_description` 三个字段。

## 修改方案

### 文件1：`src/services/pptxGenerator.ts`
1. **slideData.layout** 增加三个字段：`primary_view`、`auxiliary_view`、`layout_description`
2. **步骤 c**：将 `generateMechanicalThreeViewSlide` 替换为 `generateLayoutAndOpticalSlide`
3. **进度文案**：从 "机械三视图" 改为 "机械布局"
4. **import**：确保导入 `generateLayoutAndOpticalSlide`

### 文件2：`src/services/pptx/workstationSlides.ts`
1. **标题更新**：`generateLayoutAndOpticalSlide` 中的标题从 "机械布局" 改为包含 DB 号的格式：`${wsCode} ${wsName} - 机械布局`（与其他幻灯片标题风格一致）

不需要修改 `generateMechanicalThreeViewSlide`，它保留在代码中但不再被主流程调用。

