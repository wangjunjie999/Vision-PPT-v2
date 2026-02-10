

# 用户管理界面

## 功能说明

在管理中心新增"用户管理"标签页，仅管理员可见和使用。管理员可以：
- 查看所有已注册用户列表（通过 `user_roles` 表 + `auth.users` 的邮箱信息）
- 为用户分配或移除管理员角色
- 搜索用户

## 实现方案

### 1. 创建后端函数获取用户列表

由于前端无法直接查询 `auth.users` 表，需要创建一个 Edge Function `admin-users` 来：
- 验证调用者是否为管理员（通过 `has_role` 函数）
- 使用 service_role key 调用 `supabase.auth.admin.listUsers()` 获取用户列表
- 支持添加/移除角色的操作

### 2. 新建组件 `src/components/admin/UserManagement.tsx`

界面包含：
- 搜索框：按邮箱筛选用户
- 用户列表表格：显示邮箱、注册时间、角色状态
- 角色切换：每行一个开关，控制是否为管理员
- 加载和空状态处理

### 3. 修改 `src/components/layout/AdminCenter.tsx`

- 新增"用户管理"标签（使用 `Users` 图标）
- 标签栏从 8 列改为 9 列
- 仅当当前用户是管理员时显示该标签

### 技术细节

**Edge Function `admin-users`**：
- `GET`：返回所有用户列表（含邮箱、ID、创建时间）及其角色
- `POST`：添加角色（body: `{ user_id, role, action: 'add' }`）
- `DELETE`/POST with `action: 'remove'`：移除角色

**安全保障**：
- Edge Function 内使用 service_role key 验证调用者的 admin 身份
- 前端通过 `useAdminRole` hook 控制界面可见性
- RLS 策略已存在：只有管理员可以管理 `user_roles` 表

