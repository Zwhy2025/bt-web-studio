# hooks 模块说明

## 1. 目标与范围

- 目标：集中说明可复用 Hook 的职责与使用边界。
- 范围：`src/hooks/*`

## 2. 依赖与入口

- `use-i18n.ts`：文案翻译与语言访问。
- `use-keyboard-shortcuts.ts`：快捷键绑定。
- `use-node-validation.ts`：节点校验。
- `use-root-node-handler.ts`：Root 规则处理。
- `use-media-query.tsx` / `use-mobile.tsx`：响应式判断。
- `use-toast.ts`：全局提示消息。

## 3. 核心概念

- Hook 只封装单一职责，不直接耦合复杂业务。
- Hook 返回值保持可组合，避免隐藏副作用。

## 4. 关键流程

1. 组件按需引入 Hook。
2. Hook 读取 store 或浏览器能力。
3. 返回状态和 action 给 UI 组件使用。

## 5. 异常与边界

- 事件监听类 Hook 必须在卸载时清理监听器。
- 与窗口对象相关逻辑要兼容初始化时机。
- 业务级副作用应留在 store actions 中。

## 6. 与其他模块关系

- UI 消费层：`src/components/*`
- Store：`src/core/store/*`
- i18n：`src/i18n/*`

## 7. 变更记录

- 2026-02：新增 hooks 模块文档，统一维护入口。
