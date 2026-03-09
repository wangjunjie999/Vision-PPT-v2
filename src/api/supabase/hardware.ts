import { supabase } from '@/integrations/supabase/client';
import type { IHardwareApi } from '../types';

export function createSupabaseHardwareApi(): IHardwareApi {
  return {
    // Cameras
    async listCameras() {
      const { data, error } = await supabase.from('cameras').select('*').order('brand', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    async addCamera(camera) {
      const { data, error } = await supabase.from('cameras').insert(camera).select().single();
      if (error) throw error;
      return data;
    },
    async updateCamera(id, updates) {
      const { data, error } = await supabase.from('cameras').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    async deleteCamera(id) {
      const { error } = await supabase.from('cameras').delete().eq('id', id);
      if (error) throw error;
    },

    // Lenses
    async listLenses() {
      const { data, error } = await supabase.from('lenses').select('*').order('brand', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    async addLens(lens) {
      const { data, error } = await supabase.from('lenses').insert(lens).select().single();
      if (error) throw error;
      return data;
    },
    async updateLens(id, updates) {
      const { data, error } = await supabase.from('lenses').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    async deleteLens(id) {
      const { error } = await supabase.from('lenses').delete().eq('id', id);
      if (error) throw error;
    },

    // Lights
    async listLights() {
      const { data, error } = await supabase.from('lights').select('*').order('brand', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    async addLight(light) {
      const { data, error } = await supabase.from('lights').insert(light).select().single();
      if (error) throw error;
      return data;
    },
    async updateLight(id, updates) {
      const { data, error } = await supabase.from('lights').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    async deleteLight(id) {
      const { error } = await supabase.from('lights').delete().eq('id', id);
      if (error) throw error;
    },

    // Controllers
    async listControllers() {
      const { data, error } = await supabase.from('controllers').select('*').order('brand', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    async addController(controller) {
      const { data, error } = await supabase.from('controllers').insert(controller).select().single();
      if (error) throw error;
      return data;
    },
    async updateController(id, updates) {
      const { data, error } = await supabase.from('controllers').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    async deleteController(id) {
      const { error } = await supabase.from('controllers').delete().eq('id', id);
      if (error) throw error;
    },

    // Mechanisms
    async listMechanisms() {
      const { data, error } = await supabase.from('mechanisms').select('*').order('name', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    async addMechanism(mechanism) {
      const { data, error } = await supabase.from('mechanisms').insert(mechanism as any).select().single();
      if (error) throw error;
      return data;
    },
    async updateMechanism(id, updates) {
      const { data, error } = await supabase.from('mechanisms').update(updates as any).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    async deleteMechanism(id) {
      const { error } = await supabase.from('mechanisms').delete().eq('id', id);
      if (error) throw error;
    },
  };
}
