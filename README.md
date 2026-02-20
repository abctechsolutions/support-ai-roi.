# Support AI ROI Dashboard (MVP)

A lightweight, privacy-first dashboard for **Support teams** to prove AI value:
- Adoption (weekly active users)
- ROI (conservative hours saved + £ value)
- Quality proxy (rework rate)
- Risk visibility (simple flags + audit export)

## Start here
Open **RUN_ME_FIRST.md** and follow the steps.

## Key routes
- `/login` – sign in
- `/log` – log an AI assist session
- `/dashboard` – ROI dashboard
- `/admin` – teams, users, approved tools, settings
- `/api/report?days=7` – CSV export

## What’s in v1
- Tool-agnostic logging (ChatGPT / Claude / Copilot / Gemini / other)
- Support use-case library (seeded)
- Conservative ROI calculations + exportable reports
- Basic governance hooks (approved tools + risk flags)

## What’s next (v2)
- Connect Zendesk/Intercom for mapping to AHT/CSAT/reopens
- Slack/Teams quick-logging
- Role-based dashboards for managers
