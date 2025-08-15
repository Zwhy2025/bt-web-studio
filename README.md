# Web版BehaviorTree.CPP可视化编辑与调试工具

## 项目简介

`BT Web Studio` 是一款专为 [BehaviorTree.CPP](https://github.com/BehaviorTree/BehaviorTree.CPP) 行为树库设计的在线可视化编辑器和调试器。它旨在提供一个直观、高效、功能丰富的图形化界面，帮助开发者轻松构建、修改、分析和调试复杂的行为树。

本工具通过 `React` 和 `ReactFlow` 构建，支持将行为树导出为 BehaviorTree.CPP 兼容的 XML 格式，并能加载 XML 文件进行可视化展示和编辑。

## 核心功能

-   **可视化编辑**:
    -   **节点库**: 提供 BehaviorTree.CPP 内置的所有标准节点类型（Action, Condition, Control, Decorator, SubTree）。
    -   **拖拽式操作**: 从节点库中拖拽节点到画布，轻松构建行为树结构。
    -   **连接与配置**: 通过拖拽连接节点，形成父子关系，并在属性面板中配置节点的详细参数。
    -   **树形结构约束**: 编辑器强制执行行为树的结构规则，如控制节点可有多个子节点，而装饰器和动作节点只能有一个父节点和一个子节点。
-   **XML 导入/导出**:
    -   **完全兼容**: 支持导入和导出 BehaviorTree.CPP v4.x 版本的 XML 文件。
    -   **无缝迁移**: 开发者可以将现有的 XML 行为树导入工具进行可视化分析和修改，或将新创建的树导出到项目中直接使用。
-   **布局与导航**:
    -   **自动布局**: 一键将行为树整理成清晰的树状结构，便于阅读和理解。
    -   **自由导航**: 支持画布的平移、缩放，并提供小地图（MiniMap）进行快速概览和导航。
-   **编辑辅助**:
    -   **撤销/重做**: 支持多步操作的撤销和重做，提升编辑效率。
    -   **复制/粘贴/克隆**: 快速复制和粘贴节点或整个子树。
    -   **快捷键支持**: 为常用操作提供丰富的快捷键，如删除、全选、复制、粘贴等。

## 技术栈

-   **前端框架**: [React](https://react.dev/)
-   **图形库**: [ReactFlow](https://reactflow.dev/)
-   **UI 组件库**: [shadcn/ui](https://ui.shadcn.com/)
-   **构建工具**: [Vite](https://vitejs.dev/)
-   **语言**: TypeScript

## 如何使用

1.  **克隆仓库**:
    ```bash
    git clone https://github.com/your-username/bt-web-studio.git
    cd bt-web-studio
    ```
2.  **安装依赖**:
    ```bash
    npm install
    ```
3.  **启动开发服务器**:
    ```bash
    npm run dev
    ```
4.  在浏览器中打开 `http://localhost:5173` 即可开始使用。

## 路线图

-   [x] **基础编辑功能**: 完成节点拖拽、连接、删除、属性编辑。
-   [x] **XML 导入/导出**: 实现与 BehaviorTree.CPP 的兼容。
-   [x] **布局与导航**: 实现自动布局、小地图、缩放等。
-   [x] **编辑辅助**: 完成撤销/重做、复制/粘贴、快捷键。
-   [ ] **对齐与吸附**: 重新实现节点的对齐、分布和吸附功能，提升布局效率。
-   [ ] **实时调试后端集成**: 开发 WebSocket 服务，用于与 C++ 行为树应用通信。
-   [ ] **状态可视化**: 在前端实时展示节点状态。
-   [ ] **断点与单步调试**: 实现完整的调试器功能。
-   [ ] **用户认证与云端存储**: 支持用户登录，并将行为树保存在云端。
-   [ ] **模板与示例库**: 提供常用行为树模式的模板和示例。

## 贡献

欢迎任何形式的贡献！如果您有任何建议、发现 Bug 或希望添加新功能，请随时创建 [Issue](https://github.com/Zwhy2025/bt-web-studio/issues) 或提交 [Pull Request](https://github.com/Zwhy2025/bt-web-studio/pulls)。

## 许可证

本项目采用 [GNU Affero General Public License v3.0](LICENSE) 开源。
