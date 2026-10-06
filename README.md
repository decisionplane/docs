# DecisionPlane Docs

Source for the DecisionPlane documentation site, built with [VitePress](https://vitepress.dev) and deployed to GitHub Pages on every push to `main`.

```bash
pnpm install
pnpm dev      # local preview at http://localhost:5173
pnpm build    # static output in .vitepress/dist
```

`DOCS_BASE` sets the site base path. CI derives it automatically: `/` when `public/CNAME` exists (custom domain), otherwise `/<repo>/`.
