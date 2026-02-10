import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Camera, CircleDot, Lightbulb, Monitor, FileText, Cog, CloudUpload, Database, Users, Lock, Loader2 } from 'lucide-react';
import { HardwareResourceManager } from '../admin/HardwareResourceManager';
import { PPTTemplateManager } from '../admin/PPTTemplateManager';
import { MechanismResourceManager } from '../admin/MechanismResourceManager';
import { HardwareImageMigration } from '../admin/HardwareImageMigration';
import { DataExportTool } from '../admin/DataExportTool';
import { StorageMigrationTool } from '../admin/StorageMigrationTool';
import { UserManagement } from '../admin/UserManagement';
import { useAdminRole } from '@/hooks/useAdminRole';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function AdminCenter() {
  const [activeTab, setActiveTab] = useState('cameras');
  const { isAdmin } = useAdminRole();
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [password, setPassword] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');

  const handleVerify = async () => {
    if (!password.trim()) return;
    setVerifying(true);
    setError('');
    try {
      const { data, error: fnError } = await supabase.functions.invoke('verify-admin-password', {
        body: { password: password.trim() },
      });
      if (fnError) throw fnError;
      if (data?.valid) {
        setIsUnlocked(true);
      } else {
        setError('密码错误');
      }
    } catch (e: any) {
      console.error('Password verify error:', e);
      setError('验证失败，请重试');
    } finally {
      setVerifying(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleVerify();
  };

  if (!isUnlocked) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-xl">管理中心</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">请输入管理密码以继续</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="password"
              placeholder="请输入密码"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(''); }}
              onKeyDown={handleKeyDown}
              autoFocus
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button className="w-full" onClick={handleVerify} disabled={verifying || !password.trim()}>
              {verifying ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />验证中...</> : '确认'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <ScrollArea className="h-full">
        <div className="w-full max-w-6xl mx-auto p-6 pb-12">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">管理中心</h1>
          <p className="text-muted-foreground mt-1">
            维护硬件资源库、执行机构与PPT母版
          </p>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <TabsList className={`grid w-full max-w-5xl ${isAdmin ? 'grid-cols-9' : 'grid-cols-8'}`}>
            <TabsTrigger value="cameras" className="gap-2">
              <Camera className="h-4 w-4" />
              相机
            </TabsTrigger>
            <TabsTrigger value="lenses" className="gap-2">
              <CircleDot className="h-4 w-4" />
              镜头
            </TabsTrigger>
            <TabsTrigger value="lights" className="gap-2">
              <Lightbulb className="h-4 w-4" />
              光源
            </TabsTrigger>
            <TabsTrigger value="controllers" className="gap-2">
              <Monitor className="h-4 w-4" />
              工控机
            </TabsTrigger>
            <TabsTrigger value="mechanisms" className="gap-2">
              <Cog className="h-4 w-4" />
              执行机构
            </TabsTrigger>
            <TabsTrigger value="templates" className="gap-2">
              <FileText className="h-4 w-4" />
              PPT母版
            </TabsTrigger>
            <TabsTrigger value="image-migration" className="gap-2">
              <CloudUpload className="h-4 w-4" />
              图片迁移
            </TabsTrigger>
            <TabsTrigger value="data-migration" className="gap-2">
              <Database className="h-4 w-4" />
              数据迁移
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="users" className="gap-2">
                <Users className="h-4 w-4" />
                用户管理
              </TabsTrigger>
            )}
          </TabsList>
          
          <div className="mt-6">
            <TabsContent value="cameras">
              <HardwareResourceManager type="cameras" />
            </TabsContent>
            <TabsContent value="lenses">
              <HardwareResourceManager type="lenses" />
            </TabsContent>
            <TabsContent value="lights">
              <HardwareResourceManager type="lights" />
            </TabsContent>
            <TabsContent value="controllers">
              <HardwareResourceManager type="controllers" />
            </TabsContent>
            <TabsContent value="mechanisms">
              <MechanismResourceManager />
            </TabsContent>
            <TabsContent value="templates">
              <PPTTemplateManager />
            </TabsContent>
            <TabsContent value="image-migration">
              <HardwareImageMigration />
            </TabsContent>
            <TabsContent value="data-migration">
              <div className="space-y-6">
                <DataExportTool />
                <StorageMigrationTool />
              </div>
            </TabsContent>
            {isAdmin && (
              <TabsContent value="users">
                <UserManagement />
              </TabsContent>
            )}
          </div>
        </Tabs>
        </div>
      </ScrollArea>
    </div>
  );
}
