import { useState, useCallback } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { AnnotationCanvas, Annotation } from '@/components/product/AnnotationCanvas';
import {
  ArrowLeft,
  Save,
  Loader2,
  Edit3,
} from 'lucide-react';

export function AnnotationEditor() {
  const { user } = useAuth();
  const { annotationSnapshot, annotationAssetId, exitAnnotationMode } = useAppStore();
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveRemark, setSaveRemark] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = useCallback(async () => {
    if (!annotationSnapshot || !annotationAssetId || !user) return;

    setSaving(true);
    try {
      // Upload snapshot to storage
      const blob = await fetch(annotationSnapshot).then(r => r.blob());
      const path = `annotations/${annotationAssetId}/${Date.now()}.png`;
      const { error: uploadError } = await supabase.storage
        .from('product-snapshots')
        .upload(path, blob, { contentType: 'image/png' });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('product-snapshots').getPublicUrl(path);
      const snapshotUrl = urlData.publicUrl;

      // Get next version
      const { data: existing } = await supabase
        .from('product_annotations')
        .select('version')
        .eq('asset_id', annotationAssetId)
        .order('version', { ascending: false })
        .limit(1);

      const nextVersion = existing && existing.length > 0
        ? existing[0].version + 1
        : 1;

      // Insert annotation record
      const { error } = await supabase.from('product_annotations').insert({
        asset_id: annotationAssetId,
        snapshot_url: snapshotUrl,
        annotations_json: annotations as unknown as any,
        view_meta: { viewName: `版本${nextVersion}` },
        version: nextVersion,
        remark: saveRemark || null,
        user_id: user.id,
      });

      if (error) throw error;

      setSaveDialogOpen(false);
      setSaveRemark('');
      toast.success('标注已保存');
      // Stay in annotation mode so user can see records panel update
    } catch (error) {
      console.error('Save annotation failed:', error);
      toast.error('保存失败');
    } finally {
      setSaving(false);
    }
  }, [annotationSnapshot, annotationAssetId, annotations, saveRemark, user]);

  if (!annotationSnapshot) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p>没有截图数据</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Top toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-card/50">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={exitAnnotationMode} className="gap-1">
            <ArrowLeft className="h-4 w-4" />
            返回
          </Button>
          <span className="text-sm text-muted-foreground">|</span>
          <div className="flex items-center gap-1 text-sm font-medium">
            <Edit3 className="h-4 w-4 text-primary" />
            截图标注
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            已标注 {annotations.length} 个特征
          </span>
          <Button
            size="sm"
            onClick={() => setSaveDialogOpen(true)}
            disabled={annotations.length === 0}
            className="gap-1"
          >
            <Save className="h-4 w-4" />
            保存标注
          </Button>
        </div>
      </div>

      {/* Canvas area - fill remaining space */}
      <div className="flex-1 p-4 overflow-hidden">
        <div className="h-full">
          <AnnotationCanvas
            imageUrl={annotationSnapshot}
            annotations={annotations}
            onChange={setAnnotations}
            readOnly={false}
            fillContainer
          />
        </div>
      </div>

      {/* Save dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>保存标注记录</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>备注（可选）</Label>
              <Textarea
                value={saveRemark}
                onChange={(e) => setSaveRemark(e.target.value)}
                placeholder="描述本次标注内容..."
                rows={3}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              共 {annotations.length} 个标注项将被保存
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              确认保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
