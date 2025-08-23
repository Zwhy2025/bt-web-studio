import React from 'react';
import { cn } from '@/core/utils/utils';

// 直接导入子组件，避免动态导入问题
import ReplayToolbar from './replay-toolbar';
import ReplayCanvas from './replay-canvas';
import TimelineController from './timeline-controller';

interface ReplayLayoutProps {
  children?: React.ReactNode;
  className?: string;
}

// 简化的回放布局组件
export default function ReplayLayout({ children, className }: ReplayLayoutProps) {
  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* 回放工具栏 */}
      <div className="border-b bg-background">
        <ReplayToolbar />
      </div>

      {/* 主内容区域 */}
      <div className="flex-1 min-h-0 flex flex-col">
        {/* 回放画布组件 */}
        <div className="flex-1 min-h-0">
          <ReplayCanvas>{children}</ReplayCanvas>
        </div>

        {/* 时间轴控制器 - 底部固定 */}
        <div className="border-t bg-background">
          <TimelineController />
        </div>
      </div>
    </div>
  );
}
