import { memo, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { 
  Download, Camera, Settings2, Eye, EyeOff, Lock, Unlock, 
  Focus, Trash2, Copy, ChevronUp, ChevronDown, LayoutGrid,
  Layers, GripVertical, CheckSquare, Square
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LayoutObject } from './ObjectPropertyPanel';

type ViewType = 'front' | 'side' | 'top';

interface ObjectListPanelProps {
  objects: LayoutObject[];
  selectedIds: string[];
  onSelectObject: (id: string, multiSelect?: boolean) => void;
  onToggleVisibility: (id: string) => void;
  onToggleLock: (id: string) => void;
  onFocusObject: (id: string) => void;
  onDeleteObject: (id: string) => void;
  onDuplicateObject: (id: string) => void;
  onReorderObject: (id: string, direction: 'up' | 'down') => void;
  onAutoArrange: () => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  hiddenIds: Set<string>;
  centerX: number;
  centerY: number;
  scale: number;
  currentView: ViewType;
}

export const ObjectListPanel = memo(function ObjectListPanel({
  objects,
  selectedIds,
  onSelectObject,
  onToggleVisibility,
  onToggleLock,
  onFocusObject,
  onDeleteObject,
  onDuplicateObject,
  onReorderObject,
  onAutoArrange,
  onSelectAll,
  onDeselectAll,
  hiddenIds,
  centerX,
  centerY,
  scale,
  currentView,
}: ObjectListPanelProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  
  const cameras = objects.filter(o => o.type === 'camera');
  const mechanisms = objects.filter(o => o.type === 'mechanism');
  const products = objects.filter(o => o.type === 'product');
  
  const allSelected = objects.length > 0 && selectedIds.length === objects.length;
  const someSelected = selectedIds.length > 0 && selectedIds.length < objects.length;

  const exportToCSV = () => {
    const headers = ['设备名称', '类型', 'X (mm)', 'Y (mm)', 'Z (mm)', '距中心 (mm)'];
    const rows = objects.map(obj => {
      const distanceToCenter = Math.round(
        Math.sqrt((obj.posX ?? 0) ** 2 + (obj.posY ?? 0) ** 2 + (obj.posZ ?? 0) ** 2)
      );
      return [
        obj.name,
        obj.type === 'camera' ? '相机' : obj.type === 'product' ? '产品' : '机构',
        obj.posX ?? 0,
        obj.posY ?? 0,
        obj.posZ ?? 0,
        distanceToCenter,
      ];
    });
    
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `设备安装尺寸表_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderObjectItem = (obj: LayoutObject, index: number, totalCount: number) => {
    const isSelected = selectedIds.includes(obj.id);
    const isHidden = hiddenIds.has(obj.id);
    const distanceToCenter = Math.round(
      Math.sqrt((obj.posX ?? 0) ** 2 + (obj.posY ?? 0) ** 2 + (obj.posZ ?? 0) ** 2)
    );
    const isCamera = obj.type === 'camera';
    const isProduct = obj.type === 'product';
    
    return (
      <div
        key={obj.id}
        className={cn(
          "group relative p-2.5 rounded-lg transition-all border",
          isSelected 
            ? "bg-primary/20 border-primary/50 shadow-md" 
            : "bg-muted/40 hover:bg-muted/80 border-transparent hover:border-muted-foreground/20",
          isHidden && "opacity-50"
        )}
      >
        {/* Main content - clickable */}
        <div 
          className="flex items-start gap-2 cursor-pointer"
          onClick={(e) => onSelectObject(obj.id, e.ctrlKey || e.metaKey || selectMode)}
        >
          {/* Checkbox for multi-select mode */}
          {selectMode && (
            <Checkbox 
              checked={isSelected}
              onCheckedChange={() => onSelectObject(obj.id, true)}
              className="mt-0.5"
            />
          )}
          
          {/* Color indicator */}
          <div className={cn(
            "w-2.5 h-2.5 rounded-full mt-1.5 shrink-0",
            isCamera ? "bg-blue-500" : isProduct ? "bg-cyan-500" : "bg-orange-500"
          )} />
          
          {/* Name and info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className={cn(
                "text-sm font-medium truncate",
                isCamera ? "text-blue-400" : isProduct ? "text-cyan-400" : "text-orange-400"
              )}>
                {obj.name}
              </span>
              {obj.locked && (
                <Lock className="h-3 w-3 text-amber-400 shrink-0" />
              )}
              {isHidden && (
                <EyeOff className="h-3 w-3 text-muted-foreground shrink-0" />
              )}
              {/* Mounted indicator for cameras or products */}
              {(obj.type === 'camera' || obj.type === 'product') && obj.mountedToMechanismId && (
                <span className={cn("text-[10px]", isProduct ? "text-green-400" : "text-blue-400")} title="已吸附到机构">{isProduct ? '📦' : '🔗'}</span>
              )}
            </div>
            
            {/* 3D coordinates */}
            <div className="grid grid-cols-3 gap-1 mt-1 text-[10px]">
              <span><span className="text-red-400">X:</span> <span className="font-mono">{obj.posX ?? 0}</span></span>
              <span><span className="text-green-400">Y:</span> <span className="font-mono">{obj.posY ?? 0}</span></span>
              <span><span className="text-blue-400">Z:</span> <span className="font-mono">{obj.posZ ?? 0}</span></span>
            </div>
            
            {/* Distance badge */}
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4">
                距中心 {distanceToCenter}mm
              </Badge>
            </div>
          </div>
        </div>
        
        {/* Action buttons - shown on hover or when selected */}
        <div className={cn(
          "absolute right-1 top-1 flex items-center gap-0.5 transition-opacity",
          isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        )}>
          <TooltipProvider delayDuration={200}>
            {/* Visibility toggle */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => { e.stopPropagation(); onToggleVisibility(obj.id); }}
                >
                  {isHidden ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">{isHidden ? '显示' : '隐藏'}</TooltipContent>
            </Tooltip>
            
            {/* Lock toggle */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => { e.stopPropagation(); onToggleLock(obj.id); }}
                >
                  {obj.locked ? <Lock className="h-3 w-3 text-amber-400" /> : <Unlock className="h-3 w-3" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">{obj.locked ? '解锁' : '锁定'}</TooltipContent>
            </Tooltip>
            
            {/* Focus */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => { e.stopPropagation(); onFocusObject(obj.id); }}
                >
                  <Focus className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">聚焦</TooltipContent>
            </Tooltip>
            
            {/* Duplicate */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => { e.stopPropagation(); onDuplicateObject(obj.id); }}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">复制</TooltipContent>
            </Tooltip>
            
            {/* Delete */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-destructive hover:text-destructive"
                  onClick={(e) => { e.stopPropagation(); onDeleteObject(obj.id); }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">删除</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        {/* Reorder buttons - shown when selected */}
        {isSelected && !selectMode && (
          <div className="absolute right-1 bottom-1 flex items-center gap-0.5">
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={(e) => { e.stopPropagation(); onReorderObject(obj.id, 'up'); }}
                    disabled={index === 0}
                  >
                    <ChevronUp className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">上移层级</TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={(e) => { e.stopPropagation(); onReorderObject(obj.id, 'down'); }}
                    disabled={index === totalCount - 1}
                  >
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">下移层级</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={cn(
      "absolute left-4 top-20 bg-card/95 backdrop-blur-sm border border-border rounded-xl shadow-2xl overflow-hidden z-10 transition-all",
      isMinimized ? "w-48" : "w-72"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 bg-gradient-to-r from-muted/80 to-muted/40 border-b border-border">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">对象清单</span>
          <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
            {objects.length}
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          {/* Multi-select mode toggle */}
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant={selectMode ? "secondary" : "ghost"}
                  size="icon" 
                  className="h-7 w-7"
                  onClick={() => setSelectMode(!selectMode)}
                >
                  {selectMode ? <CheckSquare className="h-3.5 w-3.5" /> : <Square className="h-3.5 w-3.5" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">多选模式</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7"
                  onClick={exportToCSV}
                >
                  <Download className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">导出CSV</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-2 py-1.5 border-b border-border bg-muted/20">
        <TooltipProvider delayDuration={200}>
          {selectMode && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs px-2"
                onClick={allSelected ? onDeselectAll : onSelectAll}
              >
                {allSelected ? '取消全选' : '全选'}
              </Button>
              <div className="h-4 w-px bg-border" />
            </>
          )}
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs px-2 gap-1"
                onClick={onAutoArrange}
              >
                <LayoutGrid className="h-3 w-3" />
                自动排布
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">一键重新排列所有对象</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      <ScrollArea className="max-h-[60vh]">
        <div className="p-2 space-y-3">
          {/* Cameras Section */}
          {cameras.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
                <Camera className="h-3.5 w-3.5 text-blue-500" />
                <span>相机 ({cameras.length})</span>
              </div>
              <div className="space-y-1.5">
                {cameras.map((cam, i) => renderObjectItem(cam, i, cameras.length))}
              </div>
            </div>
          )}
          
          {/* Mechanisms Section */}
          {mechanisms.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
                <Settings2 className="h-3.5 w-3.5 text-orange-500" />
                <span>机构 ({mechanisms.length})</span>
              </div>
              <div className="space-y-1.5">
                {mechanisms.map((mech, i) => renderObjectItem(mech, i, mechanisms.length))}
              </div>
            </div>
          )}
          
          {/* Products Section */}
          {products.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
                <span className="text-cyan-500 text-sm">📦</span>
                <span>产品 ({products.length})</span>
              </div>
              <div className="space-y-1.5">
                {products.map((prod, i) => renderObjectItem(prod, i, products.length))}
              </div>
            </div>
          )}
          
          {objects.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <div className="text-3xl mb-2">📦</div>
              <div className="text-sm">暂无对象</div>
              <div className="text-xs mt-1">点击上方按钮添加相机或机构</div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
});
