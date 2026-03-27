import { useMemo } from 'react';
import { useData } from '@/contexts/DataContext';
import { useHardware } from '@/contexts/HardwareContext';

export interface ValidationIssue {
  severity: 'error' | 'warning' | 'info';
  category: 'hardware' | 'timing' | 'completeness';
  message: string;
  workstationId?: string;
  moduleId?: string;
  fix?: string;
}

export function useConfigValidation(projectId: string | null) {
  const { workstations, modules, layouts, getProjectWorkstations, getWorkstationModules } = useData();
  const { cameras, lenses, lights } = useHardware();

  const issues = useMemo<ValidationIssue[]>(() => {
    if (!projectId) return [];
    const result: ValidationIssue[] = [];
    const projectWs = getProjectWorkstations(projectId);

    for (const ws of projectWs) {
      const wsModules = getWorkstationModules(ws.id);
      const layout = layouts.find(l => l.workstation_id === ws.id);

      // Check: workstation has no modules
      if (wsModules.length === 0) {
        result.push({
          severity: 'warning',
          category: 'completeness',
          message: `工位「${ws.name}」尚未添加功能模块`,
          workstationId: ws.id,
          fix: '添加至少一个功能模块',
        });
      }

      // Check: no layout
      if (!layout) {
        result.push({
          severity: 'warning',
          category: 'completeness',
          message: `工位「${ws.name}」尚未配置机械布局`,
          workstationId: ws.id,
          fix: '进入工位配置布局',
        });
      }

      // Check: cycle time
      if (ws.cycle_time) {
        const totalProcessingTime = wsModules.reduce((acc, m) => {
          return acc + ((m as any).processing_time_limit || 0);
        }, 0);
        if (totalProcessingTime > 0 && totalProcessingTime > Number(ws.cycle_time) * 1000) {
          result.push({
            severity: 'error',
            category: 'timing',
            message: `工位「${ws.name}」模块处理时间 (${totalProcessingTime}ms) 超过节拍 (${ws.cycle_time}s)`,
            workstationId: ws.id,
            fix: '优化模块处理时间或增大节拍',
          });
        }
      }

      // Check hardware compatibility per module
      for (const mod of wsModules) {
        const selectedCameraModel = (mod as any).selected_camera;
        const selectedLensModel = (mod as any).selected_lens;

        if (selectedCameraModel && selectedLensModel) {
          const camera = cameras.find(c => `${c.brand} ${c.model}` === selectedCameraModel);
          const lens = lenses.find(l => `${l.brand} ${l.model}` === selectedLensModel);
          if (camera && lens) {
            // Check mount compatibility
            const compatibleModels = lens.compatible_cameras || [];
            if (compatibleModels.length > 0 && !compatibleModels.includes(camera.model)) {
              result.push({
                severity: 'error',
                category: 'hardware',
                message: `模块「${mod.name}」的镜头 ${lens.model} 与相机 ${camera.model} 不兼容`,
                workstationId: ws.id,
                moduleId: mod.id,
                fix: '更换兼容的镜头或相机',
              });
            }
          }
        }

        // Check: module missing camera selection
        if (!selectedCameraModel) {
          result.push({
            severity: 'info',
            category: 'completeness',
            message: `模块「${mod.name}」尚未选择相机`,
            workstationId: ws.id,
            moduleId: mod.id,
          });
        }
      }
    }

    return result;
  }, [projectId, workstations, modules, layouts, cameras, lenses, lights, getProjectWorkstations, getWorkstationModules]);

  const healthScore = useMemo(() => {
    if (issues.length === 0) return 100;
    const errorCount = issues.filter(i => i.severity === 'error').length;
    const warningCount = issues.filter(i => i.severity === 'warning').length;
    const infoCount = issues.filter(i => i.severity === 'info').length;
    const penalty = errorCount * 20 + warningCount * 10 + infoCount * 3;
    return Math.max(0, 100 - penalty);
  }, [issues]);

  return { issues, healthScore };
}
