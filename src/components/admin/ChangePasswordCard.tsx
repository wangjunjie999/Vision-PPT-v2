import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { KeyRound, Loader2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/api';

export function ChangePasswordCard() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const handleSubmit = async () => {
    if (!currentPassword.trim() || !newPassword.trim()) return;
    if (newPassword !== confirmPassword) {
      toast.error('两次输入的新密码不一致');
      return;
    }
    if (newPassword.length < 4) {
      toast.error('新密码至少需要4个字符');
      return;
    }

    setSaving(true);
    try {
      // Verify current password first
      const { data: verifyData, error: verifyError } = await api.functions.invoke('verify-admin-password', {
        body: { password: currentPassword.trim() },
      });
      if (verifyError) throw verifyError;
      if (!verifyData?.valid) {
        toast.error('当前密码错误');
        setSaving(false);
        return;
      }

      // Update password in admin_settings
      await api.admin.updateSetting('admin_password', newPassword.trim());

      toast.success('管理密码已更新');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error('Failed to update password:', err);
      toast.error('密码修改失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-primary" />
          <CardTitle>修改访问密码</CardTitle>
        </div>
        <CardDescription>修改管理中心的访问密码</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 max-w-md">
        <div className="space-y-2">
          <Label>当前密码</Label>
          <div className="relative">
            <Input
              type={showCurrent ? 'text' : 'password'}
              placeholder="请输入当前密码"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => setShowCurrent(!showCurrent)}
            >
              {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <div className="space-y-2">
          <Label>新密码</Label>
          <div className="relative">
            <Input
              type={showNew ? 'text' : 'password'}
              placeholder="请输入新密码"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => setShowNew(!showNew)}
            >
              {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <div className="space-y-2">
          <Label>确认新密码</Label>
          <Input
            type="password"
            placeholder="请再次输入新密码"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
          />
        </div>
        <Button onClick={handleSubmit} disabled={saving || !currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()}>
          {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />保存中...</> : '确认修改'}
        </Button>
      </CardContent>
    </Card>
  );
}
