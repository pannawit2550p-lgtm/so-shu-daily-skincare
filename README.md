# SO-SHU · Daily Skincare

A responsive skincare storefront and visual product portfolio for SO-SHU. The experience includes an animated product lookbook, product details, ingredient highlights, language switching, and a session-only demo bag.

## Live site

The GitHub Pages URL will appear here after the first deployment completes.

## Preview locally

```sh
node scripts/build-pages.mjs
```

Serve the generated `dist` directory with any static web server. The Pages build excludes the Node/SQLite order API. The public demo bag is held in memory for the current browser tab; checkout and payments are disabled.

## Deploy

Push to `main` to deploy `dist` with the GitHub Actions workflow in `.github/workflows/deploy-pages.yml`.
