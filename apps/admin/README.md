# Aurora_admin

管理后台 - 基于 React + TypeScript + Vite 构建

## 技术栈

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

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

## Vercel 部署说明

### 1. 准备工作

1. 在 [Vercel](https://vercel.com/) 上注册或登录账号
2. 确保项目已经提交到 GitHub 仓库

### 2. 部署步骤

1. **导入项目**
   - 在 Vercel 控制台点击 "Add New"
   - 选择 "Project"
   - 导入你的 GitHub 仓库

2. **配置项目**
   - **Framework Preset**: 选择 "Vite"
   - **Build Command**: `npm run build:vercel`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

3. **环境变量**
   - 点击 "Environment Variables"
   - 添加以下环境变量：
     - `VITE_SUPABASE_URL`: 你的 Supabase 项目 URL
     - `VITE_SUPABASE_ANON_KEY`: 你的 Supabase 匿名密钥
     - `VITE_API_URL`: 你的 API 服务器 URL（可选）

4. **部署**
   - 点击 "Deploy"
   - 等待部署完成

### 3. 部署后配置

1. **自定义域名**（可选）
   - 在 Vercel 项目设置中添加自定义域名
   - 按照 Vercel 的指引配置 DNS

2. **构建缓存**
   - Vercel 会自动缓存依赖，加速后续构建

### 4. 监控和日志

- 在 Vercel 控制台查看部署历史和构建日志
- 查看实时访问日志和错误信息

## 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```
