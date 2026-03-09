import { supabase } from '@/integrations/supabase/client';
import type {
  IUserRoleApi, IDocumentApi, IProductAssetApi,
  IAnnotationApi, IPPTTemplateApi,
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
    async delete(id) {
      const { error } = await supabase.from('ppt_templates').delete().eq('id', id);
      if (error) throw error;
    },
  };
}
