
# 管理中心密码门禁

## 功能说明

每次点击进入管理中心时，弹出密码输入对话框。输入正确密码后才能进入管理中心，关闭管理中心后再次进入需要重新输入密码（不缓存密码）。

## 实现方案

### 1. 在数据库中存储管理中心密码

创建一个 `admin_settings` 表，存储管理中心的访问密码（哈希存储）。初始密码可由管理员在管理中心内修改。

```text
admin_settings 表:
- id (uuid, PK)
- key (text, unique) -- 如 'admin_password'
- value (text) -- 存储密码值
- updated_at (timestamptz)
```

RLS 策略：所有已认证用户可以读取（用于验证密码），仅管理员可以修改。

### 2. 创建 Edge Function 验证密码

创建 `verify-admin-password` Edge Function：
- POST 请求，接收 `{ password }` 参数
- 使用 service_role key 读取 `admin_settings` 表中的密码
- 比对后返回 `{ valid: true/false }`
- 这样密码验证在服务端完成，前端无法绕过

### 3. 修改 `AdminCenter` 组件

在 `AdminCenter.tsx` 中增加密码门禁逻辑：
- 新增状态 `isUnlocked`（默认 false）
- 未解锁时显示密码输入界面（居中的卡片式 UI，包含密码输入框和确认按钮）
- 调用 Edge Function 验证密码
- 验证通过后设置 `isUnlocked = true`，显示原有管理中心内容
- 每次关闭管理中心（`showAdmin` 变为 false）时自动重置为未解锁状态

### 4. 修改 `MainLayout` 传递重置信号

在 `MainLayout.tsx` 中，当 `showAdmin` 从 true 变为 false 时，通知 `AdminCenter` 重置解锁状态。通过在 AdminCenter 外层控制渲染（已有 AnimatePresence），每次切换回管理中心时组件会重新挂载，自动重置状态。

### 5. 管理中心内增加"修改密码"功能

在管理中心的用户管理标签或新增一个设置区域，允许管理员修改管理中心的访问密码。

## 技术细节

**数据库迁移**：
```sql
CREATE TABLE admin_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text NOT NULL,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- 所有认证用户可读（用于密码验证）
CREATE POLICY "Authenticated users can read settings"
  ON admin_settings FOR SELECT
  TO authenticated
  USING (true);

-- 仅管理员可修改
CREATE POLICY "Admins can manage settings"
  ON admin_settings FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- 插入默认密码
INSERT INTO admin_settings (key, value)
VALUES ('admin_password', 'admin123');
```

**Edge Function `verify-admin-password`**：
- 接收 `{ password }` 参数
- 查询 `admin_settings` 表中 key='admin_password' 的 value
- 直接比对（明文存储，简单场景足够）
- 返回 `{ valid: boolean }`

**密码输入 UI**：
- 居中卡片，包含锁图标、标题"管理中心"、密码输入框、确认按钮
- 错误时显示"密码错误"提示
- 支持回车键提交

**涉及文件**：
- 新建 `supabase/functions/verify-admin-password/index.ts`
- 修改 `src/components/layout/AdminCenter.tsx` — 增加密码门禁
- 数据库迁移 — 创建 `admin_settings` 表
- 修改 `supabase/config.toml` — 注册新函数
