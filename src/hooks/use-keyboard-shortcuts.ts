import { useEffect, useCallback } from 'react';
import { useBehaviorTreeStore } from '@/core/store/behavior-tree-store';

/**
 * 键盘快捷键Hook
 * 提供属性面板相关的键盘快捷键支持
 */
export const useKeyboardShortcuts = (selectedNodeIds: string[]) => {
  const actions = useBehaviorTreeStore((state) => state.actions);
  const composerActions = useBehaviorTreeStore((state) => state.composerActions);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // 只在有选中节点时处理快捷键
    if (selectedNodeIds.length === 0) return;

    // 阻止默认行为的快捷键
    if (event.ctrlKey || event.metaKey) {
      switch (event.key) {
        case 'Enter':
          // 应用更改
          event.preventDefault();
          console.log('应用更改');
          break;
          
        case 'Escape':
          // 取消编辑
          event.preventDefault();
          console.log('取消编辑');
          break;
          
        case 'z':
          if (event.shiftKey) {
            // 重做
            event.preventDefault();
            composerActions.redo();
          } else {
            // 撤销
            event.preventDefault();
            composerActions.undo();
          }
          break;
          
        case 'c':
          // 复制节点
          event.preventDefault();
          console.log('复制节点:', selectedNodeIds);
          break;
          
        case 'v':
          // 粘贴节点
          event.preventDefault();
          composerActions.paste();
          break;
          
        case 'd':
          // 删除节点
          event.preventDefault();
          if (selectedNodeIds.length > 0) {
            actions.deleteNodes(selectedNodeIds);
          }
          break;
          
        default:
          break;
      }
    }
    
    // 功能键
    switch (event.key) {
      case 'Delete':
      case 'Backspace':
        // 删除选中节点
        event.preventDefault();
        if (selectedNodeIds.length > 0) {
          actions.deleteNodes(selectedNodeIds);
        }
        break;
        
      case 'F2':
        // 重命名节点
        event.preventDefault();
        console.log('重命名节点');
        break;
        
      default:
        break;
    }
  }, [selectedNodeIds, actions, composerActions]);

  useEffect(() => {
    // 添加键盘事件监听器
    window.addEventListener('keydown', handleKeyDown);
    
    // 清理函数
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
};