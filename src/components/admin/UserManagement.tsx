import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Loader2, Users, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

interface UserItem {
  id: string;
  email: string;
  created_at: string;
  roles: string[];
}

export function UserManagement() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [togglingUser, setTogglingUser] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await supabase.functions.invoke('admin-users', {
        method: 'GET',
      });

      if (res.error) throw res.error;
      setUsers(res.data.users || []);
    } catch (err: any) {
      console.error('Failed to fetch users:', err);
      toast.error('获取用户列表失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const toggleAdminRole = async (userId: string, currentlyAdmin: boolean) => {
    try {
      setTogglingUser(userId);
      const res = await supabase.functions.invoke('admin-users', {
        method: 'POST',
        body: {
          user_id: userId,
          role: 'admin',
          action: currentlyAdmin ? 'remove' : 'add',
        },
      });

      if (res.error) throw res.error;
      if (res.data?.error) throw new Error(res.data.error);

      toast.success(currentlyAdmin ? '已移除管理员角色' : '已授予管理员角色');
      await fetchUsers();
    } catch (err: any) {
      console.error('Failed to toggle role:', err);
      toast.error(err.message || '操作失败');
    } finally {
      setTogglingUser(null);
    }
  };

  const toDisplayName = (email: string) => email?.replace(/@internal\.local$/, '') || '';

  const filteredUsers = users.filter(u => {
    if (!searchQuery.trim()) return true;
    return toDisplayName(u.email).toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <CardTitle>用户管理</CardTitle>
        </div>
        <CardDescription>管理用户角色和权限</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 mb-4">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索账号..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="max-w-sm h-9"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">加载中...</span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Users className="h-10 w-10 mb-2" />
            <p>{searchQuery ? '没有匹配的用户' : '暂无用户'}</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>账号</TableHead>
                  <TableHead>注册时间</TableHead>
                  <TableHead className="text-center">管理员</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map(user => {
                  const isAdmin = user.roles.includes('admin');
                  const isToggling = togglingUser === user.id;
                  return (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{toDisplayName(user.email)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString('zh-CN')}
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={isAdmin}
                          disabled={isToggling}
                          onCheckedChange={() => toggleAdminRole(user.id, isAdmin)}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
