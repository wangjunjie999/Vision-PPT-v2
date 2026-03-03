import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useData } from '@/contexts/DataContext';
import { useState, useMemo } from 'react';
import { CheckCircle2, XCircle, Eye, ImageIcon, Layers, Box } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PPTImagePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PPTImagePreviewDialog({ open, onOpenChange }: PPTImagePreviewDialogProps) {
  const {
    selectedProjectId,
    workstations: allWorkstations,
    modules: allModules,
    layouts: allLayouts,
    getProjectWorkstations,
    getWorkstationModules,
  } = useData();

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLabel, setPreviewLabel] = useState('');

  const projectWorkstations = selectedProjectId ? getProjectWorkstations(selectedProjectId) : [];

  const imageData = useMemo(() => {
    let totalSaved = 0;
    let totalMissing = 0;

    const groups = projectWorkstations.map(ws => {
      const layout = allLayouts.find(l => l.workstation_id === ws.id);
      const modules = getWorkstationModules(ws.id);

      const layoutImages = [
        { label: '正视图', url: layout?.front_view_image_url || null },
        { label: '侧视图', url: layout?.side_view_image_url || null },
        { label: '俯视图', url: layout?.top_view_image_url || null },
      ];

      const moduleImages = modules.map(mod => ({
        moduleName: mod.name,
        label: '光学方案图',
        url: (mod as any).schematic_image_url || null,
      }));

      layoutImages.forEach(img => img.url ? totalSaved++ : totalMissing++);
      moduleImages.forEach(img => img.url ? totalSaved++ : totalMissing++);

      return { workstation: ws, layoutImages, moduleImages };
    });

    return { groups, totalSaved, totalMissing };
  }, [projectWorkstations, allLayouts, getWorkstationModules]);

  const handlePreview = (url: string, label: string) => {
    setPreviewUrl(url);
    setPreviewLabel(label);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-primary" />
              PPT 图片预览
            </DialogTitle>
            <DialogDescription>
              检查各工位三视图和模块光学方案图是否已保存完整
            </DialogDescription>
          </DialogHeader>

          {/* Summary */}
          <div className="flex items-center gap-4 text-sm">
            <Badge variant="outline" className="gap-1">
              <CheckCircle2 className="h-3 w-3 text-green-500" />
              已保存: {imageData.totalSaved}
            </Badge>
            <Badge variant="outline" className="gap-1">
              <XCircle className="h-3 w-3 text-destructive" />
              缺失: {imageData.totalMissing}
            </Badge>
          </div>

          <Separator />

          <ScrollArea className="flex-1 pr-2">
            <div className="space-y-6">
              {imageData.groups.map(({ workstation, layoutImages, moduleImages }) => (
                <div key={workstation.id} className="space-y-3">
                  {/* Workstation header */}
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-primary" />
                    <h4 className="font-semibold text-sm">{workstation.name}</h4>
                    <span className="text-xs text-muted-foreground">{workstation.code || ''}</span>
                  </div>

                  {/* Layout views */}
                  <div className="ml-6">
                    <p className="text-xs text-muted-foreground mb-2">三视图</p>
                    <div className="grid grid-cols-3 gap-3">
                      {layoutImages.map((img, i) => (
                        <ImageThumbnail
                          key={i}
                          label={img.label}
                          url={img.url}
                          onPreview={() => img.url && handlePreview(img.url, `${workstation.name} - ${img.label}`)}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Module schematics */}
                  {moduleImages.length > 0 && (
                    <div className="ml-6">
                      <p className="text-xs text-muted-foreground mb-2">模块光学方案图</p>
                      <div className="grid grid-cols-3 gap-3">
                        {moduleImages.map((img, i) => (
                          <ImageThumbnail
                            key={i}
                            label={`${img.moduleName}`}
                            url={img.url}
                            onPreview={() => img.url && handlePreview(img.url, `${img.moduleName} - ${img.label}`)}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  <Separator className="opacity-50" />
                </div>
              ))}

              {imageData.groups.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  当前项目没有工位数据
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Fullsize preview dialog */}
      <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
        <DialogContent className="max-w-5xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{previewLabel}</DialogTitle>
            <DialogDescription>图片预览</DialogDescription>
          </DialogHeader>
          {previewUrl && (
            <div className="flex items-center justify-center overflow-auto">
              <img
                src={previewUrl}
                alt={previewLabel}
                className="max-w-full max-h-[70vh] object-contain rounded-lg border border-border"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function ImageThumbnail({
  label,
  url,
  onPreview,
}: {
  label: string;
  url: string | null;
  onPreview: () => void;
}) {
  const saved = !!url;

  return (
    <div
      className={cn(
        'relative rounded-lg border-2 overflow-hidden aspect-video cursor-pointer group transition-colors',
        saved
          ? 'border-border hover:border-primary/50'
          : 'border-dashed border-muted-foreground/30 bg-muted/30'
      )}
      onClick={saved ? onPreview : undefined}
    >
      {saved ? (
        <>
          <img src={url} alt={label} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
            <Eye className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center h-full gap-1">
          <XCircle className="h-5 w-5 text-muted-foreground/50" />
          <span className="text-[10px] text-muted-foreground/50">未保存</span>
        </div>
      )}

      {/* Label + status */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-white truncate">{label}</span>
          {saved ? (
            <CheckCircle2 className="h-3 w-3 text-green-400 shrink-0" />
          ) : (
            <XCircle className="h-3 w-3 text-red-400 shrink-0" />
          )}
        </div>
      </div>
    </div>
  );
}
