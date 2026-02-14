---
description: GitHub Actions 部署流水线 — 静态导出至 GitHub Pages
---

# CI/CD Pipeline — GitHub Pages Deployment

## 触发条件

- `main` 分支收到 `push` 事件时自动触发。
- 支持手动触发 (`workflow_dispatch`)。

## 流水线步骤

### Step 1: Checkout

```yaml
- uses: actions/checkout@v4
```

### Step 2: Setup pnpm

```yaml
- uses: pnpm/action-setup@v4
  with:
    version: 9
```

### Step 3: Setup Node.js

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: 20
    cache: 'pnpm'
```

### Step 4: Install Dependencies

// turbo
```bash
pnpm install --frozen-lockfile
```

### Step 5: Build

// turbo
```bash
pnpm build
```

Next.js 配置了 `output: "export"` 后，`next build` 会自动在 `out/` 目录生成纯静态文件。

### Step 6: Deploy

```yaml
- uses: actions/deploy-pages@v4
```

将 `out/` 目录内容部署至 GitHub Pages。

---

## 完整 Workflow 文件

**路径**: `.github/workflows/deploy.yml`

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 9

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build
        run: pnpm build

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./out

  deploy:
    environment:
      name: github-pages
      url: ${{ github.event.repository.html_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

---

## 注意事项

1. 首次部署前，需在 GitHub 仓库 Settings → Pages 中将 Source 设置为 **GitHub Actions**。
2. `next.config.ts` 中需要根据仓库名配置 `basePath` 和 `assetPrefix`：

```typescript
const nextConfig = {
  output: "export",
  basePath: process.env.NODE_ENV === "production" ? "/erocat-homepage" : "",
  assetPrefix: process.env.NODE_ENV === "production" ? "/erocat-homepage/" : "",
};
```

3. 如果使用自定义域名，则 `basePath` 和 `assetPrefix` 设为空字符串，并在 `public/` 目录下放置 `CNAME` 文件。
