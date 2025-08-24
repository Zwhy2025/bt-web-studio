import { describe, it, expect } from 'vitest';
import { getVisibleTabsForMode } from '@/components/layout/function-tabs';
import { WorkflowMode } from '@/core/store/workflowModeState';

describe('功能特化区域可见性', () => {
  it('编辑模式：显示 File 和 Help', () => {
    const tabs = getVisibleTabsForMode(WorkflowMode.COMPOSER);
    expect(tabs).toEqual(['file', 'help']);
  });

  it('调试模式：显示 Connection 和 Help', () => {
    const tabs = getVisibleTabsForMode(WorkflowMode.DEBUG);
    expect(tabs).toEqual(['connection', 'help']);
  });

  it('回放模式：显示 Load 和 Help', () => {
    const tabs = getVisibleTabsForMode(WorkflowMode.REPLAY);
    expect(tabs).toEqual(['load', 'help']);
  });
});

