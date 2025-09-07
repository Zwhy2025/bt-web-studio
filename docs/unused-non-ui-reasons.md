# 未被使用文件（排除 src/components/ui/*）与原因说明

本清单基于入口 `src/main.tsx` 的静态依赖图分析（含 `@/` 别名与 CSS @import 解析），结合仓库内文档与代码引用关系，归纳了当前“未在运行入口链路中被引用”的非 UI 组件文件及其未被使用原因。该状态反映“当前实现/路由/入口”下的使用情况，并不代表这些文件不再需要。

生成时间：自动分析

## 组件 components（非 UI）

- `src/components/animations/mode-transitions.tsx`
  - 原因：模式切换过渡的动画包装器，当前转向使用全局 CSS 动画（`globals.css` + `styles/mode-*.css`），未在新的模式外壳中接入。
  - 替代/去向：`src/components/layout/mode-aware-layout.tsx` 与 CSS 变量/动画。

- `src/components/blackboard-panel.tsx`
- `src/components/breakpoint-panel.tsx`
- `src/components/node-info-panel.tsx`
- `src/components/port-visualization-panel.tsx`
- `src/components/right-inspector.tsx`
  - 原因：调试/右侧检查面板的旧实现，未接入新的模式化布局；相关入口 `right-inspector` 未挂到路由/外壳。
  - 替代/去向：调试模式下的新版面板与工具栏（`src/components/layout/debug-layout.tsx`、`src/components/layout/debug-logs-panel.tsx`、`src/components/layout/debug-toolbar.tsx`）。

- `src/components/debug-toolbar.tsx`（根级）
- `src/components/debug-panel.tsx`
  - 原因：调试工具条与容器的旧版本；新实现移动到 `components/layout/` 下并与模式化外壳整合。
  - 替代/去向：`src/components/layout/debug-toolbar.tsx`、`src/components/layout/debug-layout.tsx`。

- `src/components/language-switcher.tsx`
- `src/components/theme-toggle.tsx`
  - 原因：语言/主题切换的独立小部件，功能已整合进顶栏。
  - 替代/去向：`src/components/layout/top-bar.tsx` 设置区。

- `src/components/tab-bar.tsx`
  - 原因：多会话标签栏的实验/旧实现，当前界面采用“单项目 + 顶部外壳”的简化方案，未启用多标签。
  - 替代/去向：顶栏与模式化外壳（`top-bar.tsx`、`mode-aware-layout.tsx`）。

- `src/components/interactive-timeline.tsx`
- `src/components/timeline-controller.tsx`（根级）
  - 原因：时间轴交互的早期版本；新实现放在布局目录中并与回放/调试模式整合。
  - 替代/去向：`src/components/layout/timeline-controller.tsx`、`src/components/layout/replay-layout.tsx`。

- `src/components/canvas/alignment-guides.tsx`
- `src/components/canvas/custom-nodes.tsx`
- `src/components/layout/bt-canvas.tsx`
- `src/components/layout/resizable-layout.tsx`
- `src/components/layout/bottom-timeline.tsx`
- `src/components/layout/timeline-panel.tsx`
- `src/components/layout/properties-panel.tsx`
- `src/components/layout/top-toolbar.tsx`
- `src/components/layout/composer-toolbar.tsx`
- `src/components/layout/function-tabs.tsx`
- `src/components/layout/left-palette.tsx`
  - 原因：老的画布/工具栏/面板体系（以 `bt-canvas` 和 `resizable-layout` 为核心）未接入新的模式化外壳；其依赖的对齐/自动布局/历史等工具也因此间接未被使用。
  - 替代/去向：新编排布局与画布（`src/components/layout/composer-layout.tsx`、`src/components/layout/composer-canvas.tsx`、`src/components/layout/node-library-panel.tsx`）。

- `src/components/layout/behavior-tree-editor.tsx`
  - 原因：旧的“统一编辑器”容器，已被三模式外壳拆分取代。
  - 替代/去向：`mode-aware-layout.tsx` 下的 `composer-layout.tsx` / `debug-layout.tsx` / `replay-layout.tsx`。

- `src/components/layout/composer-canvas-new.tsx`
  - 原因：新画布的实验性实现（带更多控制与 HUD），尚未在布局中切换启用。
  - 替代/去向：当前使用 `composer-canvas.tsx`；后续可能替换。

## 核心 core 和工具 hooks

- `src/core/debugger/breakpoint-manager.ts`
  - 原因：独立的断点管理器，当前断点/执行控制统一由 Zustand store 的调试切片管理，未直接使用该类。
  - 替代/去向：`src/core/store/debuggerState.ts` 与 `src/components/layout/debug-toolbar.tsx` 驱动。

- `src/core/bt/node-state-manager.ts`
  - 原因：节点状态与执行历史的类式管理器；现由全局 store 与回放/调试逻辑分担，未在入口链路被引用。
  - 替代/去向：`src/core/store/behavior-tree-store.ts` 多个 slice 与事件流。

- `src/core/bt/xml-parser.ts`
  - 原因：较早的 XML 解析包装，现统一走全局处理 + 管理器。
  - 替代/去向：`src/core/bt/global-xml-processor.ts`、`src/core/bt/unified-behavior-tree-manager.ts`、`src/components/xml-dialog.tsx` 中的 `xml-utils.ts`。

- `src/core/layout/alignment-utils.ts`
- `src/core/layout/auto-layout-utils.ts`
- `src/core/utils/history-utils.ts`
  - 原因：与旧画布 `bt-canvas.tsx` 紧耦合；因旧画布未接入，新版编排未直接使用这些工具。
  - 替代/去向：新版编排更多依赖 store 行为和 `behavior-tree-layout.ts`（在 `unified-behavior-tree-manager.ts` 内被使用）。

- `src/hooks/use-root-node-handler.ts`
  - 原因：Root 节点唯一性/约束的专用 Hook，尚未在新版编排流中接线；相关校验合并到其他逻辑。
  - 替代/去向：`src/hooks/use-node-validation.ts` 及 `store` 内的树/会话逻辑。

## 其他

- `src/config.ts`
  - 原因：调试器连接 URL 的配置常量，原由旧 `components/debug-toolbar.tsx` 使用；新实现通过调试会话与动作封装连接流程，未直接读取该常量。
  - 替代/去向：`src/core/store/debuggerState.ts`（连接/断开/命令发送），并可通过 `VITE_DEBUGGER_URL` 环境变量配置代理。

- `src/layout.tsx`
  - 原因：Next.js 模板遗留文件；当前项目为 Vite + React，不走 Next 布局入口。
  - 替代/去向：实际入口为 `index.html` + `src/main.tsx`。

---

说明：
- 以上结论来自静态引用图与目录内文档（如 `docs/workflow-refactor.md`、`docs/debug_design.md`）的迁移策略佐证：采用“外壳先行、功能渐进切换”，导致旧组件/工具在过渡期不在入口链路上。
- 若后续需要彻底清理，可按“是否仍被新实现间接引用（如类型复用）/是否有明确替代实现/是否在文档规划中标记为 Legacy”三步审查。
