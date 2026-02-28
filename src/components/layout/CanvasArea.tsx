import { useData } from '@/contexts/DataContext';
import { useAppStore } from '@/store/useAppStore';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { EmptyState } from '../canvas/EmptyState';
import { ProjectDashboard } from '../canvas/ProjectDashboard';
import { WorkstationCanvas } from '../canvas/WorkstationCanvas';
import { ModuleSchematic } from '../canvas/ModuleSchematic';
import { AnnotationEditor } from '../canvas/AnnotationEditor';

export function CanvasArea() {
  const { selectedProjectId, selectedWorkstationId, selectedModuleId } = useData();
  const { annotationMode } = useAppStore();

  // Annotation mode takes priority
  if (annotationMode) {
    return (
      <ErrorBoundary fallbackTitle="标注编辑器加载失败">
        <AnnotationEditor />
      </ErrorBoundary>
    );
  }

  // Determine what to show - Module view shows 2D workstation schematic
  if (selectedModuleId) {
    return (
      <ErrorBoundary
        fallbackTitle="视觉系统示意图加载失败"
        context={{ moduleId: selectedModuleId, workstationId: selectedWorkstationId || undefined }}
      >
        <ModuleSchematic />
      </ErrorBoundary>
    );
  }
  
  if (selectedWorkstationId) {
    return (
      <ErrorBoundary
        fallbackTitle="工位布局画布加载失败"
        context={{ workstationId: selectedWorkstationId }}
      >
        <WorkstationCanvas />
      </ErrorBoundary>
    );
  }
  
  if (selectedProjectId) {
    return (
      <ErrorBoundary
        fallbackTitle="项目仪表盘加载失败"
        context={{ projectId: selectedProjectId }}
      >
        <ProjectDashboard />
      </ErrorBoundary>
    );
  }
  
  return <EmptyState />;
}
