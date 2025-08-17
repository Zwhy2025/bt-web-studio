import React from 'react';
import { AlignmentGuide } from '@/core/layout/alignment-utils';

interface AlignmentGuidesProps {
  guides: AlignmentGuide[];
  canvasWidth: number;
  canvasHeight: number;
}

export function AlignmentGuides({ guides, canvasWidth, canvasHeight }: AlignmentGuidesProps) {
  return (
    <div className="absolute inset-0 pointer-events-none z-50">
      {guides.map((guide) => (
        <div
          key={guide.id}
          className={`absolute ${
            guide.type === 'vertical' ? 'w-0.5 h-full' : 'h-0.5 w-full'
          }`}
          style={{
            [guide.type === 'vertical' ? 'left' : 'top']: `${guide.position}px`,
            [guide.type === 'vertical' ? 'top' : 'left']: '0px',
            backgroundColor: '#3b82f6', // 明确的蓝色
            boxShadow: '0 0 4px rgba(59, 130, 246, 0.5)', // 蓝色阴影
          }}
        >
          {/* 参考线标签 */}
          <div
            className={`absolute bg-blue-500 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap ${
              guide.type === 'vertical'
                ? 'top-2 left-1 transform -translate-x-1/2'
                : 'left-2 top-1 transform -translate-y-1/2'
            }`}
          >
            对齐参考线
          </div>
        </div>
      ))}
    </div>
  );
}

// 网格吸附指示器
interface GridSnapIndicatorProps {
  x: number;
  y: number;
  visible: boolean;
}

export function GridSnapIndicator({ x, y, visible }: GridSnapIndicatorProps) {
  if (!visible) return null;

  return (
    <div
      className="absolute pointer-events-none z-20"
      style={{
        left: `${x}px`,
        top: `${y}px`,
        transform: 'translate(-50%, -50%)',
      }}
    >
      <div className="w-2 h-2 bg-primary/80 rounded-full animate-pulse" />
    </div>
  );
}

// 橡皮框选择器
interface SelectionBoxProps {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  visible: boolean;
}

export function SelectionBox({ startX, startY, currentX, currentY, visible }: SelectionBoxProps) {
  if (!visible) return null;

  const left = Math.min(startX, currentX);
  const top = Math.min(startY, currentY);
  const width = Math.abs(currentX - startX);
  const height = Math.abs(currentY - startY);

  return (
    <div
      className="absolute pointer-events-none z-40 border-2 border-blue-500 bg-blue-500/10 backdrop-blur-sm"
      style={{
        left: `${left}px`,
        top: `${top}px`,
        width: `${width}px`,
        height: `${height}px`,
        borderStyle: 'dashed',
        borderRadius: '4px',
      }}
    >
      {/* 选择框信息 */}
      <div className="absolute -top-6 left-0 bg-blue-500 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
        {width.toFixed(0)} × {height.toFixed(0)}
      </div>
    </div>
  );
}

// 网格背景增强
interface GridBackgroundProps {
  gridSize: number;
  visible: boolean;
  opacity?: number;
}

export function GridBackground({ gridSize, visible, opacity = 0.3 }: GridBackgroundProps) {
  if (!visible) return null;

  return (
    <div 
      className="absolute inset-0 pointer-events-none z-0"
      style={{
        backgroundImage: `
          linear-gradient(to right, rgba(148, 163, 184, ${opacity}) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(148, 163, 184, ${opacity}) 1px, transparent 1px)
        `,
        backgroundSize: `${gridSize}px ${gridSize}px`,
      }}
    />
  );
}

// 对齐工具栏 - 简化版
interface AlignmentToolbarProps {
  selectedCount: number;
  onAlign: (type: 'left' | 'right' | 'center' | 'top' | 'bottom' | 'middle' | 'distribute-horizontal' | 'distribute-vertical') => void;
  visible: boolean;
}

export function AlignmentToolbar({ selectedCount, onAlign, visible }: AlignmentToolbarProps) {
  if (!visible || selectedCount < 2) return null;

  return (
    <div className="absolute top-12 left-2 z-50 bg-background/90 backdrop-blur-sm border rounded-lg shadow-lg p-2">
      <div className="text-xs text-muted-foreground mb-2">
        已选择 {selectedCount} 个节点 - 右键查看对齐选项
      </div>
    </div>
  );
}
