# Deploying the Dodee & Onur static site

This project is plain **HTML / CSS / JavaScript** (ES modules). There is no build step.

## Local preview

ES modules and `fetch()` for `data/clues.json` require **serving over HTTP** (not opening `index.html` directly from the disk in all browsers).

From the project folder:

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

## Hosting options

Any static host works, for example:

- **Netlify** — drag-and-drop the folder, or connect a Git repo.
- **Cloudflare Pages** — connect Git or upload.
- **GitHub Pages** — publish the `main` branch root or `/docs`.

Set the **site root** to this folder so `index.html`, `css/`, `js/`, and `data/` are at the top level.

## Custom domain (Squarespace or other registrar)

1. Deploy the site and get your host’s DNS instructions (often a **CNAME** for `www` and **A** / **ALIAS** records for the apex / `@` domain).
2. In **Squarespace** → **Domains** → your domain → **DNS settings**, add the records your host provides.
3. Wait for DNS propagation (often minutes to a few hours).
4. Enable HTTPS on the host (usually automatic).

The domain only **points** to your files; you are not running this app “inside” Squarespace’s website builder.

## Files to verify after deploy

- Home page loads and scripts run (check browser console).
- `GET /data/clues.json` returns 200 (mystery clue section).
- Links to `privacy.html` and `contact.html` work.
