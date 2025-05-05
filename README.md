# React Typing Practice App

这是一个使用 React、TypeScript、Vite 和 Monaco Editor 构建的打字练习 Web 应用。用户可以选择不同的代码片段（目前支持 JavaScript、Python、TypeScript），并在一个模拟代码编辑器的界面中练习输入。

## 主要功能

*   **代码片段选择**: 用户可以从预设的代码列表中选择不同的片段进行练习。
*   **模拟编辑器输入**: 使用 Monaco Editor 提供接近真实代码编辑器的打字体验，代码只读，通过键盘事件模拟输入。
*   **实时反馈**:
    *   高亮显示用户输入的正确和错误字符。
    *   实时显示光标位置。
*   **统计数据**:
    *   计时功能。
    *   计算 WPM (Words Per Minute)。
    *   计算准确率。
    *   显示总词数。
*   **响应式设计**: 使用 Tailwind CSS 构建界面，适应不同屏幕尺寸。

## 技术栈

*   **框架**: React 19
*   **语言**: TypeScript
*   **构建工具**: Vite
*   **编辑器核心**: Monaco Editor (`@monaco-editor/react`)
*   **样式**: Tailwind CSS
*   **包管理器**: pnpm

## 如何运行

1.  **安装依赖**:
    ```bash
    pnpm install
    ```
2.  **启动开发服务器**:
    ```bash
    pnpm run dev
    ```
    应用将在本地开发服务器上运行，通常是 `http://localhost:5173`。

## 项目结构 (简要)

*   `public/`: 静态资源。
*   `src/`:
    *   `assets/`: 图片等资源。
    *   `components/`: React 组件 (CodeSelector, StatsDisplay)。
    *   `snippet/`: 存放代码片段的源文件。
    *   `App.tsx`: 主应用组件，管理状态和逻辑。
    *   `main.tsx`: 应用入口文件。
    *   `index.css`: 全局样式和 Tailwind 配置。
*   `PLAN.md`: 项目开发计划文档。
*   `vite.config.ts`: Vite 配置文件。
*   `tailwind.config.js` / `postcss.config.js`: (如果使用旧版 Tailwind) Tailwind 和 PostCSS 配置文件。
*   `package.json`: 项目依赖和脚本。
*   ... 其他配置文件 (ESLint, TSConfig 等)
