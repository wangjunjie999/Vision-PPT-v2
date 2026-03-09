import { supabase } from '@/integrations/supabase/client';
import type {
  IUserRoleApi, IDocumentApi, IProductAssetApi,
  IAnnotationApi, IPPTTemplateApi, IAdminApi, IHardwareBulkApi,
  DbProductAsset, DbProductAnnotation, DbGeneratedDocument, DbPPTTemplate,
} from '../types';
import type { Database, Json } from '@/integrations/supabase/types';

export function createSupabaseUserRoleApi(): IUserRoleApi {
  return {
    async getUserRole(userId, role) {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .eq('role', role as Database['public']['Enums']['app_role'])
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  };
}

export function createSupabaseDocumentApi(): IDocumentApi {
  return {
    async list(projectId) {
      const { data, error } = await supabase
        .from('generated_documents')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as DbGeneratedDocument[];
    },
    async create(insertData) {
      const { data, error } = await supabase
        .from('generated_documents')
        .insert({ ...insertData, metadata: (insertData.metadata || {}) as Json })
        .select()
        .single();
      if (error) throw error;
      return data as DbGeneratedDocument;
    },
    async delete(id) {
      const { error } = await supabase.from('generated_documents').delete().eq('id', id);
      if (error) throw error;
    },
  };
}

export function createSupabaseProductAssetApi(): IProductAssetApi {
  return {
    async get(workstationId) {
      const { data, error } = await supabase
        .from('product_assets')
        .select('*')
        .eq('workstation_id', workstationId)
        .eq('scope_type', 'workstation')
        .maybeSingle();
      if (error) throw error;
      return data as DbProductAsset | null;
    },
    async getByModule(moduleId) {
      const { data, error } = await supabase
        .from('product_assets')
        .select('*')
        .eq('module_id', moduleId)
        .eq('scope_type', 'module')
        .maybeSingle();
      if (error) throw error;
      return data as DbProductAsset | null;
    },
    async create(insertData) {
      const { data, error } = await supabase
        .from('product_assets')
        .insert({
          ...insertData,
          preview_images: (insertData.preview_images || []) as Json,
          product_models: (insertData.product_models || []) as Json,
          detection_requirements: (insertData.detection_requirements || []) as Json,
        })
        .select()
        .single();
      if (error) throw error;
      return data as DbProductAsset;
    },
    async update(id, updates) {
      const castUpdates: Record<string, unknown> = { ...updates };
      if (updates.preview_images) castUpdates.preview_images = updates.preview_images as Json;
      if (updates.product_models) castUpdates.product_models = updates.product_models as Json;
      if (updates.detection_requirements) castUpdates.detection_requirements = updates.detection_requirements as Json;
      const { data, error } = await supabase
        .from('product_assets')
        .update(castUpdates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as DbProductAsset;
    },
    async delete(id) {
      const { error } = await supabase.from('product_assets').delete().eq('id', id);
      if (error) throw error;
    },
    async listByWorkstations(wsIds) {
      if (wsIds.length === 0) return [];
      const { data, error } = await supabase
        .from('product_assets')
        .select('*')
        .in('workstation_id', wsIds);
      if (error) throw error;
      return (data || []) as DbProductAsset[];
    },
    async listByUserAndScope(userId, wsIds, modIds) {
      if (wsIds.length === 0 && modIds.length === 0) return [];
      const { data, error } = await supabase
        .from('product_assets')
        .select('*')
        .eq('user_id', userId)
        .or(`workstation_id.in.(${wsIds.join(',')}),module_id.in.(${modIds.join(',')})`);
      if (error) throw error;
      return (data || []) as DbProductAsset[];
    },
  };
}

export function createSupabaseAnnotationApi(): IAnnotationApi {
  return {
    async list(assetId) {
      const { data, error } = await supabase
        .from('product_annotations')
        .select('*')
        .eq('asset_id', assetId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as DbProductAnnotation[];
    },
    async listByWorkstations(wsIds) {
      if (wsIds.length === 0) return [];
      const { data, error } = await supabase
        .from('product_annotations')
        .select('*')
        .in('workstation_id', wsIds)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as DbProductAnnotation[];
    },
    async listByUser(userId, assetIds) {
      if (assetIds.length === 0) return [];
      const { data, error } = await supabase
        .from('product_annotations')
        .select('*')
        .eq('user_id', userId)
        .in('asset_id', assetIds);
      if (error) throw error;
      return (data || []) as DbProductAnnotation[];
    },
    async listByAssetAndWorkstation(assetId, workstationId) {
      let query = supabase
        .from('product_annotations')
        .select('*')
        .eq('asset_id', assetId);
      if (workstationId) {
        query = query.eq('workstation_id', workstationId);
      }
      const { data, error } = await query.order('version', { ascending: false });
      if (error) throw error;
      return (data || []) as DbProductAnnotation[];
    },
    async getLatestVersion(assetId) {
      const { data, error } = await supabase
        .from('product_annotations')
        .select('version')
        .eq('asset_id', assetId)
        .order('version', { ascending: false })
        .limit(1);
      if (error) throw error;
      return data && data.length > 0 ? data[0].version : 0;
    },
    async create(insertData) {
      const { data, error } = await supabase
        .from('product_annotations')
        .insert({
          ...insertData,
          annotations_json: (insertData.annotations_json || []) as Json,
          view_meta: (insertData.view_meta || {}) as Json,
        })
        .select()
        .single();
      if (error) throw error;
      return data as DbProductAnnotation;
    },
    async update(id, updates) {
      const castUpdates: Record<string, unknown> = { ...updates };
      if (updates.annotations_json) castUpdates.annotations_json = updates.annotations_json as Json;
      if (updates.view_meta) castUpdates.view_meta = updates.view_meta as Json;
      const { data, error } = await supabase
        .from('product_annotations')
        .update(castUpdates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as DbProductAnnotation;
    },
    async delete(id) {
      const { error } = await supabase.from('product_annotations').delete().eq('id', id);
      if (error) throw error;
    },
  };
}

export function createSupabasePPTTemplateApi(): IPPTTemplateApi {
  return {
    async list() {
      const { data, error } = await supabase
        .from('ppt_templates')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as DbPPTTemplate[];
    },
    async listByUser(userId) {
      const { data, error } = await supabase
        .from('ppt_templates')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as DbPPTTemplate[];
    },
    async create(insertData) {
      const { data, error } = await supabase
        .from('ppt_templates')
        .insert({ ...insertData, structure_meta: (insertData.structure_meta || {}) as Json })
        .select()
        .single();
      if (error) throw error;
      return data as DbPPTTemplate;
    },
    async update(id, updates) {
      const castUpdates: Record<string, unknown> = { ...updates };
      if (updates.structure_meta) castUpdates.structure_meta = updates.structure_meta as Json;
      const { data, error } = await supabase
        .from('ppt_templates')
        .update(castUpdates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as DbPPTTemplate;
    },
    async updateWhere(filter, data) {
      let query = supabase.from('ppt_templates').update(data as Record<string, unknown>);
      if (filter.user_id) query = query.eq('user_id', filter.user_id);
      if (filter.id) query = query.neq('id', filter.id);
      const { error } = await query;
      if (error) throw error;
    },
    async delete(id) {
      const { error } = await supabase.from('ppt_templates').delete().eq('id', id);
      if (error) throw error;
    },
    async deleteByUser(id, userId) {
      const { error } = await supabase
        .from('ppt_templates')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);
      if (error) throw error;
    },
  };
}

export function createSupabaseAdminApi(): IAdminApi {
  return {
    async updateSetting(key, value) {
      const { error } = await supabase
        .from('admin_settings')
        .update({ value })
        .eq('key', key);
      if (error) throw error;
    },
  };
}

export function createSupabaseHardwareBulkApi(): IHardwareBulkApi {
  return {
    async bulkInsert(type, items) {
      const tableName = type as 'cameras' | 'lenses' | 'lights' | 'controllers';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await supabase.from(tableName).insert(items as any);
      if (error) throw error;
    },
  };
}
