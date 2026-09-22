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

React + Vite SPA with React Router. Routes:
- `/` → `src/App.jsx` — landing page
- `/survey/2026-ms` → `src/survey/SurveyPage.jsx` — member survey (not linked from landing page; share URL directly)
- `/matchplay` → `src/matchplay/MatchPlayPage.jsx` — match play standings & bracket (linked from nav)
- `/matchplay/tibbs` → `src/matchplay/MatchPlayAdmin.jsx` — hidden result-entry form (not linked anywhere; `robots.txt` disallows it)

**Styling approach:** 100% inline styles via a `C` color palette object at the top of each component file. Responsive/media-query styles live in `src/index.css` as CSS classes (`.ep-hero-grid`, `.ep-about-grid`, `.ep-feature-grid`, `.ep-path-row`, `.ep-nav-links`).

**Layout pattern (landing page):** A `Container` component (`max-width: 1100px, margin: 0 auto`) wraps every `Section`'s content. The nav and footer have their own inline container divs.

**Landing page data:** All event data, map coordinates, and static content are plain JS arrays/objects at the top of `App.jsx` — no API, no CMS.

**Survey architecture:**
- `src/survey/slides.js` — all question definitions as a flat `SLIDES` array. Each slide has a `type`, `id`, and optional `show(answers)` function for conditional visibility. `SURVEY_ID` and `API` endpoint are exported constants.
- `src/survey/SurveyPage.jsx` — single component that drives the entire survey. State: `answers` object, `idx` into the visible slides array. `getVisibleSlides(answers)` filters the SLIDES array on every render to handle conditional transitions.
- Slide types: `single` (auto-advances on click), `multi` (checkboxes + optional "Other" text field), `number` (1–8 picker), `zip` (validated 5-digit input), `rating` (1–5 dots with anchor labels), `text` (textarea, optional), `transition` (full-screen green, auto-dismisses after 2.8s), `weather` (fetches Open-Meteo + Zippopotam, no API keys), `results` (live bar chart from API), `done`.
- Survey submits all answers as one DynamoDB item when the user advances past Q13.

**To add a new survey:** Create a new route in `main.jsx`, a new `slides.js` with a different `SURVEY_ID`, and a new `SurveyPage` instance. The Lambda and DynamoDB table are survey-ID-agnostic.

**Match play architecture:**
- `src/matchplay/data.js` — shared source of truth: `REGIONS` (South/North rosters), scoring/bracket logic (`calculateStandings`, `generateBracket`), and display helpers (`displayName` renders "First L." everywhere per site convention). Imported by both the public page and the admin form.
- `src/matchplay/MatchPlayPage.jsx` — fetches `GET /matchplay/matches` on load and renders standings + bracket from the result.
- `src/matchplay/MatchPlayAdmin.jsx` — the hidden `/matchplay/tibbs` form. POSTs one match at a time to `POST /matchplay/submit` with a shared passcode (`MATCHPLAY_ADMIN_KEY` Lambda env var) — this is obscurity + a shared secret, not real auth, appropriate for a low-stakes internal tool.
- Match results live in the `ep-surveys` DynamoDB table under `surveyId = "matchplay-2026-27"` (reusing the survey table/Lambda rather than standing up new infra). `responseId` is deterministic — `REGION#playerA#playerB` (sorted) for group matches, `ROUND#slotN` for playoff matches — so resubmitting the same pairing/slot corrects it instead of creating a duplicate.
- Best-5-of-10 scoring and playoff seeding (top 4 per region, cross-seeded) are implemented client-side in `data.js`, not in the Lambda — the API just stores/returns raw match rows.

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

Survey API routes: `POST /submit` (store response), `GET /results?surveyId=X&questionId=Y` (aggregate counts for live chart), `POST /contact` (send email via SES — honeypot + timing spam protection).

Match play API routes (same Lambda/table, see above): `POST /matchplay/submit` (requires `key` matching `MATCHPLAY_ADMIN_KEY`; upserts one match), `GET /matchplay/matches` (returns all rows for the current season, no auth).

Contact route requires: Lambda env vars `CONTACT_TO` (`cbgunter@gmail.com`) and `CONTACT_FROM` (`contact@mail.electricphactory.golf`); inline IAM policy `ep-contact-ses-send` granting `ses:SendEmail` on `ep-survey-lambda-role`; SES identity verification in us-east-1 (already done).

**Email deliverability:** `CONTACT_FROM` sends from the SES *domain* identity `mail.electricphactory.golf`, not a personal Gmail address — sending "From: someone@gmail.com" through SES fails SPF/DKIM alignment for gmail.com and gets flagged as spam, since Easy DKIM only works on domain identities, never individual email addresses. DNS records live in the `electricphactory.golf` Route53 zone (`Z10315662D3CIAJVJSZVZ`, also hand-managed, no IaC):
- 3x DKIM CNAMEs: `<token>._domainkey.mail.electricphactory.golf` → `<token>.dkim.amazonses.com`
- Custom MAIL FROM domain `bounce.mail.electricphactory.golf`: MX `10 feedback-smtp.us-east-1.amazonses.com` + SPF TXT `"v=spf1 include:amazonses.com ~all"`
- `_dmarc.mail.electricphactory.golf` TXT `"v=DMARC1; p=none; rua=mailto:cbgunter@gmail.com"` (report-only, non-disruptive)

The visitor's email is passed as `ReplyToAddresses` in the Lambda's `SendEmailCommand`, never as `Source`.

**No IaC** — the API Gateway (`iaatvn44bj`), its routes/integrations, the Lambda, and the DynamoDB table were all created by hand via the AWS CLI/console, not via CDK/Terraform/SAM. There is no template to reapply if any of this is deleted or recreated; routes especially are easy to forget (the `POST /contact` route was missing entirely until 2026-07-23, causing the Lambda integration to exist but every `/contact` request to 404 before reaching it). If you add a new Lambda route, you must also run `aws apigatewayv2 create-route` for it — editing `lambda/index.mjs` alone is not enough.
