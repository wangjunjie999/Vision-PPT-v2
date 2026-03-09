

# FOV 输入改为两个独立数值框

## 问题

当前 FOV 需要用户输入 `100×80` 这样的格式，中间的 `×` 号不好打，体验差。

## 修改方案

### 1. 表单状态新增两个字段（`src/components/forms/module/types.ts`）

在 `ModuleFormState` 中添加：
```
fieldOfViewWidth: string;   // FOV 宽 (mm)
fieldOfViewHeight: string;  // FOV 高 (mm)
```

在 `getDefaultFormState` 中添加默认值 `''`。

### 2. FOV 输入 UI 改为两个框（`src/components/forms/module/ModuleStep3Imaging.tsx`）

将原来的单个 FOV 输入框改为两个并排输入框，中间显示 `×` 文字：

```
[宽度输入] × [高度输入]
```

- 宽度绑定 `fieldOfViewWidth`，高度绑定 `fieldOfViewHeight`
- 同时自动拼接为 `fieldOfViewCommon`（或 `fieldOfView`）= `"{width}×{height}"`，保持下游逻辑兼容
- 加载表单时，从已有的 `fieldOfViewCommon` 解析出宽高回填（通过 `parseFOV` 工具函数）

### 3. 定位模块 FOV 同步改（`src/components/forms/module/PositioningForm.tsx`）

同样将 `fieldOfView` 输入框改为宽+高两个框，中间显示 `×`。

### 4. PPT 输出不变

PPT 中已经是读取 `fieldOfView` 字符串（含 `×`），因为我们在表单层自动拼接，PPT 输出自然带 `×` 号，无需改动。

### 5. 自动计算兼容

`parseFOV` 函数已经能解析 `100×80` 格式，拼接后的字符串可以被正确解析，自动计算功能不受影响。

