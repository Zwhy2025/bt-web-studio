# 对齐吸附功能 - 详细设计与实现计划

## 📋 功能概述

对齐吸附功能旨在提升行为树编辑器的用户体验，让节点布局更加整洁、专业，提高行为树的可读性和维护性。

## 🎯 功能目标

### 核心价值
- **提升可读性**：整齐排列的节点让行为树结构更清晰
- **专业外观**：对齐的布局看起来更专业、更整洁  
- **提升效率**：减少手动调整节点位置的时间
- **一致性**：确保所有节点都遵循相同的对齐规则

### 用户场景
1. **拖拽创建节点**：新节点自动对齐到合适位置
2. **调整节点布局**：拖拽时获得对齐指导
3. **批量整理**：选择多个节点一键对齐
4. **精确定位**：网格吸附避免像素级微调

## ✅ 一期已实现功能

### 1. 网格吸附 (已完成)
- **功能**：拖拽节点时自动对齐到20px网格点
- **实现**：在 `onNodeDrag` 中计算网格位置并应用
- **状态**：✅ 正常工作，用户体验良好

### 2. 批量对齐工具 (已完成)
- **功能**：选择多个节点，右键菜单提供对齐选项
- **支持的对齐方式**：
  - 左对齐、右对齐、水平居中
  - 顶部对齐、底部对齐、垂直居中
  - 水平分布、垂直分布
- **实现**：`alignNodes` 函数 + 右键菜单集成
- **状态**：✅ 正常工作

### 3. 全选功能 (已完成)
- **功能**：Ctrl+A 快捷键和右键菜单全选
- **实现**：`selectAllNodes` 函数 + 快捷键监听
- **状态**：✅ 正常工作

### 4. 基础UI组件 (已完成)
- **对齐参考线组件**：`AlignmentGuides`
- **对齐工具函数**：`alignment-utils.ts`
- **状态**：✅ 组件完成，但算法需要优化

## 🚧 一期遇到的问题

### 1. 智能参考线检测不准确
- **问题**：参考线在不应该显示时出现，误导用户
- **原因**：对齐检测算法过于宽松，阈值设置不当
- **当前状态**：已暂时禁用，避免用户困扰

### 2. 拖拽事件处理不稳定
- **问题**：截图等操作可能导致节点位置异常
- **原因**：事件监听和状态管理存在边界情况
- **当前状态**：已部分修复，但需要进一步优化

## 🎯 二期实现计划

### 阶段1：智能参考线算法重构 (优先级：高)

#### 1.1 精确对齐检测
```typescript
// 新的对齐检测策略
interface AlignmentDetection {
  // 严格的距离阈值 (2-3px)
  strictThreshold: number;
  
  // 只检测真正有意义的对齐
  alignmentTypes: {
    leftEdge: boolean;    // 左边缘对齐
    rightEdge: boolean;   // 右边缘对齐
    centerX: boolean;     // 水平中心对齐
    topEdge: boolean;     // 顶部边缘对齐
    bottomEdge: boolean;  // 底部边缘对齐
    centerY: boolean;     // 垂直中心对齐
  };
  
  // 最小节点数量要求
  minNodesForAlignment: number;
}
```

#### 1.2 视觉优化
- **参考线样式**：更细腻的动画效果
- **颜色区分**：不同类型对齐使用不同颜色
- **标签优化**：显示具体的对齐类型（如"左边缘对齐"）

#### 1.3 性能优化
- **防抖处理**：避免频繁计算对齐
- **范围限制**：只检测可视区域内的节点
- **缓存机制**：缓存对齐计算结果

### 阶段2：高级对齐功能 (优先级：中)

#### 2.1 智能布局建议
```typescript
interface LayoutSuggestion {
  type: 'tree' | 'grid' | 'flow';
  description: string;
  preview: Node[];
  apply: () => void;
}
```

#### 2.2 对齐历史和撤销
- **对齐操作历史**：记录每次对齐操作
- **一键撤销**：撤销最近的对齐操作
- **批量撤销**：撤销一系列对齐操作

#### 2.3 自定义对齐规则
```typescript
interface AlignmentRule {
  name: string;
  gridSize: number;
  snapThreshold: number;
  enabledAlignments: AlignmentType[];
  customSpacing: {
    horizontal: number;
    vertical: number;
  };
}
```

### 阶段3：用户体验增强 (优先级：中)

#### 3.1 对齐预览
- **实时预览**：拖拽时显示对齐后的效果
- **虚影显示**：用半透明节点显示对齐位置
- **动画过渡**：平滑的对齐动画

#### 3.2 快捷键增强
```typescript
const alignmentShortcuts = {
  'Ctrl+Shift+L': 'alignLeft',      // 左对齐
  'Ctrl+Shift+R': 'alignRight',     // 右对齐
  'Ctrl+Shift+C': 'alignCenter',    // 居中对齐
  'Ctrl+Shift+T': 'alignTop',       // 顶部对齐
  'Ctrl+Shift+B': 'alignBottom',    // 底部对齐
  'Ctrl+Shift+M': 'alignMiddle',    // 垂直居中
  'Ctrl+Shift+G': 'toggleGrid',     // 切换网格
};
```

#### 3.3 对齐工具栏
- **专用工具栏**：独立的对齐工具栏
- **状态指示**：显示当前对齐模式
- **快速切换**：一键切换对齐选项

### 阶段4：高级功能 (优先级：低)

#### 4.1 智能布局算法
- **自动布局**：基于行为树结构自动排列节点
- **层次布局**：按照树的层次自动对齐
- **紧凑布局**：最小化节点间距离

#### 4.2 对齐模板
```typescript
interface AlignmentTemplate {
  name: string;
  description: string;
  nodePositions: Record<string, Position>;
  apply: (selectedNodes: Node[]) => Node[];
}

const builtinTemplates = [
  'horizontal-flow',    // 水平流程
  'vertical-tree',      // 垂直树形
  'grid-layout',        // 网格布局
  'radial-layout',      // 径向布局
];
```

#### 4.3 协作功能
- **对齐同步**：多人协作时同步对齐操作
- **对齐冲突解决**：处理同时对齐的冲突
- **对齐权限**：控制谁可以执行对齐操作

## 🔧 技术实现细节

### 核心算法优化
```typescript
// 新的对齐检测算法
function calculatePreciseAlignment(
  draggingNode: Node,
  otherNodes: Node[],
  options: AlignmentOptions
): AlignmentResult {
  // 1. 预过滤：只检测附近的节点
  const nearbyNodes = filterNearbyNodes(draggingNode, otherNodes, 100);
  
  // 2. 精确计算：使用更严格的阈值
  const alignments = calculateExactAlignments(draggingNode, nearbyNodes);
  
  // 3. 优先级排序：选择最佳对齐方案
  const bestAlignment = selectBestAlignment(alignments);
  
  // 4. 验证：确保对齐确实有意义
  return validateAlignment(bestAlignment) ? bestAlignment : null;
}
```

### 性能优化策略
1. **空间索引**：使用四叉树加速节点查找
2. **增量计算**：只重新计算变化的部分
3. **Web Worker**：复杂计算放到后台线程
4. **虚拟化**：大量节点时只处理可见部分

### 测试策略
```typescript
describe('对齐功能测试', () => {
  describe('精确对齐检测', () => {
    test('应该只在真正接近时显示参考线');
    test('应该选择最佳的对齐方案');
    test('应该处理边界情况');
  });
  
  describe('批量对齐', () => {
    test('应该正确对齐多个节点');
    test('应该保持相对位置关系');
    test('应该处理重叠情况');
  });
  
  describe('性能测试', () => {
    test('大量节点时应该保持流畅');
    test('频繁拖拽时不应该卡顿');
  });
});
```

## 📊 成功指标

### 用户体验指标
- **对齐准确率**：> 95% 的对齐操作符合用户预期
- **响应时间**：对齐检测延迟 < 16ms (60fps)
- **错误率**：误显示参考线的情况 < 1%

### 功能完整性指标
- **对齐类型覆盖**：支持所有常用对齐方式
- **快捷键覆盖**：所有对齐操作都有快捷键
- **撤销支持**：所有对齐操作都可撤销

### 性能指标
- **大规模支持**：支持 1000+ 节点的对齐操作
- **内存使用**：对齐功能内存占用 < 10MB
- **CPU使用**：拖拽时CPU使用率 < 20%

## 🗓️ 实施时间表

### 第一阶段 (2周)
- Week 1: 重构对齐检测算法
- Week 2: 优化参考线显示和交互

### 第二阶段 (2周)  
- Week 3: 实现高级对齐功能
- Week 4: 添加对齐历史和撤销

### 第三阶段 (1周)
- Week 5: 用户体验优化和测试

### 第四阶段 (按需)
- 根据用户反馈实现高级功能

## 💡 设计原则

1. **简单优先**：优先实现简单可靠的功能
2. **渐进增强**：从基础功能逐步扩展到高级功能
3. **用户反馈驱动**：根据实际使用情况调整优先级
4. **性能第一**：确保功能不影响编辑器整体性能
5. **一致性**：与编辑器整体设计风格保持一致

## 🔍 风险评估

### 技术风险
- **算法复杂度**：对齐检测算法可能过于复杂
- **性能影响**：大量节点时可能影响性能
- **浏览器兼容性**：某些浏览器可能有性能差异

### 用户体验风险
- **学习成本**：功能过多可能增加学习成本
- **误操作**：自动对齐可能与用户意图不符
- **视觉干扰**：参考线可能干扰正常编辑

### 缓解策略
- **分阶段实施**：逐步推出功能，收集反馈
- **可配置性**：允许用户自定义对齐行为
- **详细文档**：提供完整的使用说明和最佳实践

---

## 📝 备注

此文档将随着开发进展持续更新。所有的设计决策都应该以提升用户体验为核心目标。

**最后更新**：2025-01-13
**负责人**：CodeBuddy
**状态**：二期规划中