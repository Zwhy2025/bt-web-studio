import { StateCreator } from 'zustand';
import { Node, Edge } from 'reactflow';

// 编排工具类型
export enum ComposerTool {
  SELECT = 'select',
  CONNECT = 'connect',
  PAN = 'pan',
  DELETE = 'delete',
}

// 对齐选项
export interface AlignmentOptions {
  snapToGrid: boolean;
  gridSize: number;
  snapToNodes: boolean;
  snapDistance: number;
  showAlignmentGuides: boolean;
}

// 视图配置
export interface ViewportConfig {
  zoom: number;
  position: { x: number; y: number };
  fitToContent: boolean;
  showMiniMap: boolean;
  showControls: boolean;
  showBackground: boolean;
  backgroundType: 'grid' | 'dots' | 'lines' | 'none';
}

// 节点库配置
export interface NodeLibraryConfig {
  isExpanded: boolean;
  activeCategory: string | null;
  searchQuery: string;
  showDescription: boolean;
  favoriteNodes: string[];
  recentNodes: string[];
}

// 属性面板配置
export interface PropertyPanelConfig {
  isExpanded: boolean;
  activeTab: 'properties' | 'documentation' | 'validation';
  showAdvancedProperties: boolean;
  groupedView: boolean;
}

// 编辑历史项
export interface EditHistoryItem {
  id: string;
  timestamp: number;
  action: string;
  description: string;
  undoData: any;
  redoData: any;
}

// 选择框状态
export interface SelectionBoxState {
  isActive: boolean;
  startPosition: { x: number; y: number } | null;
  endPosition: { x: number; y: number } | null;
  selectedNodeIds: string[];
}

// 验证错误
export interface ValidationError {
  id: string;
  nodeId: string;
  type: 'error' | 'warning' | 'info';
  message: string;
  description?: string;
  fix?: () => void;
}

// 编排模式状态接口
export interface ComposerModeState {
  // 基础编辑状态
  activeTool: ComposerTool;
  isEditing: boolean;
  isDirty: boolean;
  hasUnsavedChanges: boolean;
  
  // 选择状态
  selectedNodeIds: string[];
  selectedEdgeIds: string[];
  multiSelectEnabled: boolean;
  selectionBox: SelectionBoxState;
  
  // 视图状态
  viewport: ViewportConfig;
  alignment: AlignmentOptions;
  
  // 面板状态
  nodeLibrary: NodeLibraryConfig;
  propertyPanel: PropertyPanelConfig;
  
  // 编辑历史
  editHistory: EditHistoryItem[];
  historyIndex: number;
  maxHistorySize: number;
  
  // 验证状态
  validationErrors: ValidationError[];
  showValidationErrors: boolean;
  autoValidate: boolean;
  
  // 剪贴板
  clipboard: {
    nodes: Node[];
    edges: Edge[];
  } | null;
  
  // 布局状态
  autoLayout: boolean;
  layoutDirection: 'TB' | 'BT' | 'LR' | 'RL';
  nodeSpacing: { x: number; y: number };
  
  // 性能优化
  virtualizedRendering: boolean;
  maxVisibleNodes: number;
}

// 编排模式动作接口
export interface ComposerModeActions {
  // 工具切换
  setActiveTool: (tool: ComposerTool) => void;
  toggleTool: (tool: ComposerTool) => void;
  
  // 选择操作
  selectNode: (nodeId: string, multiSelect?: boolean) => void;
  selectEdge: (edgeId: string, multiSelect?: boolean) => void;
  selectMultiple: (nodeIds: string[], edgeIds?: string[]) => void;
  clearSelection: () => void;
  selectAll: () => void;
  invertSelection: () => void;
  
  // 选择框操作
  startSelectionBox: (position: { x: number; y: number }) => void;
  updateSelectionBox: (position: { x: number; y: number }) => void;
  endSelectionBox: () => void;
  cancelSelectionBox: () => void;
  
  // 节点操作
  addNode: (nodeType: string, position: { x: number; y: number }) => void;
  deleteSelectedNodes: () => void;
  duplicateSelectedNodes: () => void;
  groupSelectedNodes: () => void;
  ungroupSelectedNodes: () => void;
  
  // 连接操作
  addEdge: (source: string, target: string, sourceHandle?: string, targetHandle?: string) => void;
  deleteSelectedEdges: () => void;
  
  // 剪贴板操作
  copySelection: () => void;
  cutSelection: () => void;
  paste: (position?: { x: number; y: number }) => void;
  canPaste: () => boolean;
  
  // 历史操作
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  addToHistory: (action: string, description: string, undoData: any, redoData: any) => void;
  clearHistory: () => void;
  
  // 视图操作
  zoomIn: () => void;
  zoomOut: () => void;
  zoomToFit: () => void;
  zoomToSelection: () => void;
  resetView: () => void;
  updateViewport: (viewport: Partial<ViewportConfig>) => void;
  
  // 对齐操作
  alignLeft: () => void;
  alignRight: () => void;
  alignTop: () => void;
  alignBottom: () => void;
  alignCenterHorizontal: () => void;
  alignCenterVertical: () => void;
  distributeHorizontally: () => void;
  distributeVertically: () => void;
  
  // 布局操作
  autoLayoutTree: () => void;
  autoLayoutHierarchy: () => void;
  autoLayoutForce: () => void;
  setLayoutDirection: (direction: 'TB' | 'BT' | 'LR' | 'RL') => void;
  updateNodeSpacing: (spacing: { x: number; y: number }) => void;
  
  // 验证操作
  validateTree: () => void;
  clearValidationErrors: () => void;
  fixValidationError: (errorId: string) => void;
  toggleValidationDisplay: () => void;
  
  // 画布操作
  addConnection: (connection: any) => void;
  toggleSnapToGrid: () => void;
  openNodeEditor: (nodeId: string) => void;
  toggleBreakpoint: (nodeId: string) => void;
  toggleNodeDisabled: (nodeId: string) => void;
  openNodeSettings: (nodeId: string) => void;
  setSelectedNodes: (nodeIds: string[]) => void;
  
  // 面板操作
  toggleNodeLibrary: () => void;
  togglePropertyPanel: () => void;
  setNodeLibraryCategory: (category: string) => void;
  setNodeLibrarySearch: (query: string) => void;
  addToFavorites: (nodeType: string) => void;
  removeFromFavorites: (nodeType: string) => void;
  
  // 设置操作
  updateAlignmentOptions: (options: Partial<AlignmentOptions>) => void;
  toggleSnapToGrid: () => void;
  toggleSnapToNodes: () => void;
  toggleAutoLayout: () => void;
  toggleVirtualizedRendering: () => void;
  
  // 状态管理
  markDirty: () => void;
  markClean: () => void;
  saveState: () => any;
  restoreState: (state: any) => void;
  resetToDefaults: () => void;
}

// 编排模式切片接口
export interface ComposerModeSlice extends ComposerModeState {
  composerActions: ComposerModeActions;
}

// 默认配置
const defaultViewportConfig: ViewportConfig = {
  zoom: 1,
  position: { x: 0, y: 0 },
  fitToContent: false,
  showMiniMap: true,
  showControls: true,
  showBackground: true,
  backgroundType: 'grid',
};

const defaultAlignmentOptions: AlignmentOptions = {
  snapToGrid: true,
  gridSize: 20,
  snapToNodes: true,
  snapDistance: 10,
  showAlignmentGuides: true,
};

const defaultNodeLibraryConfig: NodeLibraryConfig = {
  isExpanded: true,
  activeCategory: null,
  searchQuery: '',
  showDescription: true,
  favoriteNodes: [],
  recentNodes: [],
};

const defaultPropertyPanelConfig: PropertyPanelConfig = {
  isExpanded: true,
  activeTab: 'properties',
  showAdvancedProperties: false,
  groupedView: true,
};

// 创建编排模式状态切片
export const createComposerModeSlice: StateCreator<
  ComposerModeSlice,
  [],
  [],
  ComposerModeSlice
> = (set, get) => {
  
  // 生成唯一ID
  const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // 添加到历史记录
  const addToHistory = (action: string, description: string, undoData: any, redoData: any) => {
    set(state => {
      const newItem: EditHistoryItem = {
        id: generateId(),
        timestamp: Date.now(),
        action,
        description,
        undoData,
        redoData,
      };
      
      const newHistory = state.editHistory.slice(0, state.historyIndex + 1);
      newHistory.push(newItem);
      
      // 限制历史记录大小
      if (newHistory.length > state.maxHistorySize) {
        newHistory.splice(0, newHistory.length - state.maxHistorySize);
      }
      
      return {
        ...state,
        editHistory: newHistory,
        historyIndex: newHistory.length - 1,
        isDirty: true,
        hasUnsavedChanges: true,
      };
    });
  };
  
  return {
    // 初始状态
    activeTool: ComposerTool.SELECT,
    isEditing: false,
    isDirty: false,
    hasUnsavedChanges: false,
    
    selectedNodeIds: [],
    selectedEdgeIds: [],
    multiSelectEnabled: true,
    selectionBox: {
      isActive: false,
      startPosition: null,
      endPosition: null,
      selectedNodeIds: [],
    },
    
    viewport: defaultViewportConfig,
    alignment: defaultAlignmentOptions,
    
    nodeLibrary: defaultNodeLibraryConfig,
    propertyPanel: defaultPropertyPanelConfig,
    
    editHistory: [],
    historyIndex: -1,
    maxHistorySize: 50,
    
    validationErrors: [],
    showValidationErrors: true,
    autoValidate: true,
    
    clipboard: null,
    
    autoLayout: false,
    layoutDirection: 'TB',
    nodeSpacing: { x: 200, y: 150 },
    
    virtualizedRendering: false,
    maxVisibleNodes: 1000,
    
    // 动作
    composerActions: {
      setActiveTool: (tool: ComposerTool) => {
        set(state => ({ ...state, activeTool: tool }));
      },
      
      toggleTool: (tool: ComposerTool) => {
        set(state => ({
          ...state,
          activeTool: state.activeTool === tool ? ComposerTool.SELECT : tool
        }));
      },
      
      selectNode: (nodeId: string, multiSelect = false) => {
        set(state => {
          if (multiSelect) {
            const selectedIds = state.selectedNodeIds.includes(nodeId)
              ? state.selectedNodeIds.filter(id => id !== nodeId)
              : [...state.selectedNodeIds, nodeId];
            return { ...state, selectedNodeIds: selectedIds, selectedEdgeIds: [] };
          } else {
            return {
              ...state,
              selectedNodeIds: [nodeId],
              selectedEdgeIds: [],
            };
          }
        });
      },
      
      selectEdge: (edgeId: string, multiSelect = false) => {
        set(state => {
          if (multiSelect) {
            const selectedIds = state.selectedEdgeIds.includes(edgeId)
              ? state.selectedEdgeIds.filter(id => id !== edgeId)
              : [...state.selectedEdgeIds, edgeId];
            return { ...state, selectedEdgeIds: selectedIds, selectedNodeIds: [] };
          } else {
            return {
              ...state,
              selectedEdgeIds: [edgeId],
              selectedNodeIds: [],
            };
          }
        });
      },
      
      selectMultiple: (nodeIds: string[], edgeIds: string[] = []) => {
        set(state => ({
          ...state,
          selectedNodeIds: nodeIds,
          selectedEdgeIds: edgeIds,
        }));
      },
      
      clearSelection: () => {
        set(state => ({
          ...state,
          selectedNodeIds: [],
          selectedEdgeIds: [],
        }));
      },
      
      selectAll: () => {
        // TODO: 从主状态获取所有节点和边的ID
        console.log('Select all nodes and edges');
      },
      
      invertSelection: () => {
        // TODO: 反选所有节点和边
        console.log('Invert selection');
      },
      
      startSelectionBox: (position: { x: number; y: number }) => {
        set(state => ({
          ...state,
          selectionBox: {
            ...state.selectionBox,
            isActive: true,
            startPosition: position,
            endPosition: position,
            selectedNodeIds: [],
          }
        }));
      },
      
      updateSelectionBox: (position: { x: number; y: number }) => {
        set(state => {
          if (!state.selectionBox.isActive) return state;
          
          return {
            ...state,
            selectionBox: {
              ...state.selectionBox,
              endPosition: position,
            }
          };
        });
      },
      
      endSelectionBox: () => {
        set(state => {
          // TODO: 计算选择框内的节点
          const selectedNodeIds = state.selectionBox.selectedNodeIds;
          
          return {
            ...state,
            selectedNodeIds,
            selectedEdgeIds: [],
            selectionBox: {
              isActive: false,
              startPosition: null,
              endPosition: null,
              selectedNodeIds: [],
            }
          };
        });
      },
      
      cancelSelectionBox: () => {
        set(state => ({
          ...state,
          selectionBox: {
            isActive: false,
            startPosition: null,
            endPosition: null,
            selectedNodeIds: [],
          }
        }));
      },
      
      addNode: (nodeType: string, position: { x: number; y: number }) => {
        // TODO: 与主状态集成，添加新节点
        console.log(`Adding node: ${nodeType} at`, position);
        addToHistory('addNode', `Added ${nodeType} node`, null, null);
      },
      
      deleteSelectedNodes: () => {
        // TODO: 删除选中的节点
        console.log('Deleting selected nodes');
        addToHistory('deleteNodes', 'Deleted selected nodes', null, null);
      },
      
      duplicateSelectedNodes: () => {
        // TODO: 复制选中的节点
        console.log('Duplicating selected nodes');
        addToHistory('duplicateNodes', 'Duplicated selected nodes', null, null);
      },
      
      groupSelectedNodes: () => {
        console.log('Grouping selected nodes');
        addToHistory('groupNodes', 'Grouped selected nodes', null, null);
      },
      
      ungroupSelectedNodes: () => {
        console.log('Ungrouping selected nodes');
        addToHistory('ungroupNodes', 'Ungrouped selected nodes', null, null);
      },
      
      addEdge: (source: string, target: string, sourceHandle?: string, targetHandle?: string) => {
        console.log(`Adding edge: ${source} -> ${target}`);
        addToHistory('addEdge', 'Added connection', null, null);
      },
      
      deleteSelectedEdges: () => {
        console.log('Deleting selected edges');
        addToHistory('deleteEdges', 'Deleted selected connections', null, null);
      },
      
      copySelection: () => {
        // TODO: 复制选中的节点和边到剪贴板
        console.log('Copying selection');
      },
      
      cutSelection: () => {
        // TODO: 剪切选中的节点和边
        console.log('Cutting selection');
        addToHistory('cutSelection', 'Cut selection', null, null);
      },
      
      paste: (position?: { x: number; y: number }) => {
        // TODO: 粘贴剪贴板内容
        console.log('Pasting at', position);
        addToHistory('paste', 'Pasted content', null, null);
      },
      
      canPaste: () => {
        return get().clipboard !== null;
      },
      
      undo: () => {
        const { editHistory, historyIndex } = get();
        if (historyIndex >= 0) {
          const item = editHistory[historyIndex];
          // TODO: 执行撤销操作
          console.log('Undoing:', item.description);
          set(state => ({ ...state, historyIndex: state.historyIndex - 1 }));
        }
      },
      
      redo: () => {
        const { editHistory, historyIndex } = get();
        if (historyIndex < editHistory.length - 1) {
          const item = editHistory[historyIndex + 1];
          // TODO: 执行重做操作
          console.log('Redoing:', item.description);
          set(state => ({ ...state, historyIndex: state.historyIndex + 1 }));
        }
      },
      
      canUndo: () => {
        return get().historyIndex >= 0;
      },
      
      canRedo: () => {
        const { editHistory, historyIndex } = get();
        return historyIndex < editHistory.length - 1;
      },
      
      addToHistory,
      
      clearHistory: () => {
        set(state => ({
          ...state,
          editHistory: [],
          historyIndex: -1,
        }));
      },
      
      zoomIn: () => {
        set(state => ({
          ...state,
          viewport: {
            ...state.viewport,
            zoom: Math.min(state.viewport.zoom * 1.2, 3),
          }
        }));
      },
      
      zoomOut: () => {
        set(state => ({
          ...state,
          viewport: {
            ...state.viewport,
            zoom: Math.max(state.viewport.zoom / 1.2, 0.1),
          }
        }));
      },
      
      zoomToFit: () => {
        console.log('Zooming to fit content');
      },
      
      zoomToSelection: () => {
        console.log('Zooming to selection');
      },
      
      resetView: () => {
        set(state => ({
          ...state,
          viewport: defaultViewportConfig,
        }));
      },
      
      updateViewport: (viewport: Partial<ViewportConfig>) => {
        set(state => ({
          ...state,
          viewport: { ...state.viewport, ...viewport },
        }));
      },
      
      alignLeft: () => {
        console.log('Aligning nodes to left');
        addToHistory('alignLeft', 'Aligned nodes to left', null, null);
      },
      
      alignRight: () => {
        console.log('Aligning nodes to right');
        addToHistory('alignRight', 'Aligned nodes to right', null, null);
      },
      
      alignTop: () => {
        console.log('Aligning nodes to top');
        addToHistory('alignTop', 'Aligned nodes to top', null, null);
      },
      
      alignBottom: () => {
        console.log('Aligning nodes to bottom');
        addToHistory('alignBottom', 'Aligned nodes to bottom', null, null);
      },
      
      alignCenterHorizontal: () => {
        console.log('Aligning nodes to center horizontal');
        addToHistory('alignCenterH', 'Aligned nodes horizontally', null, null);
      },
      
      alignCenterVertical: () => {
        console.log('Aligning nodes to center vertical');
        addToHistory('alignCenterV', 'Aligned nodes vertically', null, null);
      },
      
      distributeHorizontally: () => {
        console.log('Distributing nodes horizontally');
        addToHistory('distributeH', 'Distributed nodes horizontally', null, null);
      },
      
      distributeVertically: () => {
        console.log('Distributing nodes vertically');
        addToHistory('distributeV', 'Distributed nodes vertically', null, null);
      },
      
      autoLayoutTree: () => {
        console.log('Auto-layout as tree');
        addToHistory('autoLayoutTree', 'Auto-layout as tree', null, null);
      },
      
      autoLayoutHierarchy: () => {
        console.log('Auto-layout as hierarchy');
        addToHistory('autoLayoutHierarchy', 'Auto-layout as hierarchy', null, null);
      },
      
      autoLayoutForce: () => {
        console.log('Auto-layout with force');
        addToHistory('autoLayoutForce', 'Auto-layout with force', null, null);
      },
      
      setLayoutDirection: (direction: 'TB' | 'BT' | 'LR' | 'RL') => {
        set(state => ({ ...state, layoutDirection: direction }));
      },
      
      updateNodeSpacing: (spacing: { x: number; y: number }) => {
        set(state => ({ ...state, nodeSpacing: spacing }));
      },
      
      validateTree: () => {
        // TODO: 验证行为树结构
        console.log('Validating tree');
      },
      
      clearValidationErrors: () => {
        set(state => ({ ...state, validationErrors: [] }));
      },
      
      fixValidationError: (errorId: string) => {
        const error = get().validationErrors.find(e => e.id === errorId);
        if (error && error.fix) {
          error.fix();
          set(state => ({
            ...state,
            validationErrors: state.validationErrors.filter(e => e.id !== errorId)
          }));
        }
      },
      
      toggleValidationDisplay: () => {
        set(state => ({
          ...state,
          showValidationErrors: !state.showValidationErrors
        }));
      },
      
      // 画布操作实现
      addConnection: (connection: any) => {
        console.log('Adding connection:', connection);
        addToHistory('addConnection', 'Add connection', null, connection);
      },
      
      openNodeEditor: (nodeId: string) => {
        console.log('Opening node editor for:', nodeId);
        // TODO: 实现节点编辑器打开逻辑
      },
      
      toggleBreakpoint: (nodeId: string) => {
        console.log('Toggling breakpoint for node:', nodeId);
        // TODO: 实现断点切换逻辑
      },
      
      toggleNodeDisabled: (nodeId: string) => {
        console.log('Toggling disabled state for node:', nodeId);
        // TODO: 实现节点禁用切换逻辑
      },
      
      openNodeSettings: (nodeId: string) => {
        console.log('Opening node settings for:', nodeId);
        // TODO: 实现节点设置对话框
      },
      
      setSelectedNodes: (nodeIds: string[]) => {
        set(state => ({ ...state, selectedNodeIds: nodeIds }));
      },
      
      toggleNodeLibrary: () => {
        set(state => ({
          ...state,
          nodeLibrary: {
            ...state.nodeLibrary,
            isExpanded: !state.nodeLibrary.isExpanded
          }
        }));
      },
      
      togglePropertyPanel: () => {
        set(state => ({
          ...state,
          propertyPanel: {
            ...state.propertyPanel,
            isExpanded: !state.propertyPanel.isExpanded
          }
        }));
      },
      
      setNodeLibraryCategory: (category: string) => {
        set(state => ({
          ...state,
          nodeLibrary: {
            ...state.nodeLibrary,
            activeCategory: category
          }
        }));
      },
      
      setNodeLibrarySearch: (query: string) => {
        set(state => ({
          ...state,
          nodeLibrary: {
            ...state.nodeLibrary,
            searchQuery: query
          }
        }));
      },
      
      addToFavorites: (nodeType: string) => {
        set(state => ({
          ...state,
          nodeLibrary: {
            ...state.nodeLibrary,
            favoriteNodes: [...state.nodeLibrary.favoriteNodes, nodeType]
          }
        }));
      },
      
      removeFromFavorites: (nodeType: string) => {
        set(state => ({
          ...state,
          nodeLibrary: {
            ...state.nodeLibrary,
            favoriteNodes: state.nodeLibrary.favoriteNodes.filter(n => n !== nodeType)
          }
        }));
      },
      
      updateAlignmentOptions: (options: Partial<AlignmentOptions>) => {
        set(state => ({
          ...state,
          alignment: { ...state.alignment, ...options }
        }));
      },
      
      toggleSnapToGrid: () => {
        set(state => ({
          ...state,
          alignment: {
            ...state.alignment,
            snapToGrid: !state.alignment.snapToGrid
          }
        }));
      },
      
      toggleSnapToNodes: () => {
        set(state => ({
          ...state,
          alignment: {
            ...state.alignment,
            snapToNodes: !state.alignment.snapToNodes
          }
        }));
      },
      
      toggleAutoLayout: () => {
        set(state => ({ ...state, autoLayout: !state.autoLayout }));
      },
      
      toggleVirtualizedRendering: () => {
        set(state => ({
          ...state,
          virtualizedRendering: !state.virtualizedRendering
        }));
      },
      
      markDirty: () => {
        set(state => ({ ...state, isDirty: true, hasUnsavedChanges: true }));
      },
      
      markClean: () => {
        set(state => ({ ...state, isDirty: false, hasUnsavedChanges: false }));
      },
      
      saveState: () => {
        const state = get();
        return {
          activeTool: state.activeTool,
          selectedNodeIds: state.selectedNodeIds,
          selectedEdgeIds: state.selectedEdgeIds,
          viewport: state.viewport,
          alignment: state.alignment,
          nodeLibrary: state.nodeLibrary,
          propertyPanel: state.propertyPanel,
        };
      },
      
      restoreState: (state: any) => {
        set(currentState => ({ ...currentState, ...state }));
      },
      
      resetToDefaults: () => {
        set({
          activeTool: ComposerTool.SELECT,
          isEditing: false,
          isDirty: false,
          hasUnsavedChanges: false,
          selectedNodeIds: [],
          selectedEdgeIds: [],
          viewport: defaultViewportConfig,
          alignment: defaultAlignmentOptions,
          nodeLibrary: defaultNodeLibraryConfig,
          propertyPanel: defaultPropertyPanelConfig,
          editHistory: [],
          historyIndex: -1,
          validationErrors: [],
          clipboard: null,
          autoLayout: false,
          layoutDirection: 'TB',
          nodeSpacing: { x: 200, y: 150 },
        });
      },
    }
  };
};

// 选择器钩子
export const useActiveTool = () => (state: any) => state.activeTool;
export const useSelectedNodes = () => (state: any) => state.selectedNodeIds;
export const useSelectedEdges = () => (state: any) => state.selectedEdgeIds;
export const useViewport = () => (state: any) => state.viewport;
export const useSnapToGrid = () => (state: any) => state.alignment.snapToGrid;
export const useCanvasConfig = () => (state: any) => state.viewport;
export const useNodeLibraryConfig = () => (state: any) => state.nodeLibrary;
export const usePropertyPanelConfig = () => (state: any) => state.propertyPanel;
export const useEditHistory = () => (state: any) => state.editHistory;
export const useValidationErrors = () => (state: any) => state.validationErrors;
export const useComposerActions = () => (state: any) => state.composerActions;