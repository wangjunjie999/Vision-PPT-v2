import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect, useCallback } from 'react';
import { Download, Trash2, FileText, FileSpreadsheet, File, Loader2, History } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { format } from 'date-fns';

interface GeneratedDocument {
  id: string;
  project_id: string;
  file_url: string;
  file_name: string;
  file_size: number | null;
  format: string;
  generation_method: string;
  template_id: string | null;
  page_count: number | null;
  metadata: any;
  created_at: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
}

const formatFileSize = (bytes: number | null) => {
  if (!bytes) return '未知';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatIcon = (format: string) => {
  switch (format) {
    case 'ppt': return <FileSpreadsheet className="h-5 w-5 text-orange-500" />;
    case 'word': return <FileText className="h-5 w-5 text-blue-500" />;
    case 'pdf': return <File className="h-5 w-5 text-red-500" />;
    default: return <FileText className="h-5 w-5 text-muted-foreground" />;
  }
};

const formatBadgeVariant = (format: string) => {
  switch (format) {
    case 'ppt': return 'default' as const;
    case 'word': return 'secondary' as const;
    case 'pdf': return 'destructive' as const;
    default: return 'outline' as const;
  }
};

export function GenerationHistoryDialog({ open, onOpenChange, projectId }: Props) {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<GeneratedDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<GeneratedDocument | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchDocuments = useCallback(async () => {
    if (!user?.id || !projectId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('generated_documents')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setDocuments((data as unknown as GeneratedDocument[]) || []);
    } catch (err) {
      console.error('Failed to fetch documents:', err);
      toast.error('加载历史记录失败');
    } finally {
      setLoading(false);
    }
  }, [user?.id, projectId]);

  useEffect(() => {
    if (open) fetchDocuments();
  }, [open, fetchDocuments]);

  const handleDownload = async (doc: GeneratedDocument) => {
    try {
      const { data } = supabase.storage
        .from('generated-documents')
        .getPublicUrl(doc.file_url);
      
      const a = document.createElement('a');
      a.href = data.publicUrl;
      a.download = doc.file_name;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success('开始下载');
    } catch (err) {
      console.error('Download failed:', err);
      toast.error('下载失败');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      // Delete from storage first
      await supabase.storage
        .from('generated-documents')
        .remove([deleteTarget.file_url]);

      // Then delete record
      const { error } = await supabase
        .from('generated_documents')
        .delete()
        .eq('id', deleteTarget.id);

      if (error) throw error;
      
      setDocuments(prev => prev.filter(d => d.id !== deleteTarget.id));
      toast.success('已删除');
    } catch (err) {
      console.error('Delete failed:', err);
      toast.error('删除失败');
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              生成历史记录
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="flex-1 min-h-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : documents.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p className="text-sm">暂无生成记录</p>
                <p className="text-xs mt-1">生成文档后会自动保存到这里</p>
              </div>
            ) : (
              <div className="space-y-2 pr-2">
                {documents.map((doc, idx) => (
                  <div key={doc.id}>
                    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group">
                      {formatIcon(doc.format)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{doc.file_name}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <Badge variant={formatBadgeVariant(doc.format)} className="text-[10px] px-1.5 py-0">
                            {doc.format.toUpperCase()}
                          </Badge>
                          {doc.page_count && <span>{doc.page_count}页</span>}
                          <span>{formatFileSize(doc.file_size)}</span>
                          <span>{format(new Date(doc.created_at), 'MM-dd HH:mm')}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => handleDownload(doc)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget(doc)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {idx < documents.length - 1 && <Separator />}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>删除生成记录</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除 &quot;{deleteTarget?.file_name}&quot; 吗？此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
