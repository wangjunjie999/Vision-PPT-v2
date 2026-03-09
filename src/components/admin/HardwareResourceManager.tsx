import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Plus, Search, Edit, Trash2, Loader2, Camera, CircleDot, Sun, Cpu, Upload } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { HardwareImageUpload } from './HardwareImageUpload';
import { HardwareBulkImport } from './HardwareBulkImport';
import { HardwareDetailView } from './HardwareDetailView';
import { useCameras, useLenses, useLights, useControllers, Camera as CameraType, Lens, Light, Controller } from '@/hooks/useHardware';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Props {
  type: 'cameras' | 'lenses' | 'lights' | 'controllers';
}

const typeConfig = {
  cameras: {
    label: '相机',
    icon: Camera,
    fields: [
      { key: 'brand', label: '品牌', required: true },
      { key: 'model', label: '型号', required: true },
      { key: 'resolution', label: '分辨率', required: true, placeholder: '如: 5472x3648' },
      { key: 'frame_rate', label: '帧率', required: true, type: 'number', placeholder: '如: 30' },
      { key: 'interface', label: '接口', required: true, placeholder: '如: GigE, USB3.0' },
      { key: 'sensor_size', label: '传感器尺寸', required: true, placeholder: '如: 1/1.8"' },
    ],
  },
  lenses: {
    label: '镜头',
    icon: CircleDot,
    fields: [
      { key: 'brand', label: '品牌', required: true },
      { key: 'model', label: '型号', required: true },
      { key: 'focal_length', label: '焦距', required: true, placeholder: '如: 25mm' },
      { key: 'aperture', label: '光圈', required: true, placeholder: '如: F1.4' },
      { key: 'mount', label: '卡口', required: true, placeholder: '如: C-Mount' },
    ],
  },
  lights: {
    label: '光源',
    icon: Sun,
    fields: [
      { key: 'brand', label: '品牌', required: true },
      { key: 'model', label: '型号', required: true },
      { key: 'type', label: '类型', required: true, placeholder: '如: 条形光, 环形光' },
      { key: 'color', label: '颜色', required: true, placeholder: '如: 白光, 红光' },
      { key: 'power', label: '功率', required: true, placeholder: '如: 24W' },
    ],
  },
  controllers: {
    label: '工控机',
    icon: Cpu,
    fields: [
      { key: 'brand', label: '品牌', required: true },
      { key: 'model', label: '型号', required: true },
      { key: 'cpu', label: 'CPU', required: true, placeholder: '如: Intel i7-12700' },
      { key: 'gpu', label: 'GPU', required: false, placeholder: '如: RTX 3060' },
      { key: 'memory', label: '内存', required: true, placeholder: '如: 32GB' },
      { key: 'storage', label: '存储', required: true, placeholder: '如: 512GB SSD' },
      { key: 'performance', label: '性能等级', required: true, placeholder: '如: 高性能' },
    ],
  },
};

type HardwareItem = CameraType | Lens | Light | Controller;

export function HardwareResourceManager({ type }: Props) {
  const { cameras, loading: camerasLoading, addCamera, updateCamera, deleteCamera, fetchCameras } = useCameras();
  const { lenses, loading: lensesLoading, addLens, updateLens, deleteLens, fetchLenses } = useLenses();
  const { lights, loading: lightsLoading, addLight, updateLight, deleteLight, fetchLights } = useLights();
  const { controllers, loading: controllersLoading, addController, updateController, deleteController, fetchControllers } = useControllers();

  const [searchQuery, setSearchQuery] = useState('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<HardwareItem | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const config = typeConfig[type];
  const Icon = config.icon;

  const getItems = (): HardwareItem[] => {
    switch (type) {
      case 'cameras': return cameras;
      case 'lenses': return lenses;
      case 'lights': return lights;
      case 'controllers': return controllers;
    }
  };

  const isLoading = () => {
    switch (type) {
      case 'cameras': return camerasLoading;
      case 'lenses': return lensesLoading;
      case 'lights': return lightsLoading;
      case 'controllers': return controllersLoading;
    }
  };

  const items = getItems();
  const loading = isLoading();

  const filteredItems = items.filter((item) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      item.brand.toLowerCase().includes(searchLower) ||
      item.model.toLowerCase().includes(searchLower) ||
      item.tags?.some((tag) => tag.toLowerCase().includes(searchLower))
    );
  });

  const handleAdd = () => {
    setSelectedItem(null);
    setFormData({ enabled: true, tags: [] });
    setImageUrl(null);
    setEditDialogOpen(true);
  };

  const handleEdit = (item: HardwareItem) => {
    setSelectedItem(item);
    setFormData({ ...item });
    setImageUrl(item.image_url);
    setEditDialogOpen(true);
  };

  const handleDelete = (item: HardwareItem) => {
    setSelectedItem(item);
    setDeleteDialogOpen(true);
  };

  const handleViewDetail = (item: HardwareItem) => {
    setSelectedItem(item);
    setDetailDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedItem) return;
    
    try {
      switch (type) {
        case 'cameras': await deleteCamera(selectedItem.id); break;
        case 'lenses': await deleteLens(selectedItem.id); break;
        case 'lights': await deleteLight(selectedItem.id); break;
        case 'controllers': await deleteController(selectedItem.id); break;
      }
    } finally {
      setDeleteDialogOpen(false);
      setSelectedItem(null);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = {
        ...formData,
        image_url: imageUrl,
        tags: formData.tags || [],
      };

      if (selectedItem) {
        // Update
        switch (type) {
          case 'cameras': await updateCamera(selectedItem.id, data); break;
          case 'lenses': await updateLens(selectedItem.id, data); break;
          case 'lights': await updateLight(selectedItem.id, data); break;
          case 'controllers': await updateController(selectedItem.id, data); break;
        }
      } else {
        // Create
        switch (type) {
          case 'cameras': await addCamera(data as any); break;
          case 'lenses': await addLens(data as any); break;
          case 'lights': await addLight(data as any); break;
          case 'controllers': await addController(data as any); break;
        }
      }
      setEditDialogOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const handleBulkImport = async (items: Record<string, any>[]) => {
    const tableName = type;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase.from(tableName).insert(items as any);
    
    if (error) {
      toast.error('批量导入失败');
      throw error;
    }
    
    // Refetch data
    switch (type) {
      case 'cameras': await fetchCameras(); break;
      case 'lenses': await fetchLenses(); break;
      case 'lights': await fetchLights(); break;
      case 'controllers': await fetchControllers(); break;
    }
  };

  const getItemSpecs = (item: HardwareItem) => {
    switch (type) {
      case 'cameras': {
        const cam = item as CameraType;
        return `${cam.resolution} @ ${cam.frame_rate}fps`;
      }
      case 'lenses': {
        const lens = item as Lens;
        return `${lens.focal_length} ${lens.aperture}`;
      }
      case 'lights': {
        const light = item as Light;
        return `${light.type} - ${light.color}`;
      }
      case 'controllers': {
        const ctrl = item as Controller;
        return `${ctrl.cpu} / ${ctrl.memory}`;
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={`搜索${config.label}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={() => setImportDialogOpen(true)}>
            <Upload className="h-4 w-4" />
            批量导入
          </Button>
          <Button className="gap-2" onClick={handleAdd}>
            <Plus className="h-4 w-4" />
            添加{config.label}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Icon className="h-12 w-12 mb-2 opacity-20" />
          <p>暂无{config.label}数据</p>
          <Button variant="link" onClick={handleAdd}>
            添加第一个{config.label}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <Card 
              key={item.id} 
              className={`cursor-pointer transition-shadow hover:shadow-md ${!item.enabled ? 'opacity-50' : ''}`}
              onClick={() => handleViewDetail(item)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-16 h-16 bg-secondary rounded flex items-center justify-center shrink-0 overflow-hidden">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.model}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Icon className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {item.brand} {item.model}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {getItemSpecs(item)}
                    </p>
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {item.tags?.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="px-1.5 py-0.5 bg-secondary text-[10px] rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleEdit(item)}
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() => handleDelete(item)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit/Add Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedItem ? `编辑${config.label}` : `添加${config.label}`}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Image Upload */}
            <div className="flex items-center gap-4">
              <HardwareImageUpload
                currentUrl={imageUrl}
                type={type}
                onUpload={setImageUrl}
                onRemove={() => setImageUrl(null)}
                uploading={uploading}
                setUploading={setUploading}
              />
              <div className="flex-1">
                <p className="text-sm font-medium">产品图片</p>
                <p className="text-xs text-muted-foreground">
                  支持 JPG, PNG 格式，最大 5MB
                </p>
              </div>
            </div>

            {/* Form Fields */}
            {config.fields.map((field) => (
              <div key={field.key} className="space-y-2">
                <Label>
                  {field.label}
                  {field.required && <span className="text-destructive">*</span>}
                </Label>
                <Input
                  type={field.type || 'text'}
                  placeholder={field.placeholder}
                  value={formData[field.key] || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      [field.key]: field.type === 'number' ? Number(e.target.value) : e.target.value,
                    }))
                  }
                />
              </div>
            ))}

            {/* Tags */}
            <div className="space-y-2">
              <Label>标签（逗号分隔）</Label>
              <Input
                placeholder="如: 高速, 高分辨率"
                value={formData.tags?.join(', ') || ''}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    tags: e.target.value
                      .split(',')
                      .map((t) => t.trim())
                      .filter(Boolean),
                  }))
                }
              />
            </div>

            {/* Enabled Switch */}
            <div className="flex items-center justify-between">
              <Label>启用</Label>
              <Switch
                checked={formData.enabled ?? true}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, enabled: checked }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSave} disabled={saving || uploading}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除 {selectedItem?.brand} {selectedItem?.model} 吗？此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Import Dialog */}
      <HardwareBulkImport
        type={type}
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onImport={handleBulkImport}
      />

      {/* Detail View Dialog */}
      <HardwareDetailView
        type={type}
        item={selectedItem}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
      />
    </div>
  );
}
