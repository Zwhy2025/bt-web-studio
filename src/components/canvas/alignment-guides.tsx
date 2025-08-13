import React from 'react';
import { AlignmentGuide } from '@/lib/alignment-utils';

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