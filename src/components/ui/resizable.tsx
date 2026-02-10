import { GripVertical } from "lucide-react";
import * as ResizablePrimitive from "react-resizable-panels";

import { cn } from "@/lib/utils";

const ResizablePanelGroup = ({ className, ...props }: React.ComponentProps<typeof ResizablePrimitive.PanelGroup>) => (
  <ResizablePrimitive.PanelGroup
    className={cn("flex h-full w-full data-[panel-group-direction=vertical]:flex-col", className)}
    {...props}
  />
);

const ResizablePanel = ResizablePrimitive.Panel;

const ResizableHandle = ({
  withHandle,
  className,
  onDragging,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.PanelResizeHandle> & {
  withHandle?: boolean;
  onDragging?: () => void;
}) => (
  <ResizablePrimitive.PanelResizeHandle
    onDragging={(isDragging) => {
      if (isDragging && onDragging) {
        onDragging();
      }
    }}
    className={cn(
      "resizable-handle group relative flex w-1 items-center justify-center",
      "bg-border/50 transition-colors duration-200 ease-out",
      "hover:bg-primary/30",
      "data-[resize-handle-state=drag]:bg-primary",
      "data-[resize-handle-state=hover]:bg-primary/40",
      "after:absolute after:inset-y-0 after:left-1/2 after:w-4 after:-translate-x-1/2",
      "data-[panel-group-direction=vertical]:h-1 data-[panel-group-direction=vertical]:w-full",
      "data-[panel-group-direction=vertical]:after:left-0 data-[panel-group-direction=vertical]:after:h-4",
      "data-[panel-group-direction=vertical]:after:w-full data-[panel-group-direction=vertical]:after:-translate-y-1/2",
      "data-[panel-group-direction=vertical]:after:translate-x-0",
      "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1",
      "[&[data-panel-group-direction=vertical]>div]:rotate-90",
      className,
    )}
    {...props}
  >
    {/* Drag handle indicator */}
    <div className={cn(
      "z-10 flex h-8 w-3 items-center justify-center rounded-sm",
      "opacity-0 group-hover:opacity-100 group-data-[resize-handle-state=drag]:opacity-100",
      "transition-all duration-200 ease-out",
      "bg-primary/20 border border-primary/30",
      "group-data-[resize-handle-state=drag]:bg-primary/40 group-data-[resize-handle-state=drag]:border-primary/50",
      "group-data-[resize-handle-state=drag]:scale-110"
    )}>
      <GripVertical className="h-3 w-3 text-primary/70 group-data-[resize-handle-state=drag]:text-primary" />
    </div>
    
    {/* Glow effect on drag */}
    <div className={cn(
      "absolute inset-y-4 w-0.5 bg-primary/50 blur-sm rounded-full",
      "opacity-0 group-data-[resize-handle-state=drag]:opacity-100",
      "transition-opacity duration-200"
    )} />
  </ResizablePrimitive.PanelResizeHandle>
);

export { ResizablePanelGroup, ResizablePanel, ResizableHandle };
