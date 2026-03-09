import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

// 幻灯片映射配置
export interface SlideMapping {
  templateSlideIndex: number;
  slideType: string;
  enabled: boolean;
}

export interface LayoutMappingConfig {
  mappings: SlideMapping[];
  duplicateForEachWorkstation: boolean;
  preserveUnmappedSlides: boolean;
}

// 解析后的幻灯片信息
export interface ParsedSlideInfo {
  index: number;
  detectedType: string;
  customFields: string[];
}

export interface StructureMeta {
  sections: string[];
  layoutMapping?: LayoutMappingConfig;
  parsedSlides?: ParsedSlideInfo[];
}

export interface PPTTemplate {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  version: number;
  file_url: string | null;
  structure_meta: StructureMeta | null;
  scope: string | null;
  is_default: boolean | null;
  enabled: boolean | null;
  background_image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface PPTTemplateInsert {
  name: string;
  description?: string;
  version?: number;
  file_url?: string;
  structure_meta?: StructureMeta;
  scope?: string;
  is_default?: boolean;
  background_image_url?: string;
}

export interface PPTTemplateUpdate {
  name?: string;
  description?: string;
  version?: number;
  file_url?: string;
  structure_meta?: StructureMeta;
  scope?: string;
  is_default?: boolean;
  enabled?: boolean;
  background_image_url?: string;
}

export function usePPTTemplates() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading, error } = useQuery({
    queryKey: ['ppt_templates', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const data = await api.pptTemplates.listByUser(user.id);
      // Cast structure_meta from Json to our expected type
      return (data || []).map(item => ({
        ...item,
        structure_meta: item.structure_meta as unknown as StructureMeta | null,
      })) as PPTTemplate[];
    },
    enabled: !!user?.id,
  });

  const defaultTemplate = templates.find(t => t.is_default) || templates[0] || null;

  const addTemplate = useMutation({
    mutationFn: async (template: PPTTemplateInsert) => {
      if (!user?.id) throw new Error('未登录');

      // If setting as default, clear other defaults first
      if (template.is_default) {
        await api.pptTemplates.updateWhere(
          { user_id: user.id } as any,
          { is_default: false }
        );
      }

      const data = await api.pptTemplates.create({
        name: template.name,
        user_id: user.id,
        description: template.description || null,
        version: template.version || 1,
        file_url: template.file_url || null,
        structure_meta: template.structure_meta as unknown as Json,
        scope: template.scope || null,
        is_default: template.is_default || false,
        background_image_url: template.background_image_url || null,
      } as any);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ppt_templates'] });
      toast.success('模板已添加');
    },
    onError: (error) => {
      toast.error('添加模板失败: ' + error.message);
    },
  });

  const updateTemplate = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: PPTTemplateUpdate }) => {
      if (!user?.id) throw new Error('未登录');

      // If setting as default, clear other defaults first
      if (updates.is_default) {
        await api.pptTemplates.updateWhere(
          { user_id: user.id } as any,
          { is_default: false }
        );
      }

      const { structure_meta, ...restUpdates } = updates;
      
      const data = await api.pptTemplates.update(id, {
        ...restUpdates,
        ...(structure_meta !== undefined && { structure_meta: structure_meta as unknown as Json }),
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ppt_templates'] });
      toast.success('模板已更新');
    },
    onError: (error) => {
      toast.error('更新模板失败: ' + error.message);
    },
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) throw new Error('未登录');

      // Get template to check for file_url (need to fetch first)
      const templates = await api.pptTemplates.listByUser(user.id);
      const template = templates.find(t => t.id === id);

      // Delete file from storage if exists
      if (template?.file_url) {
        const path = template.file_url.split('/ppt-templates/')[1];
        if (path) {
          await api.storage.remove('ppt-templates', [path]);
        }
      }

      await api.pptTemplates.deleteByUser(id, user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ppt_templates'] });
      toast.success('模板已删除');
    },
    onError: (error) => {
      toast.error('删除模板失败: ' + error.message);
    },
  });

  const setDefaultTemplate = useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) throw new Error('未登录');

      // Clear all defaults first
      await api.pptTemplates.updateWhere(
        { user_id: user.id } as any,
        { is_default: false }
      );

      // Set new default
      await api.pptTemplates.update(id, { is_default: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ppt_templates'] });
      toast.success('已设为默认模板');
    },
    onError: (error) => {
      toast.error('设置默认失败: ' + error.message);
    },
  });

  const uploadTemplateFile = async (file: File, templateId: string): Promise<string> => {
    if (!user?.id) throw new Error('未登录');

    const ext = file.name.split('.').pop();
    const path = `${user.id}/${templateId}.${ext}`;

    await api.storage.upload('ppt-templates', path, file, { upsert: true });
    return api.storage.getPublicUrl('ppt-templates', path);
  };

  return {
    templates,
    defaultTemplate,
    isLoading,
    error,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    setDefaultTemplate,
    uploadTemplateFile,
  };
}
