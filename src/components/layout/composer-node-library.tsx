import React, { useState, useMemo, useCallback } from 'react';
import { cn } from '@/core/utils/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  useNodeLibraryConfig,
  useComposerActions 
} from '@/core/store/behavior-tree-store';
import { useI18n } from '@/hooks/use-i18n';
import { 
  Search,
  Star,
  Clock,
  Folder,
  Grid3X3,
  List,
  Plus,
  Heart,
  Eye,
  Settings,
  Filter,
  SortAsc,
  Package,
  Zap,
  Activity,
  GitBranch,
  Repeat,
  Shield
} from 'lucide-react';

// 节点类型定义
export interface NodeType {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  tags: string[];
  isCustom?: boolean;
  isFavorite?: boolean;
  usageCount?: number;
  lastUsed?: number;
}

// 节点分类定义
export interface NodeCategory {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  description: string;
  nodeCount: number;
}

// 内置节点类型数据
const builtInNodeTypes: NodeType[] = [
  // 控制节点
  {
    id: 'sequence',
    name: 'Sequence',
    category: 'control',
    description: '顺序执行所有子节点，直到一个失败或全部成功',
    icon: GitBranch,
    color: 'bg-blue-500',
    tags: ['control', 'sequence', 'basic'],
    usageCount: 156,
    lastUsed: Date.now() - 3600000,
  },
  {
    id: 'selector',
    name: 'Selector',
    category: 'control',
    description: '选择执行子节点，直到一个成功或全部失败',
    icon: GitBranch,
    color: 'bg-blue-500',
    tags: ['control', 'selector', 'basic'],
    usageCount: 98,
    lastUsed: Date.now() - 7200000,
  },
  {
    id: 'parallel',
    name: 'Parallel',
    category: 'control',
    description: '并行执行所有子节点',
    icon: Activity,
    color: 'bg-blue-500',
    tags: ['control', 'parallel', 'advanced'],
    usageCount: 45,
    lastUsed: Date.now() - 86400000,
  },
  
  // 装饰器节点
  {
    id: 'inverter',
    name: 'Inverter',
    category: 'decorator',
    description: '反转子节点的返回结果',
    icon: Repeat,
    color: 'bg-purple-500',
    tags: ['decorator', 'inverter', 'logic'],
    usageCount: 34,
    lastUsed: Date.now() - 172800000,
  },
  {
    id: 'retry',
    name: 'Retry',
    category: 'decorator',
    description: '重试子节点直到成功或达到最大次数',
    icon: Repeat,
    color: 'bg-purple-500',
    tags: ['decorator', 'retry', 'error-handling'],
    usageCount: 23,
    lastUsed: Date.now() - 259200000,
  },
  
  // 动作节点
  {
    id: 'action',
    name: 'Action',
    category: 'action',
    description: '执行具体的动作或任务',
    icon: Zap,
    color: 'bg-green-500',
    tags: ['action', 'execute', 'basic'],
    usageCount: 189,
    lastUsed: Date.now() - 1800000,
  },
  
  // 条件节点
  {
    id: 'condition',
    name: 'Condition',
    category: 'condition',
    description: '检查条件并返回结果',
    icon: Shield,
    color: 'bg-orange-500',
    tags: ['condition', 'check', 'basic'],
    usageCount: 134,
    lastUsed: Date.now() - 5400000,
  },
  
  // 子树节点
  {
    id: 'subtree',
    name: 'SubTree',
    category: 'subtree',
    description: '引用另一个行为树作为子树',
    icon: Package,
    color: 'bg-teal-500',
    tags: ['subtree', 'reference', 'modular'],
    usageCount: 67,
    lastUsed: Date.now() - 43200000,
  },
];

// 节点分类数据
const nodeCategories: NodeCategory[] = [
  {
    id: 'control',
    name: '控制节点',
    icon: GitBranch,
    color: 'text-blue-600',
    description: '控制行为树执行流程的节点',
    nodeCount: 3,
  },
  {
    id: 'decorator',
    name: '装饰器',
    icon: Repeat,
    color: 'text-purple-600',
    description: '修饰子节点行为的节点',
    nodeCount: 2,
  },
  {
    id: 'action',
    name: '动作节点',
    icon: Zap,
    color: 'text-green-600',
    description: '执行具体动作的叶子节点',
    nodeCount: 1,
  },
  {
    id: 'condition',
    name: '条件节点',
    icon: Shield,
    color: 'text-orange-600',
    description: '检查条件的叶子节点',
    nodeCount: 1,
  },
  {
    id: 'subtree',
    name: '子树',
    icon: Package,
    color: 'text-teal-600',
    description: '引用其他行为树的节点',
    nodeCount: 1,
  },
];

// 视图模式
type ViewMode = 'grid' | 'list';

// 排序方式
type SortMode = 'name' | 'usage' | 'recent' | 'category';

// 节点卡片组件
function NodeCard({ 
  node, 
  viewMode,
  onDragStart 
}: { 
  node: NodeType; 
  viewMode: ViewMode;
  onDragStart: (node: NodeType, event: React.DragEvent) => void;
}) {
  const { t } = useI18n();
  const composerActions = useComposerActions();

  const handleDragStart = useCallback((event: React.DragEvent) => {
    onDragStart(node, event);
  }, [node, onDragStart]);

  const handleAddToFavorites = useCallback(() => {
    if (node.isFavorite) {
      composerActions.removeFromFavorites(node.id);
    } else {
      composerActions.addToFavorites(node.id);
    }
  }, [node.id, node.isFavorite, composerActions]);

  if (viewMode === 'list') {
    return (
      <div
        className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-move group"
        draggable
        onDragStart={handleDragStart}
      >
        <div className={cn('w-8 h-8 rounded-md flex items-center justify-center', node.color)}>
          <node.icon className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">{node.name}</div>
          <div className="text-xs text-muted-foreground truncate">{node.description}</div>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleAddToFavorites}
            className="h-6 w-6 p-0"
          >
            <Heart className={cn('h-3 w-3', node.isFavorite && 'fill-red-500 text-red-500')} />
          </Button>
          {node.usageCount && (
            <Badge variant="secondary" className="text-xs">
              {node.usageCount}
            </Badge>
          )}
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className="p-3 rounded-lg border bg-card hover:bg-muted/50 cursor-move group transition-colors"
            draggable
            onDragStart={handleDragStart}
          >
            <div className="flex items-start justify-between mb-2">
              <div className={cn('w-8 h-8 rounded-md flex items-center justify-center', node.color)}>
                <node.icon className="w-4 h-4 text-white" />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAddToFavorites}
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Heart className={cn('h-3 w-3', node.isFavorite && 'fill-red-500 text-red-500')} />
              </Button>
            </div>
            <div className="space-y-1">
              <div className="font-medium text-sm truncate">{node.name}</div>
              <div className="text-xs text-muted-foreground line-clamp-2">
                {node.description}
              </div>
            </div>
            {node.usageCount && (
              <div className="mt-2 flex items-center justify-between">
                <Badge variant="secondary" className="text-xs">
                  {t('composer:nodeLibrary.usageCount', { count: node.usageCount })}
                </Badge>
              </div>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="right">
          <div className="max-w-xs">
            <div className="font-medium">{node.name}</div>
            <div className="text-sm text-muted-foreground mt-1">{node.description}</div>
            <div className="flex flex-wrap gap-1 mt-2">
              {node.tags.map(tag => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// 主组件
export default function ComposerNodeLibrary() {
  const { t } = useI18n();
  const nodeLibraryConfig = useNodeLibraryConfig();
  const composerActions = useComposerActions();

  // 本地状态
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortMode, setSortMode] = useState<SortMode>('category');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // 处理节点拖拽
  const handleNodeDragStart = useCallback((node: NodeType, event: React.DragEvent) => {
    // 设置拖拽数据
    event.dataTransfer.setData('application/json', JSON.stringify({
      type: 'node',
      nodeType: node.id,
      nodeData: node
    }));
    event.dataTransfer.effectAllowed = 'copy';
    
    console.log('开始拖拽节点:', node.name);
  }, []);

  // 过滤和排序节点
  const filteredAndSortedNodes = useMemo(() => {
    let nodes = builtInNodeTypes;

    // 按分类过滤
    if (selectedCategory && selectedCategory !== 'all') {
      if (selectedCategory === 'favorites') {
        nodes = nodes.filter(node => node.isFavorite);
      } else if (selectedCategory === 'recent') {
        nodes = nodes.filter(node => node.lastUsed && node.lastUsed > Date.now() - 7 * 24 * 60 * 60 * 1000);
      } else {
        nodes = nodes.filter(node => node.category === selectedCategory);
      }
    }

    // 按搜索词过滤
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      nodes = nodes.filter(node => 
        node.name.toLowerCase().includes(query) ||
        node.description.toLowerCase().includes(query) ||
        node.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // 排序
    switch (sortMode) {
      case 'name':
        nodes.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'usage':
        nodes.sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));
        break;
      case 'recent':
        nodes.sort((a, b) => (b.lastUsed || 0) - (a.lastUsed || 0));
        break;
      case 'category':
        nodes.sort((a, b) => {
          if (a.category !== b.category) {
            return a.category.localeCompare(b.category);
          }
          return a.name.localeCompare(b.name);
        });
        break;
    }

    return nodes;
  }, [selectedCategory, searchQuery, sortMode]);

  return (
    <div className="flex flex-col h-full">
      {/* 搜索和过滤 */}
      <div className="p-3 border-b space-y-3">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('composer:nodeLibrary.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-9"
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="h-8 w-8 p-0"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="h-8 w-8 p-0"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          
          <Button variant="ghost" size="sm" className="h-8 gap-1">
            <SortAsc className="h-4 w-4" />
            <span className="text-xs">{t('composer:nodeLibrary.sort')}</span>
          </Button>
        </div>
      </div>

      {/* 分类标签 */}
      <div className="p-3 border-b">
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="grid w-full grid-cols-3 h-8">
            <TabsTrigger value="all" className="text-xs">
              {t('composer:nodeLibrary.categories.all')}
            </TabsTrigger>
            <TabsTrigger value="favorites" className="text-xs">
              <Star className="w-3 h-3 mr-1" />
              {t('composer:nodeLibrary.categories.favorites')}
            </TabsTrigger>
            <TabsTrigger value="recent" className="text-xs">
              <Clock className="w-3 h-3 mr-1" />
              {t('composer:nodeLibrary.categories.recent')}
            </TabsTrigger>
          </TabsList>
        </Tabs>
        
        <ScrollArea className="h-20 mt-2">
          <div className="flex flex-wrap gap-1">
            {nodeCategories.map(category => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className="h-7 gap-1 text-xs"
              >
                <category.icon className="w-3 h-3" />
                {category.name}
                <Badge variant="secondary" className="text-xs ml-1">
                  {category.nodeCount}
                </Badge>
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* 节点列表 */}
      <ScrollArea className="flex-1">
        <div className="p-3">
          {filteredAndSortedNodes.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
              <div className="text-sm font-medium">{t('composer:nodeLibrary.noNodes')}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {t('composer:nodeLibrary.noNodesDesc')}
              </div>
            </div>
          ) : (
            <div className={cn(
              'gap-2',
              viewMode === 'grid' 
                ? 'grid grid-cols-1 xl:grid-cols-2' 
                : 'space-y-1'
            )}>
              {filteredAndSortedNodes.map(node => (
                <NodeCard
                  key={node.id}
                  node={node}
                  viewMode={viewMode}
                  onDragStart={handleNodeDragStart}
                />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* 底部统计 */}
      <div className="p-2 border-t bg-muted/30">
        <div className="text-xs text-muted-foreground text-center">
          {t('composer:nodeLibrary.stats', { 
            total: filteredAndSortedNodes.length,
            categories: nodeCategories.length 
          })}
        </div>
      </div>
    </div>
  );
}