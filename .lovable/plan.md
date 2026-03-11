

# 执行机构图片在画布中不更新的原因与修复

## 问题根因

`useMechanisms` hook 在每个组件中创建独立的状态实例。当你在管理后台上传新图片时，只有管理页面的 `useMechanisms` 实例更新了，画布页面的实例仍持有旧数据（初次加载时的快照）。用户必须刷新页面才能看到新图片。

## 修复方案

### 文件：`src/hooks/useMechanisms.ts`

添加 Supabase Realtime 订阅，监听 `mechanisms` 表的变更。当任何实例（如管理后台）更新了机构数据，所有使用该 hook 的组件（包括画布）都会自动收到最新数据。

核心改动：
- 在 `useEffect` 中添加 `supabase.channel('mechanisms-changes')` 订阅
- 监听 `INSERT`、`UPDATE`、`DELETE` 事件
- 收到变更后调用 `fetchMechanisms()` 重新拉取全部数据
- 组件卸载时取消订阅

```typescript
useEffect(() => {
  const channel = supabase
    .channel('mechanisms-changes')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'mechanisms' },
      () => fetchMechanisms()
    )
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}, [fetchMechanisms]);
```

### 数据库：启用 Realtime

需要对 `mechanisms` 表启用 realtime publication：
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.mechanisms;
```

**涉及文件：**
- `src/hooks/useMechanisms.ts` — 添加 realtime 订阅
- 数据库迁移 — 启用 mechanisms 表的 realtime

