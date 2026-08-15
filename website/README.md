# DSH Desktop landing page

This directory is a dependency-free static website and is the Vercel project root.

## Local preview

From the repository root:

```sh
pnpm site:dev
```

Then open `http://127.0.0.1:4173`.

## Vercel project settings

Import this Git repository into Vercel and use these settings:

- Root Directory: `website`
- Framework Preset: `Other`
- Build Command: leave empty
- Output Directory: `.`

Deploy to the generated `*.vercel.app` URL first. After verification, add both
`dshdesktop.site` and `www.dshdesktop.site` under Project Settings → Domains.
Use the exact A and CNAME records Vercel displays in Alibaba Cloud DNS. Configure
`www.dshdesktop.site` as the primary domain and redirect the apex domain to it.

Installer and repository URLs are configured in `site.config.js`.
