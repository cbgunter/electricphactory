# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Branding

See `electric-phactory-branding-guidelines.md` for the full spec. Key rules that affect code:
- **Colors:** `C` palette defined at the top of each page component — Midnight Green `#004C54`, Phactory Orange `#D4691C`, Warm Cream `#F5F0E8`, Sand `#EDE6DA`, Deep Green `#002B30`. `silver` (`#5C5955`) is used for body/secondary text (darkened from spec `#B8B5AF` for readability). No additional colors.
- **Fonts:** Outfit (headings) + DM Sans (body). No third font, ever.
- **Minimum text size: 12px.** Nothing rendered below this.
- **Body text: 16px, line-height 1.75.** The `Body` component in `App.jsx` enforces this.
- **No pure white backgrounds.** Warm Cream `#F5F0E8` is the default page background.

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

Update Lambda after editing `lambda/index.mjs`:
```bash
Compress-Archive -Path lambda/index.mjs -DestinationPath lambda/function.zip -Force
aws lambda update-function-code --function-name ep-survey-api --zip-file fileb://lambda/function.zip --region us-east-1
```

## Architecture

React + Vite SPA with React Router. Two routes:
- `/` → `src/App.jsx` — landing page
- `/survey/2026-ms` → `src/survey/SurveyPage.jsx` — member survey (not linked from landing page; share URL directly)

**Styling approach:** 100% inline styles via a `C` color palette object at the top of each component file. Responsive/media-query styles live in `src/index.css` as CSS classes (`.ep-hero-grid`, `.ep-about-grid`, `.ep-feature-grid`, `.ep-path-row`, `.ep-nav-links`).

**Layout pattern (landing page):** A `Container` component (`max-width: 1100px, margin: 0 auto`) wraps every `Section`'s content. The nav and footer have their own inline container divs.

**Landing page data:** All event data, map coordinates, and static content are plain JS arrays/objects at the top of `App.jsx` — no API, no CMS.

**Survey architecture:**
- `src/survey/slides.js` — all question definitions as a flat `SLIDES` array. Each slide has a `type`, `id`, and optional `show(answers)` function for conditional visibility. `SURVEY_ID` and `API` endpoint are exported constants.
- `src/survey/SurveyPage.jsx` — single component that drives the entire survey. State: `answers` object, `idx` into the visible slides array. `getVisibleSlides(answers)` filters the SLIDES array on every render to handle conditional transitions.
- Slide types: `single` (auto-advances on click), `multi` (checkboxes + optional "Other" text field), `number` (1–8 picker), `zip` (validated 5-digit input), `rating` (1–5 dots with anchor labels), `text` (textarea, optional), `transition` (full-screen green, auto-dismisses after 2.8s), `weather` (fetches Open-Meteo + Zippopotam, no API keys), `results` (live bar chart from API), `done`.
- Survey submits all answers as one DynamoDB item when the user advances past Q13.

**To add a new survey:** Create a new route in `main.jsx`, a new `slides.js` with a different `SURVEY_ID`, and a new `SurveyPage` instance. The Lambda and DynamoDB table are survey-ID-agnostic.

## Infrastructure

| Resource | Value |
|---|---|
| Hosting | S3 bucket `electricphactory-golf` → CloudFront `E30KDOYILXQ12J` |
| Domain | `electricphactory.golf` (Route53 hosted zone `Z10315662D3CIAJVJSZVZ`) |
| SSL | ACM cert `dd649aaa-e7f3-4bcc-86be-a3c39daddf14` (us-east-1) |
| CI/CD | GitHub Actions (`.github/workflows/deploy.yml`) — push to `main` triggers build → S3 sync → CloudFront invalidation |
| Survey API | API Gateway HTTP API `iaatvn44bj` → Lambda `ep-survey-api` (Node 20) |
| Survey DB | DynamoDB `ep-surveys` table, PK `surveyId` + SK `responseId`, pay-per-request |
| Survey API URL | `https://iaatvn44bj.execute-api.us-east-1.amazonaws.com` |

GitHub Actions requires three repo secrets: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `CLOUDFRONT_DISTRIBUTION_ID`.

Survey API routes: `POST /submit` (store response), `GET /results?surveyId=X&questionId=Y` (aggregate counts for live chart).
