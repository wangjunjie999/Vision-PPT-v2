import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ViewType, UserRole } from '@/types';

// Note: All data CRUD has been moved to DataContext (projects/workstations/layouts/modules)
// and HardwareContext (cameras/lenses/lights/controllers).
// Templates are managed via usePPTTemplates hook.
// This store now only holds UI state.

interface Store {
  // App state
  currentRole: UserRole;
  selectedProjectId: string | null;
  selectedWorkstationId: string | null;
  selectedModuleId: string | null;
  currentView: ViewType;
  isGeneratingPPT: boolean;
  pptProgress: number;
  pptImageQuality: 'standard' | 'high' | 'ultra';
  
  // Annotation mode
  annotationMode: boolean;
  annotationSnapshot: string | null;
  annotationSnapshotIsObjectUrl: boolean;
  annotationAssetId: string | null;
  annotationScope: 'workstation' | 'module';
  annotationWorkstationId: string | null;
  annotationExistingData: { annotations: Array<{ id: string; type: string; x: number; y: number; number?: number; name: string; category: string; description: string; width?: number; height?: number; radius?: number }>; remark: string | null; recordId: string } | null;
  
  // AI Form Fill from chat
  pendingAIFill: { targetType: 'project' | 'workstation' | 'module'; targetId: string; fields: Record<string, string> } | null;
  setPendingAIFill: (fill: { targetType: 'project' | 'workstation' | 'module'; targetId: string; fields: Record<string, string> } | null) => void;
  
  enterAnnotationMode: (snapshot: string, assetId: string, scope: 'workstation' | 'module', workstationId?: string, existingData?: { annotations: any[]; remark: string | null; recordId: string }) => void;
  exitAnnotationMode: () => void;
  
  // Atomic switch from viewer to annotation (prevents objectURL revocation race)
  switchViewerToAnnotation: (snapshot: string, isObjectUrl: boolean, assetId: string, scope: 'workstation' | 'module', workstationId?: string) => void;
  
  // Viewer mode (3D/image in central canvas)
  viewerMode: boolean;
  viewerAssetData: { modelUrl: string | null; imageUrls: string[]; assetId: string; scope: 'workstation' | 'module' } | null;
  enterViewerMode: (modelUrl: string | null, imageUrls: string[], assetId: string, scope: 'workstation' | 'module') => void;
  exitViewerMode: () => void;
  
  // Quality mapping helper
  getPixelRatio: () => number;
  
  // Actions
  setCurrentRole: (role: UserRole) => void;
  selectProject: (id: string | null) => void;
  selectWorkstation: (id: string | null) => void;
  selectModule: (id: string | null) => void;
  setCurrentView: (view: ViewType) => void;
  setPPTImageQuality: (quality: 'standard' | 'high' | 'ultra') => void;
  
  // PPT Generation
  startPPTGeneration: () => void;
  updatePPTProgress: (progress: number) => void;
  finishPPTGeneration: () => void;
}

export const useAppStore = create<Store>()(
  persist(
    (set, get) => ({
      // Initial state
      currentRole: 'user',
      selectedProjectId: null,
      selectedWorkstationId: null,
      selectedModuleId: null,
      currentView: 'front',
      isGeneratingPPT: false,
      pptProgress: 0,
      pptImageQuality: 'high',
      
      // Annotation mode
      annotationMode: false,
      annotationSnapshot: null,
      annotationAssetId: null,
      annotationScope: 'workstation',
      annotationWorkstationId: null,
      annotationExistingData: null,
      
      // AI Form Fill
      pendingAIFill: null,
      setPendingAIFill: (fill) => set({ pendingAIFill: fill }),
      
      enterAnnotationMode: (snapshot, assetId, scope, workstationId, existingData) => set({
        annotationMode: true,
        annotationSnapshot: snapshot,
        annotationAssetId: assetId,
        annotationScope: scope,
        annotationWorkstationId: workstationId || null,
        annotationExistingData: existingData || null,
      }),
      exitAnnotationMode: () => set({
        annotationMode: false,
        annotationSnapshot: null,
        annotationAssetId: null,
        annotationWorkstationId: null,
        annotationExistingData: null,
      }),
      
      // Viewer mode
      viewerMode: false,
      viewerAssetData: null,
      enterViewerMode: (modelUrl, imageUrls, assetId, scope) => set({
        viewerMode: true,
        viewerAssetData: { modelUrl, imageUrls, assetId, scope },
      }),
      exitViewerMode: () => set({
        viewerMode: false,
        viewerAssetData: null,
      }),
      
      // Quality mapping helper
      getPixelRatio: () => {
        const quality = get().pptImageQuality;
        switch (quality) {
          case 'standard': return 1.5;
          case 'high': return 2;
          case 'ultra': return 3;
          default: return 2;
        }
      },
      
      // Actions
      setCurrentRole: (role) => set({ currentRole: role }),
      
      selectProject: (id) => set({ 
        selectedProjectId: id, 
        selectedWorkstationId: null, 
        selectedModuleId: null 
      }),
      
      selectWorkstation: (id) => set({ 
        selectedWorkstationId: id, 
        selectedModuleId: null,
        currentView: 'front'
      }),
      
      selectModule: (id) => set({ selectedModuleId: id }),
      
      setCurrentView: (view) => set({ currentView: view }),
      
      setPPTImageQuality: (quality) => set({ pptImageQuality: quality }),
      
      // PPT Generation
      startPPTGeneration: () => set({ isGeneratingPPT: true, pptProgress: 0 }),
      updatePPTProgress: (progress) => set({ pptProgress: progress }),
      finishPPTGeneration: () => set({ isGeneratingPPT: false, pptProgress: 100 }),
    }),
    {
      name: 'vision-config-storage',
      partialize: (state) => {
        const {
          annotationMode,
          annotationSnapshot,
          annotationAssetId,
          annotationScope,
          annotationWorkstationId,
          annotationExistingData,
          viewerMode,
          viewerAssetData,
          pendingAIFill,
          ...rest
        } = state;
        return rest;
      },
    }
  )
);
