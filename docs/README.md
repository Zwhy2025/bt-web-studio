# BT Web Studio 文档中心

本目录用于维护 BT Web Studio 的设计、实现与使用文档。文档结构参考了 BehaviorTree.CPP 与 Groot 的分层方式：先总览，再按架构、模式、组件、协议、模块细分。

参考资料：
- BehaviorTree.CPP: https://github.com/BehaviorTree/BehaviorTree.CPP
- BehaviorTree.CPP Docs: https://www.behaviortree.dev/docs/intro
- Groot: https://www.behaviortree.dev/groot/

## 快速入口

- 用户入口：[`用户手册.md`](./用户手册.md)
- 开发者入口：[`概要设计.md`](./概要设计.md)

## 目录结构

| 目录 | 说明 |
|---|---|
| `架构/` | 三模式架构、数据流、UI 分层、迁移计划 |
| `模式/` | 编排、调试、回放三种模式的规格文档 |
| `组件/` | 三模式共享组件规范（顶部工具栏、属性面板） |
| `协议/` | Groot2 协议拆分文档（总览、命令、事件、错误、示例） |
| `模块/` | 与 `src/` 对应的核心子模块说明 |
| `研发/` | 术语、文档规范、调研与部署文档 |

## 推荐阅读顺序

1. `概要设计.md`
2. `架构/三模式架构.md`
3. `架构/状态管理与数据流.md`
4. `模式/编排模式.md` -> `模式/调试模式.md` -> `模式/回放模式.md`
5. `协议/Groot2-协议总览.md`
6. `模块/core-store.md`、`模块/core-debugger.md`

## 维护约定

- 新增功能先更新对应模块文档，再更新模式/架构文档。
- 涉及协议变更必须同步更新 `协议/` 目录文档。
- 文档格式与链接规范见 [`研发/文档编写规范.md`](./研发/文档编写规范.md)。
