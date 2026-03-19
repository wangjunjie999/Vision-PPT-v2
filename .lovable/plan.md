

# 移除 Lovable/AI 字样，将标识改为"接口1"

## 修改内容

### `src/components/ai/AIChatPanel.tsx`
1. **第239行**: `'lovable'` → `'default'`
2. **第341行**: `'lovable'` → `'default'`  
3. **第447行**: `'Lovable AI'` → `'接口1'`
4. **第567行**: `"自定义 API 配置（当 Lovable AI 额度不足时自动切换）"` → `"自定义 API 配置（当接口1额度不足时自动切换）"`

### `src/components/admin/HardwareImageMigration.tsx`（第234行）
- `"将本地硬件图片迁移到Lovable Cloud存储"` → `"将本地硬件图片迁移到云端存储"`

### `src/utils/hardwareImageUrls.ts`（第4行注释）
- 移除注释中的 `Lovable` 字样

共涉及 **3个文件**，纯文本替换。

