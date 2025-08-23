import React, { useState, useCallback } from 'react';
import { cn } from '@/core/utils/utils';
import { ResizablePanel, ResizablePanelGroup, ResizableHandle } from '@/components/ui/resizable';
import { Button } from '@/components/ui/button';
import { 
  useComposerActions,
  useNodeLibraryConfig,
  usePropertyPanelConfig
} from '@/core/store/behavior-tree-store';
import { useI18n } from '@/hooks/use-i18n';
import { 
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

// 延迟加载子组件
const ComposerNodeLibrary = React.lazy(() => import('./composer-node-library'));
const ComposerPropertyPanel = React.lazy(() => import('./composer-property-panel'));
const ComposerCanvas = React.lazy(() => import('./composer-canvas'));
const ComposerToolbar = React.lazy(() => import('./composer-toolbar'));

interface ComposerLayoutProps {
  children?: React.ReactNode;
  className?: string;
}

// 面板折叠控制器
function PanelToggle({ 
  isExpanded, 
  onToggle, 
  position 
}: { 
  isExpanded: boolean; 
  onToggle: () => void; 
  position: 'left' | 'right' 
}) {
  const Icon = position === 'left' 
    ? (isExpanded ? ChevronLeft : ChevronRight)
    : (isExpanded ? ChevronRight : ChevronLeft);

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onToggle}
      className="h-8 w-6 p-0 rounded-none border-l border-r"
    >
      <Icon className="h-4 w-4" />
    </Button>
  );
}

// 主编排布局组件
export default function ComposerLayout({ children, className }: ComposerLayoutProps) {
  const { t } = useI18n();
  const nodeLibraryConfig = useNodeLibraryConfig();
  const propertyPanelConfig = usePropertyPanelConfig();
  const composerActions = useComposerActions();

  // 面板状态
  const [leftPanelSize, setLeftPanelSize] = useState(25);
  const [rightPanelSize, setRightPanelSize] = useState(25);

  const handleToggleNodeLibrary = useCallback(() => {
    composerActions.toggleNodeLibrary();
  }, [composerActions]);

  const handleTogglePropertyPanel = useCallback(() => {
    composerActions.togglePropertyPanel();
  }, [composerActions]);

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* 编排工具栏 */}
      <React.Suspense fallback={
        <div className="h-12 border-b bg-muted/50 animate-pulse" />
      }>
        <ComposerToolbar />
      </React.Suspense>
      
      {/* 主要内容区域 */}
      <div className="flex-1 min-h-0">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* 左侧节点库面板 */}
          {nodeLibraryConfig.isExpanded && (
            <>
              <ResizablePanel 
                defaultSize={leftPanelSize}
                minSize={15}
                maxSize={40}
                onResize={setLeftPanelSize}
                className="border-r"
              >
                <div className="h-full flex flex-col">
                  <div className="flex items-center justify-between p-2 border-b bg-muted/50">
                    <h3 className="font-medium text-sm">{t('composer:nodeLibrary.title')}</h3>

                    <PanelToggle 
                      isExpanded={true}
                      onToggle={handleToggleNodeLibrary}
                      position="left"
                    />
                  </div>
                  <React.Suspense fallback={
                    <div className="flex-1 flex items-center justify-center">
                      <div className="text-sm text-muted-foreground">{t('common:loading')}</div>
                    </div>
                  }>
                    <ComposerNodeLibrary />
                  </React.Suspense>
                </div>
              </ResizablePanel>
              <ResizableHandle withHandle />
            </>
          )}

          {/* 中央画布区域 */}
          <ResizablePanel defaultSize={nodeLibraryConfig.isExpanded && propertyPanelConfig.isExpanded ? 50 : 75}>
            <div className="h-full flex flex-col relative">
              {/* 左侧面板折叠按钮 */}
              {!nodeLibraryConfig.isExpanded && (
                <div className="absolute top-2 left-2 z-10">
                  <PanelToggle 
                    isExpanded={false}
                    onToggle={handleToggleNodeLibrary}
                    position="left"
                  />
                </div>
              )}

              {/* 右侧面板折叠按钮 */}
              {!propertyPanelConfig.isExpanded && (
                <div className="absolute top-2 right-2 z-10">
                  <PanelToggle 
                    isExpanded={false}
                    onToggle={handleTogglePropertyPanel}
                    position="right"
                  />
                </div>
              )}

              {/* 画布组件 */}
              <React.Suspense fallback={
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <div className="text-lg font-medium">{t('composer:canvas.loading')}</div>
                    <div className="text-sm text-muted-foreground">{t('composer:canvas.loadingDesc')}</div>
                  </div>
                </div>
              }>
                <ComposerCanvas>
                  {children}
                </ComposerCanvas>
              </React.Suspense>
            </div>
          </ResizablePanel>

          {/* 右侧属性面板 */}
          {propertyPanelConfig.isExpanded && (
            <>
              <ResizableHandle withHandle />
              <ResizablePanel 
                defaultSize={rightPanelSize}
                minSize={15}
                maxSize={40}
                onResize={setRightPanelSize}
                className="border-l"
              >
                <div className="h-full flex flex-col">
                  <div className="flex items-center justify-between p-2 border-b bg-muted/50">
                    <h3 className="font-medium text-sm">{t('composer:propertyPanel.title')}</h3>
                    <PanelToggle 
                      isExpanded={true}
                      onToggle={handleTogglePropertyPanel}
                      position="right"
                    />
                  </div>
                  <React.Suspense fallback={
                    <div className="flex-1 flex items-center justify-center">
                      <div className="text-sm text-muted-foreground">{t('common:loading')}</div>
                    </div>
                  }>
                    <ComposerPropertyPanel />
                  </React.Suspense>
                </div>
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </div>
    </div>
  );
}