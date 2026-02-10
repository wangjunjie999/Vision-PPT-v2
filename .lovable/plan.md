
# 将注册登录改为账号制（非邮箱）

## 功能说明

将当前的邮箱注册/登录改为任意账号名注册/登录。用户可以输入任意用户名（如 "zhangsan"、"admin01"）作为账号，无需输入邮箱地址。

## 实现原理

后端认证系统底层要求邮箱格式，因此采用**透明转换**方案：用户输入账号名（如 `myuser`），系统自动在后台拼接为 `myuser@internal.local` 进行注册和登录。用户完全无感知，界面上只看到"账号"字段。

同时需要开启邮箱自动确认，因为这些虚拟邮箱无法接收验证邮件。

## 具体改动

### 1. 开启邮箱自动确认
使用 configure-auth 工具开启 auto-confirm，跳过邮箱验证步骤。

### 2. 修改 `src/contexts/AuthContext.tsx`
- `signUp` 和 `signIn` 方法的参数从 `email` 改为 `username`
- 内部自动将 `username` 转换为 `username@internal.local` 再调用认证 API
- 接口类型更新：`signUp(username, password, displayName?)` / `signIn(username, password)`

### 3. 修改 `src/pages/Auth.tsx`
- 将"邮箱地址"字段改为"账号"字段
- 输入框 type 从 `email` 改为 `text`
- placeholder 改为"请输入账号"
- 验证规则从邮箱格式改为：2-30 个字符，仅允许字母、数字、下划线
- 状态变量从 `email` 改为 `username`
- 登录表单同步修改

### 4. 修改 `src/components/admin/UserManagement.tsx`
- 用户列表中显示账号名而非邮箱（去掉 `@internal.local` 后缀）

## 技术细节

验证规则：
```
username: z.string()
  .trim()
  .min(2, '账号至少需要2个字符')
  .max(30, '账号最多30个字符')
  .regex(/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/, '账号只能包含字母、数字、下划线或中文')
```

转换逻辑：
```
const fakeEmail = `${username}@internal.local`;
await supabase.auth.signUp({ email: fakeEmail, password, ... });
```
