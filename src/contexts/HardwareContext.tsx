import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '@/api';
import type { DbCamera, DbLens, DbLight, DbController } from '@/api/types';
import { toast } from 'sonner';

// Re-export types for backwards compatibility
export type Camera = DbCamera;
export type Lens = DbLens;
export type Light = DbLight;
export type Controller = DbController;

interface HardwareContextType {
  cameras: Camera[];
  lenses: Lens[];
  lights: Light[];
  controllers: Controller[];
  loading: boolean;
  
  addCamera: (camera: Omit<Camera, 'id' | 'created_at' | 'updated_at'>) => Promise<Camera>;
  updateCamera: (id: string, updates: Partial<Camera>) => Promise<Camera>;
  deleteCamera: (id: string) => Promise<void>;
  
  addLens: (lens: Omit<Lens, 'id' | 'created_at' | 'updated_at'>) => Promise<Lens>;
  updateLens: (id: string, updates: Partial<Lens>) => Promise<Lens>;
  deleteLens: (id: string) => Promise<void>;
  
  addLight: (light: Omit<Light, 'id' | 'created_at' | 'updated_at'>) => Promise<Light>;
  updateLight: (id: string, updates: Partial<Light>) => Promise<Light>;
  deleteLight: (id: string) => Promise<void>;
  
  addController: (controller: Omit<Controller, 'id' | 'created_at' | 'updated_at'>) => Promise<Controller>;
  updateController: (id: string, updates: Partial<Controller>) => Promise<Controller>;
  deleteController: (id: string) => Promise<void>;
  
  refetch: () => Promise<void>;
}

const HardwareContext = createContext<HardwareContextType | null>(null);

export function HardwareProvider({ children }: { children: React.ReactNode }) {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [lenses, setLenses] = useState<Lens[]>([]);
  const [lights, setLights] = useState<Light[]>([]);
  const [controllers, setControllers] = useState<Controller[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Fetching hardware data...');
      
      const [camerasResult, lensesResult, lightsResult, controllersResult] = await Promise.allSettled([
        api.hardware.listCameras(),
        api.hardware.listLenses(),
        api.hardware.listLights(),
        api.hardware.listControllers(),
      ]);

      const errorMessages: string[] = [];

      if (camerasResult.status === 'fulfilled') {
        console.log(`Loaded ${camerasResult.value.length} cameras`);
        setCameras(camerasResult.value);
      } else {
        console.error('相机请求失败:', camerasResult.reason);
        errorMessages.push('相机: 请求失败');
        setCameras([]);
      }

      if (lensesResult.status === 'fulfilled') {
        console.log(`Loaded ${lensesResult.value.length} lenses`);
        setLenses(lensesResult.value);
      } else {
        console.error('镜头请求失败:', lensesResult.reason);
        errorMessages.push('镜头: 请求失败');
        setLenses([]);
      }

      if (lightsResult.status === 'fulfilled') {
        console.log(`Loaded ${lightsResult.value.length} lights`);
        setLights(lightsResult.value);
      } else {
        console.error('光源请求失败:', lightsResult.reason);
        errorMessages.push('光源: 请求失败');
        setLights([]);
      }

      if (controllersResult.status === 'fulfilled') {
        console.log(`Loaded ${controllersResult.value.length} controllers`);
        setControllers(controllersResult.value);
      } else {
        console.error('控制器请求失败:', controllersResult.reason);
        errorMessages.push('控制器: 请求失败');
        setControllers([]);
      }

      if (errorMessages.length > 0) {
        console.error('Hardware loading errors:', errorMessages);
        toast.error(`部分硬件数据加载失败: ${errorMessages.join(', ')}`);
      }
    } catch (err) {
      console.error('Failed to fetch hardware data:', err);
      toast.error('硬件数据加载失败，请刷新页面重试');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Camera CRUD
  const addCamera = useCallback(async (camera: Omit<Camera, 'id' | 'created_at' | 'updated_at'>) => {
    const data = await api.hardware.addCamera(camera);
    setCameras(prev => [...prev, data]);
    toast.success('相机添加成功');
    return data;
  }, []);

  const updateCamera = useCallback(async (id: string, updates: Partial<Camera>) => {
    const data = await api.hardware.updateCamera(id, updates);
    setCameras(prev => prev.map(c => c.id === id ? data : c));
    toast.success('相机更新成功');
    return data;
  }, []);

  const deleteCamera = useCallback(async (id: string) => {
    await api.hardware.deleteCamera(id);
    setCameras(prev => prev.filter(c => c.id !== id));
    toast.success('相机删除成功');
  }, []);

  // Lens CRUD
  const addLens = useCallback(async (lens: Omit<Lens, 'id' | 'created_at' | 'updated_at'>) => {
    const data = await api.hardware.addLens(lens);
    setLenses(prev => [...prev, data]);
    toast.success('镜头添加成功');
    return data;
  }, []);

  const updateLens = useCallback(async (id: string, updates: Partial<Lens>) => {
    const data = await api.hardware.updateLens(id, updates);
    setLenses(prev => prev.map(l => l.id === id ? data : l));
    toast.success('镜头更新成功');
    return data;
  }, []);

  const deleteLens = useCallback(async (id: string) => {
    await api.hardware.deleteLens(id);
    setLenses(prev => prev.filter(l => l.id !== id));
    toast.success('镜头删除成功');
  }, []);

  // Light CRUD
  const addLight = useCallback(async (light: Omit<Light, 'id' | 'created_at' | 'updated_at'>) => {
    const data = await api.hardware.addLight(light);
    setLights(prev => [...prev, data]);
    toast.success('光源添加成功');
    return data;
  }, []);

  const updateLight = useCallback(async (id: string, updates: Partial<Light>) => {
    const data = await api.hardware.updateLight(id, updates);
    setLights(prev => prev.map(l => l.id === id ? data : l));
    toast.success('光源更新成功');
    return data;
  }, []);

  const deleteLight = useCallback(async (id: string) => {
    await api.hardware.deleteLight(id);
    setLights(prev => prev.filter(l => l.id !== id));
    toast.success('光源删除成功');
  }, []);

  // Controller CRUD
  const addController = useCallback(async (controller: Omit<Controller, 'id' | 'created_at' | 'updated_at'>) => {
    const data = await api.hardware.addController(controller);
    setControllers(prev => [...prev, data]);
    toast.success('控制器添加成功');
    return data;
  }, []);

  const updateController = useCallback(async (id: string, updates: Partial<Controller>) => {
    const data = await api.hardware.updateController(id, updates);
    setControllers(prev => prev.map(c => c.id === id ? data : c));
    toast.success('控制器更新成功');
    return data;
  }, []);

  const deleteController = useCallback(async (id: string) => {
    await api.hardware.deleteController(id);
    setControllers(prev => prev.filter(c => c.id !== id));
    toast.success('控制器删除成功');
  }, []);

  const value = useMemo(() => ({
    cameras, lenses, lights, controllers, loading,
    addCamera, updateCamera, deleteCamera,
    addLens, updateLens, deleteLens,
    addLight, updateLight, deleteLight,
    addController, updateController, deleteController,
    refetch: fetchAll,
  }), [
    cameras, lenses, lights, controllers, loading,
    addCamera, updateCamera, deleteCamera,
    addLens, updateLens, deleteLens,
    addLight, updateLight, deleteLight,
    addController, updateController, deleteController,
    fetchAll,
  ]);

  return (
    <HardwareContext.Provider value={value}>
      {children}
    </HardwareContext.Provider>
  );
}

export function useHardware() {
  const context = useContext(HardwareContext);
  if (!context) {
    throw new Error('useHardware must be used within a HardwareProvider');
  }
  return context;
}

// Convenience hooks for backwards compatibility
export function useCameras() {
  const { cameras, loading, addCamera, updateCamera, deleteCamera, refetch } = useHardware();
  return { cameras, loading, error: null, fetchCameras: refetch, addCamera, updateCamera, deleteCamera };
}

export function useLenses() {
  const { lenses, loading, addLens, updateLens, deleteLens, refetch } = useHardware();
  return { lenses, loading, error: null, fetchLenses: refetch, addLens, updateLens, deleteLens };
}

export function useLights() {
  const { lights, loading, addLight, updateLight, deleteLight, refetch } = useHardware();
  return { lights, loading, error: null, fetchLights: refetch, addLight, updateLight, deleteLight };
}

export function useControllers() {
  const { controllers, loading, addController, updateController, deleteController, refetch } = useHardware();
  return { controllers, loading, error: null, fetchControllers: refetch, addController, updateController, deleteController };
}

// Keep image upload utility - uses storage adapter
export function useHardwareImageUpload() {
  const uploadImage = async (file: File, type: 'cameras' | 'lenses' | 'lights' | 'controllers'): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${type}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const { path } = await api.storage.upload('hardware-images', fileName, file);
    return api.storage.getPublicUrl('hardware-images', path);
  };

  return { uploadImage };
}
