# BT Web Studio 工作流重构设计

## 概述

本文档详细描述了 BT Web Studio 的工作流重构设计，将原本散乱的三个核心功能（编排、调试加状态可视化、日志回放）重构为三种清晰的工作模式：**编排模式**、**调试模式**、**回放模式**。

### 设计目标

1. **模式分离**：将三个核心功能分离为独立的工作模式，避免界面混乱
2. **专注体验**：每个模式提供专门优化的用户界面和交互体验
3. **状态隔离**：不同模式之间的状态和操作相互独立，避免冲突
4. **流畅切换**：支持在三种模式之间快速切换，保持工作连续性

## 技术栈与依赖

- **状态管理**：基于现有 Zustand 架构，增加模式管理切片
- **UI组件**：继续使用 shadcn/ui 组件库
- **布局系统**：重构现有 ResizableLayout，支持模式化布局
- **国际化**：扩展现有 i18n 配置，支持新的模式相关翻译

## 整体架构设计

### 模式管理架构

```mermaid
graph TB
    subgraph "全局模式管理"
        ModeManager[模式管理器]
        ModeState[模式状态]
        ModeTransition[模式切换逻辑]
    end
    
    subgraph "编排模式"
        ComposerLayout[编排布局]
        NodeLibrary[节点库]
        PropertyPanel[属性面板]
        ComposerCanvas[编排画布]
    end
    
    subgraph "调试模式"
        DebugLayout[调试布局]
        DebugToolbar[调试工具栏]
        StateMonitor[状态监控面板]
        BreakpointPanel[断点面板]
        DebugCanvas[调试画布]
    end
    
    subgraph "回放模式"
        ReplayLayout[回放布局]
        TimelineController[时间轴控制器]
        EventInspector[事件检查器]
        ReplayCanvas[回放画布]
    end
    
    ModeManager --> ComposerLayout
    ModeManager --> DebugLayout
    ModeManager --> ReplayLayout
    
    ModeState --> ModeTransition
    ModeTransition --> ModeManager
```

### 状态管理架构扩展

```mermaid
classDiagram
    class WorkflowModeSlice {
        +currentMode: 'composer' | 'debug' | 'replay'
        +previousMode: 'composer' | 'debug' | 'replay' | null
        +isTransitioning: boolean
        +modeHistory: string[]
        +actions: WorkflowModeActions
    }
    
    class WorkflowModeActions {
        +switchToComposer(): void
        +switchToDebug(): void
        +switchToReplay(): void
        +goToPreviousMode(): void
        +canSwitchMode(targetMode: string): boolean
        +prepareModeTransition(targetMode: string): void
        +completeModeTransition(): void
    }
    
    class ComposerModeSlice {
        +activeTab: 'canvas' | 'properties'
        +selectedNodeIds: string[]
        +showGrid: boolean
        +snapToGrid: boolean
        +autoLayout: boolean
        +actions: ComposerModeActions
    }
    
    class DebugModeSlice {
        +debugSession: DebugSession | null
        +executionState: 'idle' | 'running' | 'paused' | 'error'
        +breakpoints: Set&lt;string&gt;
        +currentExecutingNode: string | null
        +executionSpeed: number
        +showExecutionPath: boolean
        +actions: DebugModeActions
    }
    
    class ReplayModeSlice {
        +replaySession: ReplaySession | null
        +timelinePosition: number
        +playbackSpeed: number
        +isPlaying: boolean
        +loopEnabled: boolean
        +selectedEventTypes: string[]
        +actions: ReplayModeActions
    }
    
    WorkflowModeSlice --> WorkflowModeActions
    ComposerModeSlice --> ComposerModeActions
    DebugModeSlice --> DebugModeActions
    ReplayModeSlice --> ReplayModeActions
```

## UI设计与布局

### 主界面布局设计

```mermaid
graph TB
    subgraph "主应用布局"
        TopBar[顶部栏]
        ModeSelector[模式选择器]
        MainContent[主内容区域]
        StatusBar[状态栏]
    end
    
    subgraph "顶部栏组件"
        AppLogo[应用Logo]
        ProjectInfo[项目信息]
        GlobalActions[全局操作]
        UserMenu[用户菜单]
    end
    
    subgraph "模式选择器"
        ComposerTab[编排模式]
        DebugTab[调试模式]
        ReplayTab[回放模式]
        ModeIndicator[模式指示器]
    end
    
    TopBar --> AppLogo
    TopBar --> ProjectInfo
    TopBar --> GlobalActions
    TopBar --> UserMenu
    
    ModeSelector --> ComposerTab
    ModeSelector --> DebugTab
    ModeSelector --> ReplayTab
    ModeSelector --> ModeIndicator
```

### 编排模式布局

```mermaid
graph LR
    subgraph "编排模式布局"
        CL[左侧节点库面板]
        CC[中央编排画布]
        CR[右侧属性面板]
        CB[底部工具栏]
    end
    
    subgraph "节点库面板"
        NodeCategories[节点分类]
        NodeList[节点列表]
        NodeSearch[节点搜索]
        CustomNodes[自定义节点]
    end
    
    subgraph "编排画布"
        FlowEditor[流程编辑器]
        MiniMap[缩略图]
        ZoomControls[缩放控件]
        GridToggle[网格切换]
    end
    
    subgraph "属性面板"
        NodeProperties[节点属性]
        PortConfiguration[端口配置]
        ValidationErrors[验证错误]
        DocumentationPanel[文档面板]
    end
    
    CL --> NodeCategories
    CL --> NodeList
    CL --> NodeSearch
    CL --> CustomNodes
    
    CC --> FlowEditor
    CC --> MiniMap
    CC --> ZoomControls
    CC --> GridToggle
    
    CR --> NodeProperties
    CR --> PortConfiguration
    CR --> ValidationErrors
    CR --> DocumentationPanel
```

### 调试模式布局

```mermaid
graph LR
    subgraph "调试模式布局"
        DL[左侧状态监控面板]
        DC[中央调试画布]
        DR[右侧调试控制面板]
        DT[顶部调试工具栏]
    end
    
    subgraph "状态监控面板"
        ExecutionStack[执行栈]
        VariableInspector[变量检查器]
        PerformanceMonitor[性能监控]
        LogOutput[日志输出]
    end
    
    subgraph "调试画布"
        ExecutionVisualization[执行可视化]
        NodeStateOverlay[节点状态覆盖层]
        ExecutionPathHighlight[执行路径高亮]
        BreakpointIndicators[断点指示器]
    end
    
    subgraph "调试控制面板"
        BreakpointManager[断点管理器]
        CallStack[调用栈]
        WatchList[监视列表]
        DebugConsole[调试控制台]
    end
    
    DL --> ExecutionStack
    DL --> VariableInspector
    DL --> PerformanceMonitor
    DL --> LogOutput
    
    DC --> ExecutionVisualization
    DC --> NodeStateOverlay
    DC --> ExecutionPathHighlight
    DC --> BreakpointIndicators
    
    DR --> BreakpointManager
    DR --> CallStack
    DR --> WatchList
    DR --> DebugConsole
```

### 回放模式布局

```mermaid
graph LR
    subgraph "回放模式布局"
        RL[左侧事件检查器]
        RC[中央回放画布]
        RR[右侧数据分析面板]
        RB[底部时间轴控制器]
    end
    
    subgraph "事件检查器"
        EventList[事件列表]
        EventFilter[事件过滤器]
        EventDetails[事件详情]
        EventSearch[事件搜索]
    end
    
    subgraph "回放画布"
        TimebasedVisualization[基于时间的可视化]
        NodeAnimations[节点动画]
        PathTracing[路径追踪]
        StateSnapshots[状态快照]
    end
    
    subgraph "数据分析面板"
        StatisticsView[统计视图]
        PerformanceChart[性能图表]
        HeatmapView[热力图视图]
        ExportOptions[导出选项]
    end
    
    subgraph "时间轴控制器"
        TimelineSlider[时间轴滑块]
        PlaybackControls[播放控制]
        SpeedSelector[速度选择]
        TimeMarkers[时间标记]
    end
    
    RL --> EventList
    RL --> EventFilter
    RL --> EventDetails
    RL --> EventSearch
    
    RC --> TimebasedVisualization
    RC --> NodeAnimations
    RC --> PathTracing
    RC --> StateSnapshots
    
    RR --> StatisticsView
    RR --> PerformanceChart
    RR --> HeatmapView
    RR --> ExportOptions
    
    RB --> TimelineSlider
    RB --> PlaybackControls
    RB --> SpeedSelector
    RB --> TimeMarkers
```

## 核心功能架构

### 编排模式功能架构

```mermaid
flowchart TD
    subgraph "编排模式核心功能"
        NodeManagement[节点管理]
        ConnectionManagement[连接管理]
        PropertyEditing[属性编辑]
        LayoutManager[布局管理器]
        ValidationEngine[验证引擎]
        ExportEngine[导出引擎]
    end
    
    subgraph "节点管理功能"
        NodeCreation[节点创建]
        NodeDeletion[节点删除]
        NodeDuplication[节点复制]
        NodeGrouping[节点分组]
        NodeLibraryIntegration[节点库集成]
    end
    
    subgraph "连接管理功能"
        EdgeCreation[边创建]
        EdgeValidation[边验证]
        EdgeDeletion[边删除]
        AutoRouting[自动路由]
    end
    
    NodeManagement --> NodeCreation
    NodeManagement --> NodeDeletion
    NodeManagement --> NodeDuplication
    NodeManagement --> NodeGrouping
    NodeManagement --> NodeLibraryIntegration
    
    ConnectionManagement --> EdgeCreation
    ConnectionManagement --> EdgeValidation
    ConnectionManagement --> EdgeDeletion
    ConnectionManagement --> AutoRouting
```

### 调试模式功能架构

```mermaid
flowchart TD
    subgraph "调试模式核心功能"
        DebugSession[调试会话管理]
        ExecutionControl[执行控制]
        StateInspection[状态检查]
        BreakpointSystem[断点系统]
        PerformanceProfiler[性能分析器]
        CommunicationLayer[通信层]
    end
    
    subgraph "调试会话管理"
        SessionCreation[会话创建]
        SessionConnection[会话连接]
        SessionTermination[会话终止]
        SessionPersistence[会话持久化]
    end
    
    subgraph "执行控制"
        StartExecution[开始执行]
        PauseExecution[暂停执行]
        StepExecution[单步执行]
        ResetExecution[重置执行]
        SpeedControl[速度控制]
    end
    
    DebugSession --> SessionCreation
    DebugSession --> SessionConnection
    DebugSession --> SessionTermination
    DebugSession --> SessionPersistence
    
    ExecutionControl --> StartExecution
    ExecutionControl --> PauseExecution
    ExecutionControl --> StepExecution
    ExecutionControl --> ResetExecution
    ExecutionControl --> SpeedControl
```

### 回放模式功能架构

```mermaid
flowchart TD
    subgraph "回放模式核心功能"
        SessionLoader[会话加载器]
        TimelineEngine[时间轴引擎]
        EventProcessor[事件处理器]
        VisualizationEngine[可视化引擎]
        AnalysisEngine[分析引擎]
        ExportEngine[导出引擎]
    end
    
    subgraph "会话加载器"
        LogFileLoader[日志文件加载器]
        SessionParser[会话解析器]
        DataValidator[数据验证器]
        SessionIndexer[会话索引器]
    end
    
    subgraph "时间轴引擎"
        TimelineNavigation[时间轴导航]
        PlaybackControl[播放控制]
        TimelineSync[时间轴同步]
        MarkerManagement[标记管理]
    end
    
    SessionLoader --> LogFileLoader
    SessionLoader --> SessionParser
    SessionLoader --> DataValidator
    SessionLoader --> SessionIndexer
    
    TimelineEngine --> TimelineNavigation
    TimelineEngine --> PlaybackControl
    TimelineEngine --> TimelineSync
    TimelineEngine --> MarkerManagement
```

## 数据流设计

### 模式切换数据流

```mermaid
sequenceDiagram
    participant User as 用户
    participant ModeSelector as 模式选择器
    participant ModeManager as 模式管理器
    participant CurrentMode as 当前模式
    participant TargetMode as 目标模式
    participant StateManager as 状态管理器
    
    User->>ModeSelector: 点击模式标签
    ModeSelector->>ModeManager: requestModeSwitch(targetMode)
    ModeManager->>CurrentMode: saveCurrentState()
    CurrentMode->>StateManager: 保存当前状态
    ModeManager->>ModeManager: validateModeSwitch()
    alt 模式切换有效
        ModeManager->>CurrentMode: cleanup()
        ModeManager->>TargetMode: initialize()
        TargetMode->>StateManager: 加载目标状态
        ModeManager->>ModeSelector: switchComplete(targetMode)
        ModeSelector->>User: 显示目标模式界面
    else 模式切换无效
        ModeManager->>ModeSelector: switchFailed(reason)
        ModeSelector->>User: 显示错误消息
    end
```

### 编排模式数据流

```mermaid
sequenceDiagram
    participant User as 用户
    participant NodeLibrary as 节点库
    participant Canvas as 画布
    participant PropertyPanel as 属性面板
    participant Store as 状态存储
    
    User->>NodeLibrary: 拖拽节点
    NodeLibrary->>Canvas: onNodeDrop(nodeData)
    Canvas->>Store: addNode(nodeData)
    Store->>Canvas: 更新节点列表
    Canvas->>User: 显示新节点
    
    User->>Canvas: 选择节点
    Canvas->>Store: setSelectedNode(nodeId)
    Store->>PropertyPanel: 通知节点选择变化
    PropertyPanel->>Store: 获取节点属性
    PropertyPanel->>User: 显示节点属性
    
    User->>PropertyPanel: 修改属性
    PropertyPanel->>Store: updateNodeProperty(nodeId, key, value)
    Store->>Canvas: 通知节点更新
    Canvas->>User: 更新节点显示
```

### 调试模式数据流

```mermaid
sequenceDiagram
    participant User as 用户
    participant DebugToolbar as 调试工具栏
    participant DebugSession as 调试会话
    participant WSClient as WebSocket客户端
    participant BTEngine as 行为树引擎
    participant StateMonitor as 状态监控
    
    User->>DebugToolbar: 点击开始调试
    DebugToolbar->>DebugSession: startDebugSession()
    DebugSession->>WSClient: connect(engineEndpoint)
    WSClient->>BTEngine: 建立连接
    BTEngine->>WSClient: 返回连接确认
    WSClient->>DebugSession: 连接成功
    DebugSession->>StateMonitor: 开始监控
    
    User->>DebugToolbar: 点击执行
    DebugToolbar->>WSClient: sendCommand('execute')
    WSClient->>BTEngine: 执行命令
    BTEngine->>WSClient: 状态更新事件
    WSClient->>StateMonitor: 更新节点状态
    StateMonitor->>User: 可视化状态变化
```

## 测试策略

### 模式切换测试
- 测试三种模式之间的平滑切换
- 验证状态保存和恢复的正确性
- 测试异常情况下的模式切换处理

### 组件集成测试
- 各模式下组件间的交互测试
- 数据流的端到端测试
- 性能和内存使用测试

### 用户体验测试
- 界面响应性测试
- 国际化功能测试
- 无障碍访问测试