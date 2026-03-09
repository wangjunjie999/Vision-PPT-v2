import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ModuleFormState, DLTaskType, DeployTarget } from './types';

interface DeepLearningFormProps {
  form: ModuleFormState;
  setForm: React.Dispatch<React.SetStateAction<ModuleFormState>>;
}

const taskTypeOptions: { value: DLTaskType; label: string; description: string }[] = [
  { value: 'classification', label: '分类', description: 'OK/NG判断' },
  { value: 'detection', label: '目标检测', description: '定位并分类' },
  { value: 'segmentation', label: '语义分割', description: '像素级分割' },
  { value: 'anomaly', label: '异常检测', description: '无监督识别' },
];

const deployTargetOptions: { value: DeployTarget; label: string }[] = [
  { value: 'cpu', label: 'CPU' },
  { value: 'gpu', label: 'GPU' },
  { value: 'edge', label: '边缘盒子' },
];

const quickClasses = ['OK', 'NG', '异常', '正常', '缺失', '错位', '破损', '污染'];

export function DeepLearningForm({ form, setForm }: DeepLearningFormProps) {
  const [newTargetClass, setNewTargetClass] = useState('');

  const addTargetClass = () => {
    if (newTargetClass.trim() && !form.targetClasses.includes(newTargetClass.trim())) {
      setForm(prev => ({
        ...prev,
        targetClasses: [...prev.targetClasses, newTargetClass.trim()]
      }));
      setNewTargetClass('');
    }
  };

  const removeTargetClass = (cls: string) => {
    setForm(prev => ({
      ...prev,
      targetClasses: prev.targetClasses.filter(c => c !== cls)
    }));
  };

  return (
    <div className="form-section">
      <h3 className="form-section-title">
        <span className="w-1 h-4 bg-primary rounded-full" />
        深度学习配置
      </h3>
      
      <div className="space-y-4">
        {/* 任务类型 */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">任务类型 <span className="text-destructive ml-0.5">*</span></Label>
          <div className="grid grid-cols-2 gap-2">
            {taskTypeOptions.map(opt => (
              <label
                key={opt.value}
                className={cn(
                  "flex flex-col p-3 border rounded-lg cursor-pointer transition-all",
                  form.dlTaskType === opt.value
                    ? "bg-primary/10 border-primary"
                    : "hover:bg-secondary"
                )}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="dlTaskType"
                    value={opt.value}
                    checked={form.dlTaskType === opt.value}
                    onChange={() => setForm(p => ({ ...p, dlTaskType: opt.value }))}
                    className="w-3 h-3"
                  />
                  <span className="text-sm font-medium">{opt.label}</span>
                </div>
                <span className="text-xs text-muted-foreground ml-5">{opt.description}</span>
              </label>
            ))}
          </div>
        </div>

        {/* 目标类别 */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">
            目标类别 <span className="text-destructive ml-0.5">*</span>
            {form.targetClasses.length === 0 && (
              <span className="text-destructive text-xs ml-2">(至少添加1个)</span>
            )}
          </Label>
          
          <div className="flex gap-2">
            <Input
              value={newTargetClass}
              onChange={e => setNewTargetClass(e.target.value)}
              placeholder="输入类别名称"
              className="h-9 flex-1"
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTargetClass())}
            />
            <Button 
              type="button"
              variant="outline"
              size="sm"
              onClick={addTargetClass}
              disabled={!newTargetClass.trim()}
              className="h-9"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          {/* 快速添加 */}
          <div className="flex flex-wrap gap-1">
            {quickClasses.map(cls => (
              <button
                key={cls}
                type="button"
                onClick={() => {
                  if (!form.targetClasses.includes(cls)) {
                    setForm(prev => ({ ...prev, targetClasses: [...prev.targetClasses, cls] }));
                  }
                }}
                disabled={form.targetClasses.includes(cls)}
                className={cn(
                  "px-2 py-1 text-xs rounded border transition-colors",
                  form.targetClasses.includes(cls)
                    ? "bg-primary/10 border-primary text-primary"
                    : "hover:bg-secondary cursor-pointer"
                )}
              >
                {form.targetClasses.includes(cls) ? '✓ ' : '+ '}{cls}
              </button>
            ))}
          </div>
          
          {/* 已添加类别 */}
          {form.targetClasses.length > 0 && (
            <div className="flex flex-wrap gap-2 p-2 bg-secondary/30 rounded-lg">
              {form.targetClasses.map(cls => (
                <Badge key={cls} variant="secondary" className="gap-1 pr-1">
                  {cls}
                  <button
                    type="button"
                    onClick={() => removeTargetClass(cls)}
                    className="ml-1 hover:bg-destructive/20 rounded p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* ROI 尺寸 */}
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">ROI宽 (mm)</Label>
            <Input
              type="number"
              value={form.dlRoiWidth}
              onChange={e => setForm(p => ({ ...p, dlRoiWidth: e.target.value }))}
              placeholder="100"
              className="h-9"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">ROI高 (mm)</Label>
            <Input
              type="number"
              value={form.dlRoiHeight}
              onChange={e => setForm(p => ({ ...p, dlRoiHeight: e.target.value }))}
              placeholder="80"
              className="h-9"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">视野大小 (mm)</Label>
            <Input
              type="number"
              value={form.dlFieldOfView}
              onChange={e => setForm(p => ({ ...p, dlFieldOfView: e.target.value }))}
              placeholder="150"
              className="h-9"
            />
          </div>
        </div>

        {/* 部署目标和推理时限 */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">部署目标 <span className="text-destructive ml-0.5">*</span></Label>
            <Select 
              value={form.deployTarget} 
              onValueChange={v => setForm(p => ({ ...p, deployTarget: v as DeployTarget }))}
            >
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                {deployTargetOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">推理时限 (ms) <span className="text-destructive ml-0.5">*</span></Label>
            <Input
              type="number"
              min="10"
              value={form.inferenceTimeTarget}
              onChange={e => setForm(p => ({ ...p, inferenceTimeTarget: e.target.value }))}
              className="h-9"
            />
          </div>
        </div>

        {/* 样本规模 */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">预计样本规模 (张)</Label>
          <Input
            type="number"
            min="0"
            value={form.sampleSize}
            onChange={e => setForm(p => ({ ...p, sampleSize: e.target.value }))}
            placeholder="例如: 5000"
            className="h-9"
          />
        </div>
      </div>
    </div>
  );
}