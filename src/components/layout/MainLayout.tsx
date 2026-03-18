import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { TopToolbar } from './TopToolbar';
import { ProjectTree } from './ProjectTree';
import { CanvasArea } from './CanvasArea';
import { FormPanel } from './FormPanel';
import { AdminCenter } from './AdminCenter';
import { useState, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useBreakpoint } from '@/hooks/use-mobile';
import { Menu, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { MobileFormDrawer, MobileFormTrigger } from '@/components/forms/MobileFormDrawer';
import { AIChatPanel } from '@/components/ai/AIChatPanel';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';

export function MainLayout() {
  const { currentRole } = useAppStore();
  const [showAdmin, setShowAdmin] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const breakpoint = useBreakpoint();
  
  // Mobile/Tablet drawer states
  const [leftDrawerOpen, setLeftDrawerOpen] = useState(false);
  const [rightDrawerOpen, setRightDrawerOpen] = useState(false);
  
  // Collapsed states for tablet
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);

  const handleDragStart = useCallback(() => setIsDragging(true), []);
  const handleDragEnd = useCallback(() => setIsDragging(false), []);
  
  const isMobile = breakpoint === 'mobile';
  const isTablet = breakpoint === 'tablet';

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="h-screen flex flex-col bg-background overflow-hidden">
        <TopToolbar 
          onAdminClick={() => setShowAdmin(!showAdmin)} 
          showBackButton={showAdmin && currentRole === 'admin'}
          isMobile={true}
          onOpenLeftDrawer={() => setLeftDrawerOpen(true)}
          onOpenRightDrawer={() => setRightDrawerOpen(true)}
        />
        
        <AnimatePresence mode="wait">
          {showAdmin && currentRole === 'admin' ? (
            <div key="admin" className="flex-1 overflow-hidden">
              <AdminCenter />
            </div>
          ) : (
            <div key="main" className="flex-1 overflow-hidden">
              <CanvasArea />
            </div>
          )}
        </AnimatePresence>
        
        {/* Mobile Bottom Navigation */}
        {!showAdmin && (
          <div className="h-16 bg-card border-t border-border flex items-center justify-around px-2 shrink-0 safe-area-bottom">
            <Sheet open={leftDrawerOpen} onOpenChange={setLeftDrawerOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="flex-col gap-1 h-14 min-w-[64px]">
                  <Menu className="h-5 w-5" />
                  <span className="text-[10px]">项目</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[85vw] max-w-sm p-0">
                <ErrorBoundary fallbackTitle="项目树加载失败" compact>
                  <ProjectTree />
                </ErrorBoundary>
              </SheetContent>
            </Sheet>
            
            {/* Center - Canvas indicator */}
            <div className="flex-1 flex items-center justify-center">
              <div className="px-4 py-2 rounded-full bg-secondary/50 text-xs text-muted-foreground">
                画布区域
              </div>
            </div>
            
            {/* Right - Form drawer trigger */}
            <MobileFormTrigger onClick={() => setRightDrawerOpen(true)} />
          </div>
        )}
        
        {/* Mobile Form Drawer */}
        <MobileFormDrawer 
          open={rightDrawerOpen} 
          onOpenChange={setRightDrawerOpen} 
        />
      </div>
    );
  }

  // Tablet Layout
  if (isTablet) {
    return (
      <div className="h-screen flex flex-col bg-background overflow-hidden">
        <TopToolbar 
          onAdminClick={() => setShowAdmin(!showAdmin)} 
          showBackButton={showAdmin && currentRole === 'admin'}
        />
        
        <AnimatePresence mode="wait">
          {showAdmin && currentRole === 'admin' ? (
            <div key="admin" className="flex-1 overflow-hidden">
              <AdminCenter />
            </div>
          ) : (
            <div key="main" className="flex-1 overflow-hidden flex">
              {/* Collapsible Left Panel */}
              <aside 
                className={cn(
                  "h-full bg-card border-r border-border flex flex-col overflow-hidden shrink-0 transition-[width] duration-200 ease-in-out",
                  leftCollapsed ? "w-12" : "w-60"
                )}
              >
                {leftCollapsed ? (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="m-2"
                    onClick={() => setLeftCollapsed(false)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="absolute top-2 right-2 z-10 h-6 w-6"
                      onClick={() => setLeftCollapsed(true)}
                    >
                      <ChevronLeft className="h-3 w-3" />
                    </Button>
                    <ErrorBoundary fallbackTitle="项目树加载失败" compact>
                      <ProjectTree />
                    </ErrorBoundary>
                  </>
                )}
              </aside>
              
              {/* Main Canvas */}
              <main className="flex-1 h-full flex flex-col overflow-hidden">
                <CanvasArea />
              </main>
              
              {/* Collapsible Right Panel */}
              <aside 
                className={cn(
                  "h-full bg-card border-l border-border flex flex-col overflow-hidden shrink-0 transition-[width] duration-200 ease-in-out",
                  rightCollapsed ? "w-12" : "w-70"
                )}
              >
                {rightCollapsed ? (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="m-2"
                    onClick={() => setRightCollapsed(false)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                ) : (
                  <>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="absolute top-2 left-2 z-10 h-6 w-6"
                      onClick={() => setRightCollapsed(true)}
                    >
                      <ChevronRight className="h-3 w-3" />
                    </Button>
                    <ErrorBoundary fallbackTitle="表单加载失败" compact>
                      <FormPanel />
                    </ErrorBoundary>
                  </>
                )}
              </aside>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Desktop Layout
  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <TopToolbar 
        onAdminClick={() => setShowAdmin(!showAdmin)} 
        showBackButton={showAdmin && currentRole === 'admin'}
      />
      
      <AnimatePresence mode="wait">
        {showAdmin && currentRole === 'admin' ? (
          <div key="admin" className="flex-1 overflow-hidden">
            <AdminCenter />
          </div>
        ) : (
          <div key="main" className="flex-1 overflow-hidden">
            <ResizablePanelGroup 
              direction="horizontal" 
              className="h-full"
            >
              {/* Left Panel - Project Tree */}
              <ResizablePanel 
                defaultSize={18} 
                minSize={12} 
                maxSize={30}
              >
                <aside className="h-full bg-card border-r border-border flex flex-col overflow-hidden">
                  <ErrorBoundary fallbackTitle="项目树加载失败" compact>
                    <ProjectTree />
                  </ErrorBoundary>
                </aside>
              </ResizablePanel>
              
              {/* Left Resize Handle */}
              <ResizableHandle 
                className={cn(
                  "resizable-handle-styled",
                  isDragging && "resizable-handle-active"
                )}
                onDragging={handleDragStart}
              />
              
              {/* Middle Panel - Canvas */}
              <ResizablePanel 
                defaultSize={54} 
                minSize={30}
              >
                <main className="h-full flex flex-col overflow-hidden">
                  <CanvasArea />
                </main>
              </ResizablePanel>
              
              {/* Right Resize Handle */}
              <ResizableHandle 
                className={cn(
                  "resizable-handle-styled",
                  isDragging && "resizable-handle-active"
                )}
                onDragging={handleDragEnd}
              />
              
              {/* Right Panel - Forms */}
              <ResizablePanel 
                defaultSize={28} 
                minSize={18} 
                maxSize={40}
              >
                <aside className="h-full bg-card border-l border-border flex flex-col overflow-hidden">
                  <ErrorBoundary fallbackTitle="表单加载失败" compact>
                    <FormPanel />
                  </ErrorBoundary>
                </aside>
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
