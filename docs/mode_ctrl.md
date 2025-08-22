以下为面向 BT Web Studio 的三模式（编排 / 调试 / 回放）重构设计文档草案，覆盖全局架构、UI/信息架构、数据与状态流、时间轴重设计、落地与迁移计划
等，旨在解决当前“单页聚合、时间轴复杂、右侧调试栏冗余”的痛点。

设计目标与痛点复盘

- 痛点总结:
    - 功能聚合在单页，信息密度过高，认知负担重。
    - 底部时间轴交互复杂，不符合预期节奏化回放心智。
    - 右侧调试栏功能过多且重复，难以快速定位关键任务（断点/黑板/会话）。
- 目标原则:
    - 模式化分离：编排、调试、回放三种模式，职责清晰、状态隔离。
    - 可视化聚焦：不同模式只呈现与当下任务相关的 UI 与状态。
    - 数据流单向可追踪：统一数据模型、事件记录与回放语义一致。
    - 可扩展与演进友好：面向插件化面板与协议升级的架构预留。

全局架构概览

- 前端技术栈: React + ReactFlow + TypeScript + Vite + Tailwind，状态管理使用 Zustand（建议新增 src/core/store/，按 slice 管理）。
- 三模式全局状态机（单例）：
    - ORCHESTRATION（编排）：编辑器能力、结构校验、导入导出。
    - DEBUG（调试）：连接会话、断点控制、状态流入、事件录制。
    - REPLAY（回放）：基于事件日志的时间轴回放、跳转与对齐。
- 通信层：
    - 浏览器 ↔ WebSocket 代理（/ws 由 Vite 代理至 ws://localhost:8080）。
    - 代理 ↔ ZeroMQ（REQ/REP、SUB/PUB）。
- 数据层：
    - 统一行为树内存模型（结构 + 视图层映射）。
    - 运行时事件流（状态变更、黑板快照、调试控制）与录制缓冲。
    - 回放轨道模型（状态轨、事件轨、标记轨）。

模式划分与状态机

- 状态机定义（简化）：
    - ORCHESTRATION → DEBUG：加载/同步当前树；校验通过后允许进入调试。
    - DEBUG → REPLAY：断开或停止后，带着录制缓冲进入回放；或从历史日志进入。
    - REPLAY → ORCHESTRATION：结束回放或返回编辑；也可 REPLAY → DEBUG 再连。
- 模式切换副作用：
    - 激活/销毁对应面板与订阅（如调试时 SUB 订阅、回放时关闭实时连接）。
    - 维护不同模式的 UI 状态隔离（右侧栏的选中 Tab、展开状态等不互相污染）。
- URL 与路由：
    - /?mode=orchestration|debug|replay&session=<id>&tree=<id>
    - 模式切换写入 URL，支持刷新/分享；无多路由页面，保留单页，但通过路由参数明确模式。

数据模型与数据流（核心）

- 行为树模型（结构层）：
    - BehaviorTree: id, name, nodes, edges, metadata
    - BTNode: id, type（Action/Condition/Control/Decorator）、props, children, position
    - BTEdge: id, source, target, order
- 运行时模型（状态层）：
    - NodeRuntimeState: nodeId, status（IDLE|RUNNING|SUCCESS|FAILURE|SKIPPED）, ts
    - BlackboardSnapshot: ts, kv: Record<string, any>
    - ExecutionEvent: ts, kind（StateChange|Breakpoint|Hook|Log）, payload
- 回放与轨道模型：
    - Timeline: start, end, tracks: Track[], markers: Marker[]
    - Track: id, type（State|Log|Breakpoint|Blackboard）, segments[]
    - Segment: t0, t1, value（如状态、日志文本、变量变化）
- 单向数据流：
    - 编辑/导入 → 结构层更新 → 视图映射（布局、颜色、样式） → Canvas 渲染。
    - 调试模式：SUB/PUB → 事件归一化（ExecutionEvent）→ 状态层更新（Zustand）→ UI。
    - 事件录制缓冲：调试期间落在缓冲，Stop/Pause 后进入回放。
    - 回放：Timeline Driver 驱动 virtual ts，根据 virtual ts 推送“合成状态”到视图层。

前端模块与目录结构建议

- src/core/（业务无关 UI 的核心逻辑）
    - bt/：树结构、XML 解析、布局算法、导入导出。
    - runtime/：事件归一化、状态机、录制缓冲、回放驱动。
    - ws/：WebSocket 会话、命令请求/响应封装、订阅管理。
    - store/：Zustand slices（modeSlice, treeSlice, runtimeSlice, timelineSlice, uiSlice）。
    - utils/：纯工具函数。
- src/components/
    - shell/：顶级布局与模式切换、全局工具条。
    - left-pane/：节点库与搜索。
    - canvas/：BT 画布、节点与边渲染、选中/对齐。
    - right-pane/：面板容器与模式化面板（见下）。
    - bottom-timeline/：时间轴与回放控制（只在调试/回放模式显示）。
- src/pages/（可选）：若将来扩展路由，再抽象为页面容器，但当前建议单页+模式参数。

UI 信息架构与布局

- 顶部工具栏（固定）：
    - 左：项目名、当前树选择、模式切换（Segmented 或 Tabs：编排 / 调试 / 回放）。
    - 中：全局操作（导入/导出 XML、保存、撤销/重做、布局）。
    - 右：会话状态（连接/断开/时长）、语言切换、主题切换。
- 左侧：节点库（保留）
    - 搜索/筛选：按类别/标签过滤。
    - 模式行为差异：仅在编排模式允许拖拽到画布；调试/回放模式不允许新建节点（避免误操作）。
- 画布（中心区域，ReactFlow）
    - 编排：强编辑态（拖拽、连接、布局、属性快捷入口）。
    - 调试：渲染运行态高亮，编辑功能弱化/禁用（支持“标注”但不改结构）。
    - 回放：仅随时间轴变更状态；禁用节点结构编辑。
- 右侧栏（模式化面板容器）
    - 编排模式（简洁、聚焦）：
    - 属性面板：节点属性表单、校验提示。
    - 检查器：结构规则校验、未连接节点、无效参数。
    - 版本/变更：本地草稿差异（可选）。
- 调试模式（去冗余、分工明确）：
    - 会话：连接配置、当前树 ID、采样频率、订阅主题、命令面板（Start/Pause/Step/Stop）。
    - 断点：列表、启用/禁用、命中计数（与节点右键菜单打通）。
    - 黑板：树状/表格视图、只读/读写切换（标记“修改将影响运行”）。
    - 事件与日志：最新事件、过滤（级别/类型），支持“固定”某节点事件。
- 回放模式（以时间为中心）：
    - 轨道筛选：显示/隐藏状态轨、日志轨、断点轨、黑板变量轨。
    - 书签与标注：添加/跳转；导出回放快照。
    - 对齐与比较：多次运行对齐（可选迭代目标）。
- 底部：时间轴（仅调试/回放显示）
    - 调试：录制进行中，显示“now”滑块与事件密度热力；简单控制（开始/暂停/停止录制）。
    - 回放：完整运输控件（播放/暂停/快进/后退/跳转/书签），缩放（时窗），轨道可见性切换。

右侧调试栏去冗余方案

- 合并相近功能，杜绝重复入口：
    - 将“运行控制”统一至“会话”页签，移除分散按钮。
    - 将“事件”、“日志”、“Hook”合并为“事件与日志”，通过过滤条件（类型/节点）细分。
    - “黑板”操作单处呈现，并支持“瞬时快照”与“对比”。
    - 断点统一管理：来源于右键菜单设置的断点在此集中维护，带检索与批量开关。

时间轴重设计（简洁、可读、可操作）

- 核心思想：分轨道呈现，不做复杂二义交互；“时间窗+缩放+拖拽”三要素清晰可预期。
- 轨道类型：
    - 节点状态轨（聚合）：按节点类型或选中节点显示，显示状态切换片段。
    - 日志轨：按级别着色、点击展开详情。
    - 断点轨：命中点显示标记，悬浮显示节点与计数。
    - 黑板轨：选择关键变量，绘制变更点或区间（带旧/新值）。
- 控制区：
    - 播放控制：播放/暂停、上一事件/下一事件、跳转书签。
    - 缩放控制：时窗缩放（滚轮 + Ctrl）、双击智能缩放到选中事件簇。
    - 选择同步：画布与时间轴联动（点击轨道事件 → 高亮节点；反之亦然）。
- 性能：对轨道进行虚拟化，仅渲染可视范围；事件密度高时进行采样/合并。

调试通信与协议统一

- 命令归一化（REQ/REP）：
    - 请求头统一：protocol=2, type（如 > start, p pause, s step, I setBreakpoint）, unique_id。
    - UI 层只触发统一 action：debug.start(), debug.pause(), debug.step(), debug.stop(), breakpoint.add/remove/toggle()。
- 订阅（SUB/PUB）：
    - 主题与事件映射：N（BREAKPOINT_REACHED）、S（状态）、B（黑板）、L（日志）…（与后端协商/扩展）。
    - 前端标准化：所有 SUB 消息入统一 ExecutionEvent，带 ts、kind、payload。
- 可靠性：
    - 会话心跳与断线重连；重连后重新订阅主题。
    - 录制缓冲循环队列（可配置上限），避免内存增长失控。

回放系统设计

- 事件来源：
    - 在线调试期间的录制缓冲。
    - 离线日志导入（JSON/MessagePack），与在线事件格式统一。
- 时间轴驱动（Timeline Driver）：
    - 维护 virtualTs，根据播放速度推进；对 ExecutionEvent 做时序索引。
    - 将 virtualTs 投影为“合成运行态”，推送到画布与右侧面板。
- 快照/书签：
    - 支持为关键时刻（断点、错误）加书签；可导出回放片段（含事件与黑板快照）。

国际化与可访问性

- i18n：
    - 为模式、面板、控制项新增明确 key（mode.orchestration|debug|replay，panel.session|breakpoints|blackboard|events 等）。
    - 事件类型、状态值使用标准 key 映射，避免文案硬编码。
- A11y：
    - 优先保证键盘可操作性（模式切换、轨道导航、播放控制）。
    - 对关键颜色（运行/成功/失败）提供对比度符合。

性能优化策略

- 画布：
    - 节点状态高频更新时，分离结构与状态渲染（结构静态，状态通过轻量 overlay 层渲染）。
    - 只对视口内节点做状态绘制；大规模树启用节点层级折叠。
- 状态管理：
    - Zustand selector 精细订阅，避免不相关组件重渲染。
    - 事件批处理（例如 16ms 合并一次）与节流。
- 时间轴：
    - 渲染窗口化、事件采样与聚合（密度热力图先行，细节按需展开）。

错误处理与可观测性

- UI 层次：
    - 模式异常回退（如调试连接失败 → 留在编排模式并提示）。
    - 操作失败的短消息（Toast）与调试页签的详细日志并存。
- 监控：
    - 在开发期间可输出标准化结构日志（便于问题定位）。
    - 可选将严重错误上报到远端（后期）。

安全与配置

- Dev 代理：
    - /ws 代理目标在 vite.config.ts 中配置；请勿在代码中硬编码后端地址。
- 配置项：
    - 运行参数、订阅主题、录制上限写入 src/config.ts；生产环境用 .env 注入。
- 校验：
    - 导入 XML/日志时做 Schema 校验；防止破坏内存模型。

迁移与落地计划（里程碑）

- 里程碑 1：模式化外壳与状态机
    - 建立全局 modeSlice，支持 URL 参数驱动。
    - 顶部工具栏与模式切换组件落地；左/中/右容器骨架搭建。
- 里程碑 2：右侧栏重组
    - 拆分为“会话｜断点｜黑板｜事件与日志”；保留老功能但迁移入口。
    - 调试控制集中到“会话”；移除分散按钮与重复项。
- 里程碑 3：时间轴重构（基础）
    - 引入轨道模型与简化控制；实现事件密度可视化与基础播放控制。
    - 双向联动（时间轴 ←→ 画布）打通。
- 里程碑 4：回放系统与录制缓冲
    - 调试期间事件录制；一键进入回放，驱动合成运行态。
    - 支持书签；导入离线日志。
- 里程碑 5：性能与体验优化
    - 状态渲染 overlay、Zustand 精细订阅、时间轴虚拟化。
    - 交互打磨与键盘快捷键全局化。
- 里程碑 6：清理与文档
    - 删除旧的冗余入口；补充 i18n keys；出用户使用指南与开发者文档。

风险与权衡
- 一次性重构风险高：采用“外壳先行、功能渐进切换”的方式降低风险。
- 协议不一致：前后端对事件/命令进行一致性校验，避免回放与实时脱节。
- 复杂度管理：把复杂度“外移到模型”，UI 只做呈现；轨道化设计替代复杂控件。

附录：关键类型定义（TS 接口草案）

- 模式与全局状态
    - type AppMode = 'ORCHESTRATION' | 'DEBUG' | 'REPLAY'
    - ModeSlice = { mode: AppMode; setMode(m: AppMode): void }
- 行为树结构
    - interface BehaviorTree { id: string; name: string; nodes: BTNode[]; edges: BTEdge[]; metadata?: Record<string, any> }
    - interface BTNode { id: string; type: 'Action'|'Condition'|'Control'|'Decorator'; props: Record<string, any>; children: string[];
position?: {x:number;y:number} }
    - interface BTEdge { id: string; source: string; target: string; order?: number }
- 运行时与事件
    - type NodeStatus = 'IDLE'|'RUNNING'|'SUCCESS'|'FAILURE'|'SKIPPED'
    - interface NodeRuntimeState { nodeId: string; status: NodeStatus; ts: number }
    - type EventKind = 'StateChange'|'Breakpoint'|'Hook'|'Log'|'Blackboard'
    - interface ExecutionEvent { ts: number; kind: EventKind; payload: any }
- 回放与时间轴
    - interface Marker { id: string; ts: number; label?: string }
    - interface Segment<T=any> { t0: number; t1: number; value: T }
    - interface Track<T=any> { id: string; type: 'State'|'Log'|'Breakpoint'|'Blackboard'; segments: Segment<T>[] }
    - interface Timeline { start: number; end: number; tracks: Track[]; markers: Marker[] }

附录：事件载荷示例

- 节点状态事件
    - { ts: 1730000123456, kind: 'StateChange', payload: { nodeId: 'n42', from: 'RUNNING', to: 'SUCCESS' } }
- 断点命中
    - { ts: 1730000123499, kind: 'Breakpoint', payload: { nodeId: 'n18', hitCount: 3 } }
- 黑板变更
    - { ts: 1730000123600, kind: 'Blackboard', payload: { key: 'target.visible', prev: false, next: true } }
- 日志
    - { ts: 1730000123700, kind: 'Log', payload: { level: 'info', message: 'Search target', nodeId: 'n12' } }

结语
通过“模式化架构 + 统一数据模型 + 轨道化时间轴 + 面板职责聚合”，我们将编辑、调试、回放三类任务拆分干净，显著降低认知负担与实现复杂度。同时保留
左侧节点库的既有优势，重塑右侧栏与底部时间轴，保证从实时到离线的连续性与可追踪性。建议按上述里程碑循序落地，尽快先完成外壳与模式状态机，随后平
滑迁移现有功能。
