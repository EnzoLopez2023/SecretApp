# Workshop Studio 🛠️

**Your Personal Productivity & Maker's Hub**

Workshop Studio is a comprehensive productivity and hobby management application that combines modern AI assistance with practical tools for makers, hobbyists, and professionals.

## 🚀 Features

### 🤖 AI Assistant
- Modern conversational AI interface built with Material-UI
- Context-aware responses for shop tools, media library, and general questions
- Beautiful chat interface with message bubbles and typing indicators

### 🔧 Shop Tools Manager
- Complete inventory management for workshop tools
- Spending analysis and company breakdown
- Search and categorization capabilities

### 📽️ Media Library (Plex Integration)
- Movie and TV show insights
- Library statistics and recommendations
- Entertainment management tools

### 🪵 Project Workshop
- Woodworking project management
- Project tracking and documentation
- Material and tool requirements

### 📊 Data Converter
- Excel to JSON conversion utility
- Data transformation tools
- Import/export capabilities

## 🛠️ Tech Stack

- **Frontend**: React + TypeScript + Vite
- **UI Framework**: Material-UI (MUI) v7.3.4 with Material Design 3
- **Authentication**: Microsoft Authentication Library (MSAL)
- **Styling**: Modern Material Design with Inter font

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
