import React, { useState, useCallback } from 'react';
import { cn } from '@/core/utils/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { 
  useComposerActions,
  useActiveTool,
  useValidationErrors,
  useSnapToGrid,
  useViewport
} from '@/core/store/behavior-tree-store';
import { ComposerTool } from '@/core/store/composerModeState';
import { useI18n } from '@/hooks/use-i18n';
import { 
  MousePointer, 
  Plus,
  Move3D,
  Trash2,
  Undo2,
  Redo2,
  Copy,
  Scissors,
  ClipboardPaste,
  AlignLeft,
  AlignRight,
  AlignCenter,
  AlignJustify,
  Grid3X3,
  ZoomIn,
  ZoomOut,
  Maximize,
  RotateCcw,
  Eye,
  EyeOff,
  Settings,
  Save,
  FolderOpen,
  Download,
  Upload,
  Share2,
  Play,
  Pause,
  Square,
  SkipForward,
  Search,
  Filter,
  Layers,
  Compass,
  Target,
  Magnet,
  Layout,
  ChevronDown,
  AlertTriangle,
  CheckCircle,
  Info,
  HelpCircle
} from 'lucide-react';

interface ComposerToolbarProps {
  className?: string;
}

// 工具组配置
const toolGroups = [
  {
    id: 'selection',
    title: '选择工具',
    tools: [
      { 
        tool: ComposerTool.SELECT, 
        icon: MousePointer, 
        label: '选择工具',
        shortcut: 'V',
        description: '选择和移动节点'
      },
      { 
        tool: ComposerTool.PAN, 
        icon: Move3D, 
        label: '平移工具',
        shortcut: 'H',
        description: '平移画布视图'
      },
    ]
  },
  {
    id: 'editing',
    title: '编辑工具',
    tools: [
      { 
        tool: ComposerTool.CONNECT, 
        icon: Plus, 
        label: '连接工具',
        shortcut: 'C',
        description: '连接节点'
      },
      { 
        tool: ComposerTool.DELETE, 
        icon: Trash2, 
        label: '删除工具',
        shortcut: 'D',
        description: '删除节点和连接'
      },
    ]
  }
];

// 文件操作组件
function FileOperations() {
  const { t } = useI18n();
  const composerActions = useComposerActions();

  return (
    <div className="flex items-center gap-1">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 gap-1">
              <Save className="h-4 w-4" />
              <span className="hidden lg:inline">{t('common:save')}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t('composer:toolbar.save')} (Ctrl+S)</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 gap-1">
            <FolderOpen className="h-4 w-4" />
            <span className="hidden lg:inline">{t('common:file')}</span>
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuLabel>{t('composer:toolbar.fileMenu')}</DropdownMenuLabel>
          <DropdownMenuItem>
            <FolderOpen className="h-4 w-4 mr-2" />
            {t('common:open')}
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Save className="h-4 w-4 mr-2" />
            {t('common:save')}
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Download className="h-4 w-4 mr-2" />
            {t('common:export')}
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Upload className="h-4 w-4 mr-2" />
            {t('common:import')}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <Share2 className="h-4 w-4 mr-2" />
            {t('common:share')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// 主工具选择组件
function MainTools() {
  const { t } = useI18n();
  const activeTool = useActiveTool();
  const composerActions = useComposerActions();

  const handleToolSelect = (tool: ComposerTool) => {
    composerActions.setActiveTool(tool);
  };

  return (
    <div className="flex items-center gap-1">
      {toolGroups.map((group, groupIndex) => (
        <React.Fragment key={group.id}>
          {groupIndex > 0 && <Separator orientation="vertical" className="h-5" />}
          <div className="flex items-center gap-1">
            {group.tools.map(({ tool, icon: Icon, label, shortcut, description }) => (
              <TooltipProvider key={tool}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={activeTool === tool ? "default" : "ghost"}
                      size="sm"
                      onClick={() => handleToolSelect(tool)}
                      className="h-8 w-8 p-0"
                    >
                      <Icon className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-center">
                      <div className="font-medium">{label}</div>
                      <div className="text-xs text-muted-foreground">({shortcut})</div>
                      <div className="text-xs text-muted-foreground mt-1">{description}</div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}

// 编辑操作组件
function EditOperations() {
  const { t } = useI18n();
  const composerActions = useComposerActions();

  return (
    <div className="flex items-center gap-1">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={composerActions.undo}
              disabled={!composerActions.canUndo()}
              className="h-8 w-8 p-0"
            >
              <Undo2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t('composer:actions.undo')} (Ctrl+Z)</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={composerActions.redo}
              disabled={!composerActions.canRedo()}
              className="h-8 w-8 p-0"
            >
              <Redo2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t('composer:actions.redo')} (Ctrl+Y)</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Separator orientation="vertical" className="h-5" />

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={composerActions.copySelection}
              className="h-8 w-8 p-0"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t('composer:actions.copy')} (Ctrl+C)</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={composerActions.cutSelection}
              className="h-8 w-8 p-0"
            >
              <Scissors className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t('composer:actions.cut')} (Ctrl+X)</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => composerActions.paste()}
              disabled={!composerActions.canPaste()}
              className="h-8 w-8 p-0"
            >
              <ClipboardPaste className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t('composer:actions.paste')} (Ctrl+V)</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

// 对齐工具组件
function AlignmentTools() {
  const { t } = useI18n();
  const composerActions = useComposerActions();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 gap-1">
          <AlignCenter className="h-4 w-4" />
          <span className="hidden lg:inline">{t('composer:toolbar.align')}</span>
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuLabel>{t('composer:toolbar.alignmentOptions')}</DropdownMenuLabel>
        <DropdownMenuItem onClick={composerActions.alignLeft}>
          <AlignLeft className="h-4 w-4 mr-2" />
          {t('composer:actions.alignLeft')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={composerActions.alignCenterHorizontal}>
          <AlignCenter className="h-4 w-4 mr-2" />
          {t('composer:actions.alignCenter')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={composerActions.alignRight}>
          <AlignRight className="h-4 w-4 mr-2" />
          {t('composer:actions.alignRight')}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={composerActions.alignTop}>
          <AlignJustify className="h-4 w-4 mr-2 rotate-90" />
          {t('composer:actions.alignTop')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={composerActions.alignCenterVertical}>
          <AlignCenter className="h-4 w-4 mr-2 rotate-90" />
          {t('composer:actions.alignMiddle')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={composerActions.alignBottom}>
          <AlignJustify className="h-4 w-4 mr-2 rotate-90" />
          {t('composer:actions.alignBottom')}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={composerActions.distributeHorizontally}>
          <Compass className="h-4 w-4 mr-2" />
          {t('composer:actions.distributeHorizontally')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={composerActions.distributeVertically}>
          <Compass className="h-4 w-4 mr-2" />
          {t('composer:actions.distributeVertically')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// 布局工具组件
function LayoutTools() {
  const { t } = useI18n();
  const composerActions = useComposerActions();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 gap-1">
          <Layout className="h-4 w-4" />
          <span className="hidden lg:inline">{t('composer:toolbar.layout')}</span>
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuLabel>{t('composer:toolbar.autoLayout')}</DropdownMenuLabel>
        <DropdownMenuItem onClick={composerActions.autoLayoutTree}>
          <Layout className="h-4 w-4 mr-2" />
          {t('composer:actions.layoutTree')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={composerActions.autoLayoutHierarchy}>
          <Layers className="h-4 w-4 mr-2" />
          {t('composer:actions.layoutHierarchy')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={composerActions.autoLayoutForce}>
          <Target className="h-4 w-4 mr-2" />
          {t('composer:actions.layoutForce')}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem 
          checked={true} 
          onCheckedChange={composerActions.toggleAutoLayout}
        >
          <Magnet className="h-4 w-4 mr-2" />
          {t('composer:actions.autoLayout')}
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// 视图控制组件
function ViewControls() {
  const { t } = useI18n();
  const composerActions = useComposerActions();
  const snapToGrid = useSnapToGrid();
  const viewport = useViewport();

  return (
    <div className="flex items-center gap-1">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={composerActions.zoomIn}
              className="h-8 w-8 p-0"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t('composer:actions.zoomIn')}</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={composerActions.zoomOut}
              className="h-8 w-8 p-0"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t('composer:actions.zoomOut')}</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={composerActions.zoomToFit}
              className="h-8 w-8 p-0"
            >
              <Maximize className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t('composer:actions.fitToView')}</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant={snapToGrid ? "default" : "ghost"}
              size="sm" 
              onClick={composerActions.toggleSnapToGrid}
              className="h-8 w-8 p-0"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t('composer:actions.toggleGrid')}</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {viewport && (
        <div className="hidden lg:flex items-center gap-2 px-2 py-1 bg-muted/50 rounded text-xs">
          <span>{Math.round(viewport.zoom * 100)}%</span>
        </div>
      )}
    </div>
  );
}

// 验证状态组件
function ValidationStatus() {
  const { t } = useI18n();
  const validationErrors = useValidationErrors();
  const composerActions = useComposerActions();

  if (validationErrors.length === 0) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 gap-1 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span className="hidden lg:inline">{t('composer:validation.valid')}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t('composer:validation.noErrors')}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  const errorCount = validationErrors.filter(e => e.type === 'error').length;
  const warningCount = validationErrors.filter(e => e.type === 'warning').length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 gap-1 text-orange-600">
          <AlertTriangle className="h-4 w-4" />
          <Badge variant="secondary" className="text-xs">
            {validationErrors.length}
          </Badge>
          <span className="hidden lg:inline">{t('composer:validation.issues')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          {t('composer:validation.errors')}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={composerActions.clearValidationErrors}
            className="h-6 text-xs"
          >
            {t('common:clear')}
          </Button>
        </DropdownMenuLabel>
        
        <div className="max-h-60 overflow-y-auto">
          {validationErrors.slice(0, 10).map((error, index) => (
            <DropdownMenuItem key={error.id} className="flex-col items-start p-3">
              <div className="flex items-center gap-2 w-full">
                {error.type === 'error' ? (
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                ) : error.type === 'warning' ? (
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                ) : (
                  <Info className="h-4 w-4 text-blue-500" />
                )}
                <span className="font-medium text-sm">{error.message}</span>
              </div>
              {error.description && (
                <div className="text-xs text-muted-foreground mt-1 ml-6">
                  {error.description}
                </div>
              )}
              {error.fix && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => composerActions.fixValidationError(error.id)}
                  className="mt-2 ml-6 h-6 text-xs"
                >
                  {t('common:fix')}
                </Button>
              )}
            </DropdownMenuItem>
          ))}
          
          {validationErrors.length > 10 && (
            <div className="p-2 text-center text-xs text-muted-foreground">
              +{validationErrors.length - 10} {t('common:more')}
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// 主工具栏组件
export default function ComposerToolbar({ className }: ComposerToolbarProps) {
  return (
    <div className={cn(
      'flex items-center justify-between gap-2 px-3 py-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
      className
    )}>
      {/* 左侧工具组 */}
      <div className="flex items-center gap-2">
        <FileOperations />
        <Separator orientation="vertical" className="h-5" />
        <MainTools />
        <Separator orientation="vertical" className="h-5" />
        <EditOperations />
      </div>

      {/* 中央工具组 */}
      <div className="flex items-center gap-2">
        <AlignmentTools />
        <LayoutTools />
        <Separator orientation="vertical" className="h-5" />
        <ViewControls />
      </div>

      {/* 右侧状态组 */}
      <div className="flex items-center gap-2">
        <ValidationStatus />
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <HelpCircle className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>快捷键帮助</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}