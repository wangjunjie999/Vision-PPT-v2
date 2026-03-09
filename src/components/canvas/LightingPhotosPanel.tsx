/**
 * Lighting Photos Panel
 * Upload and manage up to 4 lighting effect photos per module.
 */
import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Plus, ImageIcon, Loader2, Eye, X } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/api';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

export interface LightingPhoto {
  url: string;
  remark?: string;
  created_at: string;
}

interface LightingPhotosPanelProps {
  moduleId: string;
  moduleName: string;
  photos: LightingPhoto[];
  onUpdate: (photos: LightingPhoto[]) => void;
}

const MAX_PHOTOS = 4;

export function LightingPhotosPanel({ moduleId, moduleName, photos, onUpdate }: LightingPhotosPanelProps) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remaining = MAX_PHOTOS - photos.length;
    if (remaining <= 0) {
      toast.error(`最多上传 ${MAX_PHOTOS} 张打光照片`);
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remaining);
    setUploading(true);

    try {
      const newPhotos: LightingPhoto[] = [];

      for (const file of filesToUpload) {
        const fileName = `lighting-${moduleId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${file.name.split('.').pop()}`;
        await api.storage.upload('module-schematics', fileName, file, { upsert: true });
        const url = api.storage.getPublicUrl('module-schematics', fileName);
        newPhotos.push({ url, remark: '', created_at: new Date().toISOString() });
      }

      const updated = [...photos, ...newPhotos];
      onUpdate(updated);
      toast.success(`已上传 ${newPhotos.length} 张照片`);
    } catch (err) {
      console.error('Upload lighting photo failed:', err);
      toast.error('上传失败');
    } finally {
      setUploading(false);
      // Reset file input
      e.target.value = '';
    }
  }, [moduleId, photos, onUpdate]);

  const handleRemarkChange = useCallback((index: number, remark: string) => {
    const updated = photos.map((p, i) => i === index ? { ...p, remark } : p);
    onUpdate(updated);
  }, [photos, onUpdate]);

  const handleDelete = useCallback(async (index: number) => {
    const photo = photos[index];
    // Try to remove from storage
    try {
      const urlParts = photo.url.split('/');
      const fileName = urlParts[urlParts.length - 1];
      if (fileName.startsWith('lighting-')) {
        await api.storage.remove('module-schematics', [fileName]);
      }
    } catch {
      // Ignore storage removal errors
    }
    const updated = photos.filter((_, i) => i !== index);
    onUpdate(updated);
    toast.success('照片已删除');
  }, [photos, onUpdate]);

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">打光照片</span>
            <span className="text-xs text-muted-foreground">({photos.length}/{MAX_PHOTOS})</span>
          </div>
          {photos.length < MAX_PHOTOS && (
            <label>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileSelect}
                disabled={uploading}
              />
              <Button variant="outline" size="sm" className="gap-1 cursor-pointer" asChild disabled={uploading}>
                <span>
                  {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                  添加照片
                </span>
              </Button>
            </label>
          )}
        </div>

        {photos.length === 0 ? (
          <label className="flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/30 rounded-lg p-6 cursor-pointer hover:border-primary/50 transition-colors">
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileSelect}
              disabled={uploading}
            />
            {uploading ? (
              <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
            ) : (
              <>
                <ImageIcon className="h-8 w-8 text-muted-foreground/50 mb-2" />
                <span className="text-xs text-muted-foreground">点击或拖拽上传打光效果照片（最多{MAX_PHOTOS}张）</span>
              </>
            )}
          </label>
        ) : (
          <div className={cn(
            'grid gap-3',
            photos.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
          )}>
            {photos.map((photo, index) => (
              <div key={index} className="group relative rounded-lg border border-border overflow-hidden bg-muted/30">
                <div
                  className="aspect-video cursor-pointer relative"
                  onClick={() => setPreviewUrl(photo.url)}
                >
                  <img
                    src={photo.url}
                    alt={photo.remark || `打光照片 ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                    <Eye className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
                <div className="p-2 flex items-center gap-2">
                  <Input
                    value={photo.remark || ''}
                    onChange={(e) => handleRemarkChange(index, e.target.value)}
                    placeholder="备注（如：正面环形光）"
                    className="h-7 text-xs"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(index)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preview dialog */}
      <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{moduleName} - 打光照片预览</DialogTitle>
            <DialogDescription>查看大图</DialogDescription>
          </DialogHeader>
          {previewUrl && (
            <img
              src={previewUrl}
              alt="打光照片"
              className="w-full max-h-[70vh] object-contain rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
