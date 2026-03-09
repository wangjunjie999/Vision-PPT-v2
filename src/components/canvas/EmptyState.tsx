import { Button } from '@/components/ui/button';
import { Plus, FolderOpen, Layers, Zap, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { NewProjectDialog } from '@/components/dialogs/NewProjectDialog';

export function EmptyState() {
  const [showNewProject, setShowNewProject] = useState(false);

  return (
    <>
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          {/* Simple icon */}
          <div className="mx-auto mb-6 w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <FolderOpen className="h-8 w-8 text-primary" />
          </div>
          
          <h2 className="text-xl font-semibold text-foreground mb-2 tracking-tight">
            欢迎使用视觉方案配置系统
          </h2>
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            在左侧创建或选择一个项目，开始配置工位机械布局和功能模块视觉方案
          </p>
          
          {/* Feature tags */}
          <div className="flex items-center justify-center gap-3 mb-6">
            {[
              { icon: Layers, label: '多工位配置' },
              { icon: Zap, label: '智能模块' },
              { icon: Sparkles, label: 'PPT生成' },
            ].map((feature, i) => (
              <div 
                key={i}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-muted text-xs text-muted-foreground"
              >
                <feature.icon className="h-3.5 w-3.5" />
                <span>{feature.label}</span>
              </div>
            ))}
          </div>
          
          <Button 
            size="default" 
            onClick={() => setShowNewProject(true)}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            新建项目
          </Button>
        </div>
      </div>
      <NewProjectDialog open={showNewProject} onOpenChange={setShowNewProject} />
    </>
  );
}
