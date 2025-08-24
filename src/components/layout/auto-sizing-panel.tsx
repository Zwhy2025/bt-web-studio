import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ResizablePanel } from '@/components/ui/resizable';
import { cn } from '@/core/utils/utils';

interface AutoSizingPanelProps {
  children: React.ReactNode;
  side: 'left' | 'right';
  isExpanded: boolean;
  minSize?: number;
  maxSize?: number;
  defaultSize?: number;
  onExpandToggle: () => void;
  className?: string;
}

export const AutoSizingPanel: React.FC<AutoSizingPanelProps> = ({
  children,
  side,
  isExpanded,
  minSize = 15,
  maxSize = 35,
  defaultSize = 20,
  onExpandToggle,
  className
}) => {
  const [panelSize, setPanelSize] = useState(defaultSize);
  const contentRef = useRef<HTMLDivElement>(null);
  const [isManualResize, setIsManualResize] = useState(false);
  const previousSizeRef = useRef(defaultSize);

  // 计算内容所需宽度
  const calculateOptimalWidth = useCallback(() => {
    if (!contentRef.current) return defaultSize;
    
    // 获取内容的实际宽度
    const contentWidth = contentRef.current.scrollWidth;
    
    // 基于内容宽度计算面板大小
    // 使用更精确的计算方式：基于常见的侧边栏内容宽度
    let optimalSize;
    
    if (contentWidth < 200) {
      optimalSize = 15; // 最小宽度
    } else if (contentWidth < 300) {
      optimalSize = 18;
    } else if (contentWidth < 400) {
      optimalSize = 22;
    } else if (contentWidth < 500) {
      optimalSize = 25;
    } else {
      optimalSize = 30; // 较大内容使用更大宽度
    }
    
    // 限制在范围内
    return Math.min(Math.max(optimalSize, minSize), maxSize);
  }, [defaultSize, minSize, maxSize]);

  // 当面板展开或内容变化时重新计算大小
  useEffect(() => {
    if (isExpanded && !isManualResize) {
      // 延迟计算以确保内容已渲染
      const timer = setTimeout(() => {
        const optimalWidth = calculateOptimalWidth();
        // 只有当计算出的宽度与当前宽度差异较大时才更新
        if (Math.abs(optimalWidth - panelSize) > 2) {
          setPanelSize(optimalWidth);
          previousSizeRef.current = optimalWidth;
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [isExpanded, isManualResize, calculateOptimalWidth, panelSize]);

  const handleResize = useCallback((size: number) => {
    // 当用户手动调整大小时，标记为手动调整
    if (Math.abs(size - previousSizeRef.current) > 1) {
      setIsManualResize(true);
    }
    
    setPanelSize(size);
    previousSizeRef.current = size;
    
    // 重置手动调整状态（用户停止调整后一段时间）
    const timer = setTimeout(() => {
      setIsManualResize(false);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);

  if (!isExpanded) {
    return null;
  }

  return (
    <ResizablePanel
      defaultSize={panelSize}
      minSize={minSize}
      maxSize={maxSize}
      onResize={handleResize}
      className={cn(className)}
    >
      <div ref={contentRef} className="h-full flex flex-col">
        {children}
      </div>
    </ResizablePanel>
  );
};