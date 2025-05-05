# React Typing Practice App

This is a typing practice web application built with React, TypeScript, Vite, and Monaco Editor. Users can select different code snippets (currently supporting JavaScript, Python, TypeScript) and practice typing them within an interface that simulates a code editor.

## Features

*   **Code Snippet Selection**: Allows users to choose from a predefined list of code snippets for practice.
*   **Simulated Editor Input**: Utilizes Monaco Editor to provide a typing experience close to a real code editor. The code display is read-only, and input is simulated via keyboard events.
*   **Real-time Feedback**:
    *   Highlights correctly and incorrectly typed characters.
    *   Displays the current cursor position.
*   **Statistics**:
    *   Timer function.
    *   Calculates WPM (Words Per Minute).
    *   Calculates accuracy percentage.
    *   Displays the total word count of the snippet.
*   **Responsive Design**: Built with Tailwind CSS for adaptability across different screen sizes.

## Tech Stack

*   **Framework**: React 19
*   **Language**: TypeScript
*   **Build Tool**: Vite
*   **Editor Core**: Monaco Editor (`@monaco-editor/react`)
*   **Styling**: Tailwind CSS
*   **Package Manager**: pnpm

## Getting Started

1.  **Install Dependencies**:
    ```bash
    pnpm install
    ```
2.  **Run Development Server**:
    ```bash
    pnpm run dev
    ```
    The application will run on a local development server, typically `http://localhost:5173`.

## Deployment

This project is automatically deployed to GitHub Pages via GitHub Actions whenever changes are pushed to the `main` branch.

The deployed application should be available at:

`https://<your-username>.github.io/`

**Note**: For deployment to the root URL (`https://<your-username>.github.io/`), your repository name must be `<your-username>.github.io`. If your repository has a different name (like `typing-master`), deploying with `base: '/'` might require additional configuration or a custom domain setup in GitHub Pages settings. The standard deployment URL for a repository named `typing-master` would typically be `https://<your-username>.github.io/typing-master/` (which would require `base: '/typing-master/'` in `vite.config.ts`).

## Project Structure (Brief)

*   `.github/workflows/`: Contains the GitHub Actions CI/CD workflow for deployment.
*   `public/`: Static assets.
*   `src/`:
    *   `assets/`: Image assets, etc.
    *   `components/`: React components (CodeSelector, StatsDisplay).
    *   `snippet/`: Source files for code snippets.
    *   `App.tsx`: Main application component, managing state and logic.
    *   `main.tsx`: Application entry point.
    *   `index.css`: Global styles and Tailwind configuration.
*   `PLAN.md`: Project development plan document.
*   `vite.config.ts`: Vite configuration file.
*   `package.json`: Project dependencies and scripts.
*   ... Other configuration files (ESLint, TSConfig, etc.)
