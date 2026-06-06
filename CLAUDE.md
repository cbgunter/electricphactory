# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # local dev server (Vite, hot reload)
npm run build    # production build → dist/
npm run preview  # serve the dist/ build locally
```

Deploy manually:
```bash
aws s3 sync dist/ s3://electricphactory-golf --delete
aws cloudfront create-invalidation --distribution-id E30KDOYILXQ12J --paths "/*"
```

## Architecture

Single-page React app (Vite + React 18). All UI lives in `src/App.jsx` — one file with inline styles throughout. No routing, no state management library, no component library.

**Styling approach:** 100% inline styles via a `C` color palette object at the top of `App.jsx`. Responsive/media-query styles are the exception and live in `src/index.css` as CSS classes (`.ep-hero-grid`, `.ep-about-grid`, `.ep-feature-grid`, `.ep-path-row`, `.ep-nav-links`).

**Layout pattern:** A `Container` component (`max-width: 1100px, margin: 0 auto`) wraps every `Section`'s content. The nav has its own inline container div. The footer has its own inline container div.

**Data:** All event data, map coordinates, and static content are plain JS arrays/objects defined at the top of `App.jsx` — no API, no CMS.

## Infrastructure

| Resource | Value |
|---|---|
| Hosting | S3 bucket `electricphactory-golf` → CloudFront `E30KDOYILXQ12J` |
| Domain | `electricphactory.golf` (Route53 hosted zone `Z10315662D3CIAJVJSZVZ`) |
| SSL | ACM cert `dd649aaa-e7f3-4bcc-86be-a3c39daddf14` (us-east-1) |
| CI/CD | GitHub Actions (`.github/workflows/deploy.yml`) — push to `main` triggers build → S3 sync → CloudFront invalidation |

GitHub Actions requires three repo secrets: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `CLOUDFRONT_DISTRIBUTION_ID`.
