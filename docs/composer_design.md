# 编排模式（Composer Mode）设计文档

本文档阐述 BT Web Studio 中“编排模式”的业务目标、信息结构、交互流程与技术架构，作为产品设计与实现对齐的基准文档。

## 1. 目标与范围
- 目标：提供一个所见即所得的行为树（Behavior Tree）编排工作台，支持从节点库拖拽、连线、配置属性与端口，最终导入/导出为 BehaviorTree.CPP 兼容的 XML。
- 范围：
  - 节点库浏览与检索（按类别 Action/Condition/Control/Decorator/SubTree）。
  - 画布编辑（拖拽创建、吸附、对齐、缩放平移、框选、连线/断开）。
  - 节点属性与端口配置（输入/输出端口、字段属性）。
  - 数据导入/导出（XML ⇆ ReactFlow 节点/边结构）。
  - 状态管理与撤销重做、基础校验。

不在本阶段范围（但保留扩展位）：实时调试、断点、运行态高亮（调试/回放模式处理）。

## 2. 角色与典型场景
- 关卡/剧情设计师：从节点库拖拽出流程、条件与行为节点，串接逻辑，定义参数与输入输出，导出 XML 给运行时引擎。
- 工程师：从运行工程导出的 XML 导入校对，调整节点属性与端口，保持与代码侧节点定义一致。

## 3. 信息结构与核心概念
- Node（节点）：行为树构成单元，包含分类、显示名、描述、属性、端口（inputs/outputs）。
- Edge（边）：连接节点端口的有向连线，代表父子/数据/控制流关系（当前为父子控制流）。
- Port（端口）：可连接点，支持 side: top/bottom/left/right，支持多端口均匀分布。
- Category（类别）：Action/Condition/Control/Decorator/SubTree。

Glossary：
- Composer Mode：编排模式，侧重设计/绘制与结构正确性。
- React Flow：画布基础库，用于节点、边与交互管理。
- XML（BehaviorTree.CPP）：与运行时对接的数据交换格式。

## 4. 用户流程（高层）
1) 从左侧节点库检索并拖拽一个节点到画布。
2) 选择节点，配置属性与端口（默认 1 入/1 出，可增删改端口与方向）。
3) 将上游节点输出端口连接到下游节点输入端口。
4) 视图控制（吸附、对齐、缩放、适配视图）。
5) 导出为 XML 或从 XML 导入进行继续编辑。

## 5. 交互细节与规则
- 拖拽：
  - DataTransfer 类型为 `application/reactflow`，载荷包含节点元数据（id/name/category/...）。
  - 放置时根据当前吸附设置对齐到网格（默认 20px）。
- 选择与多选：点击/框选支持，`Ctrl/Cmd` 追加选择；Delete/Backspace 删除选中。
- 连线：从 source（输出端口）到 target（输入端口），避免产生环（循环检查在高级画布 bt-canvas 里已有样例实现）。
- 吸附/对齐：
  - 吸附到网格（默认开启，20px）。
  - 后续可开启对齐参考线（与邻近节点的边/中心对齐）。
- 节点样式：
  - 明暗主题适配：使用 `bg-card`/`border-border`/`text-foreground`。
  - 分类色块：左上图标背景使用类别色（蓝/绿/紫/橙/靛）。
  - 状态色仅在运行相关视图使用；编排模式默认 `idle`。
- 调试控件：
  - 在编排模式隐藏“断点/禁用/设置”等调试类悬浮控件（已移除）。

## 6. 数据模型（前端）
- React Flow Node（简化）：
```ts
interface BehaviorTreeNodeData {
  id: string
  name: string
  category: string // action | condition | control | decorator | subtree
  description?: string
  properties?: Record<string, any>
  inputs?: Array<{ id: string; label?: string; side?: 'top'|'bottom'|'left'|'right' }>
  outputs?: Array<{ id: string; label?: string; side?: 'top'|'bottom'|'left'|'right' }>
}
```
- 端口默认值：未设置则默认 `inputs:[{id:'in', side:'top'}], outputs:[{id:'out', side:'bottom'}]`。
- 边：使用 React Flow `Edge`，当前类型 `smoothstep`，收尾带箭头。

代码参考：
- 画布：`src/components/layout/composer-canvas.tsx`
- 节点渲染：`src/components/nodes/behavior-tree-node.tsx`
- 节点库：`src/components/layout/node-library-panel.tsx`
- Store：`src/core/store/behavior-tree-store.ts` + `composerModeState.ts`
- XML：`src/core/bt/xml-utils.ts`（解析/生成）

## 7. 技术架构
- React + React Flow：画布与节点/边交互。
- Zustand：应用状态与模式切换（`behavior-tree-store` 含多个 slice）。
- i18n：`i18next`（`src/i18n/*`），界面文案国际化。
- 样式：Tailwind CSS（自定义 CSS 变量与深色主题增强）。

## 8. 可视样式规范（摘录）
- 节点卡片：
  - 宽度：最小 120px，最大 220px，圆角 `lg`，边框 2px。
  - 头部：`bg-accent/10`，左侧图标方块使用类别色。
  - 端口：小圆点 `w-3 h-3`，`border-border bg-background`，多端口按侧均匀分布。
- 画布背景：默认 Dots，间距 20px，颜色 `--muted-foreground/15%`。

## 9. 导入/导出（XML 对齐）
- 导入：`parseXML(xml)` -> nodes/edges（兼容 BehaviorTree.CPP 常见节点类型）。
- 导出：`generateXML(nodes, edges)` -> XML；包含根节点校验、孤立节点检查、重复根提示。
- 节点属性与端口的映射需在生成层定义规范（后续在“属性面板/端口编辑器”中完成映射策略）。

## 10. 校验与错误处理（基础）
- 结构校验：无根/多根、孤立节点、潜在环。
- 端口校验：端口 id 唯一、端口方向与连接一致性（source/target）。
- 提示：使用 Toast/Panel 标注，轻量不打断操作。

## 11. 动画与动效（可选增强）
- 模式切换动效：
  - 顶部模式切换采用“中心涟漪 + 推挤/弹入”过渡（Composer 侧仅 UI 体验）。
- 画布动效：
  - 节点 hover：轻微放大与阴影。
  - 连线完成：端口高亮闪烁（后续可加）。

## 12. 测试与质量
- 单元测试：
  - XML 解析/生成函数、布局/对齐工具函数。
- 交互测试：
  - 拖拽/放置/连线/删除、吸附与缩放。
- 视觉回归：
  - 主题切换、节点类别色与端口分布。

## 13. 路线图（Roadmap）
- v1
  - 端口编辑器（在属性面板中添加/删除/方向/命名）。
  - 选择框内批量操作与对齐工具条。
  - XML 属性映射配置化（节点 data.properties ↔ XML 属性）。
- v2
  - 模块化子树（SubTree 引用与折叠/展开）。
  - 约束校验（必连端口、端口类型、类型兼容矩阵）。
- v3
  - 与调试/回放模式联动（从运行事件回写状态到节点）。

## 14. 附录：文件与模块清单（编排相关）
- 入口：`src/app.tsx` → `ModeAwareLayout` → `composer-layout`
- 画布：`src/components/layout/composer-canvas.tsx`
- 节点：`src/components/nodes/behavior-tree-node.tsx`、`control-sequence-node.tsx`
- 节点库：`src/components/layout/node-library-panel.tsx`
- Store：`src/core/store/behavior-tree-store.ts`、`composerModeState.ts`
- XML：`src/core/bt/xml-utils.ts`、`global-xml-processor.ts`

以上内容覆盖“编排模式”的核心业务、交互与实现要点。如需新增业务场景或变更交互，请在此文档更新并在 PR 中引用。



面板结构

- 基本信息: 面板顶部，展示模型信息与实例标识
    - 模型名: 只读，来自节点模型注册（大号、主标题）
    - 实例名: 可编辑（小号，模型名下方；为空则节点卡片不显示）
    - 类别/图标: 只读（可选展示）
    - 规则提示: 当节点是 root 时在此突出“Root 节点：无输入，仅向下连接”的规则说明
    - 规则提示: 当节点是 root 时在此突出“Root 节点：无输入，仅向下连接”的规则说明
- 
端口配置: 明确输入/输出端口，支持与黑板绑定
    - 输入端口列表:
    - 字段: id、side(top/bottom/left/right)、类型(type，可选)、绑定源(source: 字面量/黑板)、默认值/黑板 key
    - 操作: 新增/删除/重命名/改方向；拖动排序（可选）
    - 校验: 同一节点内 id 唯一；root 禁止存在任何输入端口（UI 禁用“添加输入”）
- 输出端口列表:
    - 字段: id、side、类型(type，可选)、绑定源（通常输出不绑定黑板，保留只读/隐藏）
    - 操作: 新增/删除/重命名/改方向；拖动排序（可选）
    - 校验: id 唯一；（可选）root 仅允许一个输出端口（如你需要，我可强制）

- 参数与黑板: 模仿 Groot 的 PortsList 使用体验
    - 端口类型与默认值: 若模型定义了 ports schema（见“模型驱动”），按 schema 渲染类型/默认值；否则允许自由编辑
    - 黑板绑定: 选择器列出黑板键（支持搜索/过滤），保存到 port.blackboardKey
    - 字面量/黑板切换: 若选择“字面量”，显示输入框并保存到 port.defaultValue
    - 字面量/黑板切换: 若选择“字面量”，显示输入框并保存到 port.defaultValue
- 
描述与文档: 节点的业务描述从右侧面板维护
    - 节点描述: 文本域，存入 data.description
    - 文档链接/备注: 可放富文本/Markdown（可选）
    - 卡片不再显示描述（已移除），避免画布噪声
- 
高级/模型属性: 按模型类型展示特定属性（占位，后续对接）
    - 例如 Sequence/Selector 的 memory、success/failure policy 等
    - 未对接模型 schema 前，该区暂隐藏或显示通用属性（例如执行标签）

Root 节点规则

- 唯一性: 全图仅允许一个实例名为 root 的节点；当把某节点设置为 root 时，自动清除其他节点的 root 标记
- 模型名: 强制为 “Sequence”（只读显示）
- 端口约束: 不允许输入端口；输出端口可保留一个（若你需要，我可以强制只有一个）
- 连接规则: 禁止任何边连接到 root（root 只能作为 source）

模型驱动（与 Groot 对齐）

- 若有模型注册表（Node Registry）: 每个模型带 portsSchema（输入/输出端口的名称、类型、是否必填、默认值）
    - 渲染时按 schema 展现端口与类型，默认不允许自由增删（保持模型一致性）
    - 没有 schema 的模型: 开放自由增删端口（当前实现）
- 将来接入: 模型属性（如 Parallel policy 等）、端口类型检查（连线时类型兼容）

交互与规则

- 双击打开面板: 双击画布中的节点 → 右侧属性面板聚焦当前节点
- 实时保存: 修改即写回 Store，画布立即反映（已对接）
- 校验反馈: id 重复/非法字符、root 规则违反、端口与黑板类型不符（未来加入）→ 面板就地提示
- 键盘辅助: 回车提交、Esc 取消输入焦点；撤销/重做沿用现有快捷键
- i18n: 文案 key 命名统一（示例）:
    - composer.propertyPanel.title/basic/ports/description
    - composer.propertyPanel.modelName/instanceName
    - composer.propertyPanel.inputs/outputs/addInput/addOutput
    - composer.propertyPanel.blackboard.selectKey/literal/defaultValue
    - composer.propertyPanel.rules.rootOnlyOne/noInputs/noIncomingEdges

数据结构（与现实现对齐）

- 节点数据:
    - modelName: string（只读）
    - instanceName?: string（可编辑）
    - description?: string（右侧面板维护）
    - inputs?: Array<{ id: string; side: 'top'|'bottom'|'left'|'right'; type?: string; blackboardKey?: string; defaultValue?: any }>
    - outputs?: 同上（通常不需要 blackboardKey）
    - 将来: modelProps?: Record<string, any>（按模型 schema 的专有属性）

约束与校验

- 名称
    - 模型名: 只读
    - 实例名: 任意字符（可选限制），仅 root 需要唯一与规则约束
- 端口
    - id: 同节点内唯一；建议使用字母数字/下划线；连线显示使用 id/label
    - side: 四方向；同方向多个端口等间距分布
    - root: 禁止添加输入端口；（可选）限制输出端口为 1