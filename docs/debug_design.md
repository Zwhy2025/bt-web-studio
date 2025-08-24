调试模式 UI 方案（基于行为树 & GROOT）

一、需求分析（UI侧聚焦）

目标
在统一界面里完成：实时调试、断点、变量监控、流程追踪、版本差异与回放。
兼容历史功能与数据（老代码），逐步切换到新的统一 Store/事件模型（新代码）。
针对 GROOT 业务流提供专用工具条与面板（如端口值、黑板、状态、事件流）。
关键诉求
保留老代码中有价值的面板/交互，提供兼容适配层；2) 行为树语义化可视化（状态着色、活跃路径、端口值）；3) GROOT 流程工具（节点端口/Ports、黑板、Tick/Result、断点步进）；4) 版本维度的可视化切换与差异高亮；5) 实时变量监控与时序追踪（含回放）。
约束与策略
仅 UI 与前端架构；数据源用 mock 或已存在的 websocket 客户端抽象。
渐进式替换：保留旧面板入口，用“Legacy”标注，背后接入统一 store。
二、现有资产梳理（与调试相关，已存在）

布局/工具
src/components/layout/debug-layout.tsx、debug-toolbar.tsx、debug-logs-panel.tsx、breakpoint-panel.tsx、replay-layout.tsx、timeline-controller.tsx、bottom-timeline.tsx、interactive-timeline.tsx
顶部/功能区：top-bar.tsx、mode-aware-layout.tsx、function-tabs.tsx
节点/画布
debug-behavior-tree-node.tsx、replay-behavior-tree-node.tsx、bt-canvas.tsx、debug-canvas.tsx、replay-canvas.tsx
Store/协议
core/store/debuggerState.ts、debugModeState.ts、timelineState.ts、replayModeState.ts
core/debugger/real-websocket-client.ts
编排模式参考
docs/composer_design.md 里的节点/端口/布局规范与 UI 语言
三、信息架构与模式划分

顶层模式：Composer | Debug | Replay（沿用现有模式切换）
Debug 整合视图的“功能分层”
顶部：会话与模式切换、运行控制、版本切换、过滤器
左侧：行为树概览/节点库（调试时切为“结构树 + 断点清单”）
中部：行为树画布（状态着色、活跃路径、端口值徽标）
右侧：Inspector 选项卡（Node/Ports、Blackboard、Breakpoints、Versions、Logs）
底部：时间轴/事件流（实时/回放共用，带筛选与标记）
四、核心页面与区块设计（最多5个屏）

实时调试（Live Debug）
Top 导航条：模式选择、连接状态、开始/暂停/步进、版本选择、过滤器
左侧结构树：BT 层级、断点图标、搜索定位
中央画布：节点状态高亮、活跃路径动画、端口值徽标
右侧 Inspector：Node/Ports、Blackboard、Logs、Breakpoints、Versions 选项卡
底部时间轴：事件轨道（tick/result/port-change）、范围缩放
回放与时光穿梭（Replay）
Top 控制条：加载回放、播放/暂停、速度、关键事件跳转
左侧书签：异常帧、断点命中、版本切换点
中央画布：按时间点渲染节点状态，路径回放轨迹
右侧 Inspector：该帧变量快照、端口快照、日志
底部时间轴：可拖拽游标、区间圈选、事件类型筛选
版本视图与差异（Versions）
Top 工具条：版本下拉（old/new）、对比模式切换（节点/端口/属性）
左侧变化列表：变更的节点/端口项，按类型分组
中央画布：差异高亮（新增/修改/删除）、边/端口差异边框
右侧差异面板：字段级 diff、统一/左右对比视图
底部操作：应用版本、生成对比报告（导出 JSON）
断点与流程控制（Breakpoints）
Top 工具条：条件断点、命中策略（首次/每次）、启停
左侧断点列表：筛选（启用/禁用）、命中次数、上次命中时间
中央画布：断点图钉叠加、命中动画、当前停留节点标识
右侧断点详情：条件表达式、端口值条件、命中历史
底部时间轴：断点命中标记、逐帧跳转
变量监控看板（Variables Watch）
Top 工具条：添加 Watch、分组管理、导入/导出 watchlist
左侧分组：黑板/临时变量/端口值/用户分组
中央监控卡片：值/类型、变化高亮、微型趋势图
右侧详情：历史变化、来源引用（节点/端口）、订阅设置
底部时间轴：选中变量的变化轨道叠加
五、设计风格与响应式

推荐风格 [ { "name": "Neutral Slate + Emerald", "colors": "中性灰与石板色为主，点缀祖母绿强调状态与交互反馈，避免蓝色系。", "elements": "卡片/分割线、柔和阴影、圆角中等、状态徽标/标签有明确层级。", "atmosphere": "专业、稳重、可扩展。", "typography": "几何无衬线字体，标题中等字重，正文良好行距。", "best_for": "企业/工程调试、复杂信息密度场景。" } ]
交互与可视
节点状态色：success=emerald、running=amber、failure=rose、idle=muted；高对比边框
动画：活跃路径沿边闪烁，断点命中波纹；过渡时长 150-200ms
栅格与断点
桌面 12 列、32px gutters；平板 8 列、24px；移动 4 列、16px
左侧 3/12、右侧 3/12、中部 6/12；移动降为上下栈叠，时间轴吸底
六、关键交互（兼容遗留与新功能）

兼容层
Legacy Tab：保留旧“断点/日志”面板为 Legacy 选项卡，后端事件映射到统一 store
事件适配：旧 ws 事件 → 统一 EventEnvelope，前端仅在适配器内转换（UI 无感）
行为树可视化
节点徽标显示最近一次端口值摘要；hover 展开详情；双击右侧跳转到 Ports 面板
运行路径自动高亮；可锁定路径并导出为关键帧
GROOT 专项
PortsList 与 Blackboard 同屏联动：从端口跳转到对应黑板 key watch
Tick/Result 过滤器：仅显示特定 NodeType/Category 的事件
七、版本控制可视化（UI）

顶部“版本选择”+“对比开关”
画布差异叠加：新增=绿色描边、删除=删除占位虚线、修改=黄色角标
右侧“版本差异”面板：字段级 diff（properties/ports/constraints）
时间轴版本标记：在事件轨道标出版本切换点，点击快速切换视图
快照机制：本地快照列表（仅 UI 层存储），支持命名/备注
八、实时变量监控与流程追踪（UI）

Watch 列表：搜索/分组、值变更高亮（3s 衰减）、数据类型徽标
端口/黑板联动：从节点端口一键添加到 Watch；右侧详情显示引用链
流程追踪：底部事件轨道按类型着色；点击事件在画布定位并重现路径
性能友好：节流渲染、列表虚拟化、可配置采样率（UI 层）
九、组件与技术选型（React + shadcn）

复用
timeline-controller.tsx、interactive-timeline.tsx、debug-logs-panel.tsx、breakpoint-panel.tsx、debug-toolbar.tsx
新增组件建议
layout/integrated-debug-layout.tsx：统一容器与区域分配
panels/version-diff-panel.tsx：版本差异
overlays/node-state-overlay.tsx：画布状态叠加/徽标
panels/variables-watch-panel.tsx：Watch 列表与详情
panels/flow-filter-bar.tsx：事件过滤器（时间轴顶部）
panels/groot-ports-panel.tsx：端口与黑板双列联动
UI 库
shadcn/ui：Tabs、Sidebar、Card、Badge、Tooltip、Sheet、Table
lucide-react：状态/控制图标
图表/迷你趋势：可用微型 SVG sparklines（纯前端）
十、实施计划（迭代节奏）

Milestone 1：整合布局与导航
新建 integrated-debug-layout，顶栏加入“版本选择/对比开关/过滤器”
将现有 debug/replay 布局接入 Tabs，不改内部逻辑
Milestone 2：画布状态叠加与活跃路径
node-state-overlay 在 debug-canvas 与 replay-canvas 中挂载
端口值徽标与 hover 详情卡片
Milestone 3：版本差异面板与画布差异叠加
version-diff-panel + 画布差异描边/角标；时间轴版本标记
Milestone 4：变量监控与 Watch 列表
variables-watch-panel，支持添加/移除/分组；右侧详情+sparklines
Milestone 5：断点管理增强与流程过滤
条件断点编辑器（UI），事件过滤器（flow-filter-bar）联动时间轴
Milestone 6：兼容适配与回归
Legacy 选项卡接入适配器；i18n 文案；无障碍与键盘操作完善
十一、数据与集成策略（UI占位）

数据源切换：顶部“数据源”开关（Mock | WebSocket）
Mock 事件生成器：tick/result/port-change/blackboard-change 随机流；回放用录制的 JSON
统一事件信封（UI内）：{ ts, type, nodeId, payload, versionTag }，降低旧/新数据差异影响
十二、验收标准（UI）

实时调试：状态高亮无明显延迟；路径高亮可锁定/导出
版本对比：节点/端口/属性差异清晰；切换不重绘整图（局部更新）
变量监控：大于 1k watch 项时仍可流畅滚动（虚拟列表）
回放：拖动游标与快捷跳转 <100ms 反馈（UI）
兼容性：旧日志/断点面板可在新布局下正常使用
需要确认的问题

GROOT 侧关键事件与端口/黑板映射是否有固定 schema？是否需要类型校验徽标？
老代码中必须保留的面板/交互清单有哪些？是否需要“Legacy 默认展开”策略？
版本的来源：仅 UI 快照，还是来自外部版本化文件/服务？是否需要跨版本对齐算法策略（如按 instanceName 对齐）？
回放数据来源：线上录包还是本地 JSON？是否需要导入/导出入口？
首批优先级：在上述五屏中先落地哪三项？