# Dodee & Onur website

The production site is the static edition at **https://dodee-website.vercel.app**. This workspace also preserves an independent React edition with its own Git history:

| Location | Implementation | Public output |
| --- | --- | --- |
| Repository root | HTML, CSS and browser JavaScript; Vercel configuration | `public-static/` |
| `sites/dodee-next/` | React app using vinext and Cloudflare Workers | `sites/dodee-next/dist/` |

The nested app is an independent Git repository, not a dependency or a configured submodule. It is ignored by the root repository and preserved at [dodee-react-website](https://github.com/mehmetcanbudak/dodee-react-website) (private). Review and commit its changes from its own directory; a root commit does not save its changes. To recreate this optional workspace layout, clone that repository into `sites/dodee-next`. The older root `dist/` directory is not the deployment output and is preserved as an existing artifact.

## Static website

Use Node.js 24 (minimum 22.19) and Python 3 for HTML checks. The website has no runtime npm dependencies; development dependencies provide reproducible browser and performance checks.

```sh
npm ci              # install the pinned QA tools
npm run check       # all pages, links/assets, JS behavior, deployment output
npm run dev         # http://127.0.0.1:8080, with deployment security headers
npm run dev -- --port 8081
npm run build       # regenerate public-static/ after edits
```

The preview builds once at startup. Run `npm run build` after changes, then reload the browser. Do not serve the repository root publicly: it contains development tooling, a separate application, and local configuration. See [DEPLOY.md](DEPLOY.md).

## React website

See [the app README](sites/dodee-next/README.md) for installation, checks, preview and deployment details. The two designs have different styling and URLs (`videos.html` versus `/episodes`); changing one does not update the other.

## Product boundaries

- There is no connected newsletter provider. Both editions direct visitors to the verified channel for updates and do not collect subscription details.
- The static color game's optional progress is kept in local browser storage. The April clue campaign is permanently archived; no future launch is implied.
- Video/channel links and business claims need owner verification before release. No release date, audience metric or educational outcome should be inferred from the presence of artwork or a draft page.
- Local validation does not verify deployed configuration, email ownership, third-party availability or real assistive-technology behavior.

See [the September 30 audit report](docs/AUDIT-2026-09-30.md) for the initial changes and [the completion checklist](docs/REMAINING-WORK-2026-09-30.md) for current release evidence and any external acceptance still outstanding.
