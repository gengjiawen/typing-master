# React 打字练习应用开发计划

## 1. 项目目标

创建一个基于 React 的打字练习应用，让用户可以练习输入预设的源代码。应用支持内置代码片段和从 API 加载代码片段，并能计算 WPM (Words Per Minute)。

## 2. 核心功能

*   **代码显示**: 清晰展示待输入的源代码片段。
*   **用户输入**: 提供文本区域供用户输入。
*   **实时反馈**:
    *   高亮显示用户输入的正确和错误字符。
    *   显示当前光标位置。
*   **统计计算**:
    *   计时功能（从用户开始输入时启动）。
    *   计算 WPM (Words Per Minute)。
    *   计算准确率。
*   **代码选择**: 允许用户从内置列表或通过 API 获取的代码片段中选择。
*   **API 集成**: 从指定的 API 端点获取代码片段数据。

## 3. 技术选型

*   **框架**: React (推荐使用 Vite 初始化)
*   **状态管理**: 简单的使用useState，复杂的状态管理用jotai, 并尽量使用 atomWithStorage 持久化
*   **API 请求**: `fetch` API
*   **样式**: Tailwind CSS
*   包管理器: pnpm


请注意 tailwindcss 4 不需要
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

只需要
```css
@import "tailwindcss";
```

## 4. 项目结构规划 (组件)

```mermaid
graph TD
    App ---|Manages State & Logic| Root
    Root --> CodeSelector[CodeSelector (选择代码片段)]
    Root --> CodeDisplay[CodeDisplay (显示代码 & 高亮)]
    Root --> TypingInput[TypingInput (用户输入框)]
    Root --> StatsDisplay[StatsDisplay (显示 WPM, 准确率)]

    CodeSelector -- Triggers Code Load --> App
    TypingInput -- Sends Input --> App
    App -- Updates Display --> CodeDisplay
    App -- Updates Stats --> StatsDisplay
```

## 5. 开发步骤

1.  **环境搭建**: 使用 Vite 初始化 React 项目。
2.  **组件骨架**: 创建 `App`, `CodeSelector`, `CodeDisplay`, `TypingInput`, `StatsDisplay` 组件的基本结构。
3.  **状态设计**: 在 `App` 组件中定义所需的状态（当前代码、用户输入、计时器、统计数据、API 状态等）。
4.  **代码显示与高亮**: 实现 `CodeDisplay` 组件，根据用户输入动态添加高亮样式。
5.  **用户输入处理**: 实现 `TypingInput` 组件，捕获输入并与源代码比较。
6.  **计时与统计逻辑**: 实现计时器启动/停止，以及 WPM 和准确率的计算逻辑。
7.  **代码加载**:
    *   实现加载内置代码的功能。
    *   实现从 API 获取代码列表和内容的逻辑，并处理加载状态。
8.  **代码选择器**: 实现 `CodeSelector` 组件，允许用户切换代码片段。
9.  **UI/UX 完善**: 添加 CSS 样式，优化用户体验。
10. **测试**: 进行功能测试，确保核心逻辑正常工作。