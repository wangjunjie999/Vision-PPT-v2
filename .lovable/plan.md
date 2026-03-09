

# 前端数据层抽象 — API 适配层

## 目标

将所有直接调用 Supabase SDK 的代码收敛到一个适配层，上层业务代码只依赖抽象接口。切换后端时只需替换适配层实现，无需修改任何业务组件。

## 当前问题

32 个文件直接 `import { supabase } from '@/integrations/supabase/client'`，包括：
- `DataContext.tsx` — 项目/工位/布局/模块 CRUD
- `HardwareContext.tsx` — 相机/镜头/光源/控制器 CRUD
- `AuthContext.tsx` — 登录/注册/登出
- `assetService.ts` — 资产上传/查询
- 20+ 个组件直接调用存储、查询、Edge Functions

## 架构设计

```text
┌─────────────────────────────────────┐
│         业务组件 / Context          │
│   (DataContext, HardwareContext)    │
└──────────────┬──────────────────────┘
               │ import api from '@/api'
┌──────────────▼──────────────────────┐
│        API 接口层 (types.ts)        │
│   IAuthApi, IProjectApi, ...        │
└──────────────┬──────────────────────┘
               │
     ┌─────────┴─────────┐
     ▼                   ▼
┌─────────────┐   ┌──────────────┐
│ supabase/   │   │ custom/      │
│ (默认实现)   │   │ (自建后端)    │
└─────────────┘   └──────────────┘
```

## 文件结构

```text
src/api/
  types.ts              # 所有接口定义
  index.ts              # 导出当前适配器实例
  supabase/
    auth.ts             # IAuthApi 的 Supabase 实现
    projects.ts         # IProjectApi 实现
    workstations.ts     # IWorkstationApi 实现
    layouts.ts          # ILayoutApi 实现
    modules.ts          # IModuleApi 实现
    hardware.ts         # IHardwareApi 实现
    assets.ts           # IAssetApi 实现
    storage.ts          # IStorageApi 实现
  custom/
    index.ts            # 自建后端适配器骨架(fetch-based)
```

## 接口定义示例 (`src/api/types.ts`)

```typescript
export interface IProjectApi {
  list(): Promise<Project[]>;
  create(data: ProjectCreate): Promise<Project>;
  update(id: string, data: ProjectUpdate): Promise<Project>;
  delete(id: string): Promise<void>;
}

export interface IAuthApi {
  signUp(username: string, password: string, displayName?: string): Promise<{ error: Error | null }>;
  signIn(username: string, password: string): Promise<{ error: Error | null }>;
  signOut(): Promise<void>;
  getUser(): Promise<User | null>;
  onAuthStateChange(cb: (user: User | null) => void): () => void;
}

export interface IStorageApi {
  upload(bucket: string, path: string, file: File): Promise<{ url: string }>;
  getPublicUrl(bucket: string, path: string): string;
  remove(bucket: string, paths: string[]): Promise<void>;
}

export interface ApiAdapter {
  auth: IAuthApi;
  projects: IProjectApi;
  workstations: IWorkstationApi;
  layouts: ILayoutApi;
  modules: IModuleApi;
  hardware: IHardwareApi;
  assets: IAssetApi;
  storage: IStorageApi;
}
```

## 切换机制 (`src/api/index.ts`)

```typescript
import { createSupabaseAdapter } from './supabase';
// import { createCustomAdapter } from './custom';

const BACKEND = import.meta.env.VITE_BACKEND || 'supabase';

export const api: ApiAdapter = BACKEND === 'custom'
  ? createCustomAdapter(import.meta.env.VITE_API_BASE_URL)
  : createSupabaseAdapter();
```

## 改动范围

### 第一阶段：创建适配层（新增文件，不改现有代码）
1. **`src/api/types.ts`** — 定义 7 个接口 + `ApiAdapter` 总接口 + 业务数据类型（从现有 DB 类型映射为前端类型）
2. **`src/api/supabase/*.ts`** — 将 `DataContext`、`HardwareContext`、`AuthContext`、`assetService` 中的 Supabase 调用提取为接口实现
3. **`src/api/index.ts`** — 导出适配器实例
4. **`src/api/custom/index.ts`** — 自建后端骨架（所有方法抛出 `Not implemented`）

### 第二阶段：迁移现有代码
5. **`DataContext.tsx`** — 用 `api.projects.list()` 替换 `supabase.from('projects').select('*')`，同理工位/布局/模块
6. **`HardwareContext.tsx`** — 用 `api.hardware.listCameras()` 等替换直接查询
7. **`AuthContext.tsx`** — 用 `api.auth.signIn()` 等替换 `supabase.auth.*`
8. **散落的组件** — 逐步将 `AnnotationEditor`、`ModuleSchematic`、`HardwareConfigPanel` 等中的直接 supabase 调用改为通过 api 适配层

### 第三阶段：补充自建后端模板
9. **`src/api/custom/index.ts`** — 提供基于 `fetch` 的 REST API 实现模板，用户只需填入自己的后端 URL

## 注意事项

- 数据类型保持与现有 DB Row 类型兼容，避免大量类型改动
- 离线缓存（`offlineCache`）保留在 Context 层，与适配层无关
- toast 提示保留在 Context 层，适配层只返回数据或抛错
- 分批迁移，优先迁移 3 个 Context，其余组件可后续逐步改造

