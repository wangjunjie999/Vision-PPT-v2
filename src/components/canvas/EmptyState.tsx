import { Button } from '@/components/ui/button';
import { Plus, FolderOpen, Layers, Zap, Sparkles, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { NewProjectDialog } from '@/components/dialogs/NewProjectDialog';

const steps = [
  {
    number: 1,
    icon: FolderOpen,
    title: '创建项目',
    desc: '填写项目基础信息，关联客户与产品',
    color: 'text-primary',
    bg: 'bg-primary/10 border-primary/20',
  },
  {
    number: 2,
    icon: Layers,
    title: '配置工位',
    desc: '添加工位，设计机械布局与视觉模块',
    color: 'text-accent',
    bg: 'bg-accent/10 border-accent/20',
  },
  {
    number: 3,
    icon: Sparkles,
    title: '生成PPT',
    desc: '一键导出专业视觉方案演示文档',
    color: 'text-success',
    bg: 'bg-success/10 border-success/20',
  },
];

export function EmptyState() {
  const [showNewProject, setShowNewProject] = useState(false);

  return (
    <>
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-lg">
          {/* Icon cluster */}
          <div className="mx-auto mb-6 relative w-20 h-20">
            <div className="absolute inset-0 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <FolderOpen className="h-9 w-9 text-primary" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 rounded-lg bg-accent/15 border border-accent/20 flex items-center justify-center">
              <Zap className="h-4 w-4 text-accent" />
            </div>
            <div className="absolute -bottom-1 -left-2 w-7 h-7 rounded-lg bg-success/15 border border-success/20 flex items-center justify-center">
              <Sparkles className="h-3.5 w-3.5 text-success" />
            </div>
          </div>
          
          <h2 className="text-xl font-semibold text-foreground mb-2 tracking-tight">
            欢迎使用视觉方案配置系统
          </h2>
          <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
            在左侧创建或选择一个项目，开始配置工位机械布局和功能模块视觉方案
          </p>
          
          {/* Step cards */}
          <div className="flex items-stretch gap-3 mb-8">
            {steps.map((step, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`flex-1 flex flex-col items-center gap-2 px-4 py-4 rounded-xl border ${step.bg} transition-all duration-200 hover:scale-[1.02]`}>
                  <div className={`w-7 h-7 rounded-full bg-background border border-border flex items-center justify-center text-xs font-bold ${step.color}`}>
                    {step.number}
                  </div>
                  <step.icon className={`h-5 w-5 ${step.color}`} />
                  <span className="text-sm font-medium text-foreground">{step.title}</span>
                  <span className="text-xs text-muted-foreground leading-snug">{step.desc}</span>
                </div>
                {i < steps.length - 1 && (
                  <ArrowRight className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                )}
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
