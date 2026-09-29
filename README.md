# MAGPIE documentation

[![Documentation](https://img.shields.io/badge/docs-live-118e78)](https://luxai-qtrobot.github.io/magpie-doc/)
[![Documentation workflow](https://github.com/luxai-qtrobot/magpie-doc/actions/workflows/documentation.yml/badge.svg)](https://github.com/luxai-qtrobot/magpie-doc/actions/workflows/documentation.yml)

Official documentation website for **MAGPIE**, a transport-agnostic communication framework for developers, AI agents, robotics, and distributed systems.

The site brings together the [Python](https://github.com/luxai-qtrobot/magpie), [C++](https://github.com/luxai-qtrobot/magpie-cpp), and [TypeScript/JavaScript](https://github.com/luxai-qtrobot/magpie-js) implementations in one documentation base.

## Local development

Requires Node.js 20 or newer and npm.

```bash
npm install
npm start
```

Open <http://localhost:3000/magpie-doc/>. The development server reloads when documentation, components, or styles change.

For a clean dependency installation matching the lockfile, use `npm ci` instead of `npm install`.

## Validate changes

```bash
npm run typecheck
npm run build
```

The production site is written to `build/`. Broken internal links or invalid MDX fail the build.

## Repository structure

- `docs/` — concepts, guides, transports, examples, operations, and API references.
- `src/pages/` — custom landing page.
- `src/css/custom.css` — global theme and documentation styling.
- `static/img/` — MAGPIE images and social assets.
- `sidebars.ts` — documentation navigation.
- `docusaurus.config.ts` — site metadata, routing, search, and GitHub Pages settings.

## Deployment

Pushes to `main` are built and deployed by [`.github/workflows/documentation.yml`](.github/workflows/documentation.yml). Pull requests run the same type-check and production build without deploying.

One-time repository setup:

1. Open **Settings → Pages**.
2. Under **Build and deployment**, set **Source** to **GitHub Actions**.
3. Push the site to `main` or manually run the **Documentation** workflow.

The public site is configured for:

<https://luxai-qtrobot.github.io/magpie-doc/>

## License

This repository is licensed under [GPL-3.0](LICENSE).
