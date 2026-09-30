# Deploying the static website

The root site uses plain HTML, CSS and JavaScript. Its build copies an allowlist of public pages, assets, scripts, styles and discovery files into `public-static/`. It deliberately excludes `.env*`, Git/tooling files, the nested React repository, tests and old build archives.

## Validate and preview

```sh
npm run check
npm run dev
```

Open `http://127.0.0.1:8080`. The preview sends the security headers from `vercel.json`, so blocked resources can be found before deployment. Rebuild after edits with `npm run build` and reload. Python 3 is needed only for `check:html`.

## Vercel

The selected production project is `dodee-website` in the existing `mehmetcan-budaks-projects` Vercel scope, serving `https://dodee-website.vercel.app`.

Use the repository root, framework preset **Other**, build command `npm run build`, and output directory `public-static`. These settings are also recorded in `vercel.json`. The site has no runtime npm dependencies; development dependencies support QA. The configuration sets security headers and a favicon rewrite. `.vercelignore` excludes the separate React checkout, tooling, test evidence and local configuration from source uploads. Do not select the old root `dist/` directory.

After the local and hosted checks pass, use the existing linked project:

```sh
npm exec --yes --package vercel@62.0.0 -- vercel deploy --prod --yes --scope mehmetcan-budaks-projects
node scripts/check-deployment.mjs https://dodee-website.vercel.app
```

The second command performs read-only checks and saves evidence under `test-results/deployment/`. For an immutable preview URL, set `CANONICAL_ORIGIN=https://dodee-website.vercel.app` to check its intended production metadata. It does not change DNS or deployment configuration.

The pinned CLI avoids relying on an older global installation: Vercel rejected the installed 41.6.1 upload client because its endpoint requires 47.2.2 or newer. The release uses 62.0.0 through `npm exec` without changing the global CLI. A protected preview redirects to Vercel login and cannot establish public response behavior; the verifier rejects that redirect explicitly. Verify the public production alias after release.

Versioned WOFF2 files are cached for one year. If font bytes change, change the filename and its CSS/preload references in the same release. Images retain the host's default policy so an unchanged image filename does not retain an obsolete asset indefinitely.

## Other static hosts

Run `npm run build` and publish **only `public-static/`**. On Netlify or Cloudflare Pages, set that as the publish directory. On GitHub Pages, upload that directory as the Pages artifact. Reproduce the response headers from `vercel.json` where the host supports them; a directory upload alone does not apply Vercel configuration.

The root canonical metadata, `robots.txt` and `sitemap.xml` currently use `https://dodee-website.vercel.app`. If the production origin changes, update all three together. Configure custom-domain DNS and HTTPS through the chosen host.

## Release checks

- All eight pages, navigation, images and videos load without application errors.
- Color game, episode filters, mobile menu and keyboard focus behave correctly.
- No signup success or email-delivery promise appears without a real service.
- `/.env.local`, `/sites/`, `/.git/`, `/package.json` and source archives are not served.
- Security headers are present in actual responses, with no unexpected CSP violations.
- Canonical links and sitemap refer to the deployed public origin.
- Channel/social links, contact addresses, partner permission and published episode facts are verified by the owner.

The separate React app has its own build and deployment instructions in `sites/dodee-next/README.md`. No deployment is performed by the local check/build commands.
